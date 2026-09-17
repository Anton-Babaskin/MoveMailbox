#!/usr/bin/env python3
"""Opt-in external HTTPS real-mail copy/repeat, retaining one synthetic fixture."""
import argparse
import base64
from email.message import EmailMessage
from email.policy import SMTP
import http.client
import importlib.util
import json
from pathlib import Path
import secrets
import sys
import time


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--allow-test-mail', action='store_true', required=True)
    parser.add_argument('--pilot-credential', type=Path, required=True)
    args = parser.parse_args()
    accounts = json.loads(sys.stdin.readline(65537))
    source, destination = accounts['source'], accounts['destination']
    for account in (source, destination):
        account.update(port=993, security='tls')
    credential = json.loads(args.pilot_credential.read_text())
    basic = base64.b64encode((credential['username']+':'+credential['password']).encode()).decode()
    spec = importlib.util.spec_from_file_location('live', Path(__file__).with_name('smoke-live-quota.py'))
    live = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(live)
    cookie = csrf = ''
    def request(path, payload=None, expected=200):
        connection = http.client.HTTPSConnection('staging.movemailbox.com', 18443, timeout=60)
        try:
            headers = {'Authorization': 'Basic '+basic, 'Cookie': cookie, 'X-CSRF-Token': csrf,
                       'Origin': 'https://staging.movemailbox.com:18443',
                       'Sec-Fetch-Site': 'same-origin', 'Content-Type': 'application/json'}
            connection.request('POST' if payload is not None else 'GET', path,
                               body=json.dumps(payload) if payload is not None else None, headers=headers)
            response = connection.getresponse()
            if response.status != expected:
                raise RuntimeError('unexpected API status '+str(response.status))
            return json.loads(response.read()), dict(response.getheaders())
        finally:
            connection.close()
    session, headers = request('/api/session')
    cookie, csrf = headers['Set-Cookie'].split(';')[0], session['csrfToken']
    clients, job_ids = [], []
    try:
        for account in (source, destination):
            result, _ = request('/api/connections/test', account)
            if not result.get('ok'):
                raise RuntimeError('connection preflight failed')
            clients.append(live.connect(account))
        prefix = 'MoveMailbox-HTTPS-'+secrets.token_hex(6)
        print('Synthetic fixture retained: '+prefix, flush=True)
        if clients[0].create(prefix)[0] != 'OK':
            raise RuntimeError('fixture creation failed')
        message = EmailMessage(policy=SMTP)
        message['From'], message['To'] = 'source@example.test', 'destination@example.test'
        message['Subject'] = 'MoveMailbox HTTPS acceptance'
        message['Message-ID'] = '<'+prefix+'@example.test>'
        message.set_content('Synthetic HTTPS migration. Привет / Вітаю.')
        message.add_attachment(secrets.token_bytes(65536), maintype='application', subtype='octet-stream', filename='test.bin')
        if clients[0].append(prefix, '(\\Seen \\Flagged)', '"15-Sep-2026 09:00:00 +0000"', message.as_bytes())[0] != 'OK':
            raise RuntimeError('fixture append failed')
        original = live.snapshot(clients[0], prefix)
        payload = {'source': source, 'destination': destination, 'options': {
            'folders': [prefix], 'destinationSubfolder': prefix+'-Copy', 'syncFlags': True, 'preserveDates': True}}
        for expected_count in (1, 0):
            job, _ = request('/api/jobs', payload, 202)
            job_ids.append(job['id'])
            deadline = time.monotonic()+180
            while True:
                state, _ = request('/api/jobs/'+job['id'])
                if state['status'] in ('completed', 'failed', 'cancelled'):
                    break
                if time.monotonic() > deadline:
                    raise RuntimeError('job deadline')
                time.sleep(3)
            if state['status'] != 'completed' or state['transferred'] != expected_count or state['engine'] != 'imapsync-remote-worker':
                raise RuntimeError('job outcome mismatch: '+state['status'])
            print('PASS: copied '+str(expected_count)+' messages via HTTPS/worker', flush=True)
        if live.snapshot(clients[1], prefix+'-Copy.'+prefix) != original or live.snapshot(clients[0], prefix) != original:
            raise RuntimeError('content/flags/date mismatch')
        print('PASS: content hash, flags, internal date, unchanged source and zero-copy repeat', flush=True)
    finally:
        for job_id in job_ids:
            state, _ = request('/api/jobs/'+job_id)
            if state['status'] not in ('completed', 'failed', 'cancelled'):
                request('/api/jobs/'+job_id+'/cancel', {}, 202)
        for client in clients:
            try:
                client.logout()
            except Exception:
                pass


if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        print('FAIL: '+type(error).__name__+' (details withheld to protect credentials)', file=sys.stderr)
        sys.exit(1)
