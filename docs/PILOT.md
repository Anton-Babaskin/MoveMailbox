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

### September 8 WSL Docker attachment and recovery drill

Backend `76aebfb`, image `movemailbox:quota-pilot`, actual separate worker and
real imapsync against the two authorized Mail-in-a-Box accounts:

- PASS: quota denial/admission, 6 MiB random attachment, exact content hash,
  flags and INTERNALDATE, and idempotent repeat. See [quota evidence](MAILBOX-QUOTA.md).
- PASS: cancel job `618863d2aab2fa35` while an imapsync process was present.
  The process exited, envelope cleanup completed, manual rerun
  `4d0559ee05612827` produced the expected single message. Repeat copied zero.
- PASS: forcibly killed the worker container while imapsync was present for
  job `ff7fca450c01c2d4`. Restart recovered that same job with exactly two
  attempts. Content/flags/date matched; repeat copied zero; envelopes were empty.
- PASS: source test message and both original INBOX snapshots stayed unchanged.
- PASS: existing demo Docker drill on the same image: API hard-kill/reconnect,
  worker hard-kill/retry, strict mirror not replayed after a kill, cancellation,
  preflight modes, guest isolation, no synthetic passwords in DB/WAL/log files.

Real cancellation/kill was observed after the child process started, not
guaranteed during an in-flight IMAP APPEND. The exact mid-literal cut is tested
below, together with lost acknowledgements after a successful server commit.

### Deterministic APPEND fault injection

The original proxy counted payload by receive chunks and did not prove an exact
cut. Its old exact-byte claim is superseded by the corrected September 8 run:

- Streaming parser tests verify fragmented/coalesced commands, CRLF and braces
  inside binary bodies, and synchronizing/non-synchronizing literal markers.
- Real imapsync 2.319 declared 8,610,095 literal bytes; the proxy forwarded exactly
  131,072 body bytes to the upstream TLS socket, then closed it. Exit code was 114.
- Read-only destination inspection found zero messages after the cut.
- Normal recovery and a subsequent repeat each left exactly one complete message;
  SHA-256, flags and INTERNALDATE matched the source. The source stayed unchanged.
- Target retained: `MoveMailbox-ProxyDrop-Exact-20260908.MoveMailbox-Attachment-546b1b366e`.

The test verifies TLS on source, destination and the test proxy (a temporary CA
trusted only by the test client). Mailbox passwords are supplied through Docker
stdin into the child environment, not command arguments or container config.
These are direct imapsync assertions; the test does not claim API/worker state
transitions for this exact fault. No test messages are deleted.

The additional `--lose-ack` scenario passed with the same pinned imapsync:
all 8,610,095 literal bytes reached the server; the proxy observed and withheld
the tagged APPEND success. imapsync exited 114 although the destination already
held the complete message. Recovery and repeat each retained exactly one message
with matching SHA-256, flags and INTERNALDATE; source unchanged. Target retained:
`MoveMailbox-ProxyDrop-Ack-20260908.MoveMailbox-Attachment-546b1b366e`.
The parser regression suite now contains eleven passing tests. This remains a
direct engine fault test, not an exact API/worker fault-state assertion.

The native execution-budget smoke test also passed: two synthetic source messages,
a 2-byte threshold, one whole message copied, second skipped, exit 118 and source
unchanged. Source folder `MoveMailbox-Budget-06f1f52d07b9` and its `-Copy` target
prefix remain for inspection. See MAILBOX-QUOTA.md for the whole-message overshoot
limitation and separate Go worker integration coverage.

### Full API/worker APPEND faults — September 9

`scripts/smoke-api-append-drop.py` now reproduces both faults with the actual
guest API, encrypted remote queue and native imapsync. Image
`movemailbox:api-append-pilot` contains backend `254959a` and pinned imapsync 2.319.
The worker alone receives a Docker host override and temporary trusted test CA;
API public-target validation stays enabled. The proxy binds only to the Docker
bridge gateway, verifies the real upstream certificate, and passes later
connections normally. This is an isolated test configuration, never production.

- Mid-literal: 131,072 of 8,610,095 bytes forwarded. Job `95273180d562ae68`
  completed automatically in two worker attempts; repeat `433077444ffc7b54`
  completed in one attempt with zero copied messages.
- Lost success reply: all 8,610,095 bytes forwarded and the tagged APPEND success
  withheld. Job `4c02f42bb0dc06b8` completed in two attempts; repeat
  `0732f04f41140a86` completed in one attempt with zero copied messages.
- Both destination inspections found exactly one matching SHA-256, flags and
  INTERNALDATE. Source fixture remained unchanged. Another guest received 404;
  worker SQLite contained zero terminal credential envelopes; service logs
  contained neither mailbox password.
- Stopped labs retained: `movemailbox-api-append-21cb3cea581f` and
  `movemailbox-api-append-b92ec7730d1c`. Destination prefixes are
  `MoveMailbox-APIAppend-21cb3cea581f` and `MoveMailbox-APIAppend-b92ec7730d1c`.
  No mail was deleted. Temporary certificates are removed, so these stopped
  fault labs cannot simply be restarted; rerun the harness for fresh trust.

Run in WSL with Docker administrator access and process-only `MM_SOURCE_*` /
`MM_DESTINATION_*` credentials:

```text
python3 scripts/smoke-api-append-drop.py --image movemailbox:api-append-pilot --folder MoveMailbox-Attachment-546b1b366e --allow-test-mail
python3 scripts/smoke-api-append-drop.py --image movemailbox:api-append-pilot --folder MoveMailbox-Attachment-546b1b366e --allow-test-mail --lose-ack
```

Use an existing isolated one-message attachment fixture; API port 8184 and
Docker bridge port 993 must be free. An initial immediate second run hit TCP
port reuse; SO_REUSEADDR was added before the successful lost-ack run. Fourteen
offline harness tests pass, including cleanup ownership on partial launch and
ensuring that the test host override applies only to the worker.
This establishes these two faults for Mail-in-a-Box, not every provider or a
production firewall/deployment. Strict mirror is intentionally not used.

### Backup validator regression and corrected restore

The original damaged-backup assertion was reversed: an `ok` integrity result
could pass incorrectly. The corrected test fails if a damaged sample is accepted.
The restore path now validates the entire pair before allocating restored resources:
checksums, SQLite integrity, required tables, terminal jobs, empty envelopes and
consistent states for shared job identities. Missing files are opened read-only
and cannot silently become empty databases. Ten Python regression tests passed.

Corrected Docker restore passed on September 8: original job `c382b899b4789989`,
new job after restore `30c1b0443d58914b`; owner isolation and no terminal replay
verified. Local backup retained at `/tmp/movemailbox-backup-o2d26iq_` in WSL.
Initial recovery harness attempts hit a Docker `top` formatting issue (PID is
required); the harness was corrected before the successful assertions above.

`scripts/smoke-live-recovery.py` reproduces the real recovery drill against an
explicit existing isolated quota lab; it requires `--allow-worker-kill` and
the same process-only credentials as the quota smoke test. It creates new
destination folders, retains mail/volumes and stops the named lab at the end.
The demo drill cleans up only its disposable generated test resources.

No real mailbox messages were deleted in these September 8 attachment/recovery
runs. Generated test folders remain for inspection. No production/VPS deployment
or backup-restore drill is implied by these results.

For each test record PASS/FAIL/NOT RUN, version, timestamps, expected/actual
counts and sanitized job ID/log excerpt. Remove mailbox credentials, cookies,
authorization headers and message bodies before sharing diagnostics. Revoke
app passwords after the test, then remove the disposable accounts yourself.

Before public launch also verify HTTPS, worker egress restrictions, key storage,
disk limits, metadata backup/restore and the actual free-tier quota. A passing
mailbox pilot alone does not establish public-service readiness.
