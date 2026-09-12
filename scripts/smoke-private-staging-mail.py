#!/usr/bin/env python3
"""Opt-in real-mail acceptance on the existing closed staging VM.

Run as a Docker administrator. Reads two authorized disposable accounts from
one stdin JSON line: source/destination with host, username, password. Secrets
must be piped over SSH, never saved in the checkout or supplied as CLI flags.
Creates uniquely named synthetic folders/messages and retains them. Optional
cancel/kill testing is restricted to the exact staging worker and this run's job.
"""
import argparse
from contextlib import closing
from email.message import EmailMessage
from email.policy import SMTP
import http.client
import importlib.util
import json
from pathlib import Path
import secrets
import sqlite3
import subprocess
import sys
import time
import traceback

TERMINAL = {"completed", "failed", "cancelled"}
API_NAME = "movemailbox-staging-movemailbox-1"
WORKER_NAME = "movemailbox-staging-movemailbox-worker-1"


def check(condition, label):
    if not condition:
        raise RuntimeError(label)


def docker(*args):
    result = subprocess.run(["docker", *args], capture_output=True, timeout=45)
    check(result.returncode == 0, "Docker command failed (output withheld)")
    output = result.stdout + result.stderr if args and args[0] == "logs" else result.stdout
    return output.decode()


def read_accounts(stream):
    line = stream.readline(65537)
    check(len(line) <= 65536, "Oversized credential input")
    data = json.loads(line)
    accounts = []
    for role in ("source", "destination"):
        account = data[role]
        check(all(isinstance(account.get(key), str) and account[key]
                  for key in ("host", "username", "password")), "Missing account field")
        check(not any(c in account["host"] for c in "\r\n\x00"), "Invalid host")
        accounts.append({key: account[key] for key in ("host", "username", "password")}
                       | {"port": 993, "security": "tls"})
    check((accounts[0]["host"].lower(), accounts[0]["username"].lower()) !=
          (accounts[1]["host"].lower(), accounts[1]["username"].lower()), "Distinct accounts required")
    return accounts


class API:
    def __init__(self):
        self.cookie = self.csrf = ""
        session, headers = self.request("/api/session")
        cookie = headers.get("set-cookie", "")
        check(session.get("mode") == "guest" and "Secure" in cookie and "HttpOnly" in cookie,
              "Expected secure guest session")
        self.cookie, self.csrf = cookie.split(";", 1)[0], session["csrfToken"]

    def request(self, path, payload=None, expected=200, csrf=True):
        headers = {"Host": "staging.movemailbox.com", "Cookie": self.cookie,
                   "Content-Type": "application/json"}
        if csrf:
            headers["X-CSRF-Token"] = self.csrf
        # Replay the Secure cookie only on VM loopback; this is API acceptance,
        # not browser HTTPS validation. Never change the deployed cookie policy.
        with closing(http.client.HTTPConnection("127.0.0.1", 8080, timeout=60)) as conn:
            conn.request("POST" if payload is not None else "GET", path,
                         json.dumps(payload) if payload is not None else None, headers)
            response = conn.getresponse()
            raw = response.read()
            check(response.status == expected, f"Unexpected HTTP status {response.status} at {path}")
            return json.loads(raw), {k.lower(): v for k, v in response.getheaders()}

    def wait(self, job_id, timeout=300):
        deadline = time.monotonic() + timeout
        while time.monotonic() < deadline:
            state, _ = self.request("/api/jobs/" + job_id)
            if state["status"] in TERMINAL:
                check(state["engine"] == "imapsync-remote-worker", "Wrong execution engine")
                return state
            time.sleep(2)
        raise RuntimeError("Job deadline exceeded; inspect the recorded job ID")


def inspect_stage():
    databases = {}
    for name, service, target, filename in (
        (API_NAME, "movemailbox", "/data", "movemailbox.db"),
        (WORKER_NAME, "movemailbox-worker", "/worker-data", "worker.db"),
    ):
        info = json.loads(docker("inspect", name))[0]
        labels = info["Config"]["Labels"]
        check(info["Name"] == "/" + name and labels.get("com.docker.compose.project") == "movemailbox-staging"
              and labels.get("com.docker.compose.service") == service, "Unexpected container identity")
        check(info["State"]["Health"]["Status"] == "healthy", "Unhealthy stage")
        check(info["HostConfig"]["ReadonlyRootfs"] and info["Config"]["User"] == "nobody:nogroup",
              "Unexpected container privileges")
        mounts = [m for m in info["Mounts"] if m["Destination"] == target and m["Type"] == "volume"]
        check(len(mounts) == 1, "Expected a single data volume")
        db = Path(mounts[0]["Source"]) / filename
        check(db.is_file() and not db.is_symlink(), "Missing or linked database")
        databases[service] = db
    return databases


def rows(path, query, params=()):
    with closing(sqlite3.connect(path.as_uri() + "?mode=ro", uri=True)) as db:
        return db.execute(query, params).fetchall()


def require_owned_active(path, job_id):
    active = rows(path, "SELECT job_id, status FROM worker_jobs WHERE status NOT IN ('completed','failed','cancelled')")
    check(active == [(job_id, "running")], "Refusing fault: active queue is not exclusively this running job")


def kill_and_restart():
    # A timed-out CLI can still have killed the container. Always attempt
    # restoration once the explicitly authorized kill has been attempted.
    try:
        docker("kill", "--signal=KILL", WORKER_NAME)
        check(not json.loads(docker("inspect", WORKER_NAME))[0]["State"]["Running"],
              "Worker did not stop")
    finally:
        docker("start", WORKER_NAME)


def run(args):
    check(sys.flags.optimize == 0, "Do not run acceptance tests with Python -O")
    source, destination = read_accounts(sys.stdin)
    spec = importlib.util.spec_from_file_location("live", Path(__file__).with_name("smoke-live-quota.py"))
    live = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(live)
    databases = inspect_stage()
    worker_db = databases["movemailbox-worker"]
    check(not rows(worker_db, "SELECT job_id FROM worker_jobs WHERE status NOT IN ('completed','failed','cancelled')"),
          "Staging must be idle before this test")
    check(rows(worker_db, "SELECT count(*) FROM credential_envelopes") == [(0,)], "Existing envelopes; inspect stage first")
    api, other = API(), API()
    health, _ = api.request("/api/health")
    check(health["execution"] == "remote-worker" and health["available"], "Remote worker unavailable")
    print("PASS: idle protected staging; version=" + health["version"], flush=True)
    clients, jobs = [], []
    started_at = str(int(time.time()))
    prefix = "MoveMailbox-Stage-" + secrets.token_hex(6)
    print("Retained synthetic fixture prefix: " + prefix, flush=True)

    def submit(payload):
        job, _ = api.request("/api/jobs", payload, 202)
        jobs.append(job["id"])
        print("Accepted test job " + job["id"], flush=True)
        return job["id"]

    def complete(payload, transferred=None):
        result = api.wait(submit(payload))
        check(result["status"] == "completed", "Expected completed job")
        if transferred is not None:
            check(result["transferred"] == transferred, "Unexpected copied-message count")
        return result

    try:
        for role, account in enumerate((source, destination)):
            response, _ = api.request("/api/connections/test", account)
            check(response.get("ok"), "Connection test failed")
            api.request("/api/connections/test", account, 403, csrf=False)
            clients.append(live.connect(account))
            print(f"PASS: account {role + 1} verified IMAP login via worker and inspection client", flush=True)
        inboxes = [live.snapshot(client, "INBOX") for client in clients]
        folder, child = prefix, prefix + ".Nested"
        for index, name in enumerate((folder, child)):
            check(clients[0].create(name)[0] == "OK", "Fixture folder collision or create failure")
            message = EmailMessage(policy=SMTP)
            message["From"], message["To"] = "source@example.test", "destination@example.test"
            message["Subject"] = "Synthetic staging fixture " + str(index)
            message["Message-ID"] = f"<{prefix}-{index}@example.test>"
            message["Date"] = "Sat, 12 Sep 2026 08:00:00 +0000"
            message.set_content("Synthetic staging test. Unicode: Привет / Вітаю.")
            if index:
                message.add_attachment(secrets.token_bytes(6 * 1024 * 1024), maintype="application",
                                       subtype="octet-stream", filename="test-6MiB.bin")
            check(clients[0].append(name, "(\\Seen \\Flagged)", '"12-Sep-2026 08:00:00 +0000"',
                                    message.as_bytes())[0] == "OK", "Fixture APPEND failed")
        originals = {name: live.snapshot(clients[0], name) for name in (folder, child)}
        folders, _ = api.request("/api/connections/folders", source)
        check({folder, child} <= {f["name"] for f in folders["folders"]}, "Discovery missed fixture hierarchy")
        check(all(f.get("delimiter") == "." for f in folders["folders"] if f["name"] in originals),
              "This fixture expects the Mail-in-a-Box dot delimiter")
        target = prefix + "-Copy"
        options = {"folders": [folder, child], "destinationSubfolder": target,
                   "syncFlags": True, "preserveDates": True}
        payload = {"source": source, "destination": destination, "options": options}
        for mode in ("justLogin", "justFolderSizes", "dryRun"):
            complete(payload | {"options": options | {mode: True}}, 0)
            status, names = clients[1].list('""', '"' + target + '*"')
            check(status == "OK" and names == [None], "Read-only preflight created destination folders")
            print("PASS: " + mode + " with no destination writes", flush=True)
        complete(payload | {"options": options | {"justFolders": True}}, 0)
        for name in originals:
            check(live.snapshot(clients[1], target + "." + name) == [], "Folders-only copied mail")
        print("PASS: folders-only created empty selected hierarchy", flush=True)
        complete(payload, 2)
        complete(payload, 0)
        for name, original in originals.items():
            check(live.snapshot(clients[1], target + "." + name) == original, "Forward content/flags/date mismatch")
        reverse_target = prefix + "-Return"
        reverse = {"source": destination, "destination": source,
                   "options": options | {"folders": [target + "." + n for n in originals],
                                         "destinationSubfolder": reverse_target}}
        complete(reverse, 2)
        complete(reverse, 0)
        for name, original in originals.items():
            check(live.snapshot(clients[0], reverse_target + "." + target + "." + name) == original,
                  "Reverse content/flags/date mismatch")
        print("PASS: both directions; 6 MiB attachment, SHA-256/flags/dates exact; repeats copied zero", flush=True)

        if args.allow_worker_interrupt:
            for mode in ("cancel", "kill"):
                interrupt_target = prefix + "-" + mode
                request = payload | {"options": options | {"destinationSubfolder": interrupt_target}}
                job_id = submit(request)
                deadline = time.monotonic() + 45
                while time.monotonic() < deadline:
                    processes = docker("top", WORKER_NAME, "-eo", "pid,comm")
                    if any("imapsync" in p or "perl" in p for p in processes.splitlines()[1:]):
                        break
                    time.sleep(0.2)
                else:
                    raise RuntimeError("Missed real imapsync process window")
                require_owned_active(worker_db, job_id)
                if mode == "cancel":
                    api.request("/api/jobs/" + job_id + "/cancel", {}, 202)
                    check(api.wait(job_id)["status"] == "cancelled", "Cancellation did not finish")
                    # Let asynchronous envelope/process cleanup settle before admission.
                    deadline = time.monotonic() + 30
                    while rows(worker_db, "SELECT count(*) FROM credential_envelopes") != [(0,)]:
                        check(time.monotonic() < deadline, "Cancellation cleanup deadline")
                        time.sleep(1)
                    complete(request)
                else:
                    kill_and_restart()
                    check(api.wait(job_id)["status"] == "completed", "Interrupted copy did not recover")
                    check(rows(worker_db, "SELECT attempts FROM worker_jobs WHERE job_id=?", (job_id,)) == [(2,)],
                          "Expected one supervised recovery attempt")
                complete(request, 0)
                for name, original in originals.items():
                    check(live.snapshot(clients[1], interrupt_target + "." + name) == original,
                          "Recovered content/flags/date mismatch")
                print("PASS: " + mode + " during native process; recovered copies exact; repeat zero", flush=True)

        for name, original in originals.items():
            check(live.snapshot(clients[0], name) == original, "Source fixture changed")
        for client, original in zip(clients, inboxes):
            check(live.snapshot(client, "INBOX") == original, "Pre-existing INBOX changed")
        for job_id in jobs:
            other.request("/api/jobs/" + job_id, expected=404)
            other.request("/api/jobs/" + job_id + "/cancel", {}, 404)
            check(rows(worker_db, "SELECT status FROM worker_jobs WHERE job_id=?", (job_id,))[0][0] in TERMINAL,
                  "Nonterminal worker record")
        check(rows(worker_db, "SELECT count(*) FROM credential_envelopes") == [(0,)], "Terminal envelope retained")
        passwords = [a["password"].encode() for a in (source, destination)]
        for database in databases.values():
            check(rows(database, "PRAGMA integrity_check") == [("ok",)], "SQLite integrity failure")
            for path in (database, Path(str(database) + "-wal"), Path(str(database) + "-shm")):
                if path.exists():
                    raw = path.read_bytes()
                    check(not any(p in raw for p in passwords), "Plaintext password in database files")
        for name in (API_NAME, WORKER_NAME):
            logs = docker("logs", "--since", started_at, name).encode()
            check(not any(p in logs for p in passwords), "Plaintext password in logs")
        print("PASS: source/INBOX unchanged; guest isolation; SQLite integrity; zero envelopes; no plaintext passwords in DB/WAL/SHM or inspected logs", flush=True)
        print(json.dumps({"fixturePrefix": prefix, "jobs": jobs, "version": health["version"]}), flush=True)
    finally:
        # Cancel only jobs created by this run if a check failed mid-transfer.
        for job_id in jobs:
            try:
                state, _ = api.request("/api/jobs/" + job_id)
                if state["status"] not in TERMINAL:
                    api.request("/api/jobs/" + job_id + "/cancel", {}, 202)
                    api.wait(job_id)
            except Exception:
                print("ATTENTION: verify terminal state of test job " + job_id, flush=True)
        for client in clients:
            try:
                client.logout()
            except Exception:
                pass
        print("Synthetic folders retained. Staging remains running.", flush=True)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--allow-test-mail", required=True, action="store_true")
    parser.add_argument("--allow-worker-interrupt", action="store_true")
    try:
        run(parser.parse_args())
    except Exception as exc:
        print("FAIL: " + type(exc).__name__ + " (details withheld)", flush=True)
        for frame in traceback.extract_tb(exc.__traceback__):
            print(Path(frame.filename).name, frame.lineno, frame.name, flush=True)
        raise SystemExit(1)
