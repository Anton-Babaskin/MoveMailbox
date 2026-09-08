import hashlib
from contextlib import closing, contextmanager
import json
from pathlib import Path
import sqlite3
import tempfile
import unittest

from append_gate import AppendGate
from backup_validation import validate_pair


@contextmanager
def database(path):
    with closing(sqlite3.connect(path)) as db, db:
        yield db


class AppendTests(unittest.TestCase):
    def test_fragmented_and_coalesced_literal(self):
        body = bytes(range(256)) * 20  # Includes CRLF, braces and non-text bytes.
        for marker in (b"{5120}", b"{5120+}"):
            header = b"a1 NOOP\r\na2 APPEND INBOX (\\Seen) " + marker + b"\r\n"
            stream = header + body + b"\r\na3 LOGOUT\r\n"
            for chunk in (1, 2, 7, 31, 1024, 100000):
                gate, output = AppendGate(1025), bytearray()
                for start in range(0, len(stream), chunk):
                    gate.feed(stream[start:start+chunk], output.extend)
                self.assertEqual(output, header + body[:1025])
                self.assertTrue(gate.dropped)
                self.assertEqual(gate.forwarded, 1025)
                self.assertEqual(gate.literal_size, 5120)

    def test_small_literal_and_overlong_command_fail_closed(self):
        with self.assertRaises(ValueError):
            AppendGate(1024).feed(b"a APPEND INBOX {500}\r\n", lambda _: None)
        with self.assertRaises(ValueError):
            AppendGate(1024).feed(b"a" * 65537, lambda _: None)


class BackupTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="movemailbox-backup-test-")
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        with database(self.root / "api.db") as db:
            db.execute("CREATE TABLE job_snapshots(id TEXT, snapshot_json BLOB)")
            db.execute("INSERT INTO job_snapshots VALUES (?, ?)", ("one", json.dumps({"view": {"id": "one", "status": "completed"}})))
        with database(self.root / "worker.db") as db:
            db.executescript("CREATE TABLE worker_jobs(job_id TEXT, status TEXT); CREATE TABLE credential_envelopes(job_id TEXT); INSERT INTO worker_jobs VALUES ('one','completed');")
        self.rehash()

    def rehash(self):
        self.manifest = {"files": {role: hashlib.sha256((self.root / (role + ".db")).read_bytes()).hexdigest() for role in ("api", "worker")}}

    def test_good_pair(self):
        validate_pair(self.root, self.manifest)

    def test_missing_file_is_not_silently_created(self):
        path = self.root / "worker.db"
        path.rename(self.root / "held.db")
        with self.assertRaises(ValueError):
            validate_pair(self.root, self.manifest)
        self.assertFalse(path.exists())

    def test_corrupt_and_truncated_even_with_updated_checksums(self):
        path = self.root / "worker.db"
        original = path.read_bytes()
        for damaged in (original[:512], b"BAD HEADER" + original[10:]):
            path.write_bytes(damaged)
            self.rehash()
            with self.assertRaises((ValueError, sqlite3.DatabaseError)):
                validate_pair(self.root, self.manifest)

    def test_wrong_checksum(self):
        self.manifest["files"]["worker"] = "0" * 64
        with self.assertRaises(ValueError):
            validate_pair(self.root, self.manifest)

    def test_valid_sqlite_with_incomplete_schema(self):
        with database(self.root / "worker.db") as db:
            db.execute("DROP TABLE worker_jobs")
        self.rehash()
        with self.assertRaises(sqlite3.DatabaseError):
            validate_pair(self.root, self.manifest)

    def test_active_queue(self):
        with database(self.root / "worker.db") as db:
            db.execute("UPDATE worker_jobs SET status='running'")
        self.rehash()
        with self.assertRaises(ValueError):
            validate_pair(self.root, self.manifest)

    def test_credentials(self):
        with database(self.root / "worker.db") as db:
            db.execute("INSERT INTO credential_envelopes VALUES ('one')")
        self.rehash()
        with self.assertRaises(ValueError):
            validate_pair(self.root, self.manifest)

    def test_inconsistent_pair(self):
        with database(self.root / "worker.db") as db:
            db.execute("UPDATE worker_jobs SET status='failed'")
        self.rehash()
        with self.assertRaises(ValueError):
            validate_pair(self.root, self.manifest)


if __name__ == "__main__":
    unittest.main()
