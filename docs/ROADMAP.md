# MoveMailbox public-readiness roadmap

This roadmap turns the local preview into a hosted product through small,
reviewable releases. A stage is complete only when its exit criteria pass; a
marketing launch date must not bypass a security gate.

## 1. Durable local core — complete

- versioned SQLite implementation behind a job `Store` interface;
- credential-free job snapshots and bounded diagnostic events;
- restart recovery: interrupted work becomes an explicit failed job;
- persistent Docker volume and storage health signal;
- unit, secret-leak, restart and cross-platform build coverage.

Exit criteria: green race-enabled CI, hardened Docker smoke test and a real
Windows restart test with history restored and no password bytes in SQLite.

## 2. Public gateway and identity — in progress

- automatic guest sessions, with no login wall before a free migration;
- short-lived sessions in `HttpOnly`, `Secure`, `SameSite` cookies;
- CSRF tokens for every state-changing browser request;
- global, per-IP and per-session rate/concurrency limits;
- ownership checks on every job, event stream and cancellation request;
- public-target validation for hostnames/IP addresses and IMAP ports;
- optional verified email for free recovery and completion notifications;
- passwordless email verification for one-time paid transfers;
- accounts required only for persistent paid history and business teams;
- login, security and administrative audit events without credentials.

Exit criteria: an anonymous client cannot enumerate or mutate jobs, cross-user
access tests pass, and the application is safe behind an HTTPS reverse proxy.

The identity model is progressive: a visitor receives an opaque guest session
without seeing a login screen, may attach a verified email without interrupting
a free job, and can pay for a one-time transfer through a magic link. A full
account is needed only for persistent paid history or business features.

## 3. Secure credential envelopes and workers — implementation complete; deployment gates pending

Implemented in the current slice:

- AES-256-GCM envelopes with a derived per-job key and authenticated metadata;
- ciphertext-only SQLite storage, expiry cleanup and renewable exclusive leases;
- a separate one-job worker process with a redacted JSON-lines protocol;
- connection tests and folder discovery through transient encrypted workers;
- deletion after normal completion, failure and cancellation;
- tamper, wrong-key, expiry, concurrent-lease and plaintext-leak tests.
- an independent authenticated worker HTTP service and separate worker volume;
- X25519 recipient encryption so the API holds no decrypting key;
- a durable worker queue with bounded events/results and bounded retries;
- API detach/reconnect behavior and interrupted-worker recovery;
- a non-root worker Compose service with independent resource limits.
- atomic staged admission, idempotent activation and cancellation tombstones;
- one service owner per SQLite database and consistent event snapshots;
- no automatic retry for destructive strict mirror;
- a reproducible API/worker hard-kill drill for Windows processes and CI containers.

Remaining before this stage is complete:

- validate the production egress firewall and secret-manager/KMS deployment;
- run the remaining production deployment checks. A real two-way Mail-in-a-Box
  pilot, preflight checks, repeat-without-duplicates and an authorized strict-
  mirror test are recorded in [PILOT.md](PILOT.md); broader provider coverage
  and the VPS deployment gate are still pending.
- The September 8 corrected hosted pilot additionally verified actual worker
  job rows, content/flags/internal dates, guest isolation, CSRF rejection,
  strict mirror and terminal envelope cleanup. The September 7 transfers
  exercised the local engine despite the presence of a worker container.

Exit criteria: database dumps alone cannot decrypt credentials; the API retains
no worker private key; persisted migration envelopes are opened only after a
lease; forced restart/cancel tests pass with no plaintext credentials in storage.
Encrypted remnants may exist in WAL/backups and remain sensitive. Multi-replica
coordination belongs to stage 4, not the single-VPS preview.

## 4. Hosted data plane

- PostgreSQL store implementation and migrations;
- durable multi-worker queue and idempotent job commands;
- mailbox-size estimation before transfer;
- Implemented September 8: worker-owned whole-mailbox admission check, default
  decimal 5 GB, independent of folder selection; permanent fail-closed rejection.
  See [mailbox quota](MAILBOX-QUOTA.md) for tests and snapshot limitations.
  Whole-message execution-time guard now fails permanently on native exit 118;
  strict byte accounting and per-customer cumulative quotas remain pending.
- September 9: growth after both inventories verified through the guest API and
  real worker/imapsync: one whole message over budget retained, second skipped,
  permanent failure in one attempt, credentials removed. This is the documented
  whole-message guard, not a hard traffic cap. See PILOT.md.
- WSL Docker verification passed on September 8: actual worker quota rejection,
  6 MiB attachment integrity/flags/date, zero-duplicate repeats, real imapsync
  cancellation and worker SIGKILL recovery with two attempts. See PILOT.md.
  Production backup retention remains pending.
- September 8: key separation verified by unit tests; coordinated deployed key
  rotation remains pending. Corrected backup validation rejects corrupt/truncated,
  missing and inconsistent pairs; clean Docker restore passes. See PILOT.md.
- September 8 corrected streaming proxy: exact 131,072-byte APPEND cut, exit 114,
  zero committed partial messages, successful recovery and repeat without duplicates.
  Lost acknowledgements after commit also pass with one complete message after
  recovery and repeat. September 9: both exact faults also pass through the
  guest API and encrypted remote worker queue, automatic recovery in two attempts,
  no duplicates, guest isolation and terminal envelope cleanup. See PILOT.md.
- Production backup/off-site runbook is documented; encrypted provider drill remains.
- September 9: worker event-write failure no longer allows false success; a
  permanent failure and cleanup are tested when terminal writes remain available.
  Real SQLITE_FULL snapshot rollback and recovery are covered without filling the
  host disk. Container-level ENOSPC admission now passes: 503 with no partial
  job/envelope; new work succeeds after freeing bounded tmpfs, without restart.
  Active demo-transfer ENOSPC now passes too: pending terminal writes recover
  after capacity returns without replay; worker reports unavailable while pending.
  Crash during pending terminal commit now passes in the demo Docker drill:
  no-resume and mirror fail without replay; opted-in ordinary copy resumes after
  lease expiry. Combined live-IMAP ENOSPC/crash remains a gate. See PILOT.md.
- configurable free-tier, mailbox-size and concurrency quotas;
- resumable dashboard event delivery and retention policies;
- backups for metadata only, with tested restoration.

Exit criteria: a VPS restart does not lose accepted jobs, two workers cannot
execute the same lease, and quota decisions remain consistent under load.

## 5. Operations and commercial readiness

- structured redacted logs, metrics, alerts and a status page;
- privacy policy, terms, refund rules, subprocessors and retention schedule;
- final MoveMailbox license/distribution decision and third-party notices;
- signed desktop artifacts and a documented update channel;
- idempotent payment webhooks and configurable credits/prices;
- incident, rollback and key-rotation runbooks.

Exit criteria: restore and rollback drills pass, alerts have owners, and legal
and payment flows match the actual data handling and product limits.

## 6. Pilot and launch gate

- real migrations between disposable accounts on multiple providers;
- folders, flags, dates, Unicode names, large messages and rerun verification;
- cancellation, provider throttling, network loss and low-disk tests;
- load, abuse and external security review;
- limited invite-only pilot before opening self-service registrations.

For this stage we will need a VPS and disposable test mailboxes. Credentials
should be entered directly into the deployed secret mechanism or temporary
local UI, not pasted into issues, commits, screenshots or chat history.
