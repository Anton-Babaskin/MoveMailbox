#!/usr/bin/env python3
"""Disposable demo-only API/worker hard-kill drill. Never contacts IMAP servers.

Run with --binary /path/to/movemailbox or --image movemailbox:ci.
Only generated processes/containers/volumes are removed by this test.
"""

import argparse
import base64
import hashlib
from contextlib import closing
import json
import os
from pathlib import Path
import secrets
import shutil
import socket
import sqlite3
import subprocess
import tempfile
import time
import urllib.error
import urllib.request

from backup_validation import ensure_worker_drained


def free_port():
    with socket.socket() as sock:
        sock.bind(("127.0.0.1", 0))
        return sock.getsockname()[1]


def command(args, env=None):
    result = subprocess.run(args, env=env, capture_output=True, timeout=60)
    if result.returncode:
        # Commands may contain keygen output or secrets in diagnostics; do not print it.
        raise RuntimeError(f"subprocess failed: {args[0]} (exit {result.returncode})")
    return result.stdout


def run(binary, image, directory, rotation=False):
    if binary:
        copied_binary = directory / Path(binary).name
        shutil.copy2(binary, copied_binary)
        binary = str(copied_binary)
    base_env = {k: v for k, v in os.environ.items() if not k.startswith(("MOVEMAILBOX_", "MM_"))}
    key_command = ["docker", "run", "--rm", image, "keygen"] if image else [binary, "keygen"]
    keys = dict(line.split("=", 1) for line in command(key_command, base_env).decode().splitlines())
    prefix = "movemailbox-smoke-" + secrets.token_hex(6)
    ports = {name: free_port() for name in ("api", "worker")}
    process, files, containers, volumes = {}, [], set(), set()
    private_key = keys["MOVEMAILBOX_WORKER_PRIVATE_KEY"]
    worker_env = {
        "MOVEMAILBOX_WORKER_PRIVATE_KEY": private_key,
        "MOVEMAILBOX_WORKER_TOKEN": keys["MOVEMAILBOX_WORKER_TOKEN"],
        "MOVEMAILBOX_WORKER_LEASE_TTL": "1s",
        # Demo has no external children; the container mode also kills its whole namespace.
        "MOVEMAILBOX_WORKER_RECOVER_INTERRUPTED": "true",
        "MOVEMAILBOX_DEMO": "true",
    }
    api_env = {
        "MOVEMAILBOX_PUBLIC_MODE": "true",
        "MOVEMAILBOX_WORKER_PUBLIC_KEY": keys["MOVEMAILBOX_WORKER_PUBLIC_KEY"],
        "MOVEMAILBOX_WORKER_TOKEN": keys["MOVEMAILBOX_WORKER_TOKEN"],
        "MOVEMAILBOX_SESSION_SECRET": base64.b64encode(secrets.token_bytes(48)).decode(),
        "MOVEMAILBOX_SESSION_REQUESTS_PER_MINUTE": "6000",
        "MOVEMAILBOX_IP_REQUESTS_PER_MINUTE": "12000",
        "MOVEMAILBOX_WORKER_URL": f"http://{prefix}-worker:8090" if image else f"http://127.0.0.1:{ports['worker']}",
        "MOVEMAILBOX_WORKER_ALLOW_HTTP": "true" if image else "false",
        "MOVEMAILBOX_ALLOWED_HOSTS": f"127.0.0.1:{ports['api']}",
    }
    for name in ports:
        (directory / name).mkdir()
    environments = {"api": api_env, "worker": worker_env}
    passwords = ["smoke-source-" + secrets.token_hex(16), "smoke-destination-" + secrets.token_hex(16)]
    network_created = False

    def start(name):
        values = environments[name]
        assert name != "api" or "MOVEMAILBOX_WORKER_PRIVATE_KEY" not in values
        if image:
            container = prefix + "-" + name
            data_path = "/data" if name == "api" else "/worker-data"
            volume = prefix + "-" + name + "-data"
            if volume not in volumes:
                command(["docker", "volume", "create", volume]); volumes.add(volume)
            args = ["docker", "run", "--detach", "--name", container, "--network", prefix,
                    "--read-only", "--cap-drop=ALL", "--security-opt=no-new-privileges:true",
                    "--pids-limit=128", "--memory=512m", "--cpus=1",
                    "--tmpfs=/tmp:size=64m,mode=1777,noexec,nosuid,nodev",
                    "--tmpfs=/var/tmp:size=64m,mode=1777,noexec,nosuid,nodev",
                    "--mount", f"type=volume,src={volume},dst={data_path}",
                    "--publish", f"127.0.0.1:{ports[name]}:{8080 if name == 'api' else 8090}"]
            for key in values:
                args.extend(["--env", key])
            args.append(image)
            args += ["worker-service", "--database=/worker-data/worker.db"] if name == "worker" else ["--open=false"]
            command(args, base_env | values); containers.add(container)
            if name == "api":
                config = json.loads(command(["docker", "inspect", container]))[0]["Config"]
                assert not any(item.startswith("MOVEMAILBOX_WORKER_PRIVATE_KEY=") for item in config["Env"])
        else:
            log = open(directory / name / f"process-{time.time_ns()}.log", "wb")
            files.append(log)
            args = [binary] + (["worker-service"] if name == "worker" else ["--open=false"])
            args += [f"--addr=127.0.0.1:{ports[name]}", f"--database={directory / name / (name + '.db')}"]
            process[name] = subprocess.Popen(args, env=base_env | values, stdout=log, stderr=log,
                                             creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0))

    def kill(name):
        if image:
            container = prefix + "-" + name
            if container in containers:
                logs = subprocess.run(["docker", "logs", container], capture_output=True, timeout=10)
                if logs.returncode:
                    raise RuntimeError("cannot read disposable container logs")
                (directory / name / f"container-{time.time_ns()}.log").write_bytes(logs.stdout + logs.stderr)
                # docker rm --force kills the whole container namespace, including children.
                command(["docker", "rm", "--force", container]); containers.remove(container)
        elif name in process:
            child = process.pop(name)
            child.kill(); child.wait(timeout=10)

    def request(name, path, data=None, cookie="", csrf="", expected=200):
        headers = {"Cookie": cookie, "X-CSRF-Token": csrf, "Content-Type": "application/json"}
        payload = json.dumps(data).encode() if data is not None else None
        req = urllib.request.Request(f"http://127.0.0.1:{ports[name]}{path}", data=payload, headers=headers)
        try:
            response = urllib.request.urlopen(req, timeout=3)
        except urllib.error.HTTPError as error:
            response = error
        with response:
            raw = response.read()
            assert not any(secret.encode() in raw for secret in passwords), "password in HTTP output"
            assert response.status == expected, f"{name} {path}: status {response.status}, expected {expected}"
            return (json.loads(raw) if raw else None), response.headers

    def until(check, timeout=20):
        deadline = time.monotonic() + timeout
        while time.monotonic() < deadline:
            try:
                result = check()
                if result:
                    return result
            except (OSError, urllib.error.URLError):
                pass
            time.sleep(0.1)
        raise AssertionError("timed out waiting for demo state")

    def assert_readiness(ready):
        state, headers = request("api", "/api/ready", expected=200 if ready else 503)
        assert state == {"status": "ready" if ready else "not_ready", "ready": ready}
        assert headers.get("Cache-Control") == "no-store", "readiness can be cached"
        assert not headers.get("Set-Cookie"), "readiness allocated a guest session"

    try:
        if image:
            subnet_octet = 16 + (int.from_bytes(hashlib.sha256(prefix.encode()).digest()[:2], "big") % 200)
            command(["docker", "network", "create", "--subnet", f"10.254.{subnet_octet}.0/28", prefix]); network_created = True
        start("worker")
        until(lambda: request("worker", "/healthz")[0]["available"])
        start("api")
        until(lambda: request("api", "/api/health")[0]["available"])
        assert_readiness(True)
        session, headers = request("api", "/api/session")
        # Test-only HTTP transport: manually send the Secure cookie on loopback.
        # Production browsers require HTTPS; this test does not weaken cookie flags.
        cookie, csrf = headers["Set-Cookie"].split(";", 1)[0], session["csrfToken"]
        endpoint = {"host": "8.8.8.8", "port": 993, "security": "tls", "username": "source@example.test", "password": passwords[0]}
        destination = endpoint | {"host": "1.1.1.1", "username": "destination@example.test", "password": passwords[1]}
        payload = {"source": endpoint, "destination": destination, "options": {"syncFlags": True, "preserveDates": True}}
        request("api", "/api/connections/test", endpoint, cookie, csrf)
        folders, _ = request("api", "/api/connections/folders", endpoint, cookie, csrf)
        assert len(folders["folders"]) == 7
        job, _ = request("api", "/api/jobs", payload, cookie, csrf, 202)
        job_path = "/api/jobs/" + job["id"]
        until(lambda: request("api", job_path, cookie=cookie)[0]["transferred"] > 0)
        kill("api")
        start("api")
        until(lambda: request("api", job_path, cookie=cookie)[0]["status"] in ("running", "completed"))
        def completed(path):
            state, _ = request("api", path, cookie=cookie)
            assert state["status"] not in ("failed", "cancelled"), "recovered demo job failed"
            return state if state["status"] == "completed" else None
        result = until(lambda: completed(job_path))
        assert result["transferred"] == 954, "unexpected API-recovered demo count"
        # Use a fresh job for the worker kill so a slow API boot cannot miss the
        # first job's short demo execution window.
        retry_job, _ = request("api", "/api/jobs", payload, cookie, csrf, 202)
        retry_path = "/api/jobs/" + retry_job["id"]
        until(lambda: request("api", retry_path, cookie=cookie)[0]["transferred"] > 0)
        kill("worker")
        # Keep API up during the outage: a dropped HTTP connection must not cancel work.
        assert_readiness(False)
        assert not request("api", "/api/health")[0]["available"], "liveness lost worker state"
        time.sleep(0.4)
        start("worker")
        until(lambda: request("worker", "/healthz")[0]["available"])
        assert_readiness(True)
        result = until(lambda: completed(retry_path))
        assert result["transferred"] == 954, "unexpected recovered demo count"
        mirror_payload = payload | {"options": {"strictMirror": True, "strictMirrorConfirmed": True}}
        mirror, _ = request("api", "/api/jobs", mirror_payload, cookie, csrf, 202)
        mirror_path = "/api/jobs/" + mirror["id"]
        until(lambda: request("api", mirror_path, cookie=cookie)[0]["transferred"] > 0)
        kill("worker")
        start("worker")
        until(lambda: request("api", mirror_path, cookie=cookie)[0]["status"] == "failed")
        other_session, other_headers = request("api", "/api/session")
        request("api", job_path, cookie=other_headers["Set-Cookie"].split(";", 1)[0], expected=404)
        second, _ = request("api", "/api/jobs", payload, cookie, csrf, 202)
        request("api", "/api/jobs/" + second["id"] + "/cancel", {}, cookie, csrf, 202)
        assert request("api", "/api/jobs/" + second["id"], cookie=cookie)[0]["status"] == "cancelled"
        for mode in ("dryRun", "justVerbose", "justLogin", "justFolderSizes", "justFolders"):
            preflight, _ = request("api", "/api/jobs", payload | {"options": {mode: True}}, cookie, csrf, 202)
            outcome = until(lambda: completed("/api/jobs/" + preflight["id"]))
            assert outcome["transferred"] == 0 and outcome["bytes"] == 0, f"{mode} reported copied mail"
        for options in ({"justLogin": True, "justFolders": True}, {"justFolders": True, "strictMirror": True, "strictMirrorConfirmed": True}):
            request("api", "/api/jobs", payload | {"options": options}, cookie, csrf, 400)
        if rotation:
            # Stop new admissions operationally; test requests below are the only
            # clients in this isolated lab. Keep the old recipient key until drain.
            retained, _ = request("api", "/api/jobs", payload, cookie, csrf, 202)
            retained_path = "/api/jobs/" + retained["id"]
            until(lambda: request("api", retained_path, cookie=cookie)[0]["transferred"] > 0)
            command(["docker", "stop", "--time=20", prefix + "-worker"])
            snapshot = directory / "rotation-worker.db"
            command(["docker", "cp", prefix + "-worker:/worker-data/worker.db", str(snapshot)])
            try:
                ensure_worker_drained(snapshot)
            except ValueError:
                pass
            else:
                raise AssertionError("rotation guard allowed a retained envelope/queue")
            command(["docker", "start", prefix + "-worker"])
            until(lambda: completed(retained_path))
            command(["docker", "stop", "--time=20", prefix + "-worker"])
            command(["docker", "cp", prefix + "-worker:/worker-data/worker.db", str(snapshot)])
            ensure_worker_drained(snapshot)
            print("PASS: rotation guard refuses non-drained queue; old key recovers accepted job; drained snapshot passes", flush=True)
            new_keys = dict(line.split("=", 1) for line in command(key_command, base_env).decode().splitlines())
            missing = subprocess.run(["docker", "run", "--rm", "--read-only", "--network=none",
                                      "--env", "MOVEMAILBOX_WORKER_TOKEN", image, "worker-service"],
                                     env=base_env | {"MOVEMAILBOX_WORKER_TOKEN": new_keys["MOVEMAILBOX_WORKER_TOKEN"]},
                                     capture_output=True, timeout=10)
            assert missing.returncode != 0, "worker started without recipient private key"
            kill("worker")
            worker_env["MOVEMAILBOX_WORKER_PRIVATE_KEY"] = new_keys["MOVEMAILBOX_WORKER_PRIVATE_KEY"]
            start("worker")
            until(lambda: request("worker", "/healthz")[0]["available"])
            request("api", "/api/connections/test", endpoint, cookie, csrf, 502)
            # Rotate API public half, keeping its cookie signing secret unchanged.
            kill("api")
            api_env["MOVEMAILBOX_WORKER_PUBLIC_KEY"] = new_keys["MOVEMAILBOX_WORKER_PUBLIC_KEY"]
            start("api")
            until(lambda: request("api", "/api/health")[0]["available"])
            request("api", "/api/connections/test", endpoint, cookie, csrf)
            kill("worker")
            worker_env["MOVEMAILBOX_WORKER_TOKEN"] = new_keys["MOVEMAILBOX_WORKER_TOKEN"]
            start("worker")
            until(lambda: request("worker", "/healthz")[0]["available"])
            assert not request("api", "/api/health")[0]["available"], "stale internal token still works"
            assert_readiness(False)
            kill("api")
            api_env["MOVEMAILBOX_WORKER_TOKEN"] = new_keys["MOVEMAILBOX_WORKER_TOKEN"]
            start("api")
            until(lambda: request("api", "/api/health")[0]["available"])
            assert_readiness(True)
            rotated, _ = request("api", "/api/jobs", payload, cookie, csrf, 202)
            assert until(lambda: completed("/api/jobs/" + rotated["id"]))["transferred"] == 954
            assert completed(job_path)["status"] == "completed"
            request("api", job_path, cookie=other_headers["Set-Cookie"].split(";", 1)[0], expected=404)
            print("PASS: missing private key, mismatched recipient pair and stale token fail closed; coordinated rotation completes 954 simulated messages; history/ownership retained", flush=True)
        if image:
            for name, source in (("api", "/data/movemailbox.db"), ("worker", "/worker-data/worker.db")):
                for suffix in ("", "-wal", "-shm"):
                    command(["docker", "cp", f"{prefix}-{name}:{source}{suffix}", str(directory / name / (name + ".db" + suffix))])
        for name in ("api", "worker"):
            kill(name)
        for log in files:
            log.close()
        with closing(sqlite3.connect(directory / "worker" / "worker.db")) as database:
            assert database.execute("SELECT count(*) FROM credential_envelopes").fetchone()[0] == 0
            assert database.execute("SELECT attempts FROM worker_jobs WHERE job_id = ?", (job["id"],)).fetchone()[0] == 1
            attempts = database.execute("SELECT attempts FROM worker_jobs WHERE job_id = ?", (retry_job["id"],)).fetchone()[0]
            assert attempts == 2, "worker crash should retry once"
            assert database.execute("SELECT attempts FROM worker_jobs WHERE job_id = ?", (mirror["id"],)).fetchone()[0] == 1
        for path in directory.rglob("*"):
            if path.is_file():
                raw = path.read_bytes()
                assert not any(secret.encode() in raw for secret in passwords), f"password found in {path.name}"
        print("PASS: readiness 200/503/200 with live API during worker outage; demo preflight modes and conflict rejection, connection/folders, API kill/reconnect, worker kill/retry, 954 messages, strict mirror not replayed after kill, owner isolation, cancel, no plaintext in DB/WAL/logs")
    finally:
        for name in ("api", "worker"):
            kill(name)
        for log in files:
            log.close()
        for volume in volumes:
            assert volume.startswith(prefix + "-")
            command(["docker", "volume", "rm", volume])
        if network_created:
            command(["docker", "network", "rm", prefix])


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--binary", type=lambda value: str(Path(value).resolve(strict=True)))
    mode.add_argument("--image")
    parser.add_argument("--rotation", action="store_true", help="also verify coordinated recipient/token rotation in Docker")
    args = parser.parse_args()
    if args.rotation and not args.image:
        parser.error("rotation drill requires the isolated Docker mode")
    with tempfile.TemporaryDirectory(prefix="movemailbox-smoke-") as temporary:
        run(args.binary, args.image, Path(temporary), args.rotation)
