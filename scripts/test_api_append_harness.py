"""Offline tests for test-only routing and partial-launch ownership tracking."""
import importlib.util
from pathlib import Path
from types import SimpleNamespace
import unittest
from unittest.mock import patch


def load(name, filename):
    spec = importlib.util.spec_from_file_location(name, Path(__file__).with_name(filename))
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


class HarnessTests(unittest.TestCase):
    def test_growth_fixtures_are_distinct_and_exceed_budget(self):
        growth = load("growth", "smoke-api-growth.py")
        first = growth.fixture("MoveMailbox-Growth-test", 1, 10000)
        second = growth.fixture("MoveMailbox-Growth-test", 2, 10000)
        self.assertNotEqual(first, second)
        for raw in (first, second):
            self.assertGreater(len(raw), 10000)
            self.assertLess(len(raw), 20000)
            self.assertIn(b"\r\n\r\n", raw)

    def test_recovery_gate_forwards_unmodified_bytes(self):
        drill = load("drill", "smoke-api-append-drop.py")
        gate, output = drill.PassGate(), bytearray()
        payload = bytes(range(256)) * 4
        for offset in range(0, len(payload), 7):
            gate.feed(payload[offset:offset + 7], output.extend)
        self.assertEqual(output, payload)
        self.assertFalse(gate.dropped)

    def test_partial_launch_tracks_only_created_worker_and_keeps_api_routing(self):
        pilot = load("pilot", "start-local-pilot.py")
        calls, started = [], []

        def docker(*args, **kwargs):
            calls.append(args)
            if args[:2] == ("run", "--rm"):
                return "MOVEMAILBOX_WORKER_TOKEN=test-token\nMOVEMAILBOX_WORKER_PRIVATE_KEY=test-private\nMOVEMAILBOX_WORKER_PUBLIC_KEY=test-public"
            if args[:2] == ("run", "--detach") and args[3].endswith("-api"):
                raise RuntimeError("simulated API launch failure")
            return ""

        with patch.object(pilot, "docker", side_effect=docker), patch.object(
            pilot.subprocess, "run", return_value=SimpleNamespace(returncode=1)
        ):
            with self.assertRaises(RuntimeError):
                pilot.start("movemailbox-unit", worker_test_args=("--add-host", "mail.example:172.17.0.1"), started_containers=started)
        self.assertEqual(started, ["movemailbox-unit-worker"])
        launches = [args for args in calls if args[:2] == ("run", "--detach")]
        self.assertIn("--add-host", launches[0])
        self.assertNotIn("--add-host", launches[1])

    def test_existing_resource_is_never_claimed_for_cleanup(self):
        pilot = load("pilot", "start-local-pilot.py")
        started = []
        with patch.object(pilot, "docker", return_value=""), patch.object(
            pilot.subprocess, "run", return_value=SimpleNamespace(returncode=0)
        ):
            with self.assertRaises(RuntimeError):
                pilot.start("movemailbox-unit", started_containers=started)
        self.assertEqual(started, [])


if __name__ == "__main__":
    unittest.main()
