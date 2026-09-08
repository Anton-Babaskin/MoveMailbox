#!/usr/bin/env python3
"""Offline SQLite backup/restore drill in fresh Docker volumes (Linux/WSL root).

Demo-only. No real mailbox credentials or network calls. Retains stopped labs
and backup files for inspection. Never overwrites an existing database.
"""
import argparse
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import secrets
import sqlite3
import tempfile
import time
import traceback


def load(name, filename):
    spec = importlib.util.spec_from_file_location(name, Path(__file__).with_name(filename))
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def run(image):
    if os.geteuid() != 0:
        raise RuntimeError("Run this local volume drill as WSL/Linux root")
    os.umask(0o077)
    pilot, live = load("pilot", "start-local-pilot.py"), load("live", "smoke-live-quota.py")
    prefix = "movemailbox-backup-" + secrets.token_hex(6)
    restored = prefix + "-restored"
    containers = []
    backup = Path(tempfile.mkdtemp(prefix="movemailbox-backup-"))

    def volume_db(name, role):
        info = json.loads(pilot.docker("volume", "inspect", name + "-" + role + "-data"))[0]
        root = Path(info["Mountpoint"])
        assert root.is_absolute() and root.is_dir() and not root.is_symlink()
        return root / ("worker.db" if role == "worker" else "movemailbox.db")

    def connect(path):
        return sqlite3.connect(path.as_uri() + "?mode=ro", uri=True)

    try:
        pilot.start(prefix, 8184, image, demo=True)
        containers.extend([prefix + "-api", prefix + "-worker"])
        api = live.API(8184)
        secret = "backup-test-" + secrets.token_hex(24)
        endpoint = {"host": "8.8.8.8", "username": "demo-source@example.test", "password": secret, "port": 993, "security": "tls"}
        payload = {"source": endpoint, "destination": endpoint | {"host": "1.1.1.1", "username": "demo-destination@example.test"}, "options": {"syncFlags": True, "preserveDates": True}}
        job = api.run(payload)
        assert job["status"] == "completed" and job["transferred"] == 954
        other = live.API(8184)
        other.request("/api/jobs/" + job["id"], expected=404)
        # Stop both writers before taking the paired snapshot. Never back up a
        # running queue for automatic replay: mail servers are not rolled back.
        pilot.docker("stop", "--time=20", *containers)
        config = {}
        manifest = {"image": image, "jobId": job["id"], "files": {}}
        for role in ("api", "worker"):
            info = json.loads(pilot.docker("inspect", prefix + "-" + role))[0]
            assert not info["State"]["Running"]
            config[role] = info["Config"]
            source = volume_db(prefix, role)
            destination = backup / (role + ".db")
            assert not destination.exists()
            with connect(source) as source_db:
                assert source_db.execute("PRAGMA integrity_check").fetchall() == [("ok",)]
                if role == "worker":
                    assert source_db.execute("SELECT count(*) FROM worker_jobs WHERE status NOT IN ('completed','failed','cancelled')").fetchone()[0] == 0
                    assert source_db.execute("SELECT count(*) FROM credential_envelopes").fetchone()[0] == 0
                with sqlite3.connect(destination) as destination_db:
                    source_db.backup(destination_db)
                    assert destination_db.execute("PRAGMA integrity_check").fetchall() == [("ok",)]
            raw = destination.read_bytes()
            assert secret.encode() not in raw
            manifest["files"][role] = hashlib.sha256(raw).hexdigest()
        print("PASS: stopped paired DBs, integrity checks, no active worker jobs/envelopes, no synthetic password in backup", flush=True)
        # No service keys, tokens or cookie/session secrets are placed in backup.
        (backup / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
        pilot.docker("network", "create", restored)
        for role in ("worker", "api"):
            volume = restored + "-" + role + "-data"
            pilot.docker("volume", "create", volume)
            destination = volume_db(restored, role)
            assert not destination.exists(), "Restore requires an empty target"
            original = volume_db(prefix, role)
            source = backup / (role + ".db")
            assert hashlib.sha256(source.read_bytes()).hexdigest() == manifest["files"][role]
            with connect(source) as db, sqlite3.connect(destination) as output:
                db.backup(output)
            os.chown(destination, original.stat().st_uid, original.stat().st_gid)
            os.chmod(destination, 0o600)
            os.chown(destination.parent, original.parent.stat().st_uid, original.parent.stat().st_gid)
            values = dict(item.split("=", 1) for item in config[role]["Env"] if item.startswith("MOVEMAILBOX_"))
            if role == "api":
                assert "MOVEMAILBOX_WORKER_PRIVATE_KEY" not in values
                values["MOVEMAILBOX_WORKER_URL"] = "http://" + restored + "-worker:8090"
                values["MOVEMAILBOX_ALLOWED_HOSTS"] = "127.0.0.1:8185,localhost:8185"
            env = {key: value for key, value in os.environ.items() if not key.startswith(("MM_", "MOVEMAILBOX_", "IMAPSYNC_PASSWORD"))} | values
            name = restored + "-" + role
            args = ["run", "--detach", "--name", name, "--network", restored,
                    "--read-only", "--cap-drop=ALL", "--security-opt=no-new-privileges:true", "--init",
                    "--memory=512m", "--cpus=1", "--pids-limit=128",
                    "--tmpfs=/tmp:size=64m,mode=1777,noexec,nosuid,nodev",
                    "--tmpfs=/var/tmp:size=64m,mode=1777,noexec,nosuid,nodev",
                    "--mount", "type=volume,src=" + volume + ",dst=" + ("/data" if role == "api" else "/worker-data")]
            if role == "api":
                args += ["--publish", "127.0.0.1:8185:8080"]
            for key in values:
                args += ["--env", key]
            args += [image] + (["worker-service"] if role == "worker" else [])
            pilot.docker(*args, env=env)
            containers.append(name)
        time.sleep(2)
        recovered = live.API(8185)
        recovered.cookie, recovered.csrf = api.cookie, api.csrf
        state, _ = recovered.request("/api/jobs/" + job["id"])
        assert state["status"] == "completed" and state["transferred"] == 954
        outsider = live.API(8185)
        outsider.request("/api/jobs/" + job["id"], expected=404)
        time.sleep(2)
        with connect(volume_db(restored, "worker")) as db:
            assert db.execute("SELECT status, attempts FROM worker_jobs WHERE job_id=?", (job["id"],)).fetchone() == ("completed", 1)
            assert db.execute("SELECT count(*) FROM credential_envelopes").fetchone()[0] == 0
        print("PASS: fresh-volume restore preserves owner history; outsider receives 404; terminal job not replayed", flush=True)
        fresh = recovered.run(payload)
        assert fresh["status"] == "completed" and fresh["transferred"] == 954
        print("PASS: restored API/worker accepts and completes a new job", flush=True)
        print(json.dumps({"backup": str(backup), "lab": prefix, "restoredLab": restored, "originalJob": job["id"], "newJob": fresh["id"]}), flush=True)
    finally:
        if containers:
            pilot.docker("stop", "--time=20", *containers)
        print("Test containers stopped; backups and volumes retained. Nothing deleted.", flush=True)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--image", required=True)
    args = parser.parse_args()
    try:
        run(args.image)
    except Exception as exc:
        print("FAIL:", type(exc).__name__, "(sensitive details withheld)", flush=True)
        for frame in traceback.extract_tb(exc.__traceback__):
            print(Path(frame.filename).name, frame.lineno, frame.name, flush=True)
        raise SystemExit(1)
