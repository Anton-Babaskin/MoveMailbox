#!/usr/bin/env python3
"""Transactional image update for the dedicated closed staging VM.

The command deliberately has no generic project/path switches: it owns only the
MoveMailbox staging service installed by install-private-staging.py.  It stops
both writers, creates and validates a paired SQLite Backup API snapshot, pins a
local immutable image ID and rolls the image and databases back if health does
not recover.
"""

import argparse
from contextlib import closing
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import sqlite3
import stat
import subprocess
import sys
import tempfile
import time
import urllib.request

from backup_validation import validate_pair


ENV = Path("/etc/movemailbox/staging.env")
BACKUP_ROOT = Path("/var/backups/movemailbox")
SERVICE = "movemailbox-staging.service"
CONTAINERS = (
    "movemailbox-staging-movemailbox-1",
    "movemailbox-staging-movemailbox-worker-1",
)
VOLUMES = {
    "api": ("movemailbox-staging_movemailbox-data", "movemailbox.db"),
    "worker": ("movemailbox-staging_movemailbox-worker-data", "worker.db"),
}
TERMINAL = ("completed", "failed", "cancelled")


def run(*args, check=True):
    return subprocess.run(args, check=check, text=True, capture_output=True)


def image_id(reference):
    value = run("docker", "image", "inspect", reference, "--format={{.Id}}").stdout.strip()
    if not re.fullmatch(r"sha256:[0-9a-f]{64}", value):
        raise RuntimeError("image reference did not resolve to a local immutable ID")
    return value


def database_paths():
    result = {}
    for role, (volume, filename) in VOLUMES.items():
        mount = Path(run("docker", "volume", "inspect", volume,
                         "--format={{.Mountpoint}}").stdout.strip())
        if not mount.is_absolute() or mount.is_symlink() or not mount.is_dir():
            raise RuntimeError(f"unsafe {role} volume mountpoint")
        path = mount / filename
        if path.is_symlink() or not path.is_file():
            raise RuntimeError(f"missing or linked {role} database")
        result[role] = path
    return result


def current_pin(path=ENV):
    info = path.lstat()
    if stat.S_ISLNK(info.st_mode) or not stat.S_ISREG(info.st_mode):
        raise RuntimeError("staging environment must be a regular file")
    if info.st_uid != 0 or stat.S_IMODE(info.st_mode) != 0o600:
        raise RuntimeError("staging environment must be root-owned mode 0600")
    matches = [line.split("=", 1)[1] for line in path.read_text().splitlines()
               if line.startswith("MOVEMAILBOX_STAGING_IMAGE=")]
    if len(matches) != 1 or not re.fullmatch(r"sha256:[0-9a-f]{64}", matches[0]):
        raise RuntimeError("staging environment has no single immutable image pin")
    return matches[0]


def atomic_pin(expected, replacement, path=ENV):
    if current_pin(path) != expected:
        raise RuntimeError("staging image pin changed concurrently")
    data = path.read_text()
    old_line = f"MOVEMAILBOX_STAGING_IMAGE={expected}"
    new_line = f"MOVEMAILBOX_STAGING_IMAGE={replacement}"
    temporary = path.with_name(path.name + f".update-{os.getpid()}")
    fd = os.open(temporary, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    try:
        with os.fdopen(fd, "w") as output:
            output.write(data.replace(old_line, new_line))
            output.flush()
            os.fsync(output.fileno())
        os.chown(temporary, 0, 0)
        os.replace(temporary, path)
        directory_fd = os.open(path.parent, os.O_RDONLY | os.O_DIRECTORY)
        try:
            os.fsync(directory_fd)
        finally:
            os.close(directory_fd)
    finally:
        temporary.unlink(missing_ok=True)


def sqlite_backup(source, target):
    if source.is_symlink() or not source.is_file() or target.exists() or target.is_symlink():
        raise RuntimeError("unsafe SQLite backup source or destination")
    with closing(sqlite3.connect(source.resolve().as_uri() + "?mode=ro", uri=True)) as incoming:
        with closing(sqlite3.connect(target)) as outgoing:
            incoming.backup(outgoing)
    os.chmod(target, 0o600)


def snapshot_pair(databases, directory, metadata, validate=True):
    directory.mkdir(mode=0o700, parents=True, exist_ok=False)
    hashes = {}
    for role in ("api", "worker"):
        target = directory / f"{role}.db"
        sqlite_backup(databases[role], target)
        with target.open("rb") as stream:
            hashes[role] = hashlib.file_digest(stream, "sha256").hexdigest()
    manifest = {**metadata, "files": hashes}
    manifest_path = directory / "manifest.json"
    manifest_path.write_text(json.dumps(manifest, sort_keys=True) + "\n")
    os.chmod(manifest_path, 0o600)
    if validate:
        validate_pair(directory, manifest)
    return manifest


def ensure_backup_root(path=BACKUP_ROOT):
    if not path.exists():
        path.mkdir(mode=0o700, parents=True)
    info = path.lstat()
    if stat.S_ISLNK(info.st_mode) or not stat.S_ISDIR(info.st_mode) or info.st_uid != 0:
        raise RuntimeError("backup root must be a root-owned directory")
    if stat.S_IMODE(info.st_mode) & 0o077:
        raise RuntimeError("backup root must not be accessible by group or other users")


def restore_pair(databases, directory, manifest):
    # Validate the complete pair before touching either live database.
    validate_pair(directory, manifest)
    staged = {}
    for role in ("api", "worker"):
        live = databases[role]
        info = live.stat()
        temporary = live.with_name(live.name + f".restore-{os.getpid()}")
        if temporary.exists() or temporary.is_symlink():
            raise RuntimeError("unexpected pending database restore")
        with (directory / f"{role}.db").open("rb") as source, temporary.open("xb") as target:
            shutil.copyfileobj(source, target)
            target.flush()
            os.fsync(target.fileno())
        os.chown(temporary, info.st_uid, info.st_gid)
        os.chmod(temporary, stat.S_IMODE(info.st_mode))
        staged[role] = temporary
    # Both complete files now exist on their destination filesystems. Sidecars
    # from the failed image must not be replayed into the restored databases.
    for role in ("api", "worker"):
        live = databases[role]
        for suffix in ("-wal", "-shm"):
            sidecar = Path(str(live) + suffix)
            if sidecar.is_symlink():
                for path in staged.values():
                    path.unlink(missing_ok=True)
                raise RuntimeError("refusing linked SQLite sidecar")
            sidecar.unlink(missing_ok=True)
        os.replace(staged[role], live)
        directory_fd = os.open(live.parent, os.O_RDONLY | os.O_DIRECTORY)
        try:
            os.fsync(directory_fd)
        finally:
            os.close(directory_fd)
    validate_live_pair(databases)


def validate_live_pair(databases):
    parent = Path(tempfile.mkdtemp(prefix="movemailbox-live-validate-"))
    temporary = parent / "pair"
    try:
        snapshot_pair(databases, temporary, {})
    finally:
        shutil.rmtree(parent, ignore_errors=True)


def stopped():
    for container in CONTAINERS:
        state = run("docker", "inspect", container, "--format={{.State.Running}}").stdout.strip()
        if state != "false":
            raise RuntimeError(f"container did not stop: {container}")


def wait_healthy(expected_image, timeout=120):
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        states = [run("docker", "inspect", name,
                      "--format={{.Image}} {{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}",
                      check=False).stdout.strip() for name in CONTAINERS]
        if states == [f"{expected_image} healthy", f"{expected_image} healthy"]:
            request = urllib.request.Request("http://127.0.0.1:8080/api/ready",
                                             headers={"Host": "staging.movemailbox.com"})
            try:
                with urllib.request.urlopen(request, timeout=5) as response:
                    if response.status == 200 and response.headers.get("Cache-Control") == "no-store":
                        return
            except OSError:
                pass
        time.sleep(2)
    raise RuntimeError("staging did not become healthy and ready")


def update(reference, source_commit):
    if os.geteuid() != 0:
        raise RuntimeError("run as root on the dedicated staging VM")
    if not re.fullmatch(r"[0-9a-f]{40}", source_commit):
        raise RuntimeError("source commit must be a full lowercase SHA")
    old = current_pin()
    new = image_id(reference)
    if old == new:
        raise RuntimeError("requested image is already deployed")
    image_id(old)  # Rollback image must exist before downtime begins.
    databases = database_paths()
    ensure_backup_root()
    run("systemctl", "stop", SERVICE)
    changed = False
    backup = None
    try:
        stopped()
        stamp = time.strftime("%Y%m%dT%H%M%SZ", time.gmtime())
        backup = BACKUP_ROOT / f"pre-{source_commit[:12]}-{stamp}"
        manifest = snapshot_pair(databases, backup, {
            "createdAt": stamp, "fromImage": old, "toImage": new,
            "sourceCommit": source_commit,
        })
        atomic_pin(old, new)
        changed = True
        run("systemctl", "start", SERVICE)
        wait_healthy(new)
        print(json.dumps({"backup": str(backup), "fromImage": old,
                          "toImage": new, "status": "healthy"}, sort_keys=True))
    except Exception as update_error:
        rollback_error = None
        try:
            run("systemctl", "stop", SERVICE, check=False)
            if changed:
                stopped()
                failed = backup / "failed-update"
                # Preserve the failed state for diagnosis even when it contains
                # a non-terminal job; it is never accepted as a restore source.
                snapshot_pair(databases, failed, {"failedImage": new}, validate=False)
                restore_pair(databases, backup, manifest)
                atomic_pin(new, old)
            run("systemctl", "start", SERVICE)
            wait_healthy(old)
        except Exception as error:
            rollback_error = error
        if rollback_error:
            raise RuntimeError(f"update failed and automatic rollback failed: {rollback_error}") from update_error
        raise RuntimeError("update failed; previous image and database pair restored") from update_error


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--image", required=True, help="reviewed local tag or sha256 image ID")
    parser.add_argument("--source-commit", required=True, help="full reviewed Git commit SHA")
    args = parser.parse_args()
    try:
        update(args.image, args.source_commit)
    except (OSError, ValueError, KeyError, sqlite3.DatabaseError, subprocess.SubprocessError,
            RuntimeError) as error:
        parser.exit(1, f"FAIL: {error}\n")


if __name__ == "__main__":
    main()
