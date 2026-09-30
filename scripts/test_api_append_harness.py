"""Offline tests for test-only routing and partial-launch ownership tracking."""
import importlib.util
import ipaddress
import json
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
    def test_docker_error_operation_has_no_arguments_or_output(self):
        pilot = load("pilot_network", "start-local-pilot.py")
        result = SimpleNamespace(returncode=1, stdout=b'SYNTHETIC-SECRET', stderr=b'SYNTHETIC-SECRET')
        with patch.object(pilot.subprocess, 'run', return_value=result):
            with self.assertRaises(pilot.DockerOperationError) as caught:
                pilot.docker('run', '--env', 'SYNTHETIC-SECRET')
        self.assertEqual(caught.exception.operation, 'run')
        self.assertNotIn('SYNTHETIC-SECRET', str(caught.exception))

    def test_retained_network_collision_chooses_unused_subnet(self):
        pilot = load("pilot_network", "start-local-pilot.py")
        with patch.object(pilot, 'docker', return_value='') as docker:
            pilot.create_lab_network('movemailbox-unit-network')
            first = docker.call_args.args[3]
        def inventory(*args):
            if args[:2] == ('network', 'ls'):
                return 'abcdef123456'
            if args[:2] == ('network', 'inspect'):
                return json.dumps([{'Subnet': first}, {'Subnet': '2001:db8::/32'}])
            return ''
        with patch.object(pilot, 'docker', side_effect=inventory) as docker:
            pilot.create_lab_network('movemailbox-unit-network')
            second = docker.call_args.args[3]
            self.assertFalse(ipaddress.ip_network(first).overlaps(ipaddress.ip_network(second)))
            self.assertFalse(any(call.args[:2] == ('network', 'rm') for call in docker.call_args_list))

    def test_broad_network_blocks_lab_allocation_without_cleanup(self):
        pilot = load("pilot_network", "start-local-pilot.py")
        with patch.object(pilot, 'docker', side_effect=['abcdef123456', '[{"Subnet":"10.0.0.0/8"}]']) as docker:
            with self.assertRaisesRegex(RuntimeError, 'no unused lab subnet'):
                pilot.create_lab_network('movemailbox-unit-network')
            self.assertEqual(docker.call_count, 2)

    def test_incomplete_network_inventory_fails_closed(self):
        pilot = load("pilot_network", "start-local-pilot.py")
        with patch.object(pilot, 'docker', side_effect=['abcdef123456 fedcba654321', '[{"Subnet":"10.0.0.0/8"}]']) as docker:
            with self.assertRaisesRegex(RuntimeError, 'incomplete'):
                pilot.create_lab_network('movemailbox-unit-network')
            self.assertEqual(docker.call_count, 2)

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
        calls, started, environments = [], [], []

        def docker(*args, **kwargs):
            calls.append(args)
            if args[:2] == ("run", "--detach"):
                environments.append(kwargs["env"])
            if args[:2] == ("run", "--rm"):
                return "MOVEMAILBOX_WORKER_TOKEN=test-token\nMOVEMAILBOX_WORKER_PRIVATE_KEY=test-private\nMOVEMAILBOX_WORKER_PUBLIC_KEY=test-public"
            if args[:2] == ("run", "--detach") and args[3].endswith("-api"):
                raise RuntimeError("simulated API launch failure")
            return ""

        with patch.object(pilot, "docker", side_effect=docker), patch.object(
            pilot.subprocess, "run", return_value=SimpleNamespace(returncode=1)
        ):
            with self.assertRaises(RuntimeError):
                pilot.start("movemailbox-unit", worker_test_args=("--add-host", "mail.example:172.17.0.1"), started_containers=started, worker_test_database="/fault/worker.db", resume_interrupted=False)
        self.assertEqual(started, ["movemailbox-unit-worker"])
        launches = [args for args in calls if args[:2] == ("run", "--detach")]
        self.assertIn("--add-host", launches[0])
        self.assertNotIn("--add-host", launches[1])
        self.assertEqual(environments[0]["MOVEMAILBOX_WORKER_DATABASE"], "/fault/worker.db")
        self.assertEqual(environments[0]["MOVEMAILBOX_WORKER_RECOVER_INTERRUPTED"], "false")
        self.assertNotIn("MOVEMAILBOX_WORKER_DATABASE", environments[1])

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
