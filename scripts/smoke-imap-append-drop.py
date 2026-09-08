#!/usr/bin/env python3
"""Deterministic TLS MITM fault-injection for one real imapsync APPEND.

The proxy terminates TLS only inside this disposable test, forwards to the
authorized destination, detects the APPEND literal, and closes both sockets
after a fixed prefix of the literal. The production MoveMailbox TLS policy is
not changed. Requires openssl, Docker and MM_* environment credentials.
"""
import argparse
import os
from pathlib import Path
import socket
import ssl
import subprocess
import tempfile
import threading
import time


def account(role):
    values = {key: os.environ.get(f"MM_{role}_{key}", "") for key in ("HOST", "USER", "PASSWORD")}
    if not all(values.values()):
        raise RuntimeError("incomplete disposable mailbox environment")
    return values


def make_cert(directory):
    key, cert = directory / "key.pem", directory / "cert.pem"
    result = subprocess.run(["openssl", "req", "-x509", "-newkey", "rsa:2048", "-nodes", "-days", "1", "-subj", "/CN=append-drop.test", "-keyout", str(key), "-out", str(cert)], capture_output=True)
    if result.returncode:
        raise RuntimeError("could not create disposable proxy certificate")
    return cert, key


class DropProxy:
    def __init__(self, destination, cert, key, drop_after):
        self.destination = destination
        self.drop_after = drop_after
        self.server = socket.socket()
        self.server.bind(("127.0.0.1", 0))
        self.server.listen(1)
        self.port = self.server.getsockname()[1]
        context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
        context.load_cert_chain(cert, key)
        self.context = context
        self.append_seen = threading.Event()
        self.dropped = threading.Event()
        self.thread = threading.Thread(target=self.run, daemon=True)

    def start(self):
        self.thread.start()

    def run(self):
        client = upstream = None
        try:
            raw = self.server.accept()[0]
            client = self.context.wrap_socket(raw, server_side=True)
            upstream = ssl.create_default_context().wrap_socket(socket.create_connection((self.destination["HOST"], 993), timeout=30), server_hostname=self.destination["HOST"])
            state = {"append": False, "literal": 0, "remaining": 0}

            def client_to_server():
                try:
                    while True:
                        data = client.recv(65536)
                        if not data:
                            return
                        if not state["append"] and b" APPEND " in data.upper():
                            state["append"] = True
                            self.append_seen.set()
                        if state["append"] and state["remaining"] == 0:
                            marker = data.rfind(b"{")
                            if marker >= 0:
                                end = data.find(b"}", marker)
                                if end > marker:
                                    try:
                                        state["literal"] = int(data[marker + 1:end])
                                        state["remaining"] = state["literal"]
                                    except ValueError:
                                        pass
                        if state["remaining"]:
                            line_end = data.find(b"\r\n")
                            # Once the literal marker has been sent, subsequent
                            # bytes are message content. Drop at a fixed offset.
                            if line_end >= 0 and state["literal"]:
                                prefix = data[line_end + 2:]
                                state["remaining"] -= len(prefix)
                                if state["literal"] - state["remaining"] >= self.drop_after:
                                    self.dropped.set()
                                    return
                        upstream.sendall(data)
                except (OSError, ssl.SSLError):
                    return

            def server_to_client():
                try:
                    while True:
                        data = upstream.recv(65536)
                        if not data:
                            return
                        client.sendall(data)
                except (OSError, ssl.SSLError):
                    return

            left = threading.Thread(target=client_to_server, daemon=True)
            right = threading.Thread(target=server_to_client, daemon=True)
            left.start(); right.start(); left.join(); right.join(timeout=2)
        finally:
            for value in (client, upstream, self.server):
                if value:
                    try: value.close()
                    except OSError: pass


def run(args):
    source, destination = account("SOURCE"), account("DESTINATION")
    with tempfile.TemporaryDirectory(prefix="movemailbox-append-drop-") as temporary:
        cert, key = make_cert(Path(temporary))
        proxy = DropProxy(destination, cert, key, args.drop_after)
        proxy.start()
        env = {key: value for key, value in os.environ.items() if not key.startswith(("MOVEMAILBOX_", "IMAPSYNC_PASSWORD"))}
        env.update(IMAPSYNC_PASSWORD1=source["PASSWORD"], IMAPSYNC_PASSWORD2=destination["PASSWORD"])
        command = ["docker", "run", "--rm", "--network", "host", "--entrypoint", "imapsync", args.image,
                   "--host1", source["HOST"], "--port1", "993", "--user1", source["USER"],
                   "--password1", source["PASSWORD"],
                   "--host2", "127.0.0.1", "--port2", str(proxy.port), "--user2", destination["USER"],
                   "--password2", destination["PASSWORD"],
                   "--ssl1", "--ssl2", "--sslargs1", "SSL_verify_mode=1", "--sslargs1", "SSL_verifycn_scheme=imap",
                   "--sslargs1", "SSL_verifycn_name=" + source["HOST"], "--sslargs2", "SSL_verify_mode=0",
                   "--folder", args.folder, "--subfolder2", args.target, "--syncinternaldates", "--noreleasecheck", "--nolog"]
        result = subprocess.run(command, env=env, capture_output=True, timeout=180)
        proxy.thread.join(timeout=5)
        if not proxy.append_seen.is_set():
            diagnostic = (result.stdout + result.stderr).decode(errors="replace")[-1200:]
            for value in (source["PASSWORD"], destination["PASSWORD"], source["HOST"], destination["HOST"], source["USER"], destination["USER"]):
                diagnostic = diagnostic.replace(value, "[redacted]")
            raise RuntimeError("imapsync did not reach APPEND (exit %d): %s" % (result.returncode, diagnostic))
        if not proxy.dropped.is_set():
            raise RuntimeError("proxy did not drop the configured APPEND prefix")
        if result.returncode == 0:
            raise RuntimeError("imapsync reported success after APPEND connection loss")
        print("PASS: proxy observed APPEND and dropped connection after", args.drop_after, "bytes; imapsync returned", result.returncode)
        print("Destination may contain a partial test message; inspect/remove only this generated folder:", args.target)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--image", required=True)
    parser.add_argument("--folder", required=True)
    parser.add_argument("--target", required=True)
    parser.add_argument("--drop-after", type=int, default=131072)
    args = parser.parse_args()
    if args.drop_after < 1024 or not args.folder.startswith("MoveMailbox-Attachment-") or not args.target.startswith("MoveMailbox-ProxyDrop-"):
        parser.error("use generated disposable folder names and drop-after >= 1024")
    try:
        run(args)
    except Exception as exc:
        print("FAIL:", type(exc).__name__, "(sensitive details withheld)")
        raise SystemExit(1)
