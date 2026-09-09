#!/usr/bin/env python3
"""Opt-in native imapsync budget test with two generated disposable messages.

Same MM_* environment as the APPEND test. Retains all generated mail.
This verifies the native execution boundary, not full API admission timing.
"""
import argparse
import importlib.util
from pathlib import Path
import secrets
from email.message import EmailMessage
from email.policy import SMTP


def load(name, filename):
    spec = importlib.util.spec_from_file_location(name, Path(__file__).with_name(filename))
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def run(args):
    fault = load("fault", "smoke-imap-append-drop.py")
    live = load("live", "smoke-live-quota.py")
    source, destination = fault.account("SOURCE"), fault.account("DESTINATION")
    args.folder = "MoveMailbox-Budget-" + secrets.token_hex(6)
    args.target = args.folder + "-Copy"
    clients = []
    try:
        for account in (source, destination):
            clients.append(live.connect({"host":account["HOST"], "username":account["USER"], "password":account["PASSWORD"]}))
        assert clients[0].create(args.folder)[0] == "OK"
        for number in (1, 2):
            message = EmailMessage(policy=SMTP)
            message["From"] = source["USER"]
            message["To"] = destination["USER"]
            message["Message-ID"] = f"<{args.folder}-{number}@example.test>"
            message["Subject"] = "Synthetic budget fixture " + str(number)
            message.set_content("x" * 4096)
            assert clients[0].append(args.folder, "(\\Seen)", '"08-Sep-2026 08:00:00 +0000"', message.as_bytes())[0] == "OK"
        original = live.snapshot(clients[0], args.folder)
        assert len(original) == 2
        code = fault.imapsync(args, source, destination, exit_when_over=2)
        assert code == 118, "native budget exit must be 118"
        copied = live.snapshot(clients[1], args.target + "." + args.folder)
        assert len(copied) == 1 and copied[0] in original
        assert live.snapshot(clients[0], args.folder) == original
        print("PASS: 2-byte threshold, one whole message retained, second not copied, exit 118, source unchanged", flush=True)
        print("Retained source and destination prefix:", args.folder, args.target, flush=True)
    finally:
        for client in clients:
            try:
                client.logout()
            except (OSError, live.imaplib.IMAP4.error):
                pass


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--image", required=True)
    parser.add_argument("--allow-test-mail", action="store_true", required=True)
    try:
        run(parser.parse_args())
    except Exception as exc:
        print("FAIL:", type(exc).__name__, "(sensitive details withheld)", flush=True)
        raise SystemExit(1)
