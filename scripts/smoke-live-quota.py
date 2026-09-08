#!/usr/bin/env python3
"""Opt-in Docker/real-IMAP quota and attachment test. Creates isolated test mail.

Credentials come from MM_SOURCE_HOST/USER/PASSWORD and MM_DESTINATION_HOST/USER/
PASSWORD. Does not delete mail. Retains stopped Docker labs for inspection.
Run in WSL as a Docker administrator. Never use production mailboxes.
"""
import argparse
import hashlib
import importlib.util
import imaplib
import json
import os
from pathlib import Path
import re
import secrets
import sqlite3
import ssl
import subprocess
import time
import urllib.error
import urllib.request
from email.message import EmailMessage
from email.policy import SMTP


def endpoint(role):
    values = {key.lower(): os.environ.get(f"MM_{role}_{key}", "") for key in ("HOST", "USER", "PASSWORD")}
    if not all(values.values()):
        raise RuntimeError("Missing test mailbox environment")
    return {"host": values["host"], "username": values["user"], "password": values["password"], "port": 993, "security": "tls"}


def connect(account):
    client = imaplib.IMAP4_SSL(account["host"], 993, ssl_context=ssl.create_default_context(), timeout=30)
    client.login(account["username"], account["password"])
    return client


def snapshot(client, folder):
    status, _ = client.select(folder, readonly=True)
    if status != "OK":
        raise RuntimeError("Cannot inspect test folder")
    status, values = client.uid("search", None, "ALL")
    assert status == "OK"
    messages = []
    for uid in values[0].split():
        status, data = client.uid("fetch", uid, "(BODY.PEEK[] FLAGS INTERNALDATE)")
        assert status == "OK"
        parts = [part for part in data if isinstance(part, tuple)]
        assert len(parts) == 1
        metadata, body = parts[0]
        flags = sorted(flag.decode() for flag in imaplib.ParseFlags(metadata) if flag != b"\\Recent")
        date = re.search(rb'INTERNALDATE "([^"]+)"', metadata)
        assert date
        messages.append((hashlib.sha256(body).hexdigest(), flags, date[1].decode()))
    return sorted(messages)


class API:
    def __init__(self, port):
        self.base = f"http://127.0.0.1:{port}"
        self.cookie = self.csrf = ""
        session, headers = self.request("/api/session")
        self.cookie = headers["Set-Cookie"].split(";", 1)[0]
        self.csrf = session["csrfToken"]
        health, _ = self.request("/api/health")
        assert health["execution"] == "remote-worker" and health["available"]

    def request(self, path, data=None, expected=200):
        body = json.dumps(data).encode() if data is not None else None
        req = urllib.request.Request(self.base + path, data=body, headers={"Cookie": self.cookie, "X-CSRF-Token": self.csrf, "Content-Type": "application/json"})
        try:
            response = urllib.request.urlopen(req, timeout=10)
        except urllib.error.HTTPError as exc:
            response = exc
        with response:
            assert response.status == expected, f"Unexpected HTTP status {response.status}"
            return json.load(response), response.headers

    def run(self, payload):
        job, _ = self.request("/api/jobs", payload, 202)
        deadline = time.monotonic() + 240
        while time.monotonic() < deadline:
            state, _ = self.request("/api/jobs/" + job["id"])
            if state["status"] in ("completed", "failed", "cancelled"):
                assert state["engine"] == "imapsync-remote-worker"
                return state
            time.sleep(1)
        raise RuntimeError("Migration did not finish in test deadline")


def run(args):
    source, destination = endpoint("SOURCE"), endpoint("DESTINATION")
    if source["host"] == destination["host"] and source["username"] == destination["username"]:
        raise RuntimeError("Distinct disposable accounts required")
    spec = importlib.util.spec_from_file_location("pilot", Path(__file__).with_name("start-local-pilot.py"))
    pilot = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(pilot)
    suffix = secrets.token_hex(5)
    prefixes = ["movemailbox-quota-low-" + suffix, "movemailbox-quota-high-" + suffix]
    folder = "MoveMailbox-Attachment-" + suffix
    target = "MoveMailbox-Quota-" + suffix
    created = []
    source_client = destination_client = None
    try:
        for prefix, port, limit in zip(prefixes, (8182, 8183), (1, 100000000)):
            pilot.start(prefix, port, args.image, limit)
            # Do not stop unknown resources if the launcher's collision check fails.
            # A partially failed launch is retained for explicit inspection.
            created.append(prefix)
        source_client, destination_client = connect(source), connect(destination)
        original_source = snapshot(source_client, "INBOX")
        original_destination = snapshot(destination_client, "INBOX")
        status, _ = source_client.create(folder)
        assert status == "OK", "Test folder must be new"
        message = EmailMessage(policy=SMTP)
        message["From"] = source["username"]
        message["To"] = destination["username"]
        message["Subject"] = "MoveMailbox isolated attachment validation " + suffix
        message["Message-ID"] = "<movemailbox-attachment-" + suffix + "@example.test>"
        message["Date"] = "Tue, 08 Sep 2026 08:00:00 +0000"
        message.set_content("Synthetic attachment test; no customer content.")
        message.add_attachment(os.urandom(6 * 1024 * 1024), maintype="application", subtype="octet-stream", filename="test-6MiB.bin")
        raw = message.as_bytes()
        status, _ = source_client.append(folder, "(\\Seen \\Flagged)", '"08-Sep-2026 08:00:00 +0000"', raw)
        assert status == "OK"
        original_attachment = snapshot(source_client, folder)
        payload = {"source": source, "destination": destination, "options": {"folders": [folder], "destinationSubfolder": target, "syncFlags": True, "preserveDates": True}}
        low, high = API(8182), API(8183)
        rejected = low.run(payload)
        assert rejected["status"] == "failed" and rejected["transferred"] == 0
        assert "mailbox size policy" in rejected.get("error", ""), "Failure was not quota admission"
        status, folders = destination_client.list('""', '"' + target + '*"')
        assert status == "OK" and folders == [None], "Quota rejection created destination folders"
        print("PASS: low quota rejects before any destination folder is created", flush=True)
        copied = high.run(payload)
        assert copied["status"] == "completed" and copied["transferred"] == 1, "Attachment copy failed"
        destination_folder = target + "." + folder
        assert snapshot(destination_client, destination_folder) == original_attachment, "Content, flags or INTERNALDATE changed"
        repeated = high.run(payload)
        assert repeated["status"] == "completed" and repeated["transferred"] == 0, "Repeat copied duplicates"
        assert snapshot(destination_client, destination_folder) == original_attachment
        assert snapshot(source_client, folder) == original_attachment
        assert snapshot(source_client, "INBOX") == original_source
        assert snapshot(destination_client, "INBOX") == original_destination
        print("PASS: 6 MiB attachment copied; SHA-256, flags, INTERNALDATE preserved; repeat copied zero; original INBOXes unchanged", flush=True)
        for prefix, jobs in ((prefixes[0], [rejected]), (prefixes[1], [copied, repeated])):
            mount = json.loads(pilot.docker("volume", "inspect", prefix + "-worker-data"))[0]["Mountpoint"]
            database_path = Path(mount) / "worker.db"
            with sqlite3.connect(database_path.as_uri() + "?mode=ro", uri=True) as db:
                for job in jobs:
                    row = db.execute("SELECT status, attempts FROM worker_jobs WHERE job_id=?", (job["id"],)).fetchone()
                    assert row == (job["status"], 1), "Unexpected worker execution record"
                assert db.execute("SELECT count(*) FROM credential_envelopes").fetchone()[0] == 0
            logs = pilot.docker("logs", prefix + "-worker") + pilot.docker("logs", prefix + "-api")
            assert all(account["password"] not in logs for account in (source, destination)), "Secret in logs"
        print("PASS: worker SQLite records match all 3 jobs, one attempt each, zero credential envelopes, no passwords in logs", flush=True)
        print(json.dumps({"sourceTestFolder": folder, "destinationTestFolder": destination_folder, "messageBytes": len(raw), "jobIds": [job["id"] for job in (rejected, copied, repeated)]}), flush=True)
    finally:
        for client in (source_client, destination_client):
            if client:
                try:
                    client.logout()
                except (OSError, imaplib.IMAP4.error):
                    pass
        for prefix in created:
            for role in ("api", "worker"):
                name = prefix + "-" + role
                exists = subprocess.run(["docker", "container", "inspect", name], capture_output=True).returncode == 0
                if exists:
                    pilot.docker("stop", "--time=20", name)
        print("Labs stopped; test mail and Docker volumes retained. Nothing deleted.", flush=True)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--image", required=True)
    parser.add_argument("--allow-test-mail", action="store_true", required=True)
    args = parser.parse_args()
    try:
        run(args)
    except Exception as exc:
        # IMAP exceptions can include server-supplied sensitive text.
        print("FAIL:", type(exc).__name__, "(details withheld; inspect assertions locally)", flush=True)
        raise SystemExit(1)
