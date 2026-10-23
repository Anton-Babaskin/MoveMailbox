import io
import json
import os
from pathlib import Path
import ssl
import stat
import tempfile
from types import SimpleNamespace
import unittest
from unittest import mock

import staging_notify as notify


CONFIG = {'host': 'smtp.example.invalid', 'port': 587, 'security': 'starttls',
          'username': 'operator', 'password': 'SYNTHETIC-SMTP-SECRET',
          'from': 'monitor@example.invalid', 'to': 'owner@example.invalid'}


class NotifyTests(unittest.TestCase):
    def test_configure_uses_hidden_input_atomic_private_no_overwrite(self):
        answers = [CONFIG[key] for key in ('host', 'port', 'security', 'username', 'from', 'to')]
        answers = [str(value) for value in answers]
        with tempfile.TemporaryDirectory() as name, \
             mock.patch.object(notify, 'trusted_directory'), \
             mock.patch.object(notify.sys.stdin, 'isatty', return_value=True), \
             mock.patch.object(notify.sys.stderr, 'isatty', return_value=True), \
             mock.patch('builtins.input', side_effect=answers), \
             mock.patch.object(notify.getpass, 'getpass', return_value=CONFIG['password']) as hidden, \
             mock.patch('sys.stdout', new_callable=io.StringIO) as output:
            path = Path(name) / 'notify.json'
            notify.configure(path)
            self.assertEqual(json.loads(path.read_text()), CONFIG)
            self.assertEqual(os.stat(path).st_mode & 0o777, 0o600)
            self.assertEqual([file.name for file in path.parent.iterdir()], ['notify.json'])
            hidden.assert_called_once()
            with self.assertRaises(ValueError):
                notify.configure(path)
            self.assertNotIn(CONFIG['password'], output.getvalue())
        with mock.patch.object(notify.sys.stdin, 'isatty', return_value=False), self.assertRaises(ValueError):
            notify.configure()

    def test_configuration_requires_tls_and_safe_headers(self):
        self.assertEqual(notify.validate_config(dict(CONFIG)), CONFIG)
        for changes in ({'security': 'plain'}, {'port': True}, {'port': 0},
                        {'host': 'https://smtp.example.invalid'}, {'password': ''},
                        {'username': 'name\nBcc: other'}, {'from': 'Name <mail@example.invalid>'},
                        {'to': 'owner@example.invalid\r\nBcc: other@example.invalid'}, {'extra': 'ignored'}):
            with self.subTest(changes=list(changes)), self.assertRaises(ValueError):
                notify.validate_config(CONFIG | changes)

    def test_messages_exclude_credentials_remote_payloads_and_addresses(self):
        now = 2000000
        report = {'schema': 1, 'checkedAt': now, 'alerts': {'disk.space': 'warning'},
                  'error': 'PRIVATE-MESSAGE', 'username': 'private-mailbox@example.invalid'}
        with mock.patch.object(notify, 'read_private_json', return_value=report):
            alerts = notify.monitor_alerts(now)
        mail = notify.message(CONFIG, notify.events({}, alerts), alerts, now).as_string()
        self.assertIn('disk.space warning', mail)
        self.assertIn(CONFIG['to'], mail)
        for private in ('SYNTHETIC-SMTP-SECRET', 'PRIVATE-MESSAGE', 'private-mailbox', 'smtp.example.invalid'):
            self.assertNotIn(private, mail)

    def test_bad_missing_and_stale_reports_become_fixed_alerts(self):
        now = 2000000
        for checked in (now - 901, now + 61, True, 'time'):
            with mock.patch.object(notify, 'read_private_json', return_value={
                    'schema': 1, 'checkedAt': checked, 'alerts': {}}):
                self.assertEqual(notify.monitor_alerts(now), {'monitor.stale': 'critical'})
        for alerts in ({'PRIVATE-MESSAGE': 'critical'}, {'disk.space': 'private'}, []):
            with mock.patch.object(notify, 'read_private_json', return_value={
                    'schema': 1, 'checkedAt': now, 'alerts': alerts}):
                self.assertEqual(notify.monitor_alerts(now), {'monitor.unavailable': 'critical'})
        with mock.patch.object(notify, 'read_private_json', side_effect=ValueError('PRIVATE')):
            self.assertEqual(notify.monitor_alerts(now), {'monitor.unavailable': 'critical'})

    def test_dispatch_deduplicates_escalation_and_recovery(self):
        def read(path, limit=65536):
            return json.loads(path.read_text())
        with tempfile.TemporaryDirectory() as name, \
             mock.patch.object(notify, 'read_private_json', side_effect=read), \
             mock.patch.object(notify, 'monitor_alerts') as alerts, \
             mock.patch.object(notify, 'send') as send, \
             mock.patch('sys.stdout', new_callable=io.StringIO):
            root = Path(name)
            for value in ({}, {'disk.space': 'warning'}, {'disk.space': 'warning'},
                          {'disk.space': 'critical'}, {}):
                alerts.return_value = value
                notify.dispatch(CONFIG, 2000000, root)
            self.assertEqual(send.call_count, 3)
            mails = [call.args[1].as_string() for call in send.call_args_list]
            self.assertIn('warning', mails[0])
            self.assertIn('critical', mails[1])
            self.assertIn('monitoring recovered', mails[2])
            self.assertEqual(json.loads((root / 'delivered.json').read_text())['alerts'], {})
            self.assertEqual(os.stat(root / 'delivered.json').st_mode & 0o777, 0o600)
            self.assertEqual([path.name for path in root.iterdir()], ['delivered.json'])

    def test_smtp_failure_preserves_delivered_baseline_and_retries(self):
        def read(path, limit=65536):
            return json.loads(path.read_text())
        with tempfile.TemporaryDirectory() as name, \
             mock.patch.object(notify, 'read_private_json', side_effect=read), \
             mock.patch.object(notify, 'monitor_alerts', return_value={'tls.expiry': 'warning'}), \
             mock.patch.object(notify, 'send') as send, \
             mock.patch('sys.stdout', new_callable=io.StringIO):
            root = Path(name)
            notify.save_baseline(root, {}, 1)
            before = (root / 'delivered.json').read_bytes()
            send.side_effect = RuntimeError('PRIVATE SMTP REPLY')
            with self.assertRaises(RuntimeError):
                notify.dispatch(CONFIG, 2000000, root)
            self.assertEqual((root / 'delivered.json').read_bytes(), before)
            send.side_effect = None
            notify.dispatch(CONFIG, 2000001, root)
            self.assertEqual(send.call_count, 2)
            self.assertEqual(json.loads((root / 'delivered.json').read_text())['alerts'], {'tls.expiry': 'warning'})

    def test_corrupt_delivery_state_is_not_silently_reset(self):
        with mock.patch.object(notify, 'read_private_json', return_value={
                'schema': 1, 'alerts': {'PRIVATE': 'warning'}}), \
             mock.patch.object(notify, 'send') as send, mock.patch.object(notify, 'save_baseline') as save:
            with self.assertRaises(ValueError):
                notify.dispatch(CONFIG, 2000000)
            send.assert_not_called()
            save.assert_not_called()

    def test_private_json_rejects_links_permissive_owner_and_oversize(self):
        trusted_parent = SimpleNamespace(st_mode=stat.S_IFDIR | 0o755, st_uid=0)
        with tempfile.TemporaryDirectory() as name, \
             mock.patch.object(Path, 'lstat', return_value=trusted_parent):
            path = Path(name) / 'config.json'
            path.write_text('{}')
            with mock.patch.object(notify.os, 'fstat', return_value=SimpleNamespace(
                    st_mode=stat.S_IFREG | 0o644, st_uid=0)), self.assertRaises(ValueError):
                notify.read_private_json(path)
            with mock.patch.object(notify.os, 'fstat', return_value=SimpleNamespace(
                    st_mode=stat.S_IFREG | 0o600, st_uid=1001)), self.assertRaises(ValueError):
                notify.read_private_json(path)
            with mock.patch.object(notify.os, 'fstat', return_value=SimpleNamespace(
                    st_mode=stat.S_IFREG | 0o600, st_uid=0)), self.assertRaises(ValueError):
                notify.read_private_json(path, limit=1)
            link = Path(name) / 'link.json'
            link.symlink_to(path)
            with self.assertRaises(OSError):
                notify.read_private_json(link)
        with mock.patch.object(Path, 'lstat', return_value=SimpleNamespace(
                st_mode=stat.S_IFDIR | 0o777, st_uid=0)), self.assertRaises(ValueError):
            notify.read_private_json(Path('/tmp/not-a-trusted-path.json'))

    def test_starttls_precedes_auth_and_certificate_verification_is_enabled(self):
        smtp = mock.MagicMock()
        smtp.__enter__.return_value = smtp
        smtp.send_message.return_value = {}
        with mock.patch.object(notify.smtplib, 'SMTP', return_value=smtp) as constructor:
            notify.send(CONFIG, notify.message(CONFIG, [], {}, 2000000, test=True))
        self.assertEqual(constructor.call_args.kwargs['timeout'], 5)
        names = [call[0] for call in smtp.method_calls]
        self.assertLess(names.index('starttls'), names.index('login'))
        context = smtp.starttls.call_args.kwargs['context']
        self.assertTrue(context.check_hostname)
        self.assertEqual(context.verify_mode, ssl.CERT_REQUIRED)
        self.assertEqual(context.minimum_version, ssl.TLSVersion.TLSv1_2)

    def test_no_login_after_starttls_failure(self):
        smtp = mock.MagicMock()
        smtp.__enter__.return_value = smtp
        smtp.starttls.side_effect = ssl.SSLError('PRIVATE TLS FAILURE')
        with mock.patch.object(notify.smtplib, 'SMTP', return_value=smtp), self.assertRaises(ssl.SSLError):
            notify.send(CONFIG, notify.message(CONFIG, [], {}, 2000000))
        smtp.login.assert_not_called()
        smtp.send_message.assert_not_called()

    def test_implicit_tls_and_refused_recipient(self):
        smtp = mock.MagicMock()
        smtp.__enter__.return_value = smtp
        smtp.send_message.return_value = {'owner@example.invalid': (550, b'PRIVATE')}
        with mock.patch.object(notify.smtplib, 'SMTP_SSL', return_value=smtp) as constructor, \
             self.assertRaises(RuntimeError):
            notify.send(CONFIG | {'security': 'tls', 'port': 465}, notify.message(CONFIG, [], {}, 2000000))
        self.assertTrue(constructor.call_args.kwargs['context'].check_hostname)
        smtp.starttls.assert_not_called()

    def test_missing_configuration_is_disabled_but_test_requires_configuration(self):
        with mock.patch.object(notify.os, 'geteuid', return_value=0), \
             mock.patch.object(notify, 'read_private_json', side_effect=FileNotFoundError), \
             mock.patch('sys.stdout', new_callable=io.StringIO) as output:
            self.assertEqual(notify.main([]), 0)
            self.assertEqual(notify.main(['--test']), 1)
            self.assertEqual([json.loads(line)['event'] for line in output.getvalue().splitlines()],
                             ['notify.disabled', 'notify.failed'])

    def test_main_never_logs_smtp_errors_or_secrets(self):
        with mock.patch.object(notify.os, 'geteuid', return_value=0), \
             mock.patch.object(notify, 'read_private_json', side_effect=RuntimeError('SYNTHETIC-SMTP-SECRET')), \
             mock.patch('sys.stdout', new_callable=io.StringIO) as output:
            self.assertEqual(notify.main([]), 1)
            self.assertEqual(output.getvalue().strip(), '{"event":"notify.failed"}')


if __name__ == '__main__':
    unittest.main()
