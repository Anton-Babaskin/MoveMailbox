#!/usr/bin/env python3
"""Apply the approved :18443 authority on the dedicated idle staging VM."""
import os
from pathlib import Path
import subprocess
import time
import urllib.request
from staging_update import ENV, CONTAINERS, database_paths
from backup_validation import ensure_pair_drained


def run(*args):
    return subprocess.run(args, check=True, capture_output=True, text=True, timeout=90)


def main():
    if os.geteuid() != 0 or ENV.is_symlink():
        raise RuntimeError('requires root and regular staging env')
    ensure_pair_drained(database_paths())
    original = ENV.read_text()
    lines = original.splitlines()
    positions = [i for i, line in enumerate(lines) if line.startswith('MOVEMAILBOX_ALLOWED_HOSTS=')]
    if len(positions) != 1:
        raise RuntimeError('expected one AllowedHosts setting')
    i = positions[0]
    hosts = [h for h in lines[i].split('=', 1)[1].split(',') if h != 'staging.movemailbox.com:8443']
    if 'staging.movemailbox.com:18443' not in hosts:
        hosts.append('staging.movemailbox.com:18443')
    lines[i] = 'MOVEMAILBOX_ALLOWED_HOSTS='+','.join(hosts)
    image = run('docker', 'inspect', CONTAINERS[0], '--format={{.Image}}').stdout
    worker_started = run('docker', 'inspect', CONTAINERS[1], '--format={{.State.StartedAt}}').stdout
    temporary = Path('/etc/movemailbox/staging.env.authority-new')
    def write_env(content):
        descriptor = os.open(temporary, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
        with os.fdopen(descriptor, 'w') as stream:
            stream.write(content)
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(temporary, ENV)
    def recreate():
        run('docker', 'compose', '-p', 'movemailbox-staging', '--env-file', str(ENV),
            '-f', '/opt/movemailbox/compose.yaml', '-f', '/opt/movemailbox/deploy/staging/compose.override.yaml',
            'up', '-d', '--no-build', '--pull', 'never', '--no-deps', '--force-recreate', 'movemailbox')
    try:
        write_env('\n'.join(lines)+'\n')
        recreate()
        for attempt in range(30):
            try:
                request = urllib.request.Request('http://127.0.0.1:8080/api/ready', headers={'Host': 'staging.movemailbox.com:18443'})
                with urllib.request.urlopen(request, timeout=2) as response:
                    if response.status == 200:
                        break
            except OSError:
                pass
            time.sleep(1)
        else:
            raise RuntimeError('readiness failed')
        if run('docker', 'inspect', CONTAINERS[0], '--format={{.Image}}').stdout != image:
            raise RuntimeError('API image changed unexpectedly')
        if run('docker', 'inspect', CONTAINERS[1], '--format={{.State.StartedAt}}').stdout != worker_started:
            raise RuntimeError('worker restarted unexpectedly')
    except Exception:
        write_env(original)
        recreate()
        raise
    print('PASS: :18443 authority ready; same API image; worker unchanged')


if __name__ == '__main__':
    main()
