import importlib.util
from pathlib import Path
import tempfile
import unittest
from unittest import mock

spec = importlib.util.spec_from_file_location("stage", Path(__file__).with_name("install-private-staging.py"))
stage = importlib.util.module_from_spec(spec)
spec.loader.exec_module(stage)


class StagingTests(unittest.TestCase):
    def test_invalid_nat_address(self):
        for address in ("127.0.0.1", "10.0.0.1", "169.254.169.254", "::1", "2001:4860:4860::8888", "1.1.1.1; flush ruleset"):
            with self.subTest(address=address), self.assertRaises(ValueError):
                stage.firewall(address)

    def test_firewall_scope_and_order(self):
        rules = stage.firewall("8.8.8.8")
        self.assertNotIn("flush ruleset", rules)
        self.assertEqual(rules.count("flush table"), 1)
        self.assertIn("flush table inet movemailbox_staging", rules)
        self.assertIn('iifname != "br-movemailbox" return', rules)
        self.assertLess(rules.index("ip daddr @blocked4"), rules.index("tcp dport { 143, 993 }"))
        self.assertLess(rules.index("tcp dport 8090"), rules.index("ip daddr @blocked4"))
        self.assertIn("meta nfproto ipv6 counter reject", rules)
        self.assertIn("169.254.0.0/16", rules)
        self.assertIn("8.8.8.8", rules)

    def test_refuse_symlink_parent(self):
        path = mock.Mock()
        path.parents = []
        path.parent.is_symlink.return_value = True
        with self.assertRaisesRegex(RuntimeError, "linked"):
            stage.safe_parent(path)

    def test_refuse_writable_parent(self):
        path = mock.Mock()
        path.parents = []
        path.parent.is_symlink.return_value = False
        path.parent.exists.return_value = True
        path.parent.stat.return_value = mock.Mock(st_uid=0, st_mode=0o40777)
        with self.assertRaisesRegex(RuntimeError, "root-controlled"):
            stage.safe_parent(path)

    def test_existing_different_config_is_not_overwritten(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "config"
            path.write_text("original")
            with mock.patch.object(stage, "safe_parent"), self.assertRaises(RuntimeError):
                stage.write_owned(path, "replacement", 0o600)
            self.assertEqual(path.read_text(), "original")

    def test_worker_healthcheck_uses_get(self):
        compose = Path(__file__).resolve().parents[1].joinpath("compose.yaml").read_text()
        worker = compose.split("  movemailbox-worker:", 1)[1]
        self.assertNotIn('"--spider"', worker)
        self.assertIn('"-O", "/dev/null", "http://127.0.0.1:8090/healthz"', worker)


if __name__ == "__main__":
    unittest.main()
