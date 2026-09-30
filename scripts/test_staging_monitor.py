from contextlib import closing
import io
import json
import os
from pathlib import Path
import sqlite3
import tempfile
import unittest
from unittest import mock

import staging_monitor as monitor


class MonitorTests(unittest.TestCase):
    def test_disk_thresholds(self):
        healthy = {'freeBytes': 3 * 1024**3, 'freePercent': 40, 'freeInodePercent': 90}
        self.assertEqual(monitor.disk_alerts(healthy), {})
        self.assertEqual(monitor.disk_alerts(healthy | {'freeBytes': 1500 * 1024**2}), {'disk.space': 'warning'})
        self.assertEqual(monitor.disk_alerts(healthy | {'freePercent': 4, 'freeInodePercent': 3}),
                         {'disk.space': 'critical', 'disk.inodes': 'critical'})

    def test_certificate_expiry(self):
        now = 2000000
        self.assertEqual(monitor.certificate_alerts(now + 31 * 86400, now), {})
        self.assertEqual(monitor.certificate_alerts(now + 29 * 86400, now), {'tls.expiry': 'warning'})
        for days in (-1, 0, 6):
            self.assertEqual(monitor.certificate_alerts(now + days * 86400, now), {'tls.expiry': 'critical'})

    def test_queue_thresholds_and_credential_leak(self):
        healthy = {'failedLastHour': 0, 'staleRunning': 0, 'oldestQueuedSeconds': 0,
                   'envelopes': 1, 'running': 1}
        self.assertEqual(monitor.queue_alerts(healthy, 'worker'), {})
        alerts = monitor.queue_alerts(healthy | {'envelopes': 2, 'oldestQueuedSeconds': 901,
                                               'staleRunning': 1, 'failedLastHour': 1}, 'worker')
        self.assertEqual(alerts, {'worker.orphan_envelopes': 'critical', 'worker.queue_delay': 'warning',
                                  'worker.no_progress': 'warning', 'worker.recent_failures': 'warning'})
        self.assertIn('worker.queue_delay', monitor.queue_alerts(healthy | {'queued': 8}, 'worker'))

    def test_transitions_dedup_escalation_and_recovery(self):
        old = {'disk.space': 'warning', 'api.ready': 'critical'}
        self.assertEqual(monitor.events(old, old), [])
        self.assertEqual(monitor.events(old, {'disk.space': 'critical'}),
                         [{'event': 'alert', 'check': 'disk.space', 'severity': 'critical'},
                          {'event': 'recovered', 'check': 'api.ready'}])

    def test_database_read_only_wal_aggregate_and_old_failures(self):
        now = 2000000
        with tempfile.TemporaryDirectory() as name:
            root = Path(name)
            api, worker = root / 'api.db', root / 'worker.db'
            with closing(sqlite3.connect(api)) as db, db:
                db.execute('CREATE TABLE job_snapshots(finished_at INTEGER, snapshot_json BLOB)')
                for age in (60, 7200):
                    db.execute('INSERT INTO job_snapshots VALUES (?,?)',
                               ((now - age) * 1000, json.dumps({'view': {'status': 'failed',
                                'password': 'SYNTHETIC-SECRET', 'error': 'private-address@example.invalid'}}).encode()))
            with closing(sqlite3.connect(worker)) as writer, writer:
                writer.execute('PRAGMA journal_mode=WAL')
                writer.execute('PRAGMA wal_autocheckpoint=0')
                writer.execute('CREATE TABLE worker_jobs(status TEXT, created_at INTEGER, updated_at INTEGER)')
                writer.execute('CREATE TABLE credential_envelopes(envelope BLOB)')
                writer.execute('INSERT INTO worker_jobs VALUES (?,?,?)', ('running', (now - 1000) * 1000, (now - 950) * 1000))
                writer.execute('INSERT INTO worker_jobs VALUES (?,?,?)', ('queued', (now - 920) * 1000, now * 1000))
                writer.execute("INSERT INTO credential_envelopes VALUES ('SYNTHETIC-SECRET')")
                writer.commit()
                # Keep WAL open: a main-file-only reader would miss committed data.
                before = worker.read_bytes()
                value = monitor.database_stats(worker, 'worker', now)
                self.assertEqual(value, {'running': 1, 'queued': 1, 'failedLastHour': 0,
                                         'staleRunning': 1, 'oldestQueuedSeconds': 920, 'envelopes': 1})
                self.assertEqual(worker.read_bytes(), before)
                self.assertEqual(writer.execute('SELECT count(*) FROM worker_jobs').fetchone()[0], 2)
            value = monitor.database_stats(api, 'api', now)
            self.assertEqual(value, {'failed': 2, 'failedLastHour': 1})
            self.assertNotIn('SYNTHETIC-SECRET', json.dumps(value))
            self.assertNotIn('private-address', json.dumps(value))

    def test_missing_corrupt_and_unknown_queue_refused(self):
        with tempfile.TemporaryDirectory() as name:
            path = Path(name) / 'bad.db'
            with self.assertRaises(ValueError):
                monitor.database_stats(path, 'worker', 0)
            path.write_bytes(b'not sqlite')
            with self.assertRaises(sqlite3.DatabaseError):
                monitor.database_stats(path, 'worker', 0)
        with self.assertRaises(ValueError):
            monitor.counts([('SYNTHETIC-SECRET', 1)])

    def test_failures_independent_and_redacted(self):
        with mock.patch.object(monitor, 'command', side_effect=RuntimeError('SYNTHETIC-SECRET')), \
             mock.patch.object(monitor, 'disk_stats', return_value={'freeBytes': 1, 'freePercent': 1, 'freeInodePercent': 90}), \
             mock.patch.object(monitor, 'api_ready', side_effect=RuntimeError('PRIVATE')), \
             mock.patch.object(monitor, 'local_certificate', side_effect=ValueError('PRIVATE')), \
             mock.patch.object(monitor, 'served_certificate', side_effect=ssl_error()):
            report = monitor.collect(2000000)
        self.assertEqual(report['alerts']['disk.space'], 'critical')
        for name in ('worker.container.unavailable', 'api.ready.unavailable', 'worker.queue.unavailable',
                     'tls.certificate_unavailable', 'tls.served.unavailable'):
            self.assertEqual(report['alerts'][name], 'critical')
        self.assertNotIn('SYNTHETIC-SECRET', json.dumps(report))
        self.assertNotIn('PRIVATE', json.dumps(report))

    def test_certificate_mismatch_and_recent_failures(self):
        def command(*args):
            return b'running\n' if args[-1] == monitor.CONTAINERS['proxy'] else b'running healthy\n'
        with mock.patch.object(monitor, 'command', side_effect=command), \
             mock.patch.object(monitor, 'disk_stats', return_value={'freeBytes': 3 * 1024**3, 'freePercent': 50, 'freeInodePercent': 99}), \
             mock.patch.object(monitor, 'api_ready', return_value=True), \
             mock.patch.object(monitor, 'local_certificate', return_value=(2000000 + 74 * 86400, 'new')), \
             mock.patch.object(monitor, 'served_certificate', return_value='old'):
            report = monitor.collect(2000000)
        self.assertEqual(report['tlsDaysRemaining'], 74)
        self.assertEqual(report['alerts']['tls.certificate_mismatch'], 'warning')
        self.assertNotIn('proxy.container', report['alerts'])

    def test_publish_private_atomic_baseline_and_redacted_logs(self):
        with tempfile.TemporaryDirectory() as name, \
             mock.patch.object(monitor, 'private_directory'), mock.patch.object(monitor, 'private_file'):
            root = Path(name)
            report = {'schema': 1, 'checkedAt': 1, 'alerts': {'disk.space': 'warning'}}
            with mock.patch('sys.stdout', new_callable=io.StringIO) as output:
                monitor.publish(report, root)
                monitor.publish(report, root)
                monitor.publish(report | {'alerts': {}}, root)
                entries = [json.loads(line) for line in output.getvalue().splitlines()]
            self.assertEqual([item['event'] for item in entries], ['alert', 'summary', 'summary', 'recovered', 'summary'])
            self.assertEqual(os.stat(root / 'latest.json').st_mode & 0o777, 0o600)
            self.assertEqual(list(root.iterdir()), [root / 'latest.json'])

    def test_corrupt_and_injected_state_does_not_reset_baseline(self):
        with tempfile.TemporaryDirectory() as name, \
             mock.patch.object(monitor, 'private_directory'), mock.patch.object(monitor, 'private_file'):
            root = Path(name)
            path = root / 'latest.json'
            for payload in ('not json', json.dumps({'schema': 1, 'alerts': {'SYNTHETIC-SECRET': 'warning'}})):
                path.write_text(payload)
                with self.assertRaises(ValueError):
                    monitor.publish({'schema': 1, 'checkedAt': 1, 'alerts': {}}, root)
                self.assertEqual(path.read_text(), payload)

    def test_private_files_reject_links_and_permissive_mode(self):
        with tempfile.TemporaryDirectory() as name:
            path = Path(name) / 'state'
            path.write_text('{}')
            os.chmod(path, 0o644)
            with self.assertRaises(ValueError):
                monitor.private_file(path)
            link = Path(name) / 'link'
            link.symlink_to(path)
            with self.assertRaises(ValueError):
                monitor.private_file(link)

    def test_main_error_output_is_generic(self):
        with mock.patch.object(monitor, 'private_directory', side_effect=RuntimeError('SYNTHETIC-SECRET')), \
             mock.patch.object(monitor.os, 'geteuid', return_value=0), \
             mock.patch('sys.stdout', new_callable=io.StringIO) as output:
            self.assertEqual(monitor.main(), 2)
            self.assertNotIn('SYNTHETIC-SECRET', output.getvalue())
            self.assertEqual(json.loads(output.getvalue())['check'], 'monitor.internal')


def ssl_error():
    return OSError('PRIVATE TLS FAILURE')
