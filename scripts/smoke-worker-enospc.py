#!/usr/bin/env python3
"""Real ENOSPC drill in an 8 MiB Docker tmpfs; demo by default.

Opt-in --real-imap pauses after a native copy, before worker finalization.
Requires authorized disposable MM_* accounts; does not delete mail.

Run as WSL Docker administrator. Fills only a validated dedicated tmpfs, then
truncates its own filler file. Never fills/deletes user volumes or the host disk.
"""
import argparse
from contextlib import closing
import importlib.util
import json
from pathlib import Path
import secrets
import re
import sqlite3
import subprocess
import traceback
import time
import tempfile


def load(name, filename):
    spec = importlib.util.spec_from_file_location(name, Path(__file__).with_name(filename))
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def run(args, temporary):
    pilot = load("pilot", "start-local-pilot.py")
    live = load("live", "smoke-live-quota.py")
    prefix = "movemailbox-enospc-" + secrets.token_hex(6)
    worker = prefix + "-worker"
    volume = prefix + "-fault"
    started = []
    clients = []
    try:
        worker_args = ["--mount", "type=volume,src=" + volume + ",dst=/fault"]
        original, target_folder = None, None
        if args.real_imap:
            source, destination = live.endpoint("SOURCE"), live.endpoint("DESTINATION")
            for account in (source, destination):
                clients.append(live.connect(account))
            original = live.snapshot(clients[0], args.folder)
            if len(original) != 1:
                raise RuntimeError("live source fixture must contain exactly one message")
            # Normalize Windows checkout line endings in a disposable runtime copy.
            gate = Path(temporary) / "storage-gate.sh"
            gate.write_text(Path(__file__).with_name("test-storage-finalize-gate.sh").read_text())
            gate.chmod(0o755)
            worker_args += ["--mount", f"type=bind,src={gate},dst=/test-storage-gate,readonly",
                            "--env", "MOVEMAILBOX_IMAPSYNC_BIN=/test-storage-gate"]
        if subprocess.run(["docker", "volume", "inspect", volume], capture_output=True).returncode == 0:
            raise RuntimeError("test volume already exists")
        pilot.docker("volume", "create", "--driver", "local", "--opt", "type=tmpfs", "--opt", "device=tmpfs", "--opt", "o=size=8m,mode=0770,uid=65534,gid=65534", volume)
        pilot.start(prefix, args.port, args.image, 100000000 if args.real_imap else 0, demo=not args.real_imap,
                    worker_test_args=worker_args,
                    worker_test_database="/fault/worker.db", started_containers=started,
                    resume_interrupted=not args.crash or args.resume_interrupted)
        holder = None
        if args.crash:
            holder = prefix + "-holder"
            pilot.docker("run", "--detach", "--name", holder, "--init", "--network=none", "--read-only", "--cap-drop=ALL",
                         "--security-opt=no-new-privileges:true", "--memory=64m", "--pids-limit=16",
                         "--mount", "type=volume,src=" + volume + ",dst=/fault", "--entrypoint", "sleep", args.image, "600")
            # Stop last, keeping tmpfs data mounted while the worker is killed.
            started.insert(0, holder)
        config = json.loads(pilot.docker("inspect", worker))[0]
        info = json.loads(pilot.docker("volume", "inspect", volume))[0]
        if info["Driver"] != "local" or info["Options"] != {"type": "tmpfs", "device": "tmpfs", "o": "size=8m,mode=0770,uid=65534,gid=65534"}:
            raise RuntimeError("test tmpfs configuration mismatch")
        if not any(m.get("Name") == volume and m["Destination"] == "/fault" for m in config["Mounts"]):
            raise RuntimeError("unexpected fault volume mapping")
        fs_type, block_size, blocks = pilot.docker("exec", worker, "stat", "-f", "-c", "%T:%S:%b", "/fault").split(":")
        if fs_type != "tmpfs" or int(block_size) * int(blocks) != 8388608:
            raise RuntimeError("refusing to fill non-tmpfs storage")
        dbpath = Path(info["Mountpoint"]) / "worker.db"
        api = live.API(args.port)
        payload = {"source": {"host": "1.1.1.1", "port": 993, "security": "tls", "username": "demo-source@example.test", "password": "synthetic-enospc-source"},
                   "destination": {"host": "8.8.8.8", "port": 993, "security": "tls", "username": "demo-dest@example.test", "password": "synthetic-enospc-dest"},
                   "options": {"justLogin": True}}
        # Demo worker never connects to either endpoint. Public API checks remain.
        active_job = None
        if args.active:
            active_payload = {**payload, "options": {"strictMirror": args.strict_mirror, "strictMirrorConfirmed": args.strict_mirror}}
            if args.real_imap:
                target = "MoveMailbox-Storage-" + secrets.token_hex(6)
                target_folder = target + "." + args.folder
                payload = {"source": source, "destination": destination, "options": {
                    "folders": [args.folder], "destinationSubfolder": target,
                    "syncFlags": True, "preserveDates": True}}
                active_payload = payload
            active_job, _ = api.request("/api/jobs", active_payload, 202)
            deadline = time.monotonic() + (180 if args.real_imap else 15)
            while True:
                with closing(sqlite3.connect(dbpath.as_uri() + "?mode=ro", uri=True)) as db:
                    row = db.execute("SELECT status, sequence FROM worker_jobs WHERE job_id=?", (active_job["id"],)).fetchone()
                gate_ready = not args.real_imap or subprocess.run(
                    ["docker", "exec", worker, "test", "-f", "/tmp/storage-copy-ready"],
                    capture_output=True, timeout=5).returncode == 0
                if row and row[0] == "running" and row[1] > 0 and gate_ready:
                    break
                if time.monotonic() > deadline:
                    raise RuntimeError("active job did not start")
                time.sleep(1 if args.real_imap else 0.05)
            if args.real_imap:
                if live.snapshot(clients[1], target_folder) != original:
                    raise RuntimeError("native copy before fault failed content/flags/date comparison")
                print("PASS: real native IMAP copy committed with matching hash/flags/date; wrapper holds worker finalization", flush=True)
            pilot.docker("pause", worker)
        try:
            with closing(sqlite3.connect(dbpath)) as db:
                result = db.execute("PRAGMA wal_checkpoint(TRUNCATE)").fetchone()
                if result[0] != 0:
                    raise RuntimeError("cannot checkpoint test database")
        finally:
            if active_job:
                pilot.docker("unpause", worker)
        filled = subprocess.run(["docker", "exec", worker, "dd", "if=/dev/zero", "of=/fault/filler", "bs=1048576", "count=16"], capture_output=True, timeout=20)
        if filled.returncode == 0 or b"No space left on device" not in filled.stderr:
            raise RuntimeError("real ENOSPC not observed")
        if int(pilot.docker("exec", worker, "stat", "-f", "-c", "%a", "/fault")) != 0:
            raise RuntimeError("test filesystem still has available blocks")
        if args.real_imap:
            pilot.docker("exec", worker, "touch", "/tmp/storage-copy-release")
        if active_job:
            deadline = time.monotonic() + 20
            while True:
                health, _ = api.request("/api/health")
                if not health["available"]:
                    break
                if time.monotonic() > deadline:
                    raise RuntimeError("worker did not expose pending storage failure")
                time.sleep(0.25)
            state, _ = api.request("/api/jobs/" + active_job["id"])
            if state["status"] == "completed":
                raise RuntimeError("full storage produced false success")
            print("PASS: active transfer lost persistence; worker unavailable while terminal write cannot commit; no false success", flush=True)
            if args.crash:
                pilot.docker("kill", "--signal=KILL", worker)
                if pilot.docker("inspect", "--format", "{{.State.Running}}", worker) != "false":
                    raise RuntimeError("worker did not stop after SIGKILL")
                with closing(sqlite3.connect(dbpath.as_uri() + "?mode=ro", uri=True)) as db:
                    row = db.execute("SELECT status, attempts FROM worker_jobs WHERE job_id=?", (active_job["id"],)).fetchone()
                    if row != ("running", 1):
                        raise RuntimeError("uncertain running record not retained across kill")
                print("PASS: SIGKILL while terminal write pending; holder preserves original running record in same tmpfs", flush=True)
        else:
            api.request("/api/jobs", payload, expected=503)
            jobs, _ = api.request("/api/jobs")
            if jobs:
                raise RuntimeError("API accepted job despite unavailable durable admission")
            with closing(sqlite3.connect(dbpath.as_uri() + "?mode=ro", uri=True)) as db:
                for table in ("worker_jobs", "credential_envelopes", "worker_events"):
                    if db.execute("SELECT count(*) FROM " + table).fetchone()[0] != 0:
                        raise RuntimeError("partial admission persisted")
            print("PASS: actual ENOSPC, zero available tmpfs blocks, API 503; no accepted job/envelope/event", flush=True)
        # Exact file in our verified tmpfs only. Truncate, do not recursively delete.
        storage_container = holder or worker
        if pilot.docker("exec", storage_container, "stat", "-c", "%F", "/fault/filler") != "regular file":
            raise RuntimeError("filler is not a regular file")
        pilot.docker("exec", storage_container, "truncate", "-s", "0", "/fault/filler")
        if int(pilot.docker("exec", storage_container, "stat", "-f", "-c", "%a", "/fault")) <= 0:
            raise RuntimeError("capacity was not restored")
        if args.crash:
            pilot.docker("start", worker)
        if active_job:
            expected_status = "completed" if args.crash and args.resume_interrupted and not args.strict_mirror else "failed"
            expected_attempts = 2 if expected_status == "completed" else 1
            # Crash can retain an unexpired credential lease (30 s by default).
            # Respect that lease rather than forcing a premature second owner.
            deadline = time.monotonic() + 75
            while True:
                state, _ = api.request("/api/jobs/" + active_job["id"])
                if state["status"] == expected_status:
                    break
                if time.monotonic() > deadline:
                    raise RuntimeError("terminal state did not recover after freeing space")
                time.sleep(2)  # Respect guest rate limits during lease expiry.
            with closing(sqlite3.connect(dbpath.as_uri() + "?mode=ro", uri=True)) as db:
                row = db.execute("SELECT status, attempts FROM worker_jobs WHERE job_id=?", (active_job["id"],)).fetchone()
                if row != (expected_status, expected_attempts) or db.execute("SELECT count(*) FROM credential_envelopes").fetchone()[0] != 0:
                    raise RuntimeError("active job replayed or retained credentials")
            print(f"PASS: original job {expected_status}, attempts={expected_attempts}, credentials removed; crash={args.crash}, resume={args.resume_interrupted}, mirror={args.strict_mirror}", flush=True)
        recovered = api.run(payload)
        if recovered["status"] != "completed":
            raise RuntimeError("new job failed after restoring capacity")
        if args.real_imap:
            if recovered["transferred"] != 0:
                raise RuntimeError("repeat copied an already committed message")
            if live.snapshot(clients[1], target_folder) != original or live.snapshot(clients[0], args.folder) != original:
                raise RuntimeError("recovery duplicated mail, damaged metadata or changed source")
            print("PASS: recovered real mailbox exactly matches source hash/flags/date; repeat copied zero messages; source unchanged", flush=True)
        with closing(sqlite3.connect(dbpath.as_uri() + "?mode=ro", uri=True)) as db:
            row = db.execute("SELECT status, attempts FROM worker_jobs WHERE job_id=?", (recovered["id"],)).fetchone()
            if row != ("completed", 1) or db.execute("SELECT count(*) FROM credential_envelopes").fetchone()[0] != 0:
                raise RuntimeError("recovered job state/cleanup mismatch")
            if db.execute("PRAGMA integrity_check").fetchone() != ("ok",):
                raise RuntimeError("database integrity failed")
        live.API(args.port).request("/api/jobs/" + recovered["id"], expected=404)
        logs = pilot.docker("logs", worker) + pilot.docker("logs", prefix + "-api")
        if any(payload[side]["password"] in logs for side in ("source", "destination")):
            raise RuntimeError("synthetic credentials in service logs")
        print("PASS: new job completes after recovery in one attempt, no envelopes, integrity ok, guest isolation, no secrets in logs", flush=True)
        print(json.dumps({"lab": prefix, "activeJob": active_job["id"] if active_job else None, "recoveredJob": recovered["id"], "tmpfsBytes": 8388608,
                          "realImap": args.real_imap, "destinationFolder": target_folder}), flush=True)
    finally:
        for name in reversed(started):
            pilot.docker("stop", "--time=20", name)
        for client in clients:
            try:
                client.logout()
            except (OSError, live.imaplib.IMAP4.error):
                pass
        if started:
            print("Containers stopped; disposable worker tmpfs discarded, API volume retained. " +
                  ("Test mail retained; no mail deleted." if args.real_imap else "No mail was accessed."), flush=True)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--image", required=True)
    parser.add_argument("--port", type=int, default=8186)
    parser.add_argument("--active", action="store_true", help="fill after migration has started")
    parser.add_argument("--crash", action="store_true", help="SIGKILL pending worker; preserve database with a holder")
    parser.add_argument("--resume-interrupted", action="store_true", help="explicitly opt into recovery after crash")
    parser.add_argument("--strict-mirror", action="store_true", help="demo-only destructive-mode replay guard")
    parser.add_argument("--real-imap", action="store_true", help="authorized live copy; ENOSPC after native copy before finalization")
    parser.add_argument("--folder", help="existing isolated one-message source fixture")
    parser.add_argument("--allow-test-mail", action="store_true")
    args = parser.parse_args()
    if not 1024 <= args.port <= 65535:
        parser.error("unprivileged API port required")
    if (args.crash and not args.active) or ((args.resume_interrupted or args.strict_mirror) and not args.crash):
        parser.error("crash requires active; resume/mirror require crash")
    if args.real_imap and (not args.active or not args.allow_test_mail or args.strict_mirror or
                          not re.fullmatch(r"MoveMailbox-Attachment-[a-zA-Z0-9-]+", args.folder or "")):
        parser.error("real IMAP requires active, allow-test-mail and an isolated fixture; mirror is demo-only")
    if not args.real_imap and (args.folder or args.allow_test_mail):
        parser.error("mail fixture options require real-imap")
    try:
        with tempfile.TemporaryDirectory(prefix="movemailbox-storage-") as temporary:
            Path(temporary).chmod(0o755)
            run(args, temporary)
    except Exception as exc:
        frame = traceback.extract_tb(exc.__traceback__)[-1]
        print("FAIL:", type(exc).__name__, getattr(exc, "sqlite_errorname", ""), "line", frame.lineno, "(sensitive details withheld)", flush=True)
        raise SystemExit(1)
