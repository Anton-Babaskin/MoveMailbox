#!/usr/bin/env python3
"""Opt-in cancellation and worker-kill drill using an existing isolated quota lab.

Uses the same MM_* credential environment as smoke-live-quota.py. Creates two
new destination subfolders; never deletes mail. Only the named lab is stopped.
"""
import argparse
import importlib.util
import json
from pathlib import Path
import secrets
import sqlite3
import time
import traceback


def load(name, filename):
    spec = importlib.util.spec_from_file_location(name, Path(__file__).with_name(filename))
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def run(args):
    live = load("live", "smoke-live-quota.py")
    pilot = load("pilot", "start-local-pilot.py")
    prefix = args.lab
    worker, api_name = prefix + "-worker", prefix + "-api"
    # Verify exact targets before starting/stopping anything.
    for name in (worker, api_name):
        info = json.loads(pilot.docker("inspect", name))[0]
        assert info["Name"] == "/" + name
        assert info["Config"]["Image"] == args.image
        assert prefix in info["NetworkSettings"]["Networks"]
    source, destination = live.endpoint("SOURCE"), live.endpoint("DESTINATION")
    source_client = destination_client = None

    def has_imapsync():
        output = pilot.docker("top", worker, "-eo", "pid,comm")
        return any("imapsync" in line or "perl" in line for line in output.splitlines()[1:])

    def until(check, timeout=120):
        deadline = time.monotonic() + timeout
        while time.monotonic() < deadline:
            result = check()
            if result:
                return result
            time.sleep(0.5)
        raise AssertionError("test deadline exceeded")

    def wait_job(job_id):
        deadline = time.monotonic() + 240
        while time.monotonic() < deadline:
            state, _ = api.request("/api/jobs/" + job_id)
            if state["status"] in ("completed", "failed", "cancelled"):
                return state
            time.sleep(1)
        raise AssertionError("job deadline exceeded")

    try:
        pilot.docker("start", worker, api_name)
        def ready():
            try:
                return live.API(args.port)
            except (OSError, AssertionError):
                return None
        api = until(ready)
        source_client, destination_client = live.connect(source), live.connect(destination)
        original = live.snapshot(source_client, args.folder)
        assert len(original) == 1, "expected exactly one isolated attachment message"
        source_inbox, destination_inbox = live.snapshot(source_client, "INBOX"), live.snapshot(destination_client, "INBOX")
        base = {"source": source, "destination": destination}
        report = {}
        for mode in ("cancel", "kill"):
            target = "MoveMailbox-Recovery-" + mode + "-" + secrets.token_hex(5)
            payload = base | {"options": {"folders": [args.folder], "destinationSubfolder": target, "syncFlags": True, "preserveDates": True}}
            job, _ = api.request("/api/jobs", payload, 202)
            until(has_imapsync, 60)
            state, _ = api.request("/api/jobs/" + job["id"])
            assert state["status"] == "running", "missed active process window"
            if mode == "cancel":
                api.request("/api/jobs/" + job["id"] + "/cancel", {}, 202)
                assert wait_job(job["id"])["status"] == "cancelled"
                until(lambda: not has_imapsync(), 30)
                # Do not race cancellation cleanup with a new accepted migration.
                mount = json.loads(pilot.docker("volume", "inspect", prefix + "-worker-data"))[0]["Mountpoint"]
                def no_envelopes():
                    with sqlite3.connect((Path(mount) / "worker.db").as_uri() + "?mode=ro", uri=True) as db:
                        return db.execute("SELECT count(*) FROM credential_envelopes").fetchone()[0] == 0
                until(no_envelopes, 30)
                resumed = api.run(payload)
                assert resumed["status"] == "completed"
                report[mode] = {"interruptedJob": job["id"], "resumedJob": resumed["id"]}
            else:
                pilot.docker("kill", "--signal=KILL", worker)
                inspect = json.loads(pilot.docker("inspect", worker))[0]
                assert not inspect["State"]["Running"]
                pilot.docker("start", worker)
                recovered = wait_job(job["id"])
                assert recovered["status"] == "completed", "real migration did not recover"
                mount = json.loads(pilot.docker("volume", "inspect", prefix + "-worker-data"))[0]["Mountpoint"]
                with sqlite3.connect((Path(mount) / "worker.db").as_uri() + "?mode=ro", uri=True) as db:
                    assert db.execute("SELECT attempts FROM worker_jobs WHERE job_id=?", (job["id"],)).fetchone()[0] == 2
                    assert db.execute("SELECT count(*) FROM credential_envelopes").fetchone()[0] == 0
                report[mode] = {"job": job["id"], "attempts": 2}
            assert live.snapshot(destination_client, target + "." + args.folder) == original
            repeated = api.run(payload)
            assert repeated["status"] == "completed" and repeated["transferred"] == 0
            assert live.snapshot(destination_client, target + "." + args.folder) == original
            print("PASS:", mode, "during a real imapsync process; recovery content/flags/date exact; repeat copied zero", flush=True)
        assert live.snapshot(source_client, args.folder) == original
        assert live.snapshot(source_client, "INBOX") == source_inbox
        assert live.snapshot(destination_client, "INBOX") == destination_inbox
        print(json.dumps(report), flush=True)
    finally:
        for client in (source_client, destination_client):
            if client:
                try:
                    client.logout()
                except (OSError, live.imaplib.IMAP4.error):
                    pass
        pilot.docker("stop", "--time=20", api_name, worker)
        print("Lab stopped. Recovery test folders retained; no mail deleted.", flush=True)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--lab", required=True)
    parser.add_argument("--image", required=True)
    parser.add_argument("--folder", required=True)
    parser.add_argument("--port", type=int, default=8183)
    parser.add_argument("--allow-worker-kill", action="store_true", required=True)
    args = parser.parse_args()
    if not args.lab.startswith("movemailbox-quota-high-") or not all(c.isascii() and (c.isalnum() or c == "-") for c in args.lab):
        parser.error("only an isolated high-quota lab is supported")
    if not args.folder.startswith("MoveMailbox-Attachment-") or not all(c.isascii() and (c.isalnum() or c == "-") for c in args.folder):
        parser.error("only a generated attachment test folder is supported")
    try:
        run(args)
    except Exception as exc:
        print("FAIL:", type(exc).__name__, "(sensitive details withheld)", flush=True)
        for frame in traceback.extract_tb(exc.__traceback__):
            print(Path(frame.filename).name, frame.lineno, frame.name, flush=True)
        raise SystemExit(1)
