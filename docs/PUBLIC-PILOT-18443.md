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
passwords. No permanent credentials have been delivered yet. Access logs are
disabled; API Authorization is stripped by nginx. All clients currently share
the backend's direct-proxy IP quota (240/min), while nginx limits source IPs.

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
