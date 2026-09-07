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
- run real-mailbox pilot tests; the crash drill deliberately uses the demo engine.
  Use [PILOT.md](PILOT.md) for the reproducible acceptance matrix; its status
  remains not executed until disposable provider accounts are tested.

Exit criteria: database dumps alone cannot decrypt credentials; the API retains
no worker private key; persisted migration envelopes are opened only after a
lease; forced restart/cancel tests pass with no plaintext credentials in storage.
Encrypted remnants may exist in WAL/backups and remain sensitive. Multi-replica
coordination belongs to stage 4, not the single-VPS preview.

## 4. Hosted data plane

- PostgreSQL store implementation and migrations;
- durable multi-worker queue and idempotent job commands;
- mailbox-size estimation before transfer;
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
