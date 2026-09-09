#!/usr/bin/env python3
"""Demo-only real ENOSPC drill in an 8 MiB Docker tmpfs. No IMAP credentials.

Run as WSL Docker administrator. Fills only a validated dedicated tmpfs, then
truncates its own filler file. Never fills/deletes user volumes or the host disk.
"""
import argparse
from contextlib import closing
import importlib.util
import json
from pathlib import Path
import secrets
import sqlite3
import subprocess
import traceback


def load(name, filename):
    spec = importlib.util.spec_from_file_location(name, Path(__file__).with_name(filename))
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def run(args):
    pilot = load("pilot", "start-local-pilot.py")
    live = load("live", "smoke-live-quota.py")
    prefix = "movemailbox-enospc-" + secrets.token_hex(6)
    worker = prefix + "-worker"
    volume = prefix + "-fault"
    started = []
    try:
        if subprocess.run(["docker", "volume", "inspect", volume], capture_output=True).returncode == 0:
            raise RuntimeError("test volume already exists")
        pilot.docker("volume", "create", "--driver", "local", "--opt", "type=tmpfs", "--opt", "device=tmpfs", "--opt", "o=size=8m,mode=0770,uid=65534,gid=65534", volume)
        pilot.start(prefix, args.port, args.image, 0, demo=True,
                    worker_test_args=["--mount", "type=volume,src=" + volume + ",dst=/fault"],
                    worker_test_database="/fault/worker.db", started_containers=started)
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
        with closing(sqlite3.connect(dbpath)) as db:
            result = db.execute("PRAGMA wal_checkpoint(TRUNCATE)").fetchone()
            if result[0] != 0:
                raise RuntimeError("cannot checkpoint idle test database")
        filled = subprocess.run(["docker", "exec", worker, "dd", "if=/dev/zero", "of=/fault/filler", "bs=1048576", "count=16"], capture_output=True, timeout=20)
        if filled.returncode == 0 or b"No space left on device" not in filled.stderr:
            raise RuntimeError("real ENOSPC not observed")
        if int(pilot.docker("exec", worker, "stat", "-f", "-c", "%a", "/fault")) != 0:
            raise RuntimeError("test filesystem still has available blocks")
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
        if pilot.docker("exec", worker, "stat", "-c", "%F", "/fault/filler") != "regular file":
            raise RuntimeError("filler is not a regular file")
        pilot.docker("exec", worker, "truncate", "-s", "0", "/fault/filler")
        if int(pilot.docker("exec", worker, "stat", "-f", "-c", "%a", "/fault")) <= 0:
            raise RuntimeError("capacity was not restored")
        recovered = api.run(payload)
        if recovered["status"] != "completed":
            raise RuntimeError("new job failed after restoring capacity")
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
        print("PASS: capacity restored without restart; new job completes in one attempt, no envelopes, integrity ok, guest isolation, no secrets in logs", flush=True)
        print(json.dumps({"lab": prefix, "recoveredJob": recovered["id"], "tmpfsBytes": 8388608}), flush=True)
    finally:
        for name in reversed(started):
            pilot.docker("stop", "--time=20", name)
        if started:
            print("Containers stopped; disposable worker tmpfs discarded, API volume retained. No mail was accessed.", flush=True)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--image", required=True)
    parser.add_argument("--port", type=int, default=8186)
    args = parser.parse_args()
    if not 1024 <= args.port <= 65535:
        parser.error("unprivileged API port required")
    try:
        run(args)
    except Exception as exc:
        frame = traceback.extract_tb(exc.__traceback__)[-1]
        print("FAIL:", type(exc).__name__, getattr(exc, "sqlite_errorname", ""), "line", frame.lineno, "(sensitive details withheld)", flush=True)
        raise SystemExit(1)
