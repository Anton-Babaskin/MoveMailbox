#!/usr/bin/env python3
"""Opt-in growth after both admission checks, through guest API and real worker.

Requires disposable MM_SOURCE_* and MM_DESTINATION_* credentials in environment.
Creates two synthetic messages slightly larger than the configured budget each.
Retains mail and stopped Docker lab; never fills the host disk or deletes mail.
"""
import argparse
from contextlib import closing
from email.message import EmailMessage
from email.policy import SMTP
import importlib.util
import json
from pathlib import Path
import secrets
import sqlite3
import subprocess
import tempfile
import time


def load(name, filename):
    spec = importlib.util.spec_from_file_location(name, Path(__file__).with_name(filename))
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def fixture(folder, number, limit):
    message = EmailMessage(policy=SMTP)
    message["From"] = "synthetic-source@example.test"
    message["To"] = "synthetic-destination@example.test"
    message["Message-ID"] = f"<{folder}-{number}@example.test>"
    message["Subject"] = "Synthetic growth fixture " + str(number)
    message.set_content(("x" * 76 + "\n") * (limit // 76 + 20))
    raw = message.as_bytes()
    if not limit < len(raw) < limit * 2:
        raise RuntimeError("unexpected fixture size")
    return raw


def run(args):
    live = load("live", "smoke-live-quota.py")
    pilot = load("pilot", "start-local-pilot.py")
    source, destination = live.endpoint("SOURCE"), live.endpoint("DESTINATION")
    suffix = secrets.token_hex(6)
    prefix, folder = "movemailbox-growth-" + suffix, "MoveMailbox-Growth-" + suffix
    target = folder + "-Copy"
    clients, started = [], []
    with tempfile.TemporaryDirectory(prefix="movemailbox-growth-") as temporary:
        directory = Path(temporary)
        directory.chmod(0o755)
        wrapper = directory / "imapsync-gate"
        wrapper.write_bytes(Path(__file__).with_name("test-growth-gate.sh").read_bytes().replace(b"\r\n", b"\n"))
        wrapper.chmod(0o755)
        try:
            for account in (source, destination):
                clients.append(live.connect(account))
            if clients[0].create(folder)[0] != "OK":
                raise RuntimeError("source test folder must be new")
            pilot.start(prefix, args.port, args.image, args.limit_bytes,
                        worker_test_args=["--mount", f"type=bind,src={wrapper},dst=/test-imapsync-gate,readonly",
                                          "--env", "MOVEMAILBOX_IMAPSYNC_BIN=/test-imapsync-gate"],
                        started_containers=started)
            api = live.API(args.port)
            payload = {"source": source, "destination": destination, "options": {
                "folders": [folder], "destinationSubfolder": target, "syncFlags": True, "preserveDates": True}}
            job, _ = api.request("/api/jobs", payload, 202)
            deadline = time.monotonic() + 90
            while True:
                ready = subprocess.run(["docker", "exec", prefix + "-worker", "test", "-f", "/tmp/growth-ready"], capture_output=True).returncode == 0
                state, _ = api.request("/api/jobs/" + job["id"])
                if ready:
                    if state["status"] != "running":
                        raise RuntimeError("unexpected state at execution gate")
                    break
                if state["status"] in ("completed", "failed", "cancelled") or time.monotonic() > deadline:
                    raise RuntimeError("admission did not reach gate; ensure whole source is below budget")
                time.sleep(0.5)
            print("PASS: both real mailbox inventories admitted job; imapsync paused before execution", flush=True)
            sizes = []
            for number in (1, 2):
                raw = fixture(folder, number, args.limit_bytes)
                if clients[0].append(folder, "(\\Seen)", '"09-Sep-2026 08:00:00 +0000"', raw)[0] != "OK":
                    raise RuntimeError("fixture append failed")
                sizes.append(len(raw))
            original = live.snapshot(clients[0], folder)
            if len(original) != 2:
                raise RuntimeError("fixture count mismatch")
            pilot.docker("exec", prefix + "-worker", "touch", "/tmp/growth-release")
            deadline = time.monotonic() + 240
            while True:
                state, _ = api.request("/api/jobs/" + job["id"])
                if state["status"] in ("completed", "failed", "cancelled"):
                    break
                if time.monotonic() > deadline:
                    raise RuntimeError("execution deadline exceeded")
                time.sleep(1)
            if state["status"] != "failed" or "mailbox size policy" not in state.get("error", ""):
                raise RuntimeError("runtime overrun did not produce policy failure")
            copied = live.snapshot(clients[1], target + "." + folder)
            if len(copied) != 1 or copied[0] not in original or live.snapshot(clients[0], folder) != original:
                raise RuntimeError("whole-message stop/content/source assertion failed")
            mount = json.loads(pilot.docker("volume", "inspect", prefix + "-worker-data"))[0]["Mountpoint"]
            with closing(sqlite3.connect((Path(mount) / "worker.db").as_uri() + "?mode=ro", uri=True)) as db:
                row = db.execute("SELECT status, attempts FROM worker_jobs WHERE job_id=?", (job["id"],)).fetchone()
                if row != ("failed", 1) or db.execute("SELECT count(*) FROM credential_envelopes").fetchone()[0] != 0:
                    raise RuntimeError("worker retried or retained terminal credentials")
            live.API(args.port).request("/api/jobs/" + job["id"], expected=404)
            logs = pilot.docker("logs", prefix + "-api") + pilot.docker("logs", prefix + "-worker")
            if any(account["password"] in logs for account in (source, destination)):
                raise RuntimeError("password in service logs")
            print("PASS: growth after admission fails permanently in one attempt; one whole message retained, second skipped; source unchanged; zero envelopes; guest isolation; no passwords in logs", flush=True)
            print(json.dumps({"lab": prefix, "jobId": job["id"], "sourceFolder": folder,
                              "destinationFolder": target + "." + folder, "limit": args.limit_bytes, "messageBytes": sizes}), flush=True)
        finally:
            for name in reversed(started):
                pilot.docker("stop", "--time=20", name)
            for client in clients:
                try:
                    client.logout()
                except (OSError, live.imaplib.IMAP4.error):
                    pass
            if started:
                print("Stopped lab and test mail retained; temporary gate removed. Rerun for a fresh lab.", flush=True)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--image", required=True)
    parser.add_argument("--port", type=int, default=8185)
    parser.add_argument("--limit-bytes", type=int, default=12000000)
    parser.add_argument("--allow-test-mail", action="store_true", required=True)
    args = parser.parse_args()
    if not 10000 <= args.limit_bytes <= 20000000 or not 1024 <= args.port <= 65535:
        parser.error("budget must be 10 KB..20 MB, API port 1024..65535")
    try:
        run(args)
    except Exception as exc:
        print("FAIL:", type(exc).__name__, "(sensitive details withheld)", flush=True)
        raise SystemExit(1)
