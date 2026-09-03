# Architecture

MoveMailbox is web-first and desktop-ready. Local mode keeps one process for a
simple desktop experience. Public mode uses the same binary in two roles: the
HTTP/API process and short-lived isolated worker processes.

```text
Web UI / future Wails shell
            |
       HTTP + SSE API
            |
     Go job manager
       /          \
 local engine   encrypted envelope → leased worker process
       \          /
        imapsync adapter / future native IMAP engine
```

## Boundaries

- `internal/migrator` defines the engine contract. The UI never invokes a
  process directly.
- `internal/jobs` owns job state, cancellation, concurrency and event fan-out.
- `internal/api` validates HTTP input and streams progress with SSE.
- `internal/credentials` seals requests and owns ciphertext leases.
- `internal/worker` implements the credential-free JSON-lines process protocol.
- `internal/webui` embeds the production interface in the Go binary.
- `cmd/mailbox-migrator` is a thin process entry point.

Passwords and access tokens must never appear in API responses or logs. The
imapsync adapter passes passwords through imapsync's
dedicated `IMAPSYNC_PASSWORD1` / `IMAPSYNC_PASSWORD2` child-process environment
variables; they are never placed in command-line arguments or disk files, and
the parent drops its environment reference immediately after process start.
Completed job views never include secrets. On systems where process
environments are inspectable by privileged users, host-level process isolation
is still required. The hardened Compose profile mounts `/tmp` and imapsync's
home/work directory (`/var/tmp`) as tmpfs so its transient working data is not
committed to an image layer or container filesystem.

In public mode the API immediately seals each migration request with AES-256-GCM.
An HMAC-based KDF derives a different encryption key for every opaque job ID;
the job ID, key ID and timestamps are authenticated as associated data. SQLite
stores the ciphertext, expiry and an atomic renewable lease. A worker process
leases exactly one job, opens it, clears the master key from its environment
before launching imapsync, and emits only redacted structured events. Connection
tests and folder discovery use the same worker process boundary with transient
encrypted envelopes passed through stdin rather than written to disk.

The HTTP boundary accepts only exact configured `Host` values plus automatic
loopback entries. Custom domains belong in `MOVEMAILBOX_ALLOWED_HOSTS`; this
allowlist complements origin/request checks and must also be enforced by the
fronting reverse proxy.

In public mode the API assigns an opaque guest identity in a signed
`HttpOnly`, `Secure`, `SameSite=Lax` cookie. State-changing requests also need a
session-derived CSRF token, and job reads, event streams and cancellation are
matched against an owner stored in the credential-free snapshot. Requests are
bounded per session and direct peer IP; forwarded IP headers are intentionally
ignored because only the HTTPS proxy can authenticate them.

Public connection requests resolve hostnames before use and reject any answer
that is private, loopback, link-local or reserved. Literal public IP addresses
remain supported, but only ports 143 and 993 are accepted. This application
check reduces server-side request-forgery risk; the hosted worker still needs an
egress firewall because a hostname can change between validation and imapsync's
own DNS lookup.

The local job manager is deliberately bounded: queued plus retained jobs cannot
exceed `MOVEMAILBOX_MAX_JOBS`, and terminal in-memory history expires after
`MOVEMAILBOX_HISTORY_TTL`. These controls prevent an unattended preview process
from growing forever; they are not substitutes for durable hosted queues,
per-tenant quotas or back-pressure shared across workers.

Local history is also written to a versioned SQLite store. Persisted snapshots
contain job status, mailbox identifiers, counters and bounded events, but the
store interface cannot receive a plaintext migration request or credentials.
Direct local jobs found after restart are marked failed. Public jobs can be
requeued only while a valid encrypted envelope remains. SQLite is the current
desktop/self-hosted implementation; the hosted edition will replace it with
PostgreSQL and a separately deployed worker/key boundary.

## Build and container trust

- The module's minimum Go version remains distinct from its reproducible build
  toolchain: Go 1.25 is required by the current SQLite/security dependency set,
  while CI and Docker use the exact Go 1.27 toolchain named in `go.mod`.
- GitHub Actions are referenced by immutable commit SHA with the human-readable
  release tag retained in a comment.
- Docker stages retain readable tags but are locked to registry digests. The
  final imapsync base is version `2.319`, runs as `nobody:nogroup` and is
  currently limited to `linux/amd64`.
- The image carries the application version through a linker variable and OCI
  metadata, exposes a health check and needs writable access only to its two
  memory-backed temporary directories.

## Desktop direction

The first local distribution opens the embedded web UI on loopback using
`movemailbox --open`. A Wails v2 entry point can later host the same assets
and call the same application services. No migration behavior belongs in the
Wails layer; this keeps desktop and hosted editions compatible.

## Before public hosting

The preview intentionally binds to loopback by default. Guest ownership,
short-lived encrypted envelopes and worker process isolation are implemented.
A hosted edition still needs an independently deployed worker service with KMS
access unavailable to the API, bounded retry/stuck-job recovery, an egress
firewall, audit logging, durable shared limits and an HTTPS reverse proxy before
it is safe to expose publicly.

Deployments should drain running jobs before restart. Normal process/container
shutdown must receive a grace period for job cancellation and child-process
exit; an uncatchable hard kill cannot provide that guarantee.
