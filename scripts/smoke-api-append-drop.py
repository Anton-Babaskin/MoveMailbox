#!/usr/bin/env python3
"""Opt-in real APPEND fault through guest API, encrypted queue and remote worker.

Run as a WSL Docker administrator with disposable MM_* mailbox credentials.
Only worker DNS/trust is redirected; API public-target checks stay enabled.
Generated mail and stopped lab volumes are retained. No mail is deleted.
"""
import argparse
import importlib.util
import json
import os
from pathlib import Path
import re
import secrets
import socket
import sqlite3
import ssl
import subprocess
import tempfile
import threading


def load(name, filename):
    spec = importlib.util.spec_from_file_location(name, Path(__file__).with_name(filename))
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class Accepted:
    def __init__(self, raw, address):
        self.raw, self.address = raw, address

    def accept(self):
        return self.raw, self.address

    def close(self):
        self.raw.close()


class PassGate:
    dropped = False

    def feed(self, data, send):
        send(data)


class RecoveringProxy:
    def __init__(self, fault, destination, cert, key, gateway, lose_ack):
        self.fault, self.destination = fault, destination
        self.context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
        self.context.minimum_version = ssl.TLSVersion.TLSv1_2
        self.context.load_cert_chain(cert, key)
        self.gate = fault.AppendAckGate() if lose_ack else fault.AppendGate(131072)
        self.server = socket.socket()
        self.server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        self.server.bind((gateway, 993))
        self.server.listen(8)
        self.server.settimeout(1)
        self.stop = threading.Event()
        self.errors = []
        self.active = None
        self.thread = threading.Thread(target=self.run, daemon=True)

    def run(self):
        while not self.stop.is_set():
            try:
                raw, address = self.server.accept()
            except socket.timeout:
                continue
            except OSError:
                break
            # Reuse the verified TLS relay, but close only this accepted socket.
            relay = self.fault.DropProxy.__new__(self.fault.DropProxy)
            relay.destination, relay.context = self.destination, self.context
            relay.server = Accepted(raw, address)
            relay.gate = PassGate() if self.gate.dropped else self.gate
            relay.connections, relay.error = [], None
            relay.closing = threading.Event()
            self.active = relay
            relay.run()
            if relay.error and not self.stop.is_set():
                self.errors.append(relay.error)
            self.active = None

    def close(self):
        self.stop.set()
        self.server.close()
        if self.active:
            self.active.close()
        self.thread.join(timeout=10)
        if self.thread.is_alive():
            raise RuntimeError("proxy failed to stop")


def run(args):
    fault = load("fault", "smoke-imap-append-drop.py")
    live = load("live", "smoke-live-quota.py")
    pilot = load("pilot", "start-local-pilot.py")
    source, destination = live.endpoint("SOURCE"), live.endpoint("DESTINATION")
    if not re.fullmatch(r"[a-zA-Z0-9.-]+", destination["host"]):
        raise ValueError("DNS destination required for isolated certificate")
    gateway = json.loads(pilot.docker("network", "inspect", "bridge"))[0]["IPAM"]["Config"][0]["Gateway"]
    suffix = secrets.token_hex(6)
    prefix, target = "movemailbox-api-append-" + suffix, "MoveMailbox-APIAppend-" + suffix
    clients, proxy, started = [], None, []
    with tempfile.TemporaryDirectory(prefix="movemailbox-api-append-") as temporary:
        directory = Path(temporary)
        directory.chmod(0o755)  # Only public certificate is mounted into worker.
        cert, key, bundle = directory / "cert.pem", directory / "key.pem", directory / "bundle.pem"
        command = ["openssl", "req", "-x509", "-newkey", "rsa:2048", "-nodes", "-days", "1",
                   "-subj", "/CN=append-drop.test", "-addext", "subjectAltName=DNS:" + destination["host"],
                   "-keyout", str(key), "-out", str(cert)]
        if subprocess.run(command, capture_output=True).returncode:
            raise RuntimeError("certificate generation failed")
        key.chmod(0o600)
        bundle.write_bytes(Path(ssl.get_default_verify_paths().cafile).read_bytes() + cert.read_bytes())
        bundle.chmod(0o644)
        try:
            for account in (source, destination):
                clients.append(live.connect(account))
            original = live.snapshot(clients[0], args.folder)
            if len(original) != 1:
                raise RuntimeError("source fixture must contain one message")
            proxy = RecoveringProxy(fault, fault.account("DESTINATION"), cert, key, gateway, args.lose_ack)
            proxy.thread.start()
            pilot.start(prefix, args.port, args.image, 100000000, worker_test_args=[
                "--add-host", destination["host"] + ":" + gateway,
                "--mount", f"type=bind,src={bundle},dst=/test-ca.pem,readonly",
                "--env", "SSL_CERT_FILE=/test-ca.pem"], started_containers=started)
            api = live.API(args.port)
            payload = {"source": source, "destination": destination, "options": {
                "folders": [args.folder], "destinationSubfolder": target,
                "syncFlags": True, "preserveDates": True}}
            recovered = api.run(payload)
            if recovered["status"] != "completed":
                raise RuntimeError("faulted API job did not recover")
            expected = proxy.gate.literal_size if args.lose_ack else 131072
            if proxy.errors or not proxy.gate.dropped or proxy.gate.forwarded != expected:
                raise RuntimeError("exact fault was not proven")
            folder = target + "." + args.folder
            if live.snapshot(clients[1], folder) != original:
                raise RuntimeError("recovery content/flags/date/count mismatch")
            repeat = api.run(payload)
            if repeat["status"] != "completed" or repeat["transferred"] != 0:
                raise RuntimeError("repeat must succeed without copying")
            if live.snapshot(clients[1], folder) != original or live.snapshot(clients[0], args.folder) != original:
                raise RuntimeError("repeat duplicated mail or source changed")
            outsider = live.API(args.port)
            outsider.request("/api/jobs/" + recovered["id"], expected=404)
            mount = json.loads(pilot.docker("volume", "inspect", prefix + "-worker-data"))[0]["Mountpoint"]
            dbpath = Path(mount) / "worker.db"
            db = sqlite3.connect(dbpath.as_uri() + "?mode=ro", uri=True)
            try:
                for job, attempts in ((recovered, 2), (repeat, 1)):
                    row = db.execute("SELECT status, attempts FROM worker_jobs WHERE job_id=?", (job["id"],)).fetchone()
                    if row != ("completed", attempts):
                        raise RuntimeError("unexpected worker attempts/state")
                if db.execute("SELECT count(*) FROM credential_envelopes").fetchone()[0] != 0:
                    raise RuntimeError("terminal credentials retained")
            finally:
                db.close()
            logs = pilot.docker("logs", prefix + "-api") + pilot.docker("logs", prefix + "-worker")
            if any(account["password"] in logs for account in (source, destination)):
                raise RuntimeError("password in service logs")
            print("PASS: exact API/worker APPEND fault, automatic recovery in 2 attempts, repeat in 1; content/flags/date preserved; no duplicates; source unchanged", flush=True)
            print("PASS: guest isolation, zero terminal envelopes, no passwords in service logs", flush=True)
            print(json.dumps({"lab": prefix, "folder": folder, "jobIds": [recovered["id"], repeat["id"]],
                              "literalBytes": proxy.gate.literal_size, "forwardedBytes": proxy.gate.forwarded,
                              "lostAck": args.lose_ack}), flush=True)
        finally:
            for name in reversed(started):
                pilot.docker("stop", "--time=20", name)
            if proxy:
                proxy.close()
            for client in clients:
                try:
                    client.logout()
                except (OSError, live.imaplib.IMAP4.error):
                    pass
            if started:
                print("Stopped lab retained; temporary proxy trust removed; test mail retained.", flush=True)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--image", required=True)
    parser.add_argument("--folder", required=True)
    parser.add_argument("--port", type=int, default=8184)
    parser.add_argument("--lose-ack", action="store_true")
    parser.add_argument("--allow-test-mail", action="store_true", required=True)
    args = parser.parse_args()
    if not re.fullmatch(r"MoveMailbox-Attachment-[a-zA-Z0-9-]+", args.folder) or not 1024 <= args.port <= 65535:
        parser.error("isolated source folder and unprivileged API port required")
    try:
        run(args)
    except Exception as exc:
        print("FAIL:", type(exc).__name__, "(sensitive details withheld)", flush=True)
        raise SystemExit(1)
