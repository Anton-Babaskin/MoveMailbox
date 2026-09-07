#!/usr/bin/env python3
"""Create a persistent, loopback-only Docker API/worker lab. No mailbox secrets.

Run after building movemailbox:pilot. Existing resources are never replaced.
Stop/restart with docker stop/start movemailbox-pilot-api movemailbox-pilot-worker.
Docker administrators can inspect service keys in container environments.
"""
import base64
import json
import os
import secrets
import subprocess

IMAGE = "movemailbox:pilot"
PREFIX = "movemailbox-pilot"


def docker(*args, env=None):
    result = subprocess.run(["docker", *args], env=env, capture_output=True, timeout=90)
    if result.returncode:
        raise RuntimeError("Docker operation failed; inspect container status (output withheld)")
    return result.stdout.decode().strip()


def start():
    docker("image", "inspect", IMAGE)
    # Resolve all collisions before making any changes. Do not reuse unknown data.
    for kind, names in (("container", [PREFIX + "-api", PREFIX + "-worker"]),
                        ("volume", [PREFIX + "-api-data", PREFIX + "-worker-data"]),
                        ("network", [PREFIX])):
        for name in names:
            result = subprocess.run(["docker", kind, "inspect", name], capture_output=True)
            if result.returncode == 0:
                raise RuntimeError("Pilot resources already exist; restart them instead of overwriting")
    keys = dict(line.split("=", 1) for line in docker("run", "--rm", IMAGE, "keygen").splitlines())
    public_mode = os.getenv("MOVEMAILBOX_PILOT_PUBLIC", "false").lower() == "true"
    docker("network", "create", PREFIX)
    for role in ("worker", "api"):
        volume = PREFIX + "-" + role + "-data"
        docker("volume", "create", volume)
        values = {"MOVEMAILBOX_WORKER_TOKEN": keys["MOVEMAILBOX_WORKER_TOKEN"]}
        if role == "worker":
            values.update({
                "MOVEMAILBOX_WORKER_PRIVATE_KEY": keys["MOVEMAILBOX_WORKER_PRIVATE_KEY"],
                "MOVEMAILBOX_WORKER_ADDR": "0.0.0.0:8090",
                "MOVEMAILBOX_WORKER_DATABASE": "/worker-data/worker.db",
                "MOVEMAILBOX_WORKER_RECOVER_INTERRUPTED": "true",
            })
        else:
            values.update({
                "MOVEMAILBOX_PUBLIC_MODE": "true" if public_mode else "false",
                "MOVEMAILBOX_WORKER_PUBLIC_KEY": keys["MOVEMAILBOX_WORKER_PUBLIC_KEY"],
                "MOVEMAILBOX_WORKER_URL": "http://" + PREFIX + "-worker:8090",
                "MOVEMAILBOX_WORKER_ALLOW_HTTP": "true",
                "MOVEMAILBOX_ALLOWED_HOSTS": "localhost:8180,127.0.0.1:8180",
            })
            if public_mode:
                values.update({
                    "MOVEMAILBOX_SESSION_SECRET": base64.b64encode(secrets.token_bytes(48)).decode(),
                })
        environment = {key: value for key, value in os.environ.items() if not key.startswith(("MOVEMAILBOX_", "IMAPSYNC_PASSWORD"))}
        environment.update(values)
        args = ["run", "--detach", "--name", PREFIX + "-" + role, "--network", PREFIX,
                "--read-only", "--cap-drop=ALL", "--security-opt=no-new-privileges:true",
                "--init", "--pids-limit=128", "--memory=512m", "--cpus=1",
                "--tmpfs=/tmp:size=64m,mode=1777,noexec,nosuid,nodev",
                "--tmpfs=/var/tmp:size=64m,mode=1777,noexec,nosuid,nodev",
                "--mount", "type=volume,src=" + volume + ",dst=" + ("/data" if role == "api" else "/worker-data")]
        if role == "api":
            args += ["--publish", "127.0.0.1:8180:8080"]
        else:
            args += ["--health-cmd=wget -q -T 3 -O /dev/null http://127.0.0.1:8090/healthz"]
        for key in values:
            args += ["--env", key]
        args += [IMAGE]
        if role == "worker":
            args += ["worker-service"]
        docker(*args, env=environment)
        print("Started", PREFIX + "-" + role, flush=True)
    print("Local pilot: http://localhost:8180 (real engine, no mailbox credentials stored by this script)")


if __name__ == "__main__":
    start()
