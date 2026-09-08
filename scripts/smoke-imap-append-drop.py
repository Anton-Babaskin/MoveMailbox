#!/usr/bin/env python3
"""Opt-in TLS APPEND interruption, recovery and duplicate check on disposable mail.

MM_SOURCE_HOST/USER/PASSWORD and MM_DESTINATION_HOST/USER/PASSWORD are required.
Secrets reach imapsync through stdin -> child environment, never Docker argv.
The test CA is trusted only for the local proxy; upstream TLS remains verified.
The target must be new. Source mail and generated destination mail are retained.
"""
import argparse
import importlib.util
import os
from pathlib import Path
import secrets
import socket
import ssl
import subprocess
import tempfile
import threading

from append_gate import AppendGate


def account(role):
    values = {key: os.environ.get(f"MM_{role}_{key}", "") for key in ("HOST", "USER", "PASSWORD")}
    if not all(values.values()) or any("\n" in value or "\r" in value for value in values.values()):
        raise ValueError("invalid disposable mailbox environment")
    return values


def make_cert(directory):
    key, cert = directory / "key.pem", directory / "cert.pem"
    result = subprocess.run(["openssl", "req", "-x509", "-newkey", "rsa:2048", "-nodes", "-days", "1",
                             "-subj", "/CN=append-drop.test", "-addext", "subjectAltName=IP:127.0.0.1",
                             "-keyout", str(key), "-out", str(cert)], capture_output=True)
    if result.returncode:
        raise RuntimeError("test certificate creation failed")
    return cert, key


class DropProxy:
    def __init__(self, destination, cert, key, drop_after):
        self.destination = destination
        self.gate = AppendGate(drop_after)
        self.server = socket.socket()
        self.server.bind(("127.0.0.1", 0))
        self.server.listen(1)
        self.server.settimeout(60)
        self.port = self.server.getsockname()[1]
        self.context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
        self.context.minimum_version = ssl.TLSVersion.TLSv1_2
        self.context.load_cert_chain(cert, key)
        self.connections = []
        self.error = None
        self.thread = threading.Thread(target=self.run, daemon=True)

    def close(self):
        self.server.close()
        for connection in self.connections:
            try:
                connection.shutdown(socket.SHUT_RDWR)
            except OSError:
                pass
            connection.close()

    def run(self):
        reply = None
        try:
            raw, _ = self.server.accept()
            raw.settimeout(30)
            self.connections.append(raw)
            client = self.context.wrap_socket(raw, server_side=True)
            self.connections.append(client)
            upstream_raw = socket.create_connection((self.destination["HOST"], 993), timeout=30)
            self.connections.append(upstream_raw)
            upstream = ssl.create_default_context().wrap_socket(upstream_raw, server_hostname=self.destination["HOST"])
            self.connections.append(upstream)

            def relay_replies():
                try:
                    while True:
                        data = upstream.recv(65536)
                        if not data:
                            break
                        client.sendall(data)
                except OSError:
                    pass
            reply = threading.Thread(target=relay_replies, daemon=True)
            reply.start()
            while not self.gate.dropped:
                data = client.recv(65536)
                if not data:
                    break
                self.gate.feed(data, upstream.sendall)
        except Exception as exc:
            self.error = type(exc).__name__
        finally:
            self.close()
            if reply:
                reply.join(timeout=5)


def imapsync(args, source, destination, cert=None, port=None):
    name = "movemailbox-append-test-" + secrets.token_hex(8)
    env = {key: value for key, value in os.environ.items() if not key.startswith(("MM_", "MOVEMAILBOX_", "IMAPSYNC_PASSWORD"))}
    command = ["docker", "run", "--rm", "--name", name, "-i", "--network", "host",
               "--cap-drop=ALL", "--security-opt=no-new-privileges:true", "--memory=512m", "--pids-limit=128"]
    if cert:
        command += ["--mount", f"type=bind,src={cert},dst=/test-ca.pem,readonly"]
    command += ["--entrypoint", "sh", args.image, "-c",
                'IFS= read -r IMAPSYNC_PASSWORD1 && IFS= read -r IMAPSYNC_PASSWORD2 && export IMAPSYNC_PASSWORD1 IMAPSYNC_PASSWORD2 && exec imapsync "$@"', "sh"]
    target_host = "127.0.0.1" if port else destination["HOST"]
    command += ["--host1", source["HOST"], "--port1", "993", "--user1", source["USER"],
                "--host2", target_host, "--port2", str(port or 993), "--user2", destination["USER"],
                "--ssl1", "--notls1", "--ssl2", "--notls2",
                "--folder", args.folder, "--subfolder2", args.target, "--syncinternaldates", "--noreleasecheck", "--nolog"]
    for side, host in (("1", source["HOST"]), ("2", target_host)):
        for option in ("SSL_verify_mode=1", "SSL_verifycn_scheme=imap", "SSL_verifycn_name=" + host):
            command += ["--sslargs" + side, option]
    if cert:
        command += ["--sslargs2", "SSL_ca_file=/test-ca.pem"]
    try:
        return subprocess.run(command, input=(source["PASSWORD"] + "\n" + destination["PASSWORD"] + "\n").encode(),
                              env=env, capture_output=True, timeout=180).returncode
    finally:
        probe = subprocess.run(["docker", "inspect", name], capture_output=True)
        if probe.returncode == 0:
            subprocess.run(["docker", "stop", "--time=5", name], check=True, capture_output=True, timeout=15)


def run(args):
    source, destination = account("SOURCE"), account("DESTINATION")
    spec = importlib.util.spec_from_file_location("live", Path(__file__).with_name("smoke-live-quota.py"))
    live = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(live)
    clients = []
    try:
        for item in (source, destination):
            clients.append(live.connect({"host": item["HOST"], "username": item["USER"], "password": item["PASSWORD"]}))
        original = live.snapshot(clients[0], args.folder)
        if len(original) != 1:
            raise RuntimeError("test source must contain one message")
        status, folders = clients[1].list('""', args.target + "*")
        if status != "OK" or folders != [None]:
            raise RuntimeError("destination test prefix already exists")
        with tempfile.TemporaryDirectory(prefix="movemailbox-append-drop-") as temporary:
            cert, key = make_cert(Path(temporary))
            proxy = DropProxy(destination, cert, key, args.drop_after)
            proxy.thread.start()
            try:
                result = imapsync(args, source, destination, cert, proxy.port)
            finally:
                proxy.close()
                proxy.thread.join(timeout=5)
            if proxy.error or not proxy.gate.dropped or proxy.gate.forwarded != args.drop_after or result != 114:
                raise RuntimeError("exact APPEND cut / exit 114 assertion failed")
            print(f"PASS: declared literal={proxy.gate.literal_size}, forwarded={proxy.gate.forwarded} bytes, exit={result}", flush=True)
        folder = args.target + "." + args.folder
        if live.snapshot(clients[1], folder):
            raise RuntimeError("destination committed an incomplete APPEND")
        print("PASS: interrupted APPEND left no message in destination folder", flush=True)
        for attempt in ("recovery", "repeat"):
            if imapsync(args, source, destination) != 0:
                raise RuntimeError("normal transfer failed")
            if live.snapshot(clients[1], folder) != original:
                raise RuntimeError("recovery changed content, flags, date or message count")
            print("PASS:", attempt, "exact content/flags/date, one message, no duplicates", flush=True)
        if live.snapshot(clients[0], args.folder) != original:
            raise RuntimeError("source changed")
        print("Retained destination test folder:", folder, flush=True)
    finally:
        for client in clients:
            try:
                client.logout()
            except (OSError, live.imaplib.IMAP4.error):
                pass


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--image", required=True)
    parser.add_argument("--folder", required=True)
    parser.add_argument("--target", required=True)
    parser.add_argument("--drop-after", type=int, default=131072)
    args = parser.parse_args()
    if args.drop_after < 1024 or not args.folder.startswith("MoveMailbox-Attachment-") or not args.target.startswith("MoveMailbox-ProxyDrop-"):
        parser.error("use disposable folder names and drop-after >= 1024")
    if not all(c.isascii() and (c.isalnum() or c == "-") for value in (args.folder, args.target) for c in value):
        parser.error("folder names must contain only ASCII letters, numbers and hyphens")
    try:
        run(args)
    except Exception as exc:
        print("FAIL:", type(exc).__name__, "(sensitive details withheld)", flush=True)
        raise SystemExit(1)
