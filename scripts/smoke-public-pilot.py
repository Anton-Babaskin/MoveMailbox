#!/usr/bin/env python3
"""External TLS/guest checks with a disposable invitation, removed in finally."""
import argparse
from collections import Counter
import concurrent.futures
import base64
import http.client
import json
import secrets
import subprocess
import sys
import time
from pathlib import Path


def remote(mode):
    import os
    data = json.load(sys.stdin)
    username = data['username']
    if not username.startswith('smoke-') or not username[6:].isalnum():
        raise RuntimeError('invalid disposable username')
    path = Path('/etc/movemailbox/pilot-certs/invited.htpasswd')
    if path.is_symlink() or not path.is_file():
        raise RuntimeError('unsafe user file')
    rows = [r for r in path.read_text().splitlines() if not r.startswith(username+':')]
    if mode == 'enroll':
        digest = subprocess.run(['openssl', 'passwd', '-6', '-stdin'], input=data['password']+'\n',
                                text=True, capture_output=True, check=True).stdout.strip()
        rows.append(username+':'+digest)
    temporary = path.with_name('invited.htpasswd.smoke-new')
    fd = os.open(temporary, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o640)
    with os.fdopen(fd, 'w') as stream:
        stream.write('\n'.join(rows)+'\n')
        stream.flush()
        os.fsync(stream.fileno())
    os.chown(temporary, 0, 101)
    os.replace(temporary, path)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--remote', choices=['enroll', 'revoke'])
    parser.add_argument('--ssh-key')
    parser.add_argument('--load', action='store_true', help='80 read-only readiness requests, four clients, no IMAP load')
    args = parser.parse_args()
    if args.remote:
        remote(args.remote)
        return
    if not args.ssh_key:
        parser.error('--ssh-key required')
    credential = {'username': 'smoke-'+secrets.token_hex(8), 'password': secrets.token_urlsafe(32)}
    basic = 'Basic '+base64.b64encode((credential['username']+':'+credential['password']).encode()).decode()
    authority = 'staging.movemailbox.com:18443'
    def update(mode):
        subprocess.run(['ssh', '-i', args.ssh_key, '-p', '2208', '-o', 'BatchMode=yes',
                        '-o', 'StrictHostKeyChecking=yes', 'nomak@46.4.100.22',
                        'sudo python3 /home/nomak/smoke-public-pilot.py --remote '+mode],
                       input=json.dumps(credential), text=True, capture_output=True, check=True, timeout=20)
    def request(path, method='GET', headers=None, body=None, timeout=8):
        # Direct socket; system proxy variables cannot change the endpoint.
        connection = http.client.HTTPSConnection('staging.movemailbox.com', 18443, timeout=timeout)
        try:
            connection.request(method, path, body=body, headers=headers or {})
            response = connection.getresponse()
            return response.status, dict(response.getheaders()), response.read()
        finally:
            connection.close()
    try:
        update('enroll')
        assert request('/api/ready')[0] == 401
        auth = {'Authorization': basic}
        status, _, body = request('/api/ready', headers=auth)
        assert status == 200 and json.loads(body)['ready']
        status, headers, body = request('/api/session', headers=auth)
        assert status == 200
        cookie = headers['Set-Cookie']
        assert all(flag in cookie for flag in ('Secure', 'HttpOnly', 'SameSite'))
        csrf = json.loads(body)['csrfToken']
        auth.update({'Cookie': cookie.split(';')[0], 'Origin': 'https://'+authority,
                     'Sec-Fetch-Site': 'same-origin', 'Content-Type': 'application/json'})
        assert request('/api/jobs', 'POST', auth, '{}')[0] == 403
        auth['X-CSRF-Token'] = csrf
        assert request('/api/jobs', 'POST', auth, '{}')[0] == 400
        auth['Origin'] = 'https://staging.movemailbox.com:8443'
        assert request('/api/jobs', 'POST', auth, '{}')[0] == 403
        assert request('/api/ready', headers={'Authorization': basic, 'Host': 'untrusted.invalid'})[0] == 421
        if args.load:
            started = time.monotonic()
            def sample(_):
                before = time.monotonic()
                if before - started > 40:
                    raise RuntimeError('load time budget exceeded')
                code, _, _ = request('/api/ready', headers={'Authorization': basic}, timeout=2)
                return code, (time.monotonic() - before) * 1000
            with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
                results = list(pool.map(sample, range(80)))
            counts = Counter(code for code, _ in results)
            if not counts[200] or not counts[429] or set(counts) - {200, 429}:
                raise RuntimeError('unexpected load status distribution')
            time.sleep(12)  # Drain the proxy's 20-request burst at two/second.
            if [sample(0)[0] for _ in range(3)] != [200, 200, 200]:
                raise RuntimeError('readiness failed to recover after bounded load')
            latency = sorted(duration for _, duration in results)
            print(json.dumps({'result': 'PASS', 'requests': 80, 'concurrency': 4,
                              'statuses': dict(counts), 'p95Ms': round(latency[75], 2),
                              'maxMs': round(max(latency), 2),
                              'elapsedSeconds': round(time.monotonic() - started, 2),
                              'scope': 'external HTTPS gateway readiness, not IMAP throughput'}))
    finally:
        update('revoke')
    assert request('/api/ready', headers={'Authorization': basic})[0] == 401
    print('PASS: external trusted TLS, invitation, readiness, guest cookie, CSRF, Origin port, Host and revocation; no migration submitted')


if __name__ == '__main__':
    main()
