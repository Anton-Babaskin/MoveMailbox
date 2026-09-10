"""Offline tests for the opt-in native-copy finalization gate; no Docker/mail."""
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import time
import unittest


@unittest.skipUnless(shutil.which("sh"), "POSIX shell required")
class StorageGateTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory(prefix="movemailbox-gate-test-")
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name)
        native = self.root / "imapsync"
        native.write_text('#!/bin/sh\nprintf "%s\\n" "$@" > "' + str(self.root / "args") + '"\n'
                          'printf "%s" "$GATE_TEST_VALUE" > "' + str(self.root / "environment") + '"\n'
                          'exit "${GATE_TEST_EXIT:-0}"\n')
        native.chmod(0o755)
        template = Path(__file__).with_name("test-storage-finalize-gate.sh").read_text()
        # Replace original /tmp first, not /tmp embedded in newly inserted paths.
        self.script = template.replace("/tmp/", str(self.root) + "/").replace("/worker-data/", str(self.root) + "/").replace("/usr/bin/imapsync", str(native))
        self.environment = {**os.environ, "GATE_TEST_VALUE": "synthetic-value"}

    def run_gate(self, script=None, **environment):
        return subprocess.run(["sh", "-c", script or self.script, "gate", "--folder", "folder with spaces"],
                              env={**self.environment, **environment}, capture_output=True, timeout=5)

    def test_native_failure_preserves_exit_and_does_not_open_gate(self):
        result = self.run_gate(GATE_TEST_EXIT="118")
        self.assertEqual(result.returncode, 118)
        self.assertFalse((self.root / "storage-copy-ready").exists())
        self.assertFalse((self.root / "test-storage-gated").exists())

    def test_success_waits_for_release_and_restart_does_not_gate_again(self):
        process = subprocess.Popen(["sh", "-c", self.script, "gate", "--folder", "folder with spaces"],
                                   env=self.environment, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        try:
            deadline = time.monotonic() + 3
            while not (self.root / "storage-copy-ready").exists():
                if time.monotonic() > deadline:
                    self.fail("gate never became ready")
                time.sleep(0.01)
            self.assertIsNone(process.poll())
            self.assertEqual((self.root / "args").read_text(), "--folder\nfolder with spaces\n")
            self.assertEqual((self.root / "environment").read_text(), "synthetic-value")
            (self.root / "storage-copy-release").touch()
            process.communicate(timeout=5)
            self.assertEqual(process.returncode, 0)
        finally:
            if process.poll() is None:
                process.kill()
            process.communicate(timeout=5)
        # Model loss of /tmp on restart while /worker-data remains mounted.
        (self.root / "storage-copy-ready").unlink()
        (self.root / "storage-copy-release").unlink()
        self.assertEqual(self.run_gate().returncode, 0)
        self.assertFalse((self.root / "storage-copy-ready").exists())

    def test_gate_timeout_is_bounded(self):
        self.assertEqual(self.run_gate(self.script.replace('-ge 120', '-ge 1')).returncode, 124)


class StorageCLIConstraints(unittest.TestCase):
    def test_unsafe_live_combinations_rejected_before_docker(self):
        import sys
        script = str(Path(__file__).with_name("smoke-worker-enospc.py"))
        base = [sys.executable, script, "--image", "unused"]
        valid_folder = ["--folder", "MoveMailbox-Attachment-offline"]
        cases = [
            ["--real-imap", "--active", *valid_folder],  # no authorization
            ["--real-imap", "--allow-test-mail", *valid_folder],  # no active fault
            ["--real-imap", "--active", "--allow-test-mail", "--folder", "INBOX"],
            ["--real-imap", "--active", "--allow-test-mail", *valid_folder, "--crash", "--strict-mirror"],
            ["--allow-test-mail", *valid_folder],  # missing explicit live mode
        ]
        for options in cases:
            with self.subTest(options=options):
                result = subprocess.run(base + options, capture_output=True, timeout=5)
                self.assertEqual(result.returncode, 2)
                self.assertIn(b"error:", result.stderr)


if __name__ == "__main__":
    unittest.main()
