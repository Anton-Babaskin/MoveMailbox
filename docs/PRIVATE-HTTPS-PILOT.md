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

## Recovery drill on the VM

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
