# Operator email alerts

The VM monitor and SMTP delivery are separate services. A failed monitor does
not prevent delivery: unreadable or over-15-minute-old reports become fixed
critical alerts. If the entire VM/network is down, it cannot send email; an
independent external uptime check remains necessary.

## Private configuration

Use a dedicated authenticated SMTP account, preferably restricted to the
operator sender. Obtain the SMTP host, port, username, sender and operator
recipient from the owner. Never reuse disposable migration mailbox credentials
without explicit authorization. The password must not enter chat, CLI arguments,
Git, environment dumps or logs.

Install the reviewed script beside `staging_monitor.py` and the matching
`movemailbox-notify.service` / `.timer` on the dedicated VM. Existing target
files must be inspected and preserved before an explicitly reviewed update.
The script files and units are root-owned 0644, not links. Validate both units
with `systemd-analyze verify`, then reload systemd. No API/worker restart or
firewall change is needed.

Create the root-private config in an interactive SSH terminal:

```sh
sudo python3 /opt/movemailbox/scripts/staging_notify.py --configure
```

It prompts for public SMTP settings and then uses hidden password input. It
refuses non-interactive input, links/insecure parents, malformed settings and
overwriting an existing configuration. The root-owned 0600 JSON file is
atomically created at `/etc/movemailbox/notify.json`. Choose `tls` for implicit
TLS (usually 465), or `starttls` (usually 587); plaintext SMTP is not supported.
Both paths require normal certificate/hostname verification and TLS 1.2+.

Config keys are exactly `host`, `port`, `security`, `username`, `password`,
`from`, `to`. The recipient is a single operator address. To rotate or correct
settings, use root-controlled secure editing, retain mode 0600 and inspect the
result privately. Never display the file in a terminal transcript or ticket.

Enable the timer and test delivery:

```sh
sudo systemctl enable --now movemailbox-notify.timer
sudo systemd-run --wait --pipe --collect --unit=movemailbox-notify-test \
  -p StateDirectory=movemailbox-notify -p StateDirectoryMode=0700 \
  -p TimeoutStartSec=45 -p UMask=0077 \
  /usr/bin/python3 /opt/movemailbox/scripts/staging_notify.py --test
sudo systemctl start movemailbox-notify.service
```

`--test` sends one explicitly synthetic email, without changing the incident
baseline. SMTP acceptance is not proof of inbox delivery: the owner must confirm
receipt/spam placement. The regular unit has bounded CPU/RAM/PIDs, a 45-second
overall deadline and no write access to application data. Without config it
reports `notify.disabled` and sends nothing.

## Delivery semantics

- Only allowlisted check identifiers, warning/critical severity and UTC time
  leave the VM. No queue payload, mailbox address, job ID, message or password
  is included. The configured sender/recipient are naturally visible to SMTP.
- First healthy observation sends no email. New alerts, escalation and recovery
  send one aggregated message; unchanged state is deduplicated.
- `/var/lib/movemailbox-notify/delivered.json` is a separate private baseline,
  advanced only after SMTP accepts the message. Failed sends retry at the next
  five-minute tick, even if the local monitor already logged the transition.
- This is at-least-once, not exactly-once delivery. A crash or lost SMTP reply
  after acceptance but before baseline persistence can produce a duplicate.
  A transient incident that arises and clears entirely between successful
  delivery samples can be missed; this is not an audit/event history service.
- Logs contain only fixed `notify.*` events and counts, never SMTP response
  bodies or credential values. `notify.failed` needs operator investigation.
  Corrupt/insecure delivery state fails closed rather than being silently reset.

Inspect `systemctl list-timers movemailbox-notify.timer` and the unit's journal
without printing private config. Test alert/recovery through isolated synthetic
reports, not by stopping a real worker or filling the live disk. CI covers
TLS-before-login, rejection without STARTTLS, redaction, deduplication, retry,
stale reports, private-file checks and hidden configuration input.

References: [Python SMTP](https://docs.python.org/3/library/smtplib.html),
[monitoring](STAGING-MONITORING.md).
