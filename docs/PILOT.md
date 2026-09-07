# Real-mailbox MVP acceptance test

Status: **pilot executed 2026-09-07 in the local Docker API/worker lab**. The
two Mail-in-a-Box servers completed protected IMAP connection checks, folder
discovery, one-way transfers in both directions, destination-subfolder mapping,
and a repeat without duplicates. The test did not use strict mirror or delete
any message. Automated demo and local protocol tests still do not replace a
broader provider pilot. Keep the public website in demo mode until release
gates in [ROADMAP.md](ROADMAP.md) are satisfied.

Observed pilot result: both directions completed with one synthetic message;
the repeat completed with zero new messages and the destination count remained
one. Mail-in-a-Box uses `.` as its hierarchy delimiter, and the adapter created
`MoveMailbox-Pilot.INBOX` / `MoveMailbox-Pilot-Reverse.INBOX` correctly.

## Prepare

- Install the exact candidate build and record its commit/version and imapsync
  version. Use app passwords where required and enter them in the utility only.
- Record provider names, ports and TLS modes, without passwords or tokens.
- In the source, create INBOX, Sent, an empty folder, a nested folder and a folder
  with Cyrillic characters. Add 20–30 synthetic messages, including an unread
  message, a flagged message, an old internal date and a 5–10 MB attachment.
- Keep a manifest of Message-ID, folder, internal date, flags and attachment
  SHA-256. Do not use real customer correspondence.
- In the destination, add one unique synthetic message as a preservation marker.
- Ensure the destination has enough free storage. The hosted 5 GB limit is not
  yet an enforced product guarantee; do not advertise unrestricted public use.

## Execute in order

| Test | Expected result |
| --- | --- |
| Check both connections | Both succeed; incorrect app password returns a useful error without exposing it. |
| Check credentials only | No folders or messages are created or changed. |
| Show folder sizes only | Sizes/counts appear in the technical log; neither mailbox changes. |
| Dry run | The planned operations appear, but both accounts remain unchanged. |
| Create folders only | Selected structure is created; no messages are copied. |
| Copy into a destination subfolder | Messages arrive inside that subfolder; source and destination marker remain unchanged. |
| Select only one nested folder | Only the selected folder's contents are copied. Check provider delimiter mapping. |
| Repeat the same copy | No duplicate messages appear in the same mapped destination folders. |
| Compare against manifest | Message bodies, attachments, supported flags and internal dates are preserved. |
| Stop during a larger copy | Stop is acknowledged; subsequent refresh shows a terminal state. Manually rerun to complete. |
| Restart API while copying | Existing job is recovered, not replaced by a second transfer. |
| Restart the worker container | Non-destructive job recovers within configured retry/expiry limits. Native worker recovery is deliberately different; see WORKER.md. |

Provider-specific folder aliases and Gmail labels can change apparent folder
counts and aggregate bytes. Compare message identity and content, not only
totals. Investigate every unexplained difference.

## Destructive mode: separate, optional test

Use a **new disposable destination** containing only synthetic data for this
test. Record the exact source, destination and selected folders before starting.
Never reuse a business mailbox. First run a confirmed strict mirror with Dry
run enabled and inspect its deletion plan. Then, only if the plan is correct,
disable Dry run and explicitly confirm the destructive operation again. Verify
that only destination-only messages in the mapped scope are removed and the
source remains unchanged. A failed/interrupted strict mirror must not retry
automatically. Do not enable folder deletion: MoveMailbox uses `--delete2`, not
`--delete2folders`.

## Record and close

For each test record PASS/FAIL/NOT RUN, version, timestamps, expected/actual
counts and sanitized job ID/log excerpt. Remove mailbox credentials, cookies,
authorization headers and message bodies before sharing diagnostics. Revoke
app passwords after the test, then remove the disposable accounts yourself.

Before public launch also verify HTTPS, worker egress restrictions, key storage,
disk limits, metadata backup/restore and the actual free-tier quota. A passing
mailbox pilot alone does not establish public-service readiness.
