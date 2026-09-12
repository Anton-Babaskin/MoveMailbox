# Closed single-VM staging

This is an operator-reviewed Ubuntu 24.04 setup, **not a public deployment
installer**. Use a dedicated VM. Read [staging gates](../../docs/STAGING-VPS.md)
and [backup runbook](../../docs/BACKUP-RUNBOOK.md) first.

## Preconditions

- Root-controlled checkout at `/opt/movemailbox`, pinned to a reviewed commit.
- Docker Engine, Docker Compose v2, nftables, Python 3 and systemd installed
  from trusted packages; sufficient disk space for images and metadata.
- Working SSH key access and console recovery. Keep SSH allowed before enabling
  any host firewall. The installer does not change SSH or configure UFW.
- Unused `172.30.80.0/28` subnet and `br-movemailbox` bridge. Initial installation
  rejects overlapping host routes and Docker networks.
- Supply the VM's public NAT IPv4 so workers cannot hairpin through that address
  into other forwarded services. Review additional provider-specific addresses.

Build the application image from the reviewed checkout using its pinned base
images. Then run as root (replace placeholders with reviewed actual values):

```sh
python3 /opt/movemailbox/scripts/install-private-staging.py \
  --image movemailbox:REVIEWED_VERSION --nat-public-ip PUBLIC_NAT_IPV4
```

The installer pins the full local image ID; `pull_policy: never` prevents an
implicit tag update. Existing different configuration is refused, not replaced.
Generated secrets remain root-owned mode 0600 in `/etc/movemailbox/staging.env`.
Do not print that file, expanded Compose configuration or full container inspect
output into tickets. Docker administrators can access container secrets; this is
not a KMS or protection against a compromised root account.

## Boundaries

- API publishes only `127.0.0.1:8080`; worker has no published port. Secure guest
  cookies stay enabled. An ordinary HTTP tunnel is not a substitute for HTTPS
  browser acceptance testing.
- Separate non-root, read-only containers, dropped capabilities, bounded CPU,
  RAM, PIDs and logs; one migration at a time; decimal 5 GB mailbox quota.
- `inet movemailbox_staging` filters only the dedicated bridge. Its priority -10
  hook runs before Docker filtering. It is replaced atomically without flushing
  unrelated rules. Do not disable Docker's firewall management.
- API may connect to worker TCP 8090. Worker may connect to public IMAP TCP
  143/993. DNS is configured to Cloudflare resolvers. Private/reserved IPv4,
  metadata, the public NAT address and new container-to-host connections are
  rejected; IPv6 is disabled for this network and rejected in its forwarding rule.
- DNS and permitted IMAP remain communication channels, not a guarantee against
  all exfiltration or abuse. This does not replace application target validation,
  TLS checks, rate limits, provider restrictions or external security review.
- `br_netfilter` is persisted. A Docker systemd dependency loads the egress policy
  before Docker can auto-restart containers at boot. This affects Docker startup
  on the dedicated VM: a policy failure intentionally blocks startup.

Docker-published traffic is not reliably protected by UFW alone. See the official
[Docker firewall documentation](https://docs.docker.com/engine/network/packet-filtering-firewalls/).

## Acceptance checks

After both containers become healthy, run:

```sh
sudo python3 /opt/movemailbox/scripts/verify-private-staging.py \
  --nat-public-ip PUBLIC_NAT_IPV4 --imap-host AUTHORIZED_PUBLIC_IMAP_HOST
```

Repeat `--imap-host` for additional authorized servers. The script checks actual
Docker hardening, public-mode guest protections, a private-target rejection,
blocked TCP attempts with increasing nftables reject counters, and certificate-
verified IMAP TLS handshakes. It never logs into mailboxes or creates migration
jobs. A failed check exits nonzero; external DNS/TLS failures are not a pass.

For a drained-service restart, first stop admission and verify both queues have
no active jobs, following the backup runbook. Restart `movemailbox-staging`, then
rerun acceptance. This is not proof of a whole-VM reboot or interrupted-job
recovery. Schedule a VM reboot with console access before public launch.

## Opt-in real-mail pilot

With authorized disposable Mail-in-a-Box accounts and an idle stage, the Docker
administrator can run `scripts/smoke-private-staging-mail.py --allow-test-mail`.
It also needs `smoke-live-quota.py` alongside it for the verified-TLS inspection
and snapshot helpers. Supply one JSON line on stdin with `source` and
`destination` objects, each containing `host`, `username`, `password`. Obtain
these through hidden input or a secret mechanism and pipe directly over SSH;
never use a credential file or inline shell argument. Port 993/TLS are fixed.

The test creates two synthetic messages in unique folders, including a 6 MiB
attachment, and tests preflight modes, selected folders, destination subfolders,
both directions, zero-copy repeats, guest isolation and credential cleanup.
INBOXes and source fixtures are compared read-only. Generated folders are
retained, not deleted. It assumes the Mail-in-a-Box `.` hierarchy delimiter.

Adding `--allow-worker-interrupt` also cancels a test job and sends SIGKILL to
the exact staging worker. Run during an exclusive operator test window: before
each fault the harness requires that its own job is the only active worker job.
That snapshot is a guard, not a lock against concurrent external admissions.
Only jobs created by this run are candidates for cancellation on failure.
The worker is restarted with existing keys/volumes; no settings are weakened.
If a deadline or cleanup fails, inspect printed test job IDs and service health.
This does not validate browser HTTPS or a full VM reboot.

## Updates, interruption and rollback

This is a bootstrap installer, not a transactional upgrade manager. A failure
may leave already-created files; inspect them before resuming. Never delete
secrets to bypass an image/config mismatch. Preserve the old image ID, drain
queues, take verified metadata and separate key backups, review configuration
changes, then explicitly deploy the new reviewed revision.

To stop the stage without deleting data, use `systemctl stop movemailbox-staging`.
Keep its egress policy in place while containers exist or can restart. Do not
run `compose down -v`, delete volumes, flush the global firewall, or remove the
Docker dependency while its containers can auto-start. Uninstall requires a
separate reviewed plan; other Docker projects and host rules must be preserved.

## Still required before public use

DNS/NAT ownership, trusted HTTPS, restricted pilot admission, off-site encrypted
backup and restore, retention/alerts, full reboot acceptance, host updates and
SSH hardening with verified fallback access. No production launch, payment flow,
KMS, mailbox test or off-site backup is implied by a healthy closed stage.
