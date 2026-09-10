"""Opt-in encrypted metadata backup tools. Linux/WSL operator utility, not a daemon.

Uses external age (tested 1.3.2); private identity is required only on restore.
No live database snapshotting: supply a stopped, drained, validated pair.
The directory object store models upload/commit/download, NOT actual off-site.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import stat
import sqlite3
import subprocess
import tempfile
import zipfile

from backup_validation import validate_pair

MAX_DB = 128 * 1024 * 1024
MAX_ARCHIVE = 260 * 1024 * 1024
FILES = {"api.db": MAX_DB, "worker.db": MAX_DB, "manifest.json": 65536}


def regular(path, limit):
    path = Path(path).absolute()
    if any(parent.is_symlink() for parent in (path, *path.parents)):
        raise ValueError("symlinks are not allowed")
    if not path.is_file() or not 0 < path.stat().st_size <= limit:
        raise ValueError("missing, empty or oversized input")
    return path


def parent_for_new(path):
    path = Path(path).absolute()
    if path.exists() or path.is_symlink():
        raise FileExistsError("target already exists; never overwrite")
    if any(parent.is_symlink() for parent in path.parents) or not path.parent.is_dir():
        raise ValueError("target needs an existing non-linked parent")
    return path


def digest(path):
    with open(path, "rb") as source:
        return hashlib.file_digest(source, "sha256").hexdigest()


def sync_directory(path):
    fd = os.open(path, os.O_RDONLY | os.O_DIRECTORY)
    try:
        os.fsync(fd)
    finally:
        os.close(fd)


def durable_write(path, content):
    with open(path, "xb") as output:
        os.chmod(path, 0o600)
        output.write(content)
        output.flush()
        os.fsync(output.fileno())


def copy_file(source, target):
    with open(source, "rb") as incoming, open(target, "xb") as output:
        os.chmod(target, 0o600)
        shutil.copyfileobj(incoming, output, length=1024 * 1024)
        output.flush()
        os.fsync(output.fileno())


def age_run(arguments, source, target, age):
    # No key material in arguments: only recipient/public key or identity path.
    with open(source, "rb") as incoming, open(target, "xb") as output:
        os.chmod(target, 0o600)
        result = subprocess.run([age, *arguments], stdin=incoming, stdout=output,
                                stderr=subprocess.PIPE, timeout=300)
        output.flush()
        os.fsync(output.fileno())
    if result.returncode:
        raise ValueError("age operation failed; details withheld")


def encrypt_pair(directory, target, recipient, age="age"):
    if not re.fullmatch(r"age1[0-9a-z]{58}", recipient):
        raise ValueError("native age X25519 public recipient required")
    directory, target = Path(directory), parent_for_new(target)
    for name, limit in FILES.items():
        regular(directory / name, limit)
    manifest = json.loads((directory / "manifest.json").read_text())
    validate_pair(directory, manifest)
    with tempfile.TemporaryDirectory(prefix=".movemailbox-seal-", dir=target.parent) as temp:
        root = Path(temp)
        # Copy before validation/packing to avoid a changed staged source being
        # silently sealed against an earlier manifest. No live writers supported.
        for name in FILES:
            copy_file(directory / name, root / name)
        validate_pair(root, json.loads((root / "manifest.json").read_text()))
        bundle = root / "pair.zip"
        with zipfile.ZipFile(bundle, "x", compression=zipfile.ZIP_STORED) as archive:
            for name in FILES:
                archive.write(root / name, name)
        sealed = root / "backup.age"
        age_run(["--encrypt", "--recipient", recipient], bundle, sealed, age)
        regular(sealed, MAX_ARCHIVE)
        os.link(sealed, target)  # atomic create-if-absent, never replace a backup
        sync_directory(target.parent)
    return digest(target)


def unpack_pair(bundle, target):
    """Do not use extractall: reject extra paths, links, duplicates and zip bombs."""
    with zipfile.ZipFile(bundle) as archive:
        members = archive.infolist()
        if len(members) != len(FILES) or {item.filename for item in members} != set(FILES):
            raise ValueError("unexpected or duplicate archive members")
        for item in members:
            kind = stat.S_IFMT(item.external_attr >> 16)
            if kind not in (0, stat.S_IFREG) or not 0 < item.file_size <= FILES[item.filename]:
                raise ValueError("non-regular or oversized archive member")
            with archive.open(item) as source:
                data = source.read(FILES[item.filename] + 1)
            if len(data) != item.file_size:
                raise ValueError("archive size mismatch")
            durable_write(target / item.filename, data)
    validate_pair(target, json.loads((target / "manifest.json").read_text()))


def decrypt_pair(archive, target, identity, age="age"):
    archive, target = regular(archive, MAX_ARCHIVE), parent_for_new(target)
    identity = regular(identity, 65536)
    if stat.S_IMODE(identity.stat().st_mode) & 0o077:
        raise ValueError("identity file must be private (0600)")
    with tempfile.TemporaryDirectory(prefix=".movemailbox-open-", dir=target.parent) as temp:
        root = Path(temp)
        bundle = root / "pair.zip"
        # age may write partial plaintext before authentication failure. Keep it
        # private and never unpack/publish until the entire decrypt succeeds.
        age_run(["--decrypt", "--identity", str(identity)], archive, bundle, age)
        checked = root / "checked"
        checked.mkdir(mode=0o700)
        unpack_pair(bundle, checked)
        # Output is a fresh non-live staging directory, not a database volume.
        target.mkdir(mode=0o700)  # rejects a target concurrently created elsewhere
        for name in FILES:
            os.link(checked / name, target / name)
        durable_write(target / "RESTORE-VERIFIED", b"validated metadata pair\n")
        sync_directory(target)
        sync_directory(target.parent)
    return target


def publish_object(archive, store, name):
    archive = regular(archive, MAX_ARCHIVE)
    if not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9._-]{0,100}", name):
        raise ValueError("invalid object name")
    target = parent_for_new(Path(store) / name)
    target.mkdir(mode=0o700)
    partial = target / "backup.age.part"
    copy_file(archive, partial)
    checksum = digest(archive)
    if digest(partial) != checksum:
        raise ValueError("upload checksum mismatch")
    os.link(partial, target / "backup.age")
    # The commit marker is written last; readers reject interrupted uploads.
    marker = target / "commit.part"
    durable_write(marker, (checksum + "\n").encode("ascii"))
    os.link(marker, target / "COMMITTED")
    sync_directory(target)
    sync_directory(target.parent)
    return target


def fetch_object(obj, target):
    obj, target = Path(obj), parent_for_new(target)
    marker = regular(obj / "COMMITTED", 65).read_text().strip()
    archive = regular(obj / "backup.age", MAX_ARCHIVE)
    if not re.fullmatch(r"[0-9a-f]{64}", marker) or digest(archive) != marker:
        raise ValueError("incomplete or damaged stored object")
    with tempfile.TemporaryDirectory(prefix=".movemailbox-fetch-", dir=target.parent) as temp:
        staged = Path(temp) / "backup.age"
        copy_file(archive, staged)
        if digest(staged) != marker:
            raise ValueError("download checksum mismatch")
        os.link(staged, target)
        sync_directory(target.parent)
    return target


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest="command", required=True)
    for verb in ("seal", "open", "put", "get"):
        sub = commands.add_parser(verb)
        sub.add_argument("source", type=Path)
        sub.add_argument("target", type=Path)
        if verb in ("seal", "open"):
            sub.add_argument("--age", default="age")
            sub.add_argument("--recipient" if verb == "seal" else "--identity", required=True)
        if verb == "put":
            sub.add_argument("--name", required=True)
    args = parser.parse_args()
    if os.name != "posix":
        parser.error("operator utility requires Linux/WSL filesystem semantics")
    os.umask(0o077)
    try:
        if args.command == "seal":
            encrypt_pair(args.source, args.target, args.recipient, args.age)
        elif args.command == "open":
            decrypt_pair(args.source, args.target, args.identity, args.age)
        elif args.command == "put":
            publish_object(args.source, args.target, args.name)
        else:
            fetch_object(args.source, args.target)
    except (OSError, ValueError, KeyError, TypeError, sqlite3.DatabaseError, zipfile.BadZipFile, subprocess.SubprocessError):
        parser.exit(1, "FAIL: operation rejected; no existing backup or database overwritten\n")
    print("PASS: " + args.command + " completed")
