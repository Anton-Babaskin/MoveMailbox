#!/usr/bin/env python3
"""Issue a named pilot credential over SSH stdin; save outside the checkout."""
import argparse
import base64
import http.client
import json
import os
from pathlib import Path
import re
import secrets
import subprocess
import sys


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--remote', action='store_true')
    parser.add_argument('--ssh-key')
    parser.add_argument('--username')
    parser.add_argument('--output', type=Path)
    args = parser.parse_args()
    if args.remote:
        import fcntl
        data = json.load(sys.stdin)
        if not re.fullmatch('[a-z][a-z0-9-]{1,31}', data['username']):
            raise RuntimeError('invalid username')
        path = Path('/etc/movemailbox/pilot-certs/invited.htpasswd')
        with open('/etc/movemailbox/pilot-access.lock', 'a') as lock:
            fcntl.flock(lock, fcntl.LOCK_EX)
            if path.is_symlink() or not path.is_file():
                raise RuntimeError('unsafe password file')
            rows = path.read_text().splitlines()
            if any(row.startswith(data['username']+':') for row in rows):
                raise RuntimeError('account already exists; refusing silent rotation')
            hashed = subprocess.run(['openssl', 'passwd', '-6', '-stdin'], input=data['password']+'\n',
                                    text=True, capture_output=True, check=True).stdout.strip()
            temporary = path.with_name('invited.htpasswd.issue-new')
            fd = os.open(temporary, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o640)
            with os.fdopen(fd, 'w') as output:
                output.write('\n'.join(rows+[data['username']+':'+hashed])+'\n')
                output.flush()
                os.fsync(output.fileno())
            os.chown(temporary, 0, 101)
            os.replace(temporary, path)
        return
    if not args.output or not args.ssh_key or not args.username:
        parser.error('--output, --ssh-key, --username required')
    target = args.output.resolve()
    repo = Path(__file__).resolve().parents[1]
    if target.is_relative_to(repo) or target.exists():
        raise RuntimeError('output must be a new private file outside repository')
    data = {'url': 'https://staging.movemailbox.com:18443', 'username': args.username,
            'password': secrets.token_urlsafe(32)}
    # Save before provisioning so SSH disconnect cannot lose an issued password.
    fd = os.open(target, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, 'w') as output:
        json.dump(data, output, indent=2)
    subprocess.run(['ssh', '-i', args.ssh_key, '-p', '2208', '-o', 'BatchMode=yes',
                    '-o', 'StrictHostKeyChecking=yes', 'nomak@46.4.100.22',
                    'sudo python3 /home/nomak/pilot-access.py --remote'],
                   input=json.dumps(data), text=True, capture_output=True, check=True, timeout=20)
    auth = base64.b64encode((data['username']+':'+data['password']).encode()).decode()
    connection = http.client.HTTPSConnection('staging.movemailbox.com', 18443, timeout=10)
    try:
        connection.request('GET', '/api/ready', headers={'Authorization': 'Basic '+auth})
        response = connection.getresponse()
        if response.status != 200 or not json.loads(response.read()).get('ready'):
            raise RuntimeError('issued credential verification failed; inspect saved file privately')
    finally:
        connection.close()
    print('PASS: named credential issued and verified; secret stored outside Git')


if __name__ == '__main__':
    main()
