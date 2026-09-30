# Private staging monitoring

This is a small single-VM operator monitor, not a public metrics endpoint or a
host intrusion-detection system. No new listener, external request, migration,
restart, credential read, firewall change or automatic cancellation is performed.
The owner remains responsible for responding to alerts.

## Checks and thresholds

| Check | Warning | Critical |
| --- | --- | --- |
| Root filesystem available space | Below 10% **or** 2 GiB | Below 5% **or** 1 GiB |
| Root filesystem available inodes | Below 10% | Below 5% |
| API/worker container health, proxy running | — | Missing/not healthy/not running |
| API readiness | — | Not ready/invalid response/timeout |
| Worker queue | At least 8 waiting, or oldest waiting over 15 min | Cannot read queue |
| Worker progress | Running record unchanged over 15 min | — |
| API/worker failures | At least one failed job in the last hour | Cannot read metadata |
| Credential envelopes | — | More envelopes than active worker jobs |
| Gateway certificate lifetime | Less than 30 days | Less than 7 days/expired/unreadable |
| Actual gateway TLS | Certificate differs from installed copy | Trust/name/handshake failure |

API readiness includes authenticated worker readiness and API persistence
health, not just an open port. The proxy has no Docker healthcheck: its running
state and a real, certificate-verified TLS handshake on VM loopback are checked.
The TLS probe is not an external DNS/NAT/BasicAuth test; it cannot detect a broken
public forwarding rule. Normal external HTTPS acceptance remains a separate gate.

All subprocesses/network calls have five-second timeouts; SQLite reads have a
one-second busy timeout and two-second query progress deadline. Each probe fails
independently. The unit has a 75-second overall bound, 128 MiB memory cap and 25%
CPU quota. Five-minute sampling is not real-time or an audit ledger: a failure
purged between samples can be missed. Long IMAP APPENDs can legitimately look
like stalled progress. Investigate; do not automatically rerun/mirror/delete.

The root filesystem currently holds Docker's data volumes too. If Docker or
metadata is moved to a separate filesystem, add a separate space/inode probe
before deployment. Cross-store counts are not an atomic distributed snapshot;
each individual worker read is consistent, including committed WAL data.

## Installation on the dedicated staging VM

Install only reviewed files from an exact Git commit, **not** a dirty checkout.
Preflight the fixed targets and their parents: root-owned, not writable by other
users, not symbolic links. Refuse unexpected existing files; preserve their
contents and compare before an explicit reviewed update. Do not run this on the
virtualization host.

- Install `scripts/staging_monitor.py` as root-owned mode 0644 at
  `/opt/movemailbox/scripts/staging_monitor.py`.
- Install the two matching files from `deploy/staging/` as root-owned mode 0644
  at `/etc/systemd/system/movemailbox-monitor.service` and
  `/etc/systemd/system/movemailbox-monitor.timer`.
- Run `systemd-analyze verify` on both units, `systemctl daemon-reload`, then
  `systemctl enable --now movemailbox-monitor.timer`.
- Run `systemctl start movemailbox-monitor.service` for the first sample.
  Existing API/worker/proxy must not be restarted.

The service manages `/var/lib/movemailbox-monitor` (root 0700), with a lock and
atomic `latest.json` (0600). It reads live databases with SQLite `mode=ro` and
`query_only`; its filesystem sandbox also denies writes to live volumes. SQLite
may need SHM creation if a writer is unavailable; a denied read becomes an alert,
not a reason to allow volume writes or change journal mode. The Docker socket is
privileged even though commands only inspect selected fields. This systemd
hardening is not a Docker authorization boundary or protection against root.

Read-only operator commands:

```sh
sudo systemctl list-timers movemailbox-monitor.timer
sudo systemctl status movemailbox-monitor.service --no-pager
sudo journalctl -u movemailbox-monitor.service --since '1 hour ago' --no-pager
sudo python3 -m json.tool /var/lib/movemailbox-monitor/latest.json
```

An alert exits 1 (unit failed until a healthy sample); internal monitor errors
exit 2 and log only `monitor.internal`, with exception text withheld. Repeated
incidents are deduplicated; severity changes and recoveries emit new events.
Every completed run emits a summary. Corrupt/insecure state fails closed rather
than silently resetting the baseline. Stop the timer before an intentional
maintenance window and restart it afterwards; do not hide genuine failures by
deleting the state file. Review any recovery before considering the incident closed.

## Alert delivery and certificate renewal

Current delivery is **local journal + root-private report only**. No Telegram,
email, webhook, off-host heartbeat or public status page is configured. If the
VM or timer dies, it cannot notify the operator itself. Before a public launch,
choose an owner-controlled outbound channel and an independent external
availability check; store webhook/SMTP credentials outside Git and test both
alert and recovery delivery with synthetic faults.

For a small pilot, a Telegram bot/channel is easy to operate but depends on that
service and sends operational metadata off-host. Email fits existing admin
workflows but needs authenticated SMTP and can be delayed/filtered. Do not send
addresses, job IDs, logs, envelope data or passwords through either channel.

Certificate issuance currently uses manual DNS-01. Monitoring does **not** renew
it. At the warning threshold schedule DNS verification/renewal, validate the new
certificate and key privately, then update the gateway copy and reload nginx
through the reviewed HTTPS runbook. A renewed source certificate without a
gateway reload is not a completed renewal; the served-copy comparison catches it.

## Focused verification

`python3 -m unittest discover -s scripts -p test_staging_monitor.py -v` runs on
Linux/WSL. It covers thresholds, expiry, queue delay, credential cleanup counts,
read-only committed WAL reads, recent versus old errors, independent failures,
TLS mismatch, redaction, dedup/escalation/recovery and unsafe/corrupt state.
Tests use local synthetic databases; do not fill the VM disk, stop a real worker
or load-test a mail provider just to exercise monitoring. Validate the installed
unit's actual healthy report and subsequent timer execution on the VM too.
