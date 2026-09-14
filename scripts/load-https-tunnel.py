#!/usr/bin/env python3
"""Read-only HTTPS load: 80 requests, four clients; run with timeout 60."""
import argparse
import concurrent.futures
import http.client
import json
import socket
import ssl
import time
from collections import Counter


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--ca', required=True)
    args = parser.parse_args()
    context = ssl.create_default_context(cafile=args.ca)
    started = time.monotonic()

    def request(_=None):
        before = time.monotonic()
        if before - started > 50:
            raise RuntimeError('load time budget exceeded')
        connection = http.client.HTTPSConnection('staging.movemailbox.com', 8443, timeout=2)
        try:
            connection.sock = context.wrap_socket(
                socket.create_connection(('127.0.0.1', 8443), timeout=2),
                server_hostname='staging.movemailbox.com')
            connection.request('GET', '/api/ready')
            response = connection.getresponse()
            body = response.read()
            if response.status == 200 and not json.loads(body).get('ready'):
                raise RuntimeError('upstream not ready')
            return response.status, (time.monotonic() - before) * 1000
        finally:
            connection.close()

    if request()[0] != 200:
        raise RuntimeError('baseline not ready')
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        results = list(pool.map(request, range(80)))
    counts = Counter(status for status, _ in results)
    if not counts[200] or not counts[429] or set(counts) - {200, 429}:
        raise RuntimeError(f'unexpected status distribution: {dict(counts)}')
    # 20-request burst at two requests/second drains in <= 11 seconds.
    time.sleep(12)
    recovery = [request()[0] for _ in range(3)]
    if recovery != [200, 200, 200]:
        raise RuntimeError(f'gateway did not recover: {recovery}')
    latencies = sorted(ms for _, ms in results)
    print(json.dumps({'result': 'PASS', 'requests': 80, 'concurrency': 4,
                      'statuses': dict(counts), 'p95Ms': round(latencies[75], 2),
                      'maxMs': round(max(latencies), 2), 'recovery': recovery,
                      'elapsedSeconds': round(time.monotonic() - started, 2),
                      'scope': 'readiness through TLS/SSH, not IMAP throughput'}))


if __name__ == '__main__':
    main()
