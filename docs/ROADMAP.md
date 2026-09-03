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
- optional verified email for recovery and completion notifications;
- accounts required only for paid history, purchases and business teams;
- login, security and administrative audit events without credentials.

Exit criteria: an anonymous client cannot enumerate or mutate jobs, cross-user
access tests pass, and the application is safe behind an HTTPS reverse proxy.

The identity model is progressive: a visitor first receives an opaque guest
session, may attach a verified email without interrupting a job, and only needs
a full account when buying or using business features.

## 3. Secure credential envelopes and workers

- separate API and worker processes;
- per-job authenticated encryption for IMAP credentials;
- a master key supplied by an external secret manager, never the database;
- short credential expiry and guaranteed deletion after completion/cancel;
- leased jobs with bounded retries, graceful draining and stuck-job recovery;
- isolated non-root worker containers with CPU, memory, PID and wall-time limits.

Exit criteria: database and backup dumps cannot decrypt credentials, only the
leased worker can open an envelope, and forced-restart tests leave no reusable
credential material.

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
