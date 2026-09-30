#!/usr/bin/env python3
"""Private, read-only staging diagnostics. No secrets, mail or job IDs in reports."""
from contextlib import closing
import fcntl
import hashlib
import json
import os
from pathlib import Path
import socket
import sqlite3
import ssl
import stat
import subprocess
import sys
import tempfile
import time
import urllib.request


STATE = Path('/var/lib/movemailbox-monitor')
CERT = Path('/etc/movemailbox/pilot-certs/fullchain.pem')
HOST = 'staging.movemailbox.com'
CONTAINERS = {'api': 'movemailbox-staging-movemailbox-1',
              'worker': 'movemailbox-staging-movemailbox-worker-1',
              'proxy': 'movemailbox-pilot-proxy'}
VOLUMES = {'api': ('movemailbox-staging_movemailbox-data', 'movemailbox.db'),
           'worker': ('movemailbox-staging_movemailbox-worker-data', 'worker.db')}
TERMINAL = {'completed', 'failed', 'cancelled'}


def command(*args):
    return subprocess.run(args, check=True, capture_output=True, timeout=5).stdout


def disk_stats(path):
    value = os.statvfs(path)
    return {'freeBytes': value.f_bavail * value.f_frsize,
            'freePercent': round(100 * value.f_bavail / max(1, value.f_blocks), 2),
            'freeInodePercent': round(100 * value.f_favail / max(1, value.f_files), 2)}


def disk_alerts(value):
    alerts = {}
    if value['freeBytes'] < 2 * 1024**3 or value['freePercent'] < 10:
        alerts['disk.space'] = 'warning'
    if value['freeBytes'] < 1024**3 or value['freePercent'] < 5:
        alerts['disk.space'] = 'critical'
    if value['freeInodePercent'] < 10:
        alerts['disk.inodes'] = 'warning'
    if value['freeInodePercent'] < 5:
        alerts['disk.inodes'] = 'critical'
    return alerts


def database_stats(path, role, now):
    # Do not fetch snapshots, addresses, error messages, events or ciphertext.
    if path.is_symlink() or not path.is_file():
        raise ValueError('database unavailable')
    with closing(sqlite3.connect(path.resolve().as_uri() + '?mode=ro',
                                uri=True, timeout=1)) as db:
        db.execute('PRAGMA query_only=ON')
        deadline = time.monotonic() + 2
        db.set_progress_handler(lambda: int(time.monotonic() > deadline), 1000)
        db.execute('BEGIN')  # Consistent per-store snapshot including committed WAL.
        if role == 'api':
            rows = db.execute("SELECT json_extract(CAST(snapshot_json AS TEXT), '$.view.status'), "
                              "count(*) FROM job_snapshots GROUP BY 1").fetchall()
            failed = db.execute("SELECT count(*) FROM job_snapshots WHERE finished_at >= ? "
                                "AND json_extract(CAST(snapshot_json AS TEXT), '$.view.status') = 'failed'",
                                ((now - 3600) * 1000,)).fetchone()[0]
            return counts(rows) | {'failedLastHour': failed}
        rows = db.execute('SELECT status, count(*) FROM worker_jobs GROUP BY status').fetchall()
        oldest = db.execute("SELECT min(created_at) FROM worker_jobs WHERE status IN ('queued','accepting')").fetchone()[0]
        stale = db.execute("SELECT count(*) FROM worker_jobs WHERE status='running' AND updated_at < ?",
                           ((now - 900) * 1000,)).fetchone()[0]
        failed = db.execute("SELECT count(*) FROM worker_jobs WHERE status='failed' AND updated_at >= ?",
                            ((now - 3600) * 1000,)).fetchone()[0]
        envelopes = db.execute('SELECT count(*) FROM credential_envelopes').fetchone()[0]
        return counts(rows) | {'failedLastHour': failed, 'staleRunning': stale,
                               'oldestQueuedSeconds': max(0, int(now - oldest / 1000)) if oldest else 0,
                               'envelopes': envelopes}


def counts(rows):
    allowed = TERMINAL | {'queued', 'accepting', 'running'}
    if any(status not in allowed for status, _ in rows):
        raise ValueError('unknown queue state')
    return {status: int(count) for status, count in rows}


def queue_alerts(value, role):
    alerts = {}
    if value['failedLastHour']:
        alerts[role + '.recent_failures'] = 'warning'
    if role == 'worker':
        if value.get('queued', 0) + value.get('accepting', 0) >= 8 or value['oldestQueuedSeconds'] > 900:
            alerts['worker.queue_delay'] = 'warning'
        if value['staleRunning']:
            alerts['worker.no_progress'] = 'warning'
        active = sum(value.get(status, 0) for status in ('queued', 'accepting', 'running'))
        if value['envelopes'] > active:
            alerts['worker.orphan_envelopes'] = 'critical'
    return alerts


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *args, **kwargs):
        return None


def api_ready():
    opener = urllib.request.build_opener(urllib.request.ProxyHandler({}), NoRedirect())
    request = urllib.request.Request('http://127.0.0.1:8080/api/ready',
                                     headers={'Host': HOST + ':18443'})
    with opener.open(request, timeout=5) as response:
        return response.status == 200 and json.loads(response.read(4096)).get('ready') is True


def local_certificate():
    if CERT.is_symlink() or not CERT.is_file():
        raise ValueError('certificate unavailable')
    date = command('openssl', 'x509', '-in', str(CERT), '-noout', '-enddate').decode().strip()
    expires = ssl.cert_time_to_seconds(date.removeprefix('notAfter='))
    der = command('openssl', 'x509', '-in', str(CERT), '-outform', 'DER')
    return expires, hashlib.sha256(der).hexdigest()


def served_certificate():
    # Loopback checks the actual proxy TLS handshake, trust chain and host name.
    # No invitation password is needed to complete TLS. No external requests.
    with socket.create_connection(('127.0.0.1', 443), timeout=5) as connection:
        with ssl.create_default_context().wrap_socket(connection, server_hostname=HOST) as secure:
            return hashlib.sha256(secure.getpeercert(binary_form=True)).hexdigest()


def certificate_alerts(expires, now):
    days = (expires - now) / 86400
    return {'tls.expiry': 'critical' if days < 7 else 'warning'} if days < 30 else {}


def collect(now):
    report, alerts = {'checkedAt': int(now), 'schema': 1}, {}
    # Each probe fails independently; one missing container must not hide disk/TLS alerts.
    def probe(name, call, evaluate):
        try:
            result = call()
            report[name] = result
            alerts.update(evaluate(result))
        except Exception:
            # Exception strings can contain paths, remote data or secrets. Never print them.
            alerts[name + '.unavailable'] = 'critical'

    probe('disk', lambda: disk_stats('/'), disk_alerts)
    for role, container in CONTAINERS.items():
        def health(container=container):
            value = command('docker', 'inspect', '--format={{.State.Status}} {{if .State.Health}}{{.State.Health.Status}}{{end}}', container)
            status = value.decode().strip()
            return status == 'running healthy' or (container == CONTAINERS['proxy'] and status == 'running')
        probe(role + '.container', health,
              lambda ok, role=role: {} if ok else {role + '.container': 'critical'})
    # API readiness includes authenticated worker readiness and persistence health.
    probe('api.ready', api_ready, lambda ok: {} if ok else {'api.ready': 'critical'})
    for role, (volume, filename) in VOLUMES.items():
        def store(role=role, volume=volume, filename=filename):
            mount = Path(command('docker', 'volume', 'inspect', volume,
                                 '--format={{.Mountpoint}}').decode().strip())
            if not mount.is_absolute() or mount.is_symlink() or not mount.is_dir():
                raise ValueError('volume unavailable')
            return database_stats(mount / filename, role, now)
        probe(role + '.queue', store, lambda value, role=role: queue_alerts(value, role))
    try:
        expires, fingerprint = local_certificate()
        report['tlsDaysRemaining'] = round((expires - now) / 86400, 2)
        alerts.update(certificate_alerts(expires, now))
    except Exception:
        fingerprint = None
        alerts['tls.certificate_unavailable'] = 'critical'
    probe('tls.served', lambda: served_certificate() == fingerprint,
          lambda matches: {} if matches else {'tls.certificate_mismatch': 'warning'})
    report['alerts'] = alerts
    return report


def events(previous, current):
    # Only transitions, not five-minute repeats of the same incident.
    output = []
    for name, severity in sorted(current.items()):
        if previous.get(name) != severity:
            output.append({'event': 'alert', 'check': name, 'severity': severity})
    for name in sorted(previous.keys() - current.keys()):
        output.append({'event': 'recovered', 'check': name})
    return output


def private_directory(path):
    for parent in (path, *path.parents):
        info = parent.lstat()
        if not stat.S_ISDIR(info.st_mode) or info.st_uid != 0 or info.st_mode & 0o022:
            raise ValueError('unsafe monitor state directory')
    if stat.S_IMODE(path.stat().st_mode) != 0o700:
        raise ValueError('state directory must be private')


def private_file(path):
    info = path.lstat()
    if not stat.S_ISREG(info.st_mode) or info.st_uid != 0 or stat.S_IMODE(info.st_mode) != 0o600:
        raise ValueError('unsafe monitor state file')


def publish(report, root=STATE):
    private_directory(root)
    path = root / 'latest.json'
    previous = {}
    if path.exists() or path.is_symlink():
        private_file(path)
        if path.stat().st_size > 65536:
            raise ValueError('monitor state too large')
        previous = json.loads(path.read_text())
        if previous.get('schema') != 1 or not isinstance(previous.get('alerts'), dict):
            raise ValueError('invalid monitor state')
        # Reject injected log keys/values, even though the file is root-private.
        for name, severity in previous['alerts'].items():
            if not isinstance(name, str) or len(name) > 64 or not all(c in 'abcdefghijklmnopqrstuvwxyz._' for c in name):
                raise ValueError('invalid alert name')
            if severity not in ('warning', 'critical'):
                raise ValueError('invalid severity')
        previous = previous['alerts']
    transitions = events(previous, report['alerts'])
    fd, name = tempfile.mkstemp(prefix='.latest-', dir=root)
    temporary = Path(name)
    try:
        with os.fdopen(fd, 'w') as output:
            json.dump(report, output, sort_keys=True)
            output.write('\n')
            output.flush()
            os.fsync(output.fileno())
        os.replace(temporary, path)
        directory_fd = os.open(root, os.O_RDONLY | os.O_DIRECTORY)
        try:
            os.fsync(directory_fd)
        finally:
            os.close(directory_fd)
    finally:
        temporary.unlink(missing_ok=True)
    for item in transitions:
        print(json.dumps(item, sort_keys=True), flush=True)
    print(json.dumps({'event': 'summary', 'checkedAt': report['checkedAt'],
                      'alerts': len(report['alerts'])}), flush=True)


def main():
    try:
        if os.geteuid() != 0:
            raise ValueError('root required')
        private_directory(STATE)
        # The unit and a manual operator invocation cannot race the state baseline.
        fd = os.open(STATE / 'lock', os.O_RDWR | os.O_CREAT | os.O_NOFOLLOW, 0o600)
        with os.fdopen(fd, 'w') as lock:
            private_file(STATE / 'lock')
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
            report = collect(time.time())
            publish(report)
        return 1 if report['alerts'] else 0
    except Exception:
        print('{"event":"alert","check":"monitor.internal","severity":"critical"}', flush=True)
        return 2


if __name__ == '__main__':
    sys.exit(main())
