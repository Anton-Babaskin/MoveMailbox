import importlib.util
import io
import json
from pathlib import Path
import unittest
from unittest import mock

spec = importlib.util.spec_from_file_location("mail_stage", Path(__file__).with_name("smoke-private-staging-mail.py"))
stage = importlib.util.module_from_spec(spec)
spec.loader.exec_module(stage)


class MailStageTests(unittest.TestCase):
    def test_refuses_missing_same_and_oversized_accounts(self):
        account = dict(host="imap.example.test", username="test", password="synthetic")
        for value in ({"source": account, "destination": account},
                      {"source": {}, "destination": account}):
            with self.assertRaises(RuntimeError):
                stage.read_accounts(io.StringIO(json.dumps(value)))
        with self.assertRaises(RuntimeError):
            stage.read_accounts(io.StringIO("x" * 65537))

    def test_input_cannot_disable_tls_or_override_port(self):
        account = dict(host="imap.example.test", username="one", password="synthetic", port=143, security="plain")
        source, destination = stage.read_accounts(io.StringIO(json.dumps({
            "source": account, "destination": account | {"username": "two"}})))
        for item in (source, destination):
            self.assertEqual(item["security"], "tls")
            self.assertEqual(item["port"], 993)

    def test_interrupt_refused_if_other_jobs_or_wrong_state(self):
        for active in ([], [("foreign", "running")], [("ours", "queued")],
                       [("ours", "running"), ("foreign", "running")]):
            with mock.patch.object(stage, "rows", return_value=active), self.assertRaises(RuntimeError):
                stage.require_owned_active(Path("unused"), "ours")
        with mock.patch.object(stage, "rows", return_value=[("ours", "running")]):
            stage.require_owned_active(Path("unused"), "ours")

    def test_password_scan_includes_stderr_logs(self):
        result = mock.Mock(returncode=0, stdout=b"normal", stderr=b"synthetic-secret")
        with mock.patch.object(stage.subprocess, "run", return_value=result):
            self.assertIn("synthetic-secret", stage.docker("logs", stage.WORKER_NAME))
            self.assertEqual(stage.docker("inspect", stage.WORKER_NAME), "normal")


if __name__ == "__main__":
    unittest.main()
