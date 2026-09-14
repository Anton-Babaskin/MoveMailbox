# Operator-local HTTPS pilot

This is a private technical gateway, not public staging. Traffic follows:
local TLS `127.0.0.1:8443` -> SSH `127.0.0.1:18080` -> VM `127.0.0.1:8080`.
Only an operator with SSH access can use it. No public firewall/DNS change is
needed. The certificate is trusted explicitly by the smoke test, not installed
in the system trust store. Website and external browser acceptance are separate.

## Run from a Linux/WSL repository checkout

Prerequisites: Docker, OpenSSH, OpenSSL, Python 3.10+, verified VM host key and
the existing operator SSH identity. Replace SSH placeholders with approved
values. Keep the tunnel in a separate terminal:

```sh
ssh -N -L 127.0.0.1:18080:127.0.0.1:8080 -o ExitOnForwardFailure=yes -o StrictHostKeyChecking=yes -i KEY -p PORT USER@VM
```

Create short-lived test material outside Git and run a non-root, read-only proxy:

```sh
pilot_dir=$(mktemp -d /tmp/mm-https-pilot.XXXXXX) || exit 1
openssl req -x509 -newkey rsa:2048 -nodes -days 2 -subj /CN=staging.movemailbox.com -addext subjectAltName=DNS:staging.movemailbox.com -keyout "${pilot_dir:?}/pilot.key" -out "${pilot_dir:?}/pilot.crt" || exit 1
sudo chown 101:101 "$pilot_dir" "$pilot_dir/pilot.key" "$pilot_dir/pilot.crt"
docker run -d --name mm-https-pilot --user 101:101 --network host --read-only --cap-drop=ALL --security-opt no-new-privileges --pids-limit 64 --memory 128m --cpus 0.5 --tmpfs /tmp:size=16m,mode=1777 --mount "type=bind,src=$pilot_dir,dst=/certs,readonly" --mount "type=bind,src=$PWD/deploy/staging/nginx-tunnel.conf,dst=/etc/nginx/nginx.conf,readonly" --entrypoint nginx nginx:stable-alpine@sha256:dc5069ad14f19660b141b21236140b91656bf89bbc3e2417c70ae650cd66104c -g 'daemon off;'
sudo python3 scripts/smoke-https-tunnel.py --ca "$pilot_dir/pilot.crt"
```

The test creates a guest session but no migration. It validates TLS, cookie flags,
CSRF rejection, input validation, Host rejection and oversized-body rejection.
Do not run Python with `-O`: these harness checks use assertions.
Stop the named proxy with `docker stop mm-https-pilot`, then remove that container
with `docker rm mm-https-pilot`; interrupt the SSH terminal. Inspect the printed
temporary directory before removing its two certificate files. Never commit keys.

## Bounded load and invitation gate

With the operator gateway running, execute:

```sh
sudo timeout 60 python3 scripts/load-https-tunnel.py --ca "$pilot_dir/pilot.crt"
```

This sends 80 readiness requests with four clients, expects both success and
rate rejection, then checks recovery after 12 seconds. It creates no jobs and
does not measure IMAP performance. Gateway limits remain 0.5 CPU / 128 MiB.

For an invitation-gate rehearsal, stop/remove the operator gateway first (same
port), prepare a disposable account with
`sudo python3 scripts/smoke-invited-https.py --fixture-dir "$pilot_dir" --prepare`,
then launch the same Docker command using `nginx-invited.conf` instead of
`nginx-tunnel.conf`. The fixture directory must be `/tmp/mm-load-pilot.*`.
Run the script again without `--prepare`: anonymous/wrong-password requests
must return 401, valid requests 200, and revocation must deny the next request.
The script intentionally revokes its disposable account. Never use it on real
invitation data. Do not run with Python `-O`.

For a real closed pilot, use one random password per tester and a root-managed
`invited.htpasswd` file outside Git, readable by nginx UID 101 only. Use a
supported salted crypt hash, such as SHA-512 crypt from `openssl passwd -6`
(interactive input, never a password command-line argument). Deliver credentials
privately, not in URLs, Git or chat logs. Maintain an operator roster with an
expiry date; this simple gate does NOT automate invitation delivery or expiry.
Revoke by atomically replacing the user file in the mounted directory without
that user. Existing HTTP/SSE requests are not disconnected by file revocation;
terminate the gateway's active connections if immediate revocation is required.
Never reuse mailbox passwords. Authorization is stripped before proxying to API.

The gate uses [nginx Basic Authentication](https://nginx.org/en/docs/http/ngx_http_auth_basic_module.html)
over TLS; it is a temporary pilot boundary, not the product's paid account system.
Real external testers still need an approved private-network/tunnel route, or a
separately approved public TLS endpoint with a browser-trusted certificate.
No such endpoint or permanent tester credentials have been provisioned.

## Recovery drill on the VM (idle maintenance)

Use an exclusive idle maintenance window: the script's idle check is not a lock
against concurrent submissions. Run the reviewed script alongside
`scripts/staging_update.py`, with sudo and `--allow-worker-restart`. It refuses
active worker jobs/envelopes, then stops and starts only the worker, verifies
readiness transitions, unchanged API start time and unchanged worker image.
Keep operator access available in case Docker itself fails to restart the worker.

## Limits and design

- Access logs disabled; requests are not cached or retried upstream. SSE buffering
  is off. Request bodies are capped at 64 KiB. Temporary paths use bounded tmpfs.
- The gateway intentionally does not set persistent HSTS during local testing.
- Rate limit is operator-local (2 requests/s, burst 20), not a public quota design.
- Follow-up public access requires trusted certificates and an explicitly approved
  access-control model; do not simply bind this listener to all interfaces.

Configuration references: [nginx proxy module](https://nginx.org/en/docs/http/ngx_http_proxy_module.html)
and [nginx TLS module](https://nginx.org/en/docs/http/ngx_http_ssl_module.html).
