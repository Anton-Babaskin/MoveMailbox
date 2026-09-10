#!/usr/bin/env python3
"""Offline SQLite backup/restore drill in fresh Docker volumes (Linux/WSL root).

Demo by default. Opt-in live mode copies an authorized isolated test fixture.
Retains stopped labs and backup files; never overwrites an existing database.
"""
import argparse
from contextlib import closing
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import secrets
import re
import subprocess
import sqlite3
import tempfile
import time
import traceback

from backup_validation import validate_pair
from backup_archive import encrypt_pair, decrypt_pair, publish_object, fetch_object


def load(name, filename):
    spec = importlib.util.spec_from_file_location(name, Path(__file__).with_name(filename))
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def run(image, encrypted=False, age="age", keygen="age-keygen", folder=None):
    if os.geteuid() != 0:
        raise RuntimeError("Run this local volume drill as WSL/Linux root")
    os.umask(0o077)
    pilot, live = load("pilot", "start-local-pilot.py"), load("live", "smoke-live-quota.py")
    prefix = "movemailbox-backup-" + secrets.token_hex(6)
    restored = prefix + "-restored"
    containers = []
    backup = Path(tempfile.mkdtemp(prefix="movemailbox-backup-"))
    clients = []

    def volume_db(name, role):
        info = json.loads(pilot.docker("volume", "inspect", name + "-" + role + "-data"))[0]
        root = Path(info["Mountpoint"])
        assert root.is_absolute() and root.is_dir() and not root.is_symlink()
        return root / ("worker.db" if role == "worker" else "movemailbox.db")

    def connect(path):
        return closing(sqlite3.connect(path.as_uri() + "?mode=ro", uri=True))

    try:
        pilot.start(prefix, 8184, image, max_mailbox_bytes=100000000 if folder else 5000000000,
                    demo=not folder, started_containers=containers)
        api = live.API(8184)
        secret = "backup-test-" + secrets.token_hex(24)
        endpoint = {"host": "8.8.8.8", "username": "demo-source@example.test", "password": secret, "port": 993, "security": "tls"}
        payload = {"source": endpoint, "destination": endpoint | {"host": "1.1.1.1", "username": "demo-destination@example.test"}, "options": {"syncFlags": True, "preserveDates": True}}
        test_secrets, count = [secret], 954
        if folder:
            source, destination = live.endpoint("SOURCE"), live.endpoint("DESTINATION")
            test_secrets = [source["password"], destination["password"]]
            for account in (source, destination):
                clients.append(live.connect(account))
            original = live.snapshot(clients[0], folder)
            assert len(original) == 1, "expected one isolated fixture"
            count = 1
            target = "MoveMailbox-Backup-" + secrets.token_hex(6)
            payload = {"source": source, "destination": destination, "options": {
                "folders": [folder], "destinationSubfolder": target, "syncFlags": True, "preserveDates": True}}
        job = api.run(payload)
        assert job["status"] == "completed" and job["transferred"] == count, "initial job result mismatch"
        if folder:
            assert live.snapshot(clients[1], target + "." + folder) == original
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
                with closing(sqlite3.connect(destination)) as destination_db:
                    source_db.backup(destination_db)
                    assert destination_db.execute("PRAGMA integrity_check").fetchall() == [("ok",)]
            raw = destination.read_bytes()
            assert not any(value.encode() in raw for value in test_secrets)
            manifest["files"][role] = hashlib.sha256(raw).hexdigest()
        print("PASS: stopped paired DBs, integrity checks, no active worker jobs/envelopes, no synthetic password in backup", flush=True)
        # No service keys, tokens or cookie/session secrets are placed in backup.
        (backup / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
        # A backup is not trusted merely because the file exists. Verify that
        # truncation and a byte-level mutation are rejected before restore.
        worker_backup = backup / "worker.db"
        for label, mutate in (("truncated", lambda data: data[: max(512, len(data) // 3)]),
                              ("corrupt", lambda data: data[:100] + bytes([data[100] ^ 0xFF]) + data[101:])):
            damaged = backup / ("worker-" + label + ".db")
            damaged.write_bytes(mutate(worker_backup.read_bytes()))
            try:
                with closing(sqlite3.connect(damaged)) as damaged_db:
                    check = damaged_db.execute("PRAGMA integrity_check").fetchall()
                if check == [("ok",)]:
                    raise AssertionError(label + " backup unexpectedly passed integrity check")
            except sqlite3.DatabaseError:
                pass
        print("PASS: truncated and byte-corrupted worker backups fail SQLite integrity validation", flush=True)
        validate_pair(backup, manifest)
        restore_source = backup
        if encrypted:
            # Separate directory target models a committed upload/download. It is
            # still on this host: do not claim a real off-site provider drill.
            store = Path(tempfile.mkdtemp(prefix="movemailbox-object-store-"))
            with tempfile.TemporaryDirectory(prefix="movemailbox-restore-identity-") as keydir:
                identity = Path(keydir) / "identity.txt"
                result = subprocess.run([keygen, "-o", str(identity)], capture_output=True, timeout=10)
                if result.returncode:
                    raise RuntimeError("test age key generation failed")
                identity.chmod(0o600)
                recipient = subprocess.run([keygen, "-y", str(identity)], capture_output=True, check=True).stdout.decode().strip()
                sealed = store / "incoming.age"
                encrypt_pair(backup, sealed, recipient, age)
                obj = publish_object(sealed, store, "snapshot")
                downloaded = fetch_object(obj, backup / "download.age")
                restore_source = decrypt_pair(downloaded, backup / "verified", identity, age)
            assert (restore_source / "RESTORE-VERIFIED").is_file()
            manifest = json.loads((restore_source / "manifest.json").read_text())
            validate_pair(restore_source, manifest)
            print("PASS: age-encrypted paired snapshot uploaded, committed, downloaded, decrypted and validated before any restore volume exists", flush=True)
        # All pair validation must succeed before allocating restored resources.
        # Explicit /28 avoids Docker's exhausted default address pool on a
        # developer workstation with many retained disposable labs. The subnet
        # is private and the restore network remains isolated from live services.
        subnet_octet = 16 + (int.from_bytes(hashlib.sha256(restored.encode()).digest()[:2], "big") % 200)
        pilot.docker("network", "create", "--subnet", f"10.253.{subnet_octet}.0/28", restored)
        for role in ("worker", "api"):
            volume = restored + "-" + role + "-data"
            pilot.docker("volume", "create", volume)
            destination = volume_db(restored, role)
            assert not destination.exists(), "Restore requires an empty target"
            original = volume_db(prefix, role)
            source = restore_source / (role + ".db")
            assert hashlib.sha256(source.read_bytes()).hexdigest() == manifest["files"][role]
            with connect(source) as db, closing(sqlite3.connect(destination)) as output:
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
        assert state["status"] == "completed" and state["transferred"] == count
        outsider = live.API(8185)
        outsider.request("/api/jobs/" + job["id"], expected=404)
        time.sleep(2)
        with connect(volume_db(restored, "worker")) as db:
            assert db.execute("SELECT status, attempts FROM worker_jobs WHERE job_id=?", (job["id"],)).fetchone() == ("completed", 1)
            assert db.execute("SELECT count(*) FROM credential_envelopes").fetchone()[0] == 0
        print("PASS: fresh-volume restore preserves owner history; outsider receives 404; terminal job not replayed", flush=True)
        if folder:
            target = "MoveMailbox-Restored-" + secrets.token_hex(6)
            payload["options"]["destinationSubfolder"] = target
        fresh = recovered.run(payload)
        assert fresh["status"] == "completed" and fresh["transferred"] == count
        if folder:
            assert live.snapshot(clients[1], target + "." + folder) == original
            repeat = recovered.run(payload)
            assert repeat["status"] == "completed" and repeat["transferred"] == 0
            assert live.snapshot(clients[1], target + "." + folder) == original
            assert live.snapshot(clients[0], folder) == original
            print("PASS: post-restore real IMAP copy hash/flags/date/count match; repeat zero; source unchanged", flush=True)
        print("PASS: restored API/worker accepts and completes a new job", flush=True)
        print(json.dumps({"backup": str(backup), "lab": prefix, "restoredLab": restored, "originalJob": job["id"], "newJob": fresh["id"], "encrypted": encrypted}), flush=True)
    finally:
        if containers:
            pilot.docker("stop", "--time=20", *containers)
        for client in clients:
            try:
                client.logout()
            except (OSError, live.imaplib.IMAP4.error):
                pass
        print("Test containers stopped; backups/volumes and any test mail retained. Temporary age identity discarded.", flush=True)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--image", required=True)
    parser.add_argument("--encrypted", action="store_true", help="age seal/upload/download/open before restoring")
    parser.add_argument("--age", default="age")
    parser.add_argument("--age-keygen", default="age-keygen")
    parser.add_argument("--folder", help="opt-in existing one-message live fixture")
    parser.add_argument("--allow-test-mail", action="store_true")
    args = parser.parse_args()
    if bool(args.folder) != args.allow_test_mail or (args.folder and not re.fullmatch(r"MoveMailbox-Attachment-[a-zA-Z0-9-]+", args.folder)):
        parser.error("live mode requires both isolated attachment folder and allow-test-mail")
    try:
        run(args.image, args.encrypted, args.age, args.age_keygen, args.folder)
    except Exception as exc:
        print("FAIL:", type(exc).__name__, "(sensitive details withheld)", flush=True)
        for frame in traceback.extract_tb(exc.__traceback__):
            print(Path(frame.filename).name, frame.lineno, frame.name, flush=True)
        raise SystemExit(1)
