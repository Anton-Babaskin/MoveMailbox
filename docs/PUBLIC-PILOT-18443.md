# Closed pilot on external port 18443

Endpoint: `https://staging.movemailbox.com:18443`.
Owner-managed DNAT maps that port to VM TCP 443. The VM firewall allows TCP 443
on ens18 to its private address. Amnezia's ports 443/8443 on the hypervisor are
independent. Do not change their mappings. NAT persistence still needs owner
verification before relying on a hypervisor reboot.

## Current VM installation

- nginx container `movemailbox-pilot-proxy`, pinned image
  `nginx:stable-alpine@sha256:dc5069ad14f19660b141b21236140b91656bf89bbc3e2417c70ae650cd66104c`.
- Host network, read-only filesystem, 0.5 CPU, 128 MiB, 64 PIDs, 16 MiB tmpfs.
- Master runs as root with only NET_BIND_SERVICE, CHOWN, SETUID, SETGID;
  workers drop to UID/GID 101. `no-new-privileges` enabled.
- Config: `/etc/movemailbox/nginx-public-pilot.conf`, sourced from
  [nginx-public-pilot.conf](../deploy/staging/nginx-public-pilot.conf).
- Root-managed `/etc/movemailbox/pilot-certs` mounted read-only at `/certs`:
  `fullchain.pem`, `privkey.pem`, `invited.htpasswd`; secret files mode 0640,
  root:101, directory 0750. Manage the directory file, not the older unused
  `/etc/movemailbox/pilot.htpasswd` copy.
- API stays on loopback 8080. AllowedHosts includes the exact external authority.
  `configure-pilot-authority.py` applies this only to an idle dedicated staging
  installation, preserving secrets and recreating only API with rollback on error.
  Run beside staging_update.py (or with its directory in PYTHONPATH). Its snapshot
  checks require an exclusive window; they do not lock out a concurrent operator.
- Restart policy `unless-stopped`. Stop with `docker stop movemailbox-pilot-proxy`;
  restart with `docker start movemailbox-pilot-proxy`. Do not remove data volumes.

## Access and acceptance

Public readiness/session endpoints require a pilot invitation. Product guest
sessions remain separate. Create one account per tester; never use mailbox
passwords. Owner access was issued and verified on 2026-09-15. Access logs are
disabled; API Authorization is stripped by nginx. All clients currently share
the backend's direct-proxy IP quota (240/min), while nginx limits source IPs.

Use `scripts/pilot-access.py` locally with `--ssh-key`, `--username` and a new
`--output` file in a private directory outside Git, after uploading the script
to the operator home on the VM. It saves the generated secret locally, sends it
over SSH stdin, stores only a salted hash at the gateway and checks readiness.
Windows output inherits directory ACLs: choose a user-private directory and
verify them. The local credential file is intentionally not Git-synchronized.
Existing usernames are refused; a failure may leave a saved but unissued local
credential. Do not share one account between multiple testers.

`scripts/smoke-https-mail.py --allow-test-mail --pilot-credential FILE` reads
authorized source/destination accounts as one JSON line on stdin. It creates
one unique synthetic folder/message, transfers only that folder through the
public HTTPS API, repeats, compares body/flags/date, and retains its fixtures.
It does not exercise destructive mirror. Run with exclusive pilot access;
all mail-provider connections verify TLS. Never put account secrets in Git.

Upload `scripts/smoke-public-pilot.py` to the operator home on the VM and run the
local copy with `--ssh-key PATH`. It uses normal public TLS trust, provisions a
random disposable invitation over SSH stdin, verifies session/CSRF/Origin and
revokes that invitation in finally. No credentials are printed and no migration
is submitted. Do not use Python `-O`. Invitation updates require exclusive admin
access to avoid racing other account changes. Revocation affects new requests;
already-open streams require disconnection for immediate revocation.

## Certificate lifecycle

Current certificate expires 2026-12-13. Certbot manual DNS mode does not renew
automatically. Source files are in `/etc/letsencrypt/live/movemailbox-staging`;
the gateway currently reads protected copies. Renewal must refresh both copies,
preserve ownership/modes, run `nginx -t`, and reload nginx. A future renewal hook
and DNS automation are required before an unattended long-running pilot.
