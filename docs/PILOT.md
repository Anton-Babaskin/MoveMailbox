# Real-mailbox MVP acceptance test

Status: **local-engine pilot executed 2026-09-07; remote-worker pilot verified
2026-09-08**. The initial lab had two containers but public mode was disabled,
so the real migrations on September 7 ran inside the API container. They did
not validate the remote-worker path. The
two Mail-in-a-Box servers completed protected IMAP connection checks, folder
discovery, one-way transfers in both directions, destination-subfolder mapping,
and a repeat without duplicates. The initial copying tests were non-destructive;
the separately authorized strict-mirror test is described below.
Automated demo and local protocol tests still do not replace a
broader provider pilot. Keep the public website in demo mode until release
gates in [ROADMAP.md](ROADMAP.md) are satisfied.

Observed pilot result: both directions completed with one synthetic message;
the repeat completed with zero new messages and the destination count remained
one. Mail-in-a-Box uses `.` as its hierarchy delimiter, and the adapter created
`MoveMailbox-Pilot.INBOX` / `MoveMailbox-Pilot-Reverse.INBOX` correctly.
The real backend also completed `justLogin` and `dryRun` jobs against both
servers with zero transferred messages and zero bytes.

An authorized strict-mirror check was then isolated to
`MoveMailbox-Strict-20260907.INBOX`: one destination-only synthetic message
was added, the dry-run left both messages intact, and the confirmed live run
finished with one message remaining. The remaining Message-ID matched the
source; the extra destination-only message was removed. No source message was
deleted. This test used the local engine; the remote-worker test is below.

## Remote-worker verification, 2026-09-08

The corrected lab requires public mode and checks `execution=remote-worker`
before declaring itself ready. It uses loopback HTTP for the test client, which
explicitly replays the guest cookie and CSRF token. This does not validate a
production HTTPS deployment.

- Both connection checks and folder reads succeeded through the worker.
- `justLogin` and `dryRun` completed without copying. A read-only IMAP check
  confirmed the new destination folder did not exist after dry-run.
- A copy to `MoveMailbox-Worker-20260908.INBOX` transferred one message (3277
  bytes); the repeat transferred zero. Content SHA-256, flags and internal date
  matched the source. Source INBOX and destination INBOX snapshots were unchanged.
- Missing CSRF was rejected with 403; another guest session received 404 for
  the migration job.
- Worker SQLite contained all four completed jobs with exactly one attempt
  each and zero remaining credential envelopes. This proves the separate
  worker executed the jobs rather than the API's local engine.
- Strict mirror was then tested in that same isolated destination folder with
  one newly appended synthetic extra message: dry-run preserved two messages;
  live mirror left the original one and removed the extra. Source content was
  unchanged. Both worker rows were completed with `attempts=1`, `no_retry=1`,
  and no remaining credential envelopes. This verifies the persisted retry
  guard, not behavior during an actual mid-transfer crash.

Crash recovery during a real large transfer, multiple providers, and load
testing are still pending on this corrected hosted path.

### Reusing the local lab

The corrected launcher always enables the protected gateway and verifies the
remote execution mode. In an open Ubuntu WSL terminal with Docker running:

```sh
sudo python3 scripts/start-local-pilot.py --name movemailbox-worker-pilot --port 8181
```

Existing resources are preserved; for a previously created lab use:

```sh
sudo docker start movemailbox-worker-pilot-worker movemailbox-worker-pilot-api
sudo docker stop movemailbox-worker-pilot-api movemailbox-worker-pilot-worker
```

Keep the WSL terminal open during testing: systemd services alone did not keep
this machine's WSL distribution alive. The lab uses loopback HTTP, not public
HTTPS. A non-browser client must replay the received cookie explicitly because
ordinary cookie jars do not send a Secure cookie over HTTP. Do not disable the
gateway to work around this; that would silently select the local engine.
Mailbox passwords are not part of the launcher or its container configuration.

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
