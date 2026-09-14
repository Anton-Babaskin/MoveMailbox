#!/usr/bin/env python3
"""Verify operator-local HTTPS against staging without submitting a migration."""
import argparse
import http.client
import json
import socket
import ssl


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--ca", required=True)
    args = parser.parse_args()
    context = ssl.create_default_context(cafile=args.ca)

    def request(path, method="GET", body=None, headers=None):
        connection = http.client.HTTPSConnection("staging.movemailbox.com", 8443, context=context, timeout=5)
        connection.sock = context.wrap_socket(socket.create_connection(("127.0.0.1", 8443), timeout=5),
                                             server_hostname="staging.movemailbox.com")
        try:
            connection.request(method, path, body=body, headers=headers or {})
            response = connection.getresponse()
            return response.status, dict(response.getheaders()), response.read()
        finally:
            connection.close()

    status, _, body = request("/api/ready")
    assert status == 200 and json.loads(body)["ready"]
    status, headers, body = request("/api/session")
    assert status == 200
    cookie = headers["Set-Cookie"]
    assert all(flag in cookie for flag in ("Secure", "HttpOnly", "SameSite"))
    csrf = json.loads(body)["csrfToken"]
    auth = {"Cookie": cookie.split(";", 1)[0], "Content-Type": "application/json",
            "Origin": "https://staging.movemailbox.com:8443", "Sec-Fetch-Site": "same-origin"}
    assert request("/api/jobs", "POST", "{}", auth)[0] == 403
    # Valid CSRF reaches input validation, but invalid payload cannot create a job.
    assert request("/api/jobs", "POST", "{}", auth | {"X-CSRF-Token": csrf})[0] == 400
    assert request("/api/jobs", "POST", "{}", auth | {"X-CSRF-Token": csrf,
                   "Origin": "https://staging.movemailbox.com:9443"})[0] == 403
    assert request("/api/ready", headers={"Host": "untrusted.invalid"})[0] == 421
    assert request("/api/jobs", "POST", "x" * 65537, auth)[0] == 413
    print("PASS: verified TLS hostname/certificate, readiness, Secure/HttpOnly/SameSite cookie, CSRF rejection, authenticated validation, Host rejection, body limit; no migration submitted")


if __name__ == "__main__":
    main()
