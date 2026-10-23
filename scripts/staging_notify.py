#!/usr/bin/env python3
"""Deliver bounded, redacted monitor transitions through owner-configured SMTP."""
import argparse
from datetime import datetime, timezone
from email.headerregistry import Address
from email.message import EmailMessage
import fcntl
import getpass
import json
import os
from pathlib import Path
import re
import smtplib
import ssl
import stat
import sys
import tempfile
import time

from staging_monitor import events, private_directory

CONFIG = Path('/etc/movemailbox/notify.json')
STATE = Path('/var/lib/movemailbox-notify')
REPORT = Path('/var/lib/movemailbox-monitor/latest.json')
CHECKS = {
    'disk.unavailable', 'disk.space', 'disk.inodes',
    'api.container', 'api.container.unavailable',
    'worker.container', 'worker.container.unavailable',
    'proxy.container', 'proxy.container.unavailable',
    'api.ready', 'api.ready.unavailable', 'api.queue.unavailable',
    'worker.queue.unavailable', 'api.recent_failures', 'worker.recent_failures',
    'worker.queue_delay', 'worker.no_progress', 'worker.orphan_envelopes',
    'tls.expiry', 'tls.certificate_unavailable', 'tls.served.unavailable',
    'tls.certificate_mismatch', 'monitor.stale', 'monitor.unavailable',
}


def trusted_directory(path):
    for parent in (path, *path.parents):
        info = parent.lstat()
        if not stat.S_ISDIR(info.st_mode) or info.st_uid != 0 or info.st_mode & 0o022:
            raise ValueError('unsafe parent')


def read_private_json(path, limit=65536):
    # Trusted parents plus O_NOFOLLOW/fstat avoid following substituted files.
    trusted_directory(path.parent)
    fd = os.open(path, os.O_RDONLY | os.O_NOFOLLOW)
    with os.fdopen(fd, 'rb') as stream:
        info = os.fstat(stream.fileno())
        if not stat.S_ISREG(info.st_mode) or info.st_uid != 0 or stat.S_IMODE(info.st_mode) != 0o600:
            raise ValueError('unsafe private file')
        value = stream.read(limit + 1)
        if len(value) > limit:
            raise ValueError('oversized private file')
    return json.loads(value)


def mailbox(value):
    if not isinstance(value, str) or len(value) > 254 or not value.isascii() or any(c.isspace() for c in value):
        raise ValueError('invalid mailbox')
    parsed = Address(addr_spec=value)
    if not parsed.username or not parsed.domain or parsed.addr_spec != value:
        raise ValueError('invalid mailbox')
    return value


def validate_config(value):
    expected = {'host', 'port', 'security', 'username', 'password', 'from', 'to'}
    if not isinstance(value, dict) or set(value) != expected:
        raise ValueError('invalid SMTP configuration')
    host = value['host']
    if not isinstance(host, str) or not re.fullmatch(r'[A-Za-z0-9](?:[A-Za-z0-9.-]{0,251}[A-Za-z0-9])?', host):
        raise ValueError('invalid SMTP host')
    if type(value['port']) is not int or not 1 <= value['port'] <= 65535:
        raise ValueError('invalid SMTP port')
    if value['security'] not in ('tls', 'starttls'):
        raise ValueError('encrypted SMTP required')
    for key in ('username', 'password'):
        if not isinstance(value[key], str) or not 1 <= len(value[key]) <= 4096 or '\r' in value[key] or '\n' in value[key]:
            raise ValueError('invalid SMTP authentication')
    mailbox(value['from'])
    mailbox(value['to'])
    return value


def valid_alerts(value):
    if not isinstance(value, dict) or any(key not in CHECKS or level not in ('warning', 'critical')
                                         for key, level in value.items()):
        raise ValueError('invalid alert state')
    return value


def monitor_alerts(now, report_path=REPORT):
    try:
        value = read_private_json(report_path)
        if not isinstance(value, dict) or value.get('schema') != 1:
            raise ValueError('invalid report')
        checked = value.get('checkedAt')
        if type(checked) is not int or checked > now + 60 or now - checked > 900:
            return {'monitor.stale': 'critical'}
        return valid_alerts(value.get('alerts'))
    except Exception:
        return {'monitor.unavailable': 'critical'}


def message(config, changes, active, now, test=False):
    mail = EmailMessage()
    mail['From'], mail['To'] = config['from'], config['to']
    mail['Subject'] = '[MoveMailbox] SMTP delivery test' if test else (
        '[MoveMailbox] monitoring alert' if active else '[MoveMailbox] monitoring recovered')
    stamp = datetime.fromtimestamp(now, timezone.utc).isoformat()
    lines = ['MoveMailbox operator monitoring', stamp,
             'Synthetic delivery test; no production incident.' if test else
             'Only fixed check identifiers and severity are included.']
    for item in changes:
        lines.append(' '.join((item['event'], item['check'], item.get('severity', ''))).strip())
    lines.append('Active checks: ' + str(len(active)))
    mail.set_content('\n'.join(lines) + '\n')
    return mail


def send(config, mail):
    context = ssl.create_default_context()
    context.minimum_version = ssl.TLSVersion.TLSv1_2
    options = {'host': config['host'], 'port': config['port'], 'timeout': 5,
               'local_hostname': 'movemailbox.invalid'}
    if config['security'] == 'tls':
        connection = smtplib.SMTP_SSL(**options, context=context)
    else:
        connection = smtplib.SMTP(**options)
    with connection as smtp:
        smtp.ehlo()
        if config['security'] == 'starttls':
            smtp.starttls(context=context)  # Missing STARTTLS or untrusted TLS fails closed.
            smtp.ehlo()
        smtp.login(config['username'], config['password'])
        refused = smtp.send_message(mail, from_addr=config['from'], to_addrs=[config['to']])
        if refused:
            raise RuntimeError('SMTP recipient refused')


def save_baseline(root, alerts, now):
    fd, name = tempfile.mkstemp(prefix='.delivered-', dir=root)
    temporary = Path(name)
    try:
        with os.fdopen(fd, 'w') as stream:
            json.dump({'schema': 1, 'alerts': alerts, 'deliveredAt': int(now)}, stream, sort_keys=True)
            stream.write('\n')
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(temporary, root / 'delivered.json')
        directory = os.open(root, os.O_RDONLY | os.O_DIRECTORY)
        try:
            os.fsync(directory)
        finally:
            os.close(directory)
    finally:
        temporary.unlink(missing_ok=True)


def dispatch(config, now, root=STATE, report_path=REPORT):
    path = root / 'delivered.json'
    try:
        previous = read_private_json(path, 8192)
        if not isinstance(previous, dict) or previous.get('schema') != 1:
            raise ValueError('invalid delivery state')
        previous = valid_alerts(previous.get('alerts'))
    except FileNotFoundError:
        previous = {}
    active = monitor_alerts(now, report_path)
    changes = events(previous, active)
    if changes:
        send(config, message(config, changes, active, now))
    # Persist only after SMTP acceptance. Delivery failure must remain retryable.
    save_baseline(root, active, now)
    print(json.dumps({'event': 'notify.delivered' if changes else 'notify.unchanged',
                      'changes': len(changes)}), flush=True)


def configure(path=CONFIG):
    if not sys.stdin.isatty() or not sys.stderr.isatty():
        raise ValueError('interactive terminal required for hidden password input')
    trusted_directory(path.parent)
    if path.exists() or path.is_symlink():
        raise ValueError('refusing to overwrite existing SMTP credentials')
    value = {'host': input('SMTP host: ').strip(),
             'port': int(input('SMTP port (465 or 587): ').strip()),
             'security': input('Security (tls or starttls): ').strip(),
             'username': input('SMTP username: ').strip(),
             'from': input('From email address: ').strip(),
             'to': input('Operator recipient email address: ').strip()}
    value['password'] = getpass.getpass('SMTP password (hidden): ')
    validate_config(value)
    fd, name = tempfile.mkstemp(prefix='.notify-', dir=path.parent)
    temporary = Path(name)
    try:
        with os.fdopen(fd, 'w') as stream:
            json.dump(value, stream)
            stream.write('\n')
            stream.flush()
            os.fsync(stream.fileno())
        # Atomic no-overwrite publication; neither service nor competing operator
        # can observe a partial configuration or have existing secrets replaced.
        os.link(temporary, path, follow_symlinks=False)
        directory = os.open(path.parent, os.O_RDONLY | os.O_DIRECTORY)
        try:
            os.fsync(directory)
        finally:
            os.close(directory)
    finally:
        temporary.unlink(missing_ok=True)
    print('{"event":"notify.configured"}', flush=True)


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument('--test', action='store_true', help='send one synthetic email, without changing delivery state')
    mode.add_argument('--configure', action='store_true', help='create private SMTP config with hidden password input')
    args = parser.parse_args(argv)
    try:
        if os.geteuid() != 0:
            raise ValueError('root required')
        if args.configure:
            configure()
            return 0
        try:
            config = validate_config(read_private_json(CONFIG, 16384))
        except FileNotFoundError:
            if args.test:
                raise ValueError('SMTP not configured')
            print('{"event":"notify.disabled"}', flush=True)
            return 0
        private_directory(STATE)
        fd = os.open(STATE / 'lock', os.O_RDWR | os.O_CREAT | os.O_NOFOLLOW, 0o600)
        with os.fdopen(fd, 'w') as lock:
            info = os.fstat(lock.fileno())
            if not stat.S_ISREG(info.st_mode) or info.st_uid != 0 or stat.S_IMODE(info.st_mode) != 0o600:
                raise ValueError('unsafe lock')
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
            if args.test:
                send(config, message(config, [], {}, time.time(), test=True))
                print('{"event":"notify.test_accepted"}', flush=True)
            else:
                dispatch(config, time.time())
        return 0
    except Exception:
        # SMTP replies may contain passwords, addresses and remote content.
        print('{"event":"notify.failed"}', flush=True)
        return 1


if __name__ == '__main__':
    sys.exit(main())
