#!/usr/bin/env python3
"""Create disposable pilot credentials and test grant/revoke; local fixtures only."""
import argparse
import base64
import http.client
import json
import os
from pathlib import Path
import secrets
import socket
import ssl
import subprocess


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--fixture-dir', required=True)
    parser.add_argument('--prepare', action='store_true')
    args = parser.parse_args()
    directory = Path(args.fixture_dir).resolve(strict=True)
    if directory.parent != Path('/tmp') or not directory.name.startswith('mm-load-pilot.'):
        raise RuntimeError('only disposable /tmp/mm-load-pilot.* fixtures allowed')
    authfile = directory / 'invited.htpasswd'
    secretfile = directory / 'test-invite.secret'
    if args.prepare:
        password = secrets.token_urlsafe(32)
        hashed = subprocess.run(['openssl', 'passwd', '-6', '-stdin'], input=password+'\n',
                                text=True, capture_output=True, check=True).stdout.strip()
        for path, content in ((authfile, 'pilot-test:'+hashed+'\n'), (secretfile, password)):
            descriptor = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
            with os.fdopen(descriptor, 'w') as stream:
                stream.write(content)
            os.chown(path, 101, 101)
        print('Prepared disposable invitation; no credentials printed')
        return
    password = secretfile.read_text()
    context = ssl.create_default_context(cafile=str(directory / 'pilot.crt'))

    def request(path, credential=None):
        connection = http.client.HTTPSConnection('staging.movemailbox.com', 8443, timeout=5)
        try:
            connection.sock = context.wrap_socket(socket.create_connection(('127.0.0.1', 8443), timeout=5),
                                                 server_hostname='staging.movemailbox.com')
            headers = {} if credential is None else {'Authorization': 'Basic '+base64.b64encode(
                ('pilot-test:'+credential).encode()).decode()}
            connection.request('GET', path, headers=headers)
            response = connection.getresponse()
            body = response.read()
            return response.status, body
        finally:
            connection.close()

    for path in ('/', '/api/ready', '/api/session', '/api/jobs'):
        assert request(path)[0] == 401, path
    assert request('/api/ready', 'incorrect')[0] == 401
    status, body = request('/api/ready', password)
    assert status == 200 and json.loads(body)['ready']
    assert request('/api/session', password)[0] == 200
    # Empty user file revokes access; mounted directory exposes atomic replacements.
    replacement = directory / 'revoked.htpasswd'
    descriptor = os.open(replacement, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    os.close(descriptor)
    os.chown(replacement, 101, 101)
    os.replace(replacement, authfile)
    assert request('/api/ready', password)[0] == 401
    print('PASS: anonymous and wrong-password denied; invited readiness/session allowed; revocation denied next request')


if __name__ == '__main__':
    main()
