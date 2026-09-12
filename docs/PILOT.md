# Real-mailbox MVP acceptance test

### September 12: merged-main deployment and second real-mail acceptance

Main `bc80040` was deployed as `staging-bc80040`, digest
`sha256:07761ebafcdb3fccce8ba420f1be2e47aa5508a5fae2730ed65360ae5e0f1e7f`,
with the old digest retained for rollback. The build passed Go and real imapsync
TLS/STARTTLS certificate tests; isolated worker restart/retry/key/token rotation
and secret-leak checks also passed.

A drained stopped snapshot made through SQLite Backup API passed hashes,
integrity, terminal-state and cross-store validation. A preceding main-file-only
copy was rejected because committed worker state remained in WAL; it was never
accepted as rollback evidence.

Post-deploy private-stage checks and verified TLS to both authorized servers
passed. A new 13-job pilot passed preflight/no-write modes, folders-only,
destination subfolder, both directions, exact 6 MiB attachment hash/flags/date,
zero-copy repeats, cancellation recovery and worker-SIGKILL recovery. Sources
and INBOXes stayed unchanged; guest isolation and database integrity passed;
there were no active jobs/envelopes or plaintext test passwords in inspected
DB/WAL/SHM/logs. Fixture `MoveMailbox-Stage-73f998de0f3e` remains for inspection.
No strict mirror, deletion, other-provider, public-browser, reboot or off-site
restore claim is made by this result.

### September 12: real-mail acceptance on the deployed closed VM

`scripts/smoke-private-staging-mail.py --allow-test-mail --allow-worker-interrupt`
passed against the existing protected API and independent native imapsync worker.
Application version `staging-be9af16`, image
`sha256:15d062fa52b8d9bb3e3cdea83045e4481ae72eb7476be87087404ccaafd476b3`.
The owner explicitly resumed testing; secrets were sent through SSH stdin and
were not written to credential files, command-line arguments or Git.

| Check | Evidence / result |
| --- | --- |
| Login and discovery | Both accounts authenticated through the worker with verified TLS; selected nested source folders discovered |
| Login-only, sizes-only, dry-run | Jobs `51282db515e38837`, `72c960ea7ff0ace8`, `40b02ef47d06fd3e`; zero messages copied, no destination folders created |
| Folders-only | `6fd4cdba61d7b6a7`; selected hierarchy created empty |
| Forward copy / repeat | `fe2db9dc11c33293` / `b9e9a5ca42202944`; two / zero messages copied |
| Reverse copy / repeat | `de65f8b1354229f1` / `aa9117c8375db6f6`; two / zero messages copied |
| Cancel during native process | `1b3fad863fbb1aa0` cancelled; `cfa398eeb4576e5c` completed; repeat `12741ec6285eeb8f` copied zero |
| Worker SIGKILL / recovery | `39afdbdae63d384a` recovered to completed in two attempts; repeat `12d884131d735709` copied zero |
| Integrity and isolation | Message SHA-256, flags and INTERNALDATE exact in both directions and after interruptions; original INBOXes and source fixture unchanged; another guest cannot read/cancel any of the 13 jobs |
| Storage and credentials | Both SQLite databases pass integrity checks; zero terminal envelopes; neither raw password found in inspected DB/WAL/SHM or stdout/stderr service logs |

Synthetic prefix `MoveMailbox-Stage-3bb3565c5ff4` is retained in the disposable
accounts. Two source messages include Unicode text and a 6 MiB random attachment;
copy/return/cancel/kill destination subfolders remain for inspection. No message
was deleted. API and worker were healthy after the test; API was not restarted.
The existing private-stage acceptance checks also passed, including actual
network denials, CSRF, host restrictions and TLS to the two authorized hosts.

Limits: tests use the VM's loopback API with explicit Secure-cookie replay,
not a public browser HTTPS flow. Cancellation/SIGKILL occur while native imapsync
is present; this is not an exact APPEND-byte fault. Earlier isolated proxy drills
cover that separately. This run did not repeat strict mirror, quota growth,
key rotation, off-site restore, full VM reboot or additional provider coverage.
Passing these fixtures is not a universal exactly-once or public-launch guarantee.

The six new offline tests cover unsafe account input, fixed TLS/port policy,
foreign/non-running queue interruption refusal, inclusion of stderr in secret
scans and worker restart after a kill CLI error/timeout. The latter cleanup guard
was added after the live pilot and verified offline, not by another mailbox run.
Local WSL suite: 41 passed, one crypto integration test skipped because
age tools were absent. CI installs the pinned tools and must be checked separately.

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

### Storage write failures — September 9

- Regression reproduced before the fix: a worker event INSERT rejected by a
  SQLite trigger could still result in `completed` if the engine returned nil
  after cancellation. Worker now latches event-write failure, cancels the engine
  and records permanent failure before considering the engine success result.
- `TestEventPersistenceFailureCannotReportSuccess` verifies one attempt, explicit
  persistence failure, terminal envelope deletion and a successful new job after
  removing the injected fault. This uses the real worker HTTP service and SQLite,
  with a simulated migration engine; it is not a live IMAP/disk-exhaustion drill.
- `TestSQLiteFullRollsBackSnapshotAndRecoversAfterCapacityRestored` constrains
  `PRAGMA max_page_count` and asserts actual SQLite error code 13 (`SQLITE_FULL`).
  A failed snapshot update leaves the previous record intact; increasing capacity
  permits the update and `PRAGMA integrity_check` returns `ok`.
- These tests do not exhaust the host filesystem or prove handling of every WAL,
  fsync or read failure. If storage cannot accept even terminal state/cleanup,
  immediate durable failure and envelope deletion cannot be guaranteed; repairing
  storage and reviewing interrupted work remain necessary. Container-level ENOSPC
  at admission and during an active demo migration is now covered below.
  The full API growth test is recorded below.

### Active worker ENOSPC and terminal-state recovery — September 9

Reproduced a backend defect with a SQLite terminal-write rejection: after the
engine returned, the job stayed `running` even after the database was repaired.
The worker now retains its execution slot and retries only the failed terminal
transaction (250 ms interval; bounded individual writes), never the IMAP operation.
Pending terminal writes make `/healthz` return 503 with `storage-unavailable`.
After storage recovers, failure state and envelope removal commit atomically.
Even if the engine returned success, a lost final commit is reported conservatively
as failure requiring review; already copied mail is retained.

`TestFinalWriteFailureRecoversWithoutReplayingEngine` covers the regression,
degraded availability, repair without restart, one engine attempt and cleanup.
`scripts/smoke-worker-enospc.py --active` additionally passed with an actual full
8 MiB tmpfs and the demo engine on image `movemailbox:active-enospc` (version label
`active-storage-test`, containing this change):

- Started job `152573d1bb202e67`, verified worker `running` and persisted events,
  checkpointed WAL, then exhausted storage. No false successful API result.
- Worker became unavailable while its terminal transaction could not commit.
- After truncating only the validated filler, the same job became `failed` in
  one attempt; zero envelopes. New job `4aad49e37e2f6cf7` completed without restart.
- SQLite integrity, guest isolation and synthetic-secret log checks passed.
  Lab `movemailbox-enospc-bdd03465ceb7` stopped; ephemeral worker tmpfs discarded,
  API volume retained. No real mailbox was accessed. Both ENOSPC modes run in CI.

Operational limit: pending terminal recovery is in memory. Restore capacity before
restarting the worker where possible; do not use this readiness failure to trigger
automatic restarts. A crash during the outage still follows interrupted-job
recovery policy and is not covered by this no-replay guarantee. Existing strict-
mirror guards remain in effect. The subsequent crash-policy matrix is below;
live-IMAP ENOSPC remains separate, as demo tests do not prove message integrity.

### SIGKILL during pending terminal write — September 9

The ENOSPC harness now supports `--active --crash`. A restricted holder container
keeps the same bounded tmpfs volume mounted across worker SIGKILL; this avoids
mistaking an empty database after tmpfs unmount for successful crash recovery.
The test verifies the original `running` record with one attempt after the kill,
frees only its filler and restarts the original worker with its original keys.
The demo engine never connects to IMAP. On image `movemailbox:active-enospc`
(backend code from `7a15597`), all three policies passed:

| Policy | Original job | Final state / attempts |
| --- | --- | --- |
| Resume disabled | `6728b41b8c80ed35` | failed / 1 |
| Resume enabled, ordinary copy | `6c9d8a3ec3ff4b7b` | completed / 2 |
| Resume enabled, strict mirror | `39282f38e63f8805` | failed / 1 |

Every case verifies terminal envelope cleanup, a new successful job after repair,
SQLite integrity, guest isolation and absence of synthetic passwords in logs.
Retained stopped labs: `movemailbox-enospc-d9fab134ca37`,
`movemailbox-enospc-89361ec76f2b`, `movemailbox-enospc-08a01f666496`.
Worker tmpfs was discarded only after each holder stopped. API volumes remain.

The resume-enabled case respects the existing credential lease, which may survive
the crash for 30 seconds. The initial 20-second harness deadline was insufficient;
recovery now allows 75 seconds and polls every two seconds to stay within guest
request limits. Failed harness attempts are not counted as passing product tests.

```text
sudo python3 scripts/smoke-worker-enospc.py --image movemailbox:active-enospc --active --crash
sudo python3 scripts/smoke-worker-enospc.py --image movemailbox:active-enospc --active --crash --resume-interrupted
sudo python3 scripts/smoke-worker-enospc.py --image movemailbox:active-enospc --active --crash --resume-interrupted --strict-mirror
```

All three commands also run in CI. Recovery policy itself was not changed: the
standalone worker defaults to resume disabled, while the current Compose setup
enables supervised interrupted-job recovery. An uncertain ordinary copy may
therefore execute again after restart; only the no-resume policy and strict-mirror
guard avoid that replay. This test proves metadata/worker behavior with a demo
engine, not real-mail idempotence under combined ENOSPC + process crash.

### Actual container ENOSPC at admission — September 9

`scripts/smoke-worker-enospc.py` passed twice on backend `07fb9de` in image
`movemailbox:growth-pilot`. The worker uses the demo engine and an isolated
8,388,608-byte tmpfs volume. No IMAP connections or real credentials are used.

- Confirms Docker volume driver/options, destination mapping, actual tmpfs type
  and exact capacity before filling only `/fault/filler`. Bounded dd returns
  `No space left on device`; statfs confirms zero available blocks.
- Guest API rejects new work with 503. API job list and worker job/event/envelope
  tables remain empty: no partial admission and no fake successful job.
- Truncating only the verified regular filler file restores capacity. Without
  restarting either service, a new job completes in one attempt, terminal
  envelopes are absent, SQLite integrity is `ok`, another guest gets 404 and
  synthetic passwords are absent from service logs.
- Latest retained lab: `movemailbox-enospc-6f87038be6b7`, recovery job
  `c666b236d613265d`. Earlier successful job: `b2bf54bd6b6c5647` in
  `movemailbox-enospc-018ac609122e`. Containers stopped; worker tmpfs contents
  discarded on unmount, API volumes retained. No mail or user files deleted.

Initial harness attempts stopped before filling because of mount inspection and
SQLite permissions. Docker tmpfs metadata handling was corrected and the dedicated
directory uses uid/gid 65534 with mode 0770. A normal WSL run then passed; namespace
switching is not required. The host disk is never filled.

```text
sudo python3 scripts/smoke-worker-enospc.py --image movemailbox:growth-pilot
```

Needs local Docker administrator access and free API port 8186; also runs in CI
against its freshly built image. This proves admission rollback/recovery under
actual ENOSPC, not an active transfer losing its final commit, host power loss,
fsync failure, or durability after restarting a deliberately ephemeral tmpfs.

### Growth after admission through the guest API — September 9

`scripts/smoke-api-growth.py` passed on `movemailbox:growth-pilot` (backend
`07fb9de`, pinned imapsync 2.319). A temporary executable wrapper pauses native
imapsync after both real whole-mailbox inventories succeed. It preserves the
worker's arguments/environment; the test adds mail then releases execution.
Neither API validation, TLS verification nor server-owned quota is bypassed.

- Job `5a66a4da0f32b392`: budget 12,000,000 bytes; two distinct synthetic messages
  of 12,317,565 bytes each added only after the execution gate was reached.
- Exactly one complete message copied; the second was skipped. Its SHA-256,
  flags and INTERNALDATE match. Both source messages remain unchanged.
- Guest API reports mailbox-policy failure; worker SQLite confirms `failed`, one
  attempt and zero credential envelopes. Another guest gets 404. Mailbox passwords
  are absent from service logs.
- Stopped lab retained: `movemailbox-growth-0f8dcd8c3cc2`; source fixture
  `MoveMailbox-Growth-0f8dcd8c3cc2`; destination
  `MoveMailbox-Growth-0f8dcd8c3cc2-Copy.MoveMailbox-Growth-0f8dcd8c3cc2`.
  Two source messages and one destination message are retained; nothing deleted.

This proves the documented whole-message guard, **not** a hard traffic cap:
the last message exceeded the budget by 317,565 bytes. No automatic retry occurs.
It does not cover cumulative per-customer billing or incoming mail in folders
not selected for copying.

Reproduce in WSL with Docker administrator access and process-only MM_* secrets:

```text
python3 scripts/smoke-api-growth.py --image movemailbox:growth-pilot --limit-bytes 12000000 --allow-test-mail
```

API port 8185 must be free. Use a disposable source whose **entire mailbox** is
initially below the limit; retained fixtures from a previous run may prevent a
second admission. The harness limits its budget to 20 MB to bound test writes.
It stops only containers it created, removes its temporary wrapper and retains
volumes/mail. Recreate the lab rather than restarting it with a missing wrapper.
Fifteen offline Python harness tests pass, including distinct above-budget fixtures.

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

### September 10: real copy, ENOSPC finalization and worker crash

Both runs used `smoke-worker-enospc.py --active --real-imap` in WSL Docker,
native imapsync with verified TLS, public guest API and encrypted worker queue.
Backend code is unchanged from merged PR #8 (`main` baseline `5315ce2`);
local image `movemailbox:active-enospc`, image ID
`sha256:61f822837e672731c9d3a00d891b063d6a8053d6eee402a14323cb3bb5826328`.

The existing one-message 6 MiB attachment fixture was copied into a unique
destination subfolder. A test-only wrapper held process exit after native copy
success. The harness verified destination hash/flags/date, checkpointed SQLite,
filled a validated **8 MiB tmpfs** (not the host disk), then released the wrapper.
Actual ENOSPC and zero available blocks were asserted. Worker became unavailable
while final state could not commit and never reported false success.

| Case | Original job | Result after capacity returned | New repeat |
| --- | --- | --- | --- |
| No restart | `6b32adb3fdd4afcf` | failed, 1 attempt, envelope removed | `cd934e3b094d7bb2`, completed, zero copied |
| SIGKILL, ordinary resume opted in | `fa6938ea88dbfc37` | completed, 2 attempts, envelope removed | `613a87c332847a08`, completed, zero copied |

For the crash case a holder kept the **same** tmpfs/database mounted; the
running record survived SIGKILL. Restart respected the retained lease before
retrying. Both final mailbox snapshots matched the original SHA-256, flags and
INTERNALDATE, with exactly one message. Source remained unchanged. Both databases
passed integrity checks, terminal envelopes were empty, another guest got 404
and neither mailbox password appeared in service logs.

Stopped labs: `movemailbox-enospc-c356b76be83a` and
`movemailbox-enospc-a518382c5e80`. Mail retained under destination prefixes
`MoveMailbox-Storage-88e36149cb7e` and `MoveMailbox-Storage-25b62554b8f6`.
No mail deleted. Only the exact test filler file was truncated. Worker tmpfs
data disappeared after the last holder stopped; ordinary lab volumes remain.
The temporary wrapper bind mount is removed: rerun, do not restart these labs.

To reproduce, supply authorized disposable `MM_SOURCE_*` and `MM_DESTINATION_*`
credentials via the local process environment, not shell arguments or Git:

```text
python3 scripts/smoke-worker-enospc.py --image <current-image> --active --real-imap --allow-test-mail --folder MoveMailbox-Attachment-<fixture>
python3 scripts/smoke-worker-enospc.py --image <current-image> --active --real-imap --allow-test-mail --folder MoveMailbox-Attachment-<fixture> --crash --resume-interrupted
```

This opt-in live mode refuses strict mirror and non-isolated fixtures. Default
CI modes remain demo-only and never access external mail. Four new offline
tests cover native exit preservation, exact arguments/environment, bounded gate,
restart bypass and unsafe CLI combinations (19 total tests passed). An initial
unit-fixture path substitution bug was fixed before that passing run.

Limit: the combined fault is at **finalization after APPEND**, not during its
literal. The earlier exact APPEND disconnect/lost-ACK drills remain separate.
This confirms recovery for the tested Mail-in-a-Box fixture, not all providers,
production storage, destructive mirror, or a public deployment.

### September 10: rotation and encrypted backup stages

The Docker remote-worker rotation drill passed: a non-drained queue is refused
by the read-only backup/rotation gate; the old key finishes its accepted job;
after drain, a fresh snapshot passes. Missing private key, mismatched recipient
key and stale internal token all fail closed. API/worker recipient public/private
halves and the bearer token were then rotated together; a new 954-message demo
job completed and existing owner history remained available. Worker liveness is
public at `/healthz`; authenticated availability is `/v1/health`.

`backup_archive.py` now provides four operator actions: `seal`/`open` for age
encryption, and `put`/`get` for an atomic directory object-store model. It uses
only drained paired SQLite databases, excludes worker keys and mailbox data,
checks SHA-256/SQLite integrity, refuses links/traversal/oversized members,
rejects incomplete uploads and never overwrites a target. Age v1.3.2 integration
passed with wrong-key, tamper and truncation cases. The encrypted Docker demo
then restored into empty volumes and completed a new migration without replay.
The local object directory is not an off-site provider; that remains a VPS gate.

Before public launch also verify HTTPS, worker egress restrictions, key storage,
disk limits, metadata backup/restore and the actual free-tier quota. A passing
mailbox pilot alone does not establish public-service readiness.
