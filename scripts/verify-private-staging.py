#!/usr/bin/env python3
"""Read-only private-stage checks. No mailbox login, job creation or message changes."""
import argparse
import http.client
import json
import subprocess


def run(*args):
    result = subprocess.run(args, capture_output=True, text=True, timeout=30)
    if result.returncode:
        raise RuntimeError("Command failed; output withheld: " + args[0])
    return result.stdout


def check(condition, label):
    if not condition:
        raise RuntimeError("FAIL: " + label)
    print("PASS: " + label)


def reject_count():
    rules = json.loads(run("nft", "-j", "list", "table", "inet", "movemailbox_staging"))
    count = 0
    for item in rules["nftables"]:
        expr = item.get("rule", {}).get("expr", [])
        if any("reject" in part for part in expr):
            count += sum(part.get("counter", {}).get("packets", 0) for part in expr)
    return count


def request(path, method="GET", body=None, headers=None):
    conn = http.client.HTTPConnection("127.0.0.1", 8080, timeout=10)
    try:
        conn.request(method, path, body=body,
                     headers={"Host": "staging.movemailbox.com", **(headers or {})})
        response = conn.getresponse()
        return response.status, dict(response.getheaders()), response.read()
    finally:
        conn.close()


def verify(nat_public_ip, imap_hosts):
    # Validate user-supplied address before passing it to a container command.
    import ipaddress
    address = ipaddress.ip_address(nat_public_ip)
    check(address.version == 4 and address.is_global, "global NAT IPv4 argument")
    containers = {}
    for service in ("movemailbox", "movemailbox-worker"):
        name = "movemailbox-staging-" + service + "-1"
        info = json.loads(run("docker", "inspect", name))[0]
        containers[service] = name
        check(info["State"]["Health"]["Status"] == "healthy", service + " healthy")
        host = info["HostConfig"]
        check(info["Config"]["User"] == "nobody:nogroup" and host["ReadonlyRootfs"]
              and "ALL" in host["CapDrop"] and "no-new-privileges:true" in host["SecurityOpt"],
              service + " non-root/read-only/capability restrictions")
        bindings = host.get("PortBindings") or {}
        expected = {"8080/tcp": [{"HostIp": "127.0.0.1", "HostPort": "8080"}]} if service == "movemailbox" else {}
        check(bindings == expected, service + " port exposure")
        check(host["Memory"] > 0 and host["NanoCpus"] > 0 and host["PidsLimit"] > 0,
              service + " resource limits")
    status, _, body = request("/api/health")
    health = json.loads(body)
    check(status == 200 and health["available"] and health["engine"] == "imapsync-remote-worker"
          and health["storage"]["healthy"], "real remote-worker API health")
    status, headers, body = request("/api/session")
    session = json.loads(body)
    cookie_header = headers.get("Set-Cookie", "")
    check(status == 200 and session.get("csrfToken") and "Secure" in cookie_header
          and "HttpOnly" in cookie_header, "secure guest session")
    # Manually replay only to loopback for this diagnostic; never weaken public cookies.
    auth = {"Cookie": cookie_header.split(";", 1)[0], "Content-Type": "application/json"}
    endpoint = json.dumps(dict(host="127.0.0.1", port=993, security="tls", username="probe", password="synthetic"))
    check(request("/api/connections/test", "POST", endpoint, auth)[0] == 403, "missing CSRF rejected")
    auth["X-CSRF-Token"] = session["csrfToken"]
    status, _, body = request("/api/connections/test", "POST", endpoint, auth)
    check(status == 403 and b"connection.target.denied" in body, "private target rejected before connection")
    check(request("/api/session", headers={"Host": "untrusted.invalid"})[0] == 421,
          "untrusted Host rejected")
    tcp = 'use IO::Socket::INET; my $s=IO::Socket::INET->new(PeerAddr=>$ARGV[0],PeerPort=>$ARGV[1],Proto=>"tcp",Timeout=>3); print($s ? "connected" : "blocked");'
    for service, target, port in (("movemailbox-worker", "169.254.169.254", 80),
                                  ("movemailbox-worker", "172.30.80.1", 22),
                                  ("movemailbox-worker", str(address), 993),
                                  ("movemailbox-worker", "1.1.1.1", 443),
                                  ("movemailbox", "1.1.1.1", 993)):
        before = reject_count()
        result = run("docker", "exec", containers[service], "perl", "-e", tcp, target, str(port))
        check(result == "blocked" and reject_count() > before, service + " egress denial " + target + ":" + str(port))
    tls = 'use IO::Socket::SSL; my $s=IO::Socket::SSL->new(PeerHost=>$ARGV[0],PeerPort=>993,Timeout=>8,SSL_verify_mode=>1,SSL_verifycn_scheme=>"imap",SSL_verifycn_name=>$ARGV[0]); exit($s ? 0 : 1);'
    for hostname in imap_hosts:
        run("docker", "exec", containers["movemailbox-worker"], "perl", "-e", tls, hostname)
        print("PASS: worker DNS + verified IMAP TLS " + hostname + " (no login)")
    print("No mailbox credentials used; no jobs or messages created.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--nat-public-ip", required=True)
    parser.add_argument("--imap-host", action="append", required=True,
                        help="Authorized public IMAP hostname; TLS handshake only. Repeatable.")
    args = parser.parse_args()
    verify(args.nat_public_ip, args.imap_host)
