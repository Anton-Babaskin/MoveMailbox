#!/usr/bin/env python3
"""Validate release archives and exercise the native packaged demo, offline.

Runs only the selected host-compatible binary on loopback, in a fresh temporary
directory. Never contacts IMAP, opens a browser or modifies an installed copy.
"""

import argparse
import hashlib
from html.parser import HTMLParser
import json
import os
from pathlib import Path, PurePosixPath
import platform
import re
import secrets
import socket
import stat
import subprocess
import tarfile
import tempfile
import time
import urllib.error
import urllib.request
import zipfile

TARGETS = ("windows/amd64", "linux/amd64", "linux/arm64", "darwin/amd64", "darwin/arm64")
MAX_UNPACKED = 512 * 1024 * 1024
REQUIRED = {"README.md", "SECURITY.md", "LICENSING.md", "BUILD-INFO.txt",
            "BUILD-DEPENDENCIES.txt", "operations/WORKER.md", "operations/BACKUP-RUNBOOK.md",
            "operations/backup_archive.py", "operations/backup_validation.py"}


def package_name(tag, target):
    if not re.fullmatch(r"v[0-9]+\.[0-9]+\.[0-9]+(?:-[0-9A-Za-z.-]+)?", tag) or target not in TARGETS:
        raise ValueError("invalid release tag or platform")
    return "movemailbox-" + target.replace("/", "-") + "-" + tag


def inventory(path, root):
    """Read regular files only; never use archive extractall on downloaded input."""
    files, total = {}, 0

    def add(name, size, read, executable=False):
        nonlocal total
        parts = PurePosixPath(name).parts
        if "\\" in name or not parts or parts[0] != root or ".." in parts or name.startswith("/"):
            raise ValueError("archive path outside expected package")
        relative = "/".join(parts[1:])
        if not relative or relative in files or len(files) >= 64 or size < 0:
            raise ValueError("invalid, duplicate or excessive archive members")
        total += size
        if total > MAX_UNPACKED:
            raise ValueError("archive exceeds unpacked size budget")
        data = read()
        if len(data) != size:
            raise ValueError("incomplete archive member")
        files[relative] = (data, executable)

    if path.suffix == ".zip":
        with zipfile.ZipFile(path) as archive:
            for member in archive.infolist():
                mode = member.external_attr >> 16
                if stat.S_ISLNK(mode) or (stat.S_IFMT(mode) not in (0, stat.S_IFREG, stat.S_IFDIR)):
                    raise ValueError("archive contains link or special file")
                if member.is_dir():
                    continue
                add(member.filename, member.file_size, lambda m=member: archive.read(m))
    else:
        with tarfile.open(path, "r:gz") as archive:
            for member in archive:
                if member.isdir():
                    continue
                if not member.isfile():
                    raise ValueError("archive contains link or special file")
                add(member.name, member.size, lambda m=member: archive.extractfile(m).read(),
                    bool(member.mode & 0o111))
    return files


def validate_package(path, tag, commit, target):
    if not re.fullmatch(r"[0-9a-f]{40}", commit):
        raise ValueError("expected full source commit")
    files = inventory(path, package_name(tag, target))
    binary = "movemailbox.exe" if target.startswith("windows/") else "movemailbox"
    platform_files = ({"START-DEMO.cmd", "START-DEMO-DEBUG.cmd", "START-REAL.cmd", "README-RU.txt"}
                      if target.startswith("windows/") else {"README-UNIX.txt"})
    if not REQUIRED | platform_files | {binary} <= files.keys():
        raise ValueError("release is missing executable, instructions or build evidence")
    allowed = REQUIRED | platform_files | {binary, "LICENSE"}
    if files.keys() - allowed:
        raise ValueError("release contains unexpected files (possibly runtime data)")
    expected = f"Version: {tag}\nCommit: {commit}\nPlatform: {target}\n"
    if files["BUILD-INFO.txt"][0].decode() != expected:
        raise ValueError("release identity does not match tag, commit and platform")
    dependencies = files["BUILD-DEPENDENCIES.txt"][0].decode()
    for required in ("github.com/Anton-Babaskin/MoveMailbox", "modernc.org/sqlite",
                     "GOOS=" + target.split("/")[0], "GOARCH=" + target.split("/")[1]):
        if required not in dependencies:
            raise ValueError("binary build metadata does not match platform/dependencies")
    if not target.startswith("windows/") and not files[binary][1]:
        raise ValueError("Unix binary is not executable")
    return files[binary][0]


def verify_checksums(directory, tag):
    expected = {package_name(tag, t) + (".zip" if t.startswith("windows/") else ".tar.gz")
                for t in TARGETS}
    recorded = {}
    for line in (directory / "SHA256SUMS.txt").read_text().splitlines():
        match = re.fullmatch(r"([0-9a-f]{64})  ([A-Za-z0-9_.-]+)", line)
        if not match or match[2] in recorded:
            raise ValueError("invalid or duplicate published checksum")
        recorded[match[2]] = match[1]
    if recorded.keys() != expected:
        raise ValueError("checksum inventory must cover exactly five native packages")
    for name, expected_hash in recorded.items():
        with (directory / name).open("rb") as source:
            if hashlib.file_digest(source, "sha256").hexdigest() != expected_hash:
                raise ValueError("archive checksum mismatch")
    return recorded


class Assets(HTMLParser):
    def __init__(self):
        super().__init__()
        self.paths = set()

    def handle_starttag(self, tag, attributes):
        for name, value in attributes:
            if tag in ("script", "link") and name in ("src", "href") and value and value.startswith("/_next/static/"):
                self.paths.add(value)


def smoke(binary_data, tag, directory):
    executable = directory / ("movemailbox.exe" if os.name == "nt" else "movemailbox")
    executable.write_bytes(binary_data)
    executable.chmod(0o700)
    database = directory / "history.db"
    environment = {k: v for k, v in os.environ.items() if not k.startswith(("MOVEMAILBOX_", "MM_", "NEXT_PUBLIC_"))}
    # Ignore proxy settings: the only HTTP target is this newly started process.
    opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))
    passwords = [secrets.token_hex(24), secrets.token_hex(24)]
    process = None
    base = ""

    def request(path, payload=None, expected=200):
        data = None if payload is None else json.dumps(payload).encode()
        req = urllib.request.Request(base + path, data=data,
                                     headers={"Content-Type": "application/json"} if data else {})
        try:
            response = opener.open(req, timeout=3)
        except urllib.error.HTTPError as error:
            response = error
        with response:
            if response.status != expected:
                raise RuntimeError(f"packaged endpoint {path} returned {response.status}, expected {expected}")
            return response.read(), response.headers

    def stop():
        nonlocal process
        if process is not None:
            if process.poll() is None:
                process.terminate()
                try:
                    process.wait(timeout=25)
                except subprocess.TimeoutExpired:
                    process.kill()
                    process.wait(timeout=5)
            process = None

    def start():
        nonlocal process, base
        with socket.socket() as sock:
            sock.bind(("127.0.0.1", 0))
            port = sock.getsockname()[1]
        base = f"http://127.0.0.1:{port}"
        process = subprocess.Popen([str(executable), "--demo", "--open=false", f"--addr=127.0.0.1:{port}",
                                    "--database=" + str(database)], cwd=directory, env=environment,
                                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        deadline = time.monotonic() + 20
        while time.monotonic() < deadline:
            if process.poll() is not None:
                raise RuntimeError("packaged process exited during startup")
            try:
                raw, _ = request("/api/health")
                health = json.loads(raw)
                if health["product"] != "movemailbox" or health["version"] != tag[1:] or health["engine"] != "demo":
                    raise RuntimeError("packaged process identity mismatch")
                return
            except (urllib.error.URLError, ConnectionError, TimeoutError):
                time.sleep(0.1)
        raise RuntimeError("packaged process startup timeout")

    try:
        start()
        for route in ("/", "/en", "/uk"):
            html, headers = request(route)
            assets = Assets()
            assets.feed(html.decode())
            if not assets.paths or "text/html" not in headers.get("Content-Type", ""):
                raise RuntimeError("release lacks the embedded exported interface")
            policy = headers.get("Content-Security-Policy", "")
            if "script-src 'self' 'sha256-" not in policy:
                raise RuntimeError("embedded interface lacks hashed inline script permission")
            for asset in sorted(assets.paths):
                body, _ = request(asset)
                if not body:
                    raise RuntimeError("empty embedded asset")
        request("/release-smoke-missing-page", expected=404)
        raw, _ = request("/api/session")
        if json.loads(raw)["mode"] != "local":
            raise RuntimeError("native demo must not require guest registration")
        endpoint = {"host": "source.example.test", "port": 993, "security": "tls",
                    "username": "fixture@example.test", "password": passwords[0]}
        payload = {"source": endpoint,
                   "destination": endpoint | {"host": "destination.example.test", "password": passwords[1]},
                   "options": {"syncFlags": True, "preserveDates": True, "folders": ["INBOX"]}}
        raw, _ = request("/api/jobs", payload, 202)
        job_id = json.loads(raw)["id"]
        deadline = time.monotonic() + 15
        while time.monotonic() < deadline:
            raw, _ = request("/api/jobs/" + job_id)
            job = json.loads(raw)
            if job["status"] in ("completed", "failed", "cancelled"):
                break
            time.sleep(0.1)
        else:
            raise RuntimeError("packaged demo migration timeout")
        if job["status"] != "completed" or job["transferred"] != 184 or job["progress"] != 100:
            raise RuntimeError("packaged demo result mismatch")
        stop()
        start()
        raw, _ = request("/api/jobs/" + job_id)
        if json.loads(raw)["status"] != "completed":
            raise RuntimeError("packaged history lost after restart")
    finally:
        stop()
    for path in directory.rglob("*"):
        if path.is_file() and path != executable:
            content = path.read_bytes()
            if any(password.encode() in content for password in passwords):
                raise RuntimeError("synthetic password persisted in local history/logs")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--dist", required=True, type=Path)
    parser.add_argument("--tag", required=True)
    parser.add_argument("--commit", required=True)
    parser.add_argument("--target", choices=("windows/amd64", "linux/amd64"), required=True)
    args = parser.parse_args()
    host = "windows/amd64" if os.name == "nt" else "linux/amd64"
    if args.target != host or platform.machine().lower() not in ("amd64", "x86_64"):
        parser.error("selected executable does not match the native test runner")
    verify_checksums(args.dist, args.tag)
    binary = None
    for target in TARGETS:
        path = args.dist / (package_name(args.tag, target) + (".zip" if target.startswith("windows/") else ".tar.gz"))
        data = validate_package(path, args.tag, args.commit, target)
        if target == args.target:
            binary = data
    with tempfile.TemporaryDirectory(prefix="movemailbox-release-") as temporary:
        smoke(binary, args.tag, Path(temporary))
    print(f"PASS: five archives/checksums/build identities; {args.target} native launch, embedded RU/EN/UK "
          "pages/assets/CSP, demo job, persisted restart, no plaintext synthetic passwords. No IMAP contacted.")


if __name__ == "__main__":
    main()
