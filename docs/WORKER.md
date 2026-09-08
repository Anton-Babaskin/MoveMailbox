# Independent worker: single-VPS preview

This topology separates the public API from the component that can decrypt
mailbox credentials. It is **not yet approval for an unrestricted public launch**.
Keep the free flow guest-based; worker authentication is internal infrastructure,
not an extra login for visitors.

## Roles and secrets

| Role | Receives | Persistent storage |
| --- | --- | --- |
| API | worker public key, internal token, session signing secret | owner/job history without passwords |
| Worker | worker private key, internal token | encrypted envelopes, leases, bounded events/results |
| imapsync child | current job's mailbox credentials | tmpfs working directories in Compose |

The API must never receive `MOVEMAILBOX_WORKER_PRIVATE_KEY`. It refuses startup
if that variable is populated. The worker removes its key/token environment
variables before spawning imapsync. Privileged operators can still inspect
process memory or environment; use a dedicated account and restrict host access.

## Compose setup

1. Build the image: `docker compose build`.
2. Generate one set of keys with `movemailbox keygen` (or
   `docker run --rm movemailbox:local keygen`) into a **new private file**. On
   Linux set `umask 077` before redirecting output. Never overwrite an existing
   key file while jobs are pending, and never paste its contents into chat/issues.
3. Add `MOVEMAILBOX_PUBLIC_MODE=true`, a random session secret of at least 32
   bytes, and `MOVEMAILBOX_ALLOWED_HOSTS=movemailbox.com` to that private file.
4. Use it for Compose interpolation only:
   `docker compose --env-file .env.hosted --profile hosted up -d --build`.
   Do not pass the whole file as the API's `env_file` and do not source it into
   the native API process.
5. Put a trusted HTTPS reverse proxy in front of loopback port 8080. Do not
   publish port 8090. Apply the worker egress firewall before testing real mail.

Compose mounts distinct API and worker volumes. Both are initialized with the
image's non-root ownership. It enables internal HTTP only on its private Docker
network and enables interrupted-job recovery because terminating the container
also terminates imapsync children. If the API and worker move to different hosts,
use HTTPS (or an authenticated encrypted private transport); the bearer token
and returned metadata are **not encrypted by credential envelopes**.

One API and one worker service are supported. Each worker service can run several
jobs, but two services must not share its SQLite database. An OS-level lock
rejects a second process; keep the database on a local disk, not NFS or a shared
filesystem. PostgreSQL/distributed fencing are separate roadmap work.

## Worker-service settings

| Environment | Default | Meaning |
| --- | --- | --- |
| `MOVEMAILBOX_WORKER_DATABASE` | `/data/worker.db` | native path; Compose uses `/worker-data/worker.db` |
| `MOVEMAILBOX_WORKER_MAX_CONCURRENT` | `2` | migration and connection/folder operation slots |
| `MOVEMAILBOX_WORKER_MAX_JOBS` | `1024` | queued plus retained job records; new work is refused when full |
| `MOVEMAILBOX_WORKER_MAX_ATTEMPTS` | `3` | bounded attempts for ordinary failed/interrupted work; maximum 10 |
| `MOVEMAILBOX_WORKER_LEASE_TTL` | `30s` | renewable credential lease |
| `MOVEMAILBOX_WORKER_JOB_TIMEOUT` | `24h` | per-attempt timeout, also bounded by envelope expiry |
| `MOVEMAILBOX_WORKER_RECOVER_INTERRUPTED` | `false` | opt in only with whole-process-tree supervision; Compose enables it |

The API sets envelope lifetime with `MOVEMAILBOX_CREDENTIAL_TTL` (24 hours,
allowed range 5 minutes–48 hours). Transient connection/folder operations have
a 30-second worker deadline and use the same concurrency budget. Each job retains
128 bounded, redacted events. Terminal records are retained for 48 hours; expired
queued/staged envelopes are removed by startup and periodic cleanup.

## Execution and failure rules

1. API encrypts credentials to the worker's public key.
2. Worker atomically stores the staged job and ciphertext; it does not start yet.
3. API saves the owner/job snapshot, then activates that job ID idempotently.
4. Worker claims the job, leases and decrypts the envelope, runs imapsync, and
   stores events/results. Only the current mailbox credentials reach imapsync.
5. Completion/final failure/cancellation removes the active envelope row. A
   terminal tombstone prevents a captured payload from resurrecting the job.

- API shutdown or temporary connection loss: worker continues; API reconnects.
- Worker graceful shutdown: ordinary stopped jobs return to the queue.
- Worker hard kill: supervised deployments retry ordinary jobs within the
  attempt limit; native daemons fail them for manual review by default. Before
  opting in natively, prove the supervisor terminates every child process.
- Strict mirror error, shutdown or hard kill: **no automatic retry**. Check the
  destination and start a new run with the usual explicit destructive confirmation.
- Stop during a worker outage: API reports that stopping was not confirmed;
  retry after connectivity returns. It must not pretend the transfer stopped.

Retries are not a promise of exactly-once IMAP writes. Imapsync normally skips
messages it recognizes, but real providers, flags and duplicate handling need
pilot verification. Never remove source mail based solely on a progress bar.

## Repeatable verification

```bash
go test -race ./...
go vet ./...
go build -o bin/movemailbox ./cmd/mailbox-migrator
python3 scripts/smoke-remote-worker.py --binary bin/movemailbox
# Linux/Docker, using fresh disposable volumes:
docker build -t movemailbox:ci .
python3 scripts/smoke-remote-worker.py --image movemailbox:ci
```

On Windows build/use `bin/movemailbox.exe`. The smoke test generates disposable
keys, uses only the demo engine, kills API and worker independently, verifies
954 simulated messages, checks that interrupted strict mirror is not replayed,
tests cross-guest isolation and Stop, and scans SQLite/WAL/logs for test passwords.
No real IMAP connection is made, despite public IP placeholders in the test form.
Container mode also verifies that the API environment has no private worker key.

## Rotation, backups and launch gates

Drain or explicitly cancel all jobs before rotating the worker private key;
there is no old-key keyring. Replace public/private halves together and restart
both roles. Rotate the internal token on both sides. Rotating the session secret
invalidates guest cookies, so coordinate it with retention and incident handling.

The recipient-envelope rotation test confirms that a new X25519 key cannot open
old envelopes, and the old key cannot open envelopes sealed to the new key. The
safe sequence is therefore: stop admission, drain/cancel the queue, confirm zero
leased envelopes, generate the new pair, deploy API public key and worker private
key together, then resume admission. Do not delete the old key until the drain
and incident-retention window has ended; it is required only to finish already
accepted envelopes.

Treat metadata, ciphertext and backups as sensitive. Logical deletion/TTL does
not securely erase old SQLite pages or backups; a stolen private key can decrypt
retained ciphertext. Do not include worker credentials in ordinary backups.
Backups must be taken with both API and worker writers stopped (or by a tested
consistent SQLite snapshot), include a manifest and SHA-256 checksums, and pass
`PRAGMA integrity_check` before restore. A truncated or byte-corrupted copy must
be rejected and never mounted as a live queue. Restore into empty volumes; do
not overwrite the only working database.
See [SECURITY.md](../SECURITY.md) for the precise threat boundary.

Before public traffic: HTTPS/proxy abuse controls, verified egress blocking of
private/metadata networks (including IPv6 and DNS rebinding), quota enforcement,
operational monitoring, legal/privacy review and disposable real-mailbox tests.
Accounts, magic links and paid entitlements come next; free migration remains
available without registration.
