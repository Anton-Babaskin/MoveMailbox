# Staging VPS preparation

Recommended baseline: Ubuntu Server 24.04 LTS, amd64/x86_64, 4 vCPU, 8 GB RAM,
80 GB SSD/NVMe and a dedicated public IPv4. Use a minimal image, no desktop,
hosting control panel or local mail server. This is a staging baseline, not a
promise of production migration throughput.

- Point `staging.movemailbox.com` to the VPS IPv4.
- Allow TCP 80/443 inbound for HTTPS provisioning and the site/API.
- Restrict SSH to the operator IP where practical; use an SSH key and a sudo
  deployment user. Do not send private keys or passwords in chat.
- Verify the provider permits outgoing IMAP TCP 993 and 143. SMTP port 25 is
  not required for mailbox migration.
- Keep worker port 8090 and database ports private; do not publish Docker or
  database management sockets.

Before real public traffic we will configure Docker, trusted HTTPS, worker/API
separation, secret generation, private-network egress restrictions, resource
limits, metadata backup/restore, log retention and monitoring. Do not open the
demo form to public real-credential submissions as a substitute for these gates.

Next verification stages:

Local WSL status (September 8): quota image rebuilt; real hosted quota denial/
admission, 6 MiB attachment verification, cancellation, worker SIGKILL recovery
and idempotent repeats passed. The steps below remain the VPS acceptance plan;
local success does not substitute for validating the deployed environment.

Key-rotation unit tests and a Docker restore drill also pass: damaged/truncated
copies fail integrity validation, and valid copies restore into empty volumes
without replaying terminal jobs. VPS acceptance must still test provider-level
snapshots, retention, access control and restore from an off-host copy.

1. Rebuild the quota-enabled image and verify hosted rejection/admission using
   low test limits and isolated destination folders.
2. Define and test overrun handling when the source grows after admission.
3. Test large attachments, cancellation, worker termination, retry idempotency
   and VPS restart with content/flags/internal-date comparisons.
4. Restore metadata from backup and validate expiry, secret rotation and rollback.
