import hashlib
from contextlib import closing
import json
import os
from pathlib import Path
import shutil
import sqlite3
import subprocess
import tempfile
import unittest
from unittest.mock import patch
import zipfile

import backup_archive as archive
from backup_validation import ensure_worker_drained

AGE = os.environ.get("AGE_BINARY") or shutil.which("age")
KEYGEN = os.environ.get("AGE_KEYGEN_BINARY") or shutil.which("age-keygen")


class ArchiveTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="movemailbox-archive-test-")
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.pair = self.root / "pair"
        self.pair.mkdir(mode=0o700)
        for name, schema in (
            ("api", "CREATE TABLE job_snapshots(id TEXT, snapshot_json BLOB)"),
            ("worker", "CREATE TABLE worker_jobs(job_id TEXT,status TEXT); CREATE TABLE credential_envelopes(job_id TEXT)"),
        ):
            with closing(sqlite3.connect(self.pair / (name + ".db"))) as db:
                db.executescript(schema)
        manifest = {"files": {role: archive.digest(self.pair / (role + ".db")) for role in ("api", "worker")}}
        (self.pair / "manifest.json").write_text(json.dumps(manifest))
        self.cipher = self.root / "example.age"
        self.cipher.write_bytes(b"synthetic ciphertext for transport-only tests")
        self.store = self.root / "store"
        self.store.mkdir()

    def test_drain_guard_rejects_jobs_envelopes_and_missing_database(self):
        ensure_worker_drained(self.pair / "worker.db")
        with self.assertRaises(ValueError):
            ensure_worker_drained(self.pair / "missing.db")
        for table, values in (("worker_jobs", "('job','queued')"), ("credential_envelopes", "('job')")):
            with self.subTest(table=table):
                with closing(sqlite3.connect(self.pair / "worker.db")) as db, db:
                    db.execute("INSERT INTO " + table + " VALUES " + values)
                with self.assertRaises(ValueError):
                    ensure_worker_drained(self.pair / "worker.db")
                with closing(sqlite3.connect(self.pair / "worker.db")) as db, db:
                    db.execute("DELETE FROM " + table)

    def test_committed_object_roundtrip_and_no_overwrite(self):
        obj = archive.publish_object(self.cipher, self.store, "one")
        output = archive.fetch_object(obj, self.root / "download.age")
        self.assertEqual(output.read_bytes(), self.cipher.read_bytes())
        with self.assertRaises(FileExistsError):
            archive.publish_object(self.cipher, self.store, "one")
        with self.assertRaises(FileExistsError):
            archive.fetch_object(obj, output)

    def test_interrupted_upload_never_commits(self):
        def interrupt(source, target):
            target.write_bytes(b"partial")
            raise OSError("simulated interrupted upload")
        with patch.object(archive, "copy_file", interrupt), self.assertRaises(OSError):
            archive.publish_object(self.cipher, self.store, "interrupted")
        obj = self.store / "interrupted"
        self.assertFalse((obj / "COMMITTED").exists())
        with self.assertRaises(ValueError):
            archive.fetch_object(obj, self.root / "download.age")
        self.assertFalse((self.root / "download.age").exists())

    def test_corrupt_and_truncated_objects_rejected(self):
        for name, content in (("corrupt", b"changed"), ("truncated", b"")):
            obj = archive.publish_object(self.cipher, self.store, name)
            (obj / "backup.age").write_bytes(content)
            with self.assertRaises(ValueError):
                archive.fetch_object(obj, self.root / (name + ".age"))

    def test_zip_rejects_extra_duplicate_traversal_link_and_oversize(self):
        for mode in ("extra", "traversal", "link", "oversize", "duplicate", "missing"):
            bundle = self.root / (mode + ".zip")
            target = self.root / mode
            target.mkdir()
            with zipfile.ZipFile(bundle, "w") as output:
                for name in archive.FILES:
                    if mode == "missing" and name == "worker.db":
                        continue
                    item = zipfile.ZipInfo(name)
                    item.external_attr = (0o120777 if mode == "link" else 0o100600) << 16
                    data = (self.pair / name).read_bytes()
                    if mode == "oversize" and name == "manifest.json":
                        data = b"x" * 65537
                    output.writestr(item, data)
                if mode in ("extra", "traversal", "duplicate"):
                    import warnings
                    with warnings.catch_warnings():
                        warnings.simplefilter("ignore", UserWarning)
                        output.writestr({"extra": ".env", "traversal": "../escape", "duplicate": "api.db"}[mode], b"bad")
            with self.subTest(mode=mode), self.assertRaises(ValueError):
                archive.unpack_pair(bundle, target)
        self.assertFalse((self.root / "escape").exists())

    def test_symlinks_and_bad_object_names_rejected(self):
        link = self.root / "linked.age"
        link.symlink_to(self.cipher)
        with self.assertRaises(ValueError):
            archive.publish_object(link, self.store, "link")
        for name in ("..", "../outside", "/absolute", "nested/name"):
            with self.assertRaises(ValueError):
                archive.publish_object(self.cipher, self.store, name)

    @unittest.skipUnless(AGE and KEYGEN, "install pinned age and age-keygen for crypto integration tests")
    def test_age_roundtrip_wrong_key_tamper_truncation_and_no_secrets(self):
        identities = []
        for number in range(2):
            identity = self.root / (str(number) + ".key")
            result = subprocess.run([KEYGEN, "-o", str(identity)], capture_output=True, timeout=10)
            self.assertEqual(result.returncode, 0)
            identity.chmod(0o600)
            identities.append(identity)
        recipient = subprocess.run([KEYGEN, "-y", str(identities[0])], capture_output=True, check=True).stdout.decode().strip()
        (self.pair / ".env").write_text("must not be archived")
        sealed = self.root / "real.age"
        archive.encrypt_pair(self.pair, sealed, recipient, AGE)
        self.assertNotIn(b"SQLite format 3", sealed.read_bytes())
        self.assertNotIn(identities[0].read_bytes(), sealed.read_bytes())
        restored = archive.decrypt_pair(sealed, self.root / "restored", identities[0], AGE)
        for name in archive.FILES:
            self.assertEqual((restored / name).read_bytes(), (self.pair / name).read_bytes())
        self.assertEqual({item.name for item in restored.iterdir()}, set(archive.FILES) | {"RESTORE-VERIFIED"})
        with self.assertRaises(FileExistsError):
            archive.decrypt_pair(sealed, restored, identities[0], AGE)
        raw = sealed.read_bytes()
        for mode, content, identity in (("wrong-key", raw, identities[1]), ("truncated", raw[:-20], identities[0]),
                                        ("tampered", raw[:-1] + bytes([raw[-1] ^ 1]), identities[0])):
            damaged = self.root / (mode + ".age")
            damaged.write_bytes(content)
            target = self.root / (mode + "-restore")
            with self.subTest(mode=mode), self.assertRaises(ValueError):
                archive.decrypt_pair(damaged, target, identity, AGE)
            self.assertFalse(target.exists())


if __name__ == "__main__":
    unittest.main()
