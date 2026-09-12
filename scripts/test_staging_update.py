import importlib.util
import json
import os
from pathlib import Path
import sqlite3
import stat
import tempfile
import unittest
from unittest import mock


spec = importlib.util.spec_from_file_location("staging_update", Path(__file__).with_name("staging_update.py"))
stage = importlib.util.module_from_spec(spec)
spec.loader.exec_module(stage)


def create_pair(root):
    api = root / "api-live.db"
    worker = root / "worker-live.db"
    with sqlite3.connect(api) as db:
        db.execute("CREATE TABLE job_snapshots(id TEXT, snapshot_json BLOB)")
        db.execute("INSERT INTO job_snapshots VALUES (?, ?)",
                   ("one", json.dumps({"view": {"id": "one", "status": "completed"}})))
    with sqlite3.connect(worker) as db:
        db.execute("PRAGMA journal_mode=WAL")
        db.execute("PRAGMA wal_autocheckpoint=0")
        db.execute("CREATE TABLE credential_envelopes(id TEXT)")
        db.execute("CREATE TABLE worker_jobs(job_id TEXT, status TEXT)")
        db.execute("INSERT INTO worker_jobs VALUES ('one', 'running')")
        db.commit()
        db.execute("PRAGMA wal_checkpoint(TRUNCATE)")
    return {"api": api, "worker": worker}


class StagingUpdateTests(unittest.TestCase):
    def test_snapshot_includes_committed_wal_and_validates_pair(self):
        with tempfile.TemporaryDirectory() as name:
            root = Path(name)
            databases = create_pair(root)
            writer = sqlite3.connect(databases["worker"])
            try:
                writer.execute("PRAGMA wal_autocheckpoint=0")
                writer.execute("UPDATE worker_jobs SET status='completed' WHERE job_id='one'")
                writer.commit()
                backup = root / "backup"
                manifest = stage.snapshot_pair(databases, backup, {"sourceCommit": "a" * 40})
                with sqlite3.connect(backup / "worker.db") as db:
                    self.assertEqual(db.execute("SELECT status FROM worker_jobs").fetchone()[0], "completed")
                self.assertEqual(set(manifest["files"]), {"api", "worker"})
            finally:
                writer.close()

    def test_snapshot_rejects_active_pair(self):
        with tempfile.TemporaryDirectory() as name:
            root = Path(name)
            databases = create_pair(root)
            with self.assertRaisesRegex(ValueError, "non-terminal"):
                stage.snapshot_pair(databases, root / "backup", {})

    def test_atomic_pin_changes_only_exact_image_line(self):
        with tempfile.TemporaryDirectory() as name:
            path = Path(name) / "staging.env"
            old, new = "sha256:" + "1" * 64, "sha256:" + "2" * 64
            path.write_text(f"SAFE=value\nMOVEMAILBOX_STAGING_IMAGE={old}\n")
            os.chmod(path, 0o600)
            with mock.patch.object(stage, "current_pin", return_value=old), \
                 mock.patch.object(stage.os, "chown"):
                stage.atomic_pin(old, new, path)
            self.assertIn(f"MOVEMAILBOX_STAGING_IMAGE={new}", path.read_text())
            self.assertIn("SAFE=value", path.read_text())
            self.assertEqual(stat.S_IMODE(path.stat().st_mode), 0o600)

    def test_restore_refuses_corrupt_pair_before_live_write(self):
        with tempfile.TemporaryDirectory() as name:
            root = Path(name)
            databases = create_pair(root)
            with sqlite3.connect(databases["worker"]) as db:
                db.execute("UPDATE worker_jobs SET status='completed'")
            backup = root / "backup"
            manifest = stage.snapshot_pair(databases, backup, {})
            before = databases["api"].read_bytes()
            (backup / "worker.db").write_bytes(b"broken")
            with self.assertRaises(ValueError):
                stage.restore_pair(databases, backup, manifest)
            self.assertEqual(databases["api"].read_bytes(), before)

    def test_restore_replaces_both_databases_and_removes_failed_sidecars(self):
        with tempfile.TemporaryDirectory() as name:
            root = Path(name)
            databases = create_pair(root)
            with sqlite3.connect(databases["worker"]) as db:
                db.execute("UPDATE worker_jobs SET status='completed'")
            backup = root / "backup"
            manifest = stage.snapshot_pair(databases, backup, {})
            with sqlite3.connect(databases["worker"]) as db:
                db.execute("UPDATE worker_jobs SET status='failed'")
            sidecar = Path(str(databases["worker"]) + "-wal")
            sidecar.write_bytes(b"failed-image-sidecar")
            with mock.patch.object(stage.os, "chown"):
                stage.restore_pair(databases, backup, manifest)
            with sqlite3.connect(databases["worker"]) as db:
                self.assertEqual(db.execute("SELECT status FROM worker_jobs").fetchone()[0], "completed")
            self.assertTrue(not sidecar.exists() or sidecar.read_bytes() != b"failed-image-sidecar")

    def test_update_rejects_bad_commit_before_commands(self):
        with mock.patch.object(stage.os, "geteuid", return_value=0), \
             mock.patch.object(stage, "current_pin") as pin:
            with self.assertRaisesRegex(RuntimeError, "full lowercase SHA"):
                stage.update("image", "short")
            pin.assert_not_called()

    def test_failed_health_restores_pair_and_old_pin(self):
        old, new = "sha256:" + "1" * 64, "sha256:" + "2" * 64
        manifest = {"files": {"api": "a", "worker": "b"}}
        with tempfile.TemporaryDirectory() as name, \
             mock.patch.object(stage.os, "geteuid", return_value=0), \
             mock.patch.object(stage, "BACKUP_ROOT", Path(name)), \
             mock.patch.object(stage, "current_pin", return_value=old), \
             mock.patch.object(stage, "image_id", side_effect=lambda ref: new if ref == "candidate" else old), \
             mock.patch.object(stage, "database_paths", return_value={"api": Path("api"), "worker": Path("worker")}), \
             mock.patch.object(stage, "ensure_backup_root"), \
             mock.patch.object(stage, "run"), \
             mock.patch.object(stage, "stopped"), \
             mock.patch.object(stage, "snapshot_pair", side_effect=[manifest, {}]) as snapshot, \
             mock.patch.object(stage, "atomic_pin") as pin, \
             mock.patch.object(stage, "restore_pair") as restore, \
             mock.patch.object(stage, "wait_healthy", side_effect=[RuntimeError("new failed"), None]) as health:
            with self.assertRaisesRegex(RuntimeError, "previous image and database pair restored"):
                stage.update("candidate", "a" * 40)
            self.assertEqual(pin.call_args_list, [mock.call(old, new), mock.call(new, old)])
            restore.assert_called_once()
            self.assertFalse(snapshot.call_args_list[1].kwargs["validate"])
            self.assertEqual(health.call_args_list, [mock.call(new), mock.call(old)])


if __name__ == "__main__":
    unittest.main()
