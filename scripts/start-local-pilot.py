#!/usr/bin/env python3
"""Create a persistent, loopback-only Docker API/worker lab. No mailbox secrets.

Run after building movemailbox:pilot. Existing resources are never replaced.
Stop/restart with docker stop/start movemailbox-pilot-api movemailbox-pilot-worker.
Docker administrators can inspect service keys in container environments.
Public mode is required to select the remote runner. HTTP is loopback-only;
test clients must explicitly replay the session cookie and CSRF token, or use
a trusted local HTTPS proxy. Never disable public mode to bypass cookie handling.
"""
import base64
import argparse
import hashlib
import ipaddress
import json
import os
import secrets
import subprocess
import time
import urllib.request

IMAGE = "movemailbox:pilot"
PREFIX = "movemailbox-pilot"


class DockerOperationError(RuntimeError):
    def __init__(self, operation):
        super().__init__('Docker operation failed; details withheld')
        self.operation = operation


def docker(*args, env=None):
    result = subprocess.run(["docker", *args], env=env, capture_output=True, timeout=90)
    if result.returncode:
        # Only the fixed operation name, never arguments/env/stderr with secrets.
        raise DockerOperationError(args[0])
    return result.stdout.decode().strip()


def create_lab_network(prefix):
    # Retained stopped labs still own their networks. Hashing into only 200
    # slots made sequential CI faults collide randomly; never delete those labs.
    ids = docker("network", "ls", "--quiet").split()
    if any(not value.isascii() or not all(c in '0123456789abcdef' for c in value) for value in ids):
        raise RuntimeError("invalid Docker network inventory")
    occupied = []
    if ids:
        lines = docker("network", "inspect", *ids, "--format={{json .IPAM.Config}}").splitlines()
        if len(lines) != len(ids):
            raise RuntimeError("incomplete Docker network inventory")
        for line in lines:
            for config in json.loads(line) or []:
                if config.get("Subnet"):
                    occupied.append(ipaddress.ip_network(config["Subnet"], strict=False))
    start = int.from_bytes(hashlib.sha256(prefix.encode()).digest()[:2], "big") % 3200
    for offset in range(3200):
        slot = (start + offset) % 3200
        subnet = ipaddress.ip_network(f"10.254.{16 + slot // 16}.{(slot % 16) * 16}/28")
        if not any(network.version == 4 and subnet.overlaps(network) for network in occupied):
            # Docker remains the atomic collision guard against concurrent creation.
            # Any creation failure is fatal, never a reason to remove another network.
            docker("network", "create", "--subnet", str(subnet), prefix)
            return
    raise RuntimeError("no unused lab subnet; existing networks preserved")


def start(prefix=PREFIX, port=8180, image=IMAGE, max_mailbox_bytes=5000000000, demo=False, worker_test_args=(), started_containers=None, worker_test_database=None, resume_interrupted=True):
    if max_mailbox_bytes < 0:
        raise ValueError("mailbox limit must be non-negative")
    docker("image", "inspect", image)
    # Resolve all collisions before making any changes. Do not reuse unknown data.
    for kind, names in (("container", [prefix + "-api", prefix + "-worker"]),
                        ("volume", [prefix + "-api-data", prefix + "-worker-data"]),
                        ("network", [prefix])):
        for name in names:
            result = subprocess.run(["docker", kind, "inspect", name], capture_output=True)
            if result.returncode == 0:
                raise RuntimeError("Pilot resources already exist; restart them instead of overwriting")
    keys = dict(line.split("=", 1) for line in docker("run", "--rm", image, "keygen").splitlines())
    # Explicitly allocate a tiny private subnet. Developer machines often retain
    # stopped test labs until inspection, exhausting Docker's default pools.
    create_lab_network(prefix)
    for role in ("worker", "api"):
        volume = prefix + "-" + role + "-data"
        docker("volume", "create", volume)
        values = {"MOVEMAILBOX_WORKER_TOKEN": keys["MOVEMAILBOX_WORKER_TOKEN"]}
        if role == "worker":
            values.update({
                "MOVEMAILBOX_WORKER_PRIVATE_KEY": keys["MOVEMAILBOX_WORKER_PRIVATE_KEY"],
                "MOVEMAILBOX_WORKER_ADDR": "0.0.0.0:8090",
                "MOVEMAILBOX_WORKER_DATABASE": worker_test_database or "/worker-data/worker.db",
                "MOVEMAILBOX_WORKER_RECOVER_INTERRUPTED": "true" if resume_interrupted else "false",
                "MOVEMAILBOX_MAX_MAILBOX_BYTES": str(max_mailbox_bytes),
                "MOVEMAILBOX_DEMO": "true" if demo else "false",
            })
        else:
            values.update({
                "MOVEMAILBOX_PUBLIC_MODE": "true",
                "MOVEMAILBOX_WORKER_PUBLIC_KEY": keys["MOVEMAILBOX_WORKER_PUBLIC_KEY"],
                "MOVEMAILBOX_WORKER_URL": "http://" + prefix + "-worker:8090",
                "MOVEMAILBOX_WORKER_ALLOW_HTTP": "true",
                "MOVEMAILBOX_ALLOWED_HOSTS": f"localhost:{port},127.0.0.1:{port}",
                "MOVEMAILBOX_SESSION_SECRET": base64.b64encode(secrets.token_bytes(48)).decode(),
            })
        environment = {key: value for key, value in os.environ.items() if not key.startswith(("MOVEMAILBOX_", "IMAPSYNC_PASSWORD"))}
        environment.update(values)
        args = ["run", "--detach", "--name", prefix + "-" + role, "--network", prefix,
                "--read-only", "--cap-drop=ALL", "--security-opt=no-new-privileges:true",
                "--init", "--pids-limit=128", "--memory=512m", "--cpus=1",
                "--tmpfs=/tmp:size=64m,mode=1777,noexec,nosuid,nodev",
                "--tmpfs=/var/tmp:size=64m,mode=1777,noexec,nosuid,nodev",
                "--mount", "type=volume,src=" + volume + ",dst=" + ("/data" if role == "api" else "/worker-data")]
        if role == "api":
            args += ["--publish", f"127.0.0.1:{port}:8080"]
        else:
            args += ["--health-cmd=wget -q -T 3 -O /dev/null http://127.0.0.1:8090/healthz"]
            # Python-only hook for isolated fault-injection labs; not a service
            # option and never enabled by the launcher CLI.
            args += list(worker_test_args)
        for key in values:
            args += ["--env", key]
        args += [image]
        if role == "worker":
            args += ["worker-service"]
        docker(*args, env=environment)
        if started_containers is not None:
            started_containers.append(prefix + "-" + role)
        print("Started", prefix + "-" + role, flush=True)
    for attempt in range(20):
        try:
            with urllib.request.urlopen(f"http://127.0.0.1:{port}/api/health", timeout=3) as response:
                health = json.load(response)
            if health.get("execution") != "remote-worker":
                raise RuntimeError("Pilot is not using the remote worker")
            if health.get("available"):
                print(f"Verified remote-worker pilot: http://localhost:{port}")
                return
        except (OSError, ValueError):
            pass
        time.sleep(1)
    raise RuntimeError("Remote worker did not become available; inspect pilot status")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--name", default=PREFIX)
    parser.add_argument("--port", type=int, default=8180)
    parser.add_argument("--image", default=IMAGE)
    parser.add_argument("--max-mailbox-bytes", type=int, default=5000000000)
    parser.add_argument("--demo", action="store_true", help="simulate mail; never contact IMAP")
    args = parser.parse_args()
    if not args.name.startswith("movemailbox-") or not all(c.isascii() and (c.isalnum() or c == "-") for c in args.name):
        parser.error("name must start with movemailbox- and contain ASCII letters, numbers or hyphens")
    if not 1024 <= args.port <= 65535:
        parser.error("port must be between 1024 and 65535")
    if args.max_mailbox_bytes < 0:
        parser.error("mailbox limit must be non-negative")
    start(args.name, args.port, args.image, args.max_mailbox_bytes, args.demo)
