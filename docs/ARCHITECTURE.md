# Architecture

MoveMailbox is web-first and desktop-ready. The same Go application owns
the migration jobs and serves the embedded interface, so Docker, a local browser
and a future Wails shell share one implementation.

```text
Web UI / future Wails shell
            |
       HTTP + SSE API
            |
     Go job manager
            |
     Migration Engine
       /          \
imapsync adapter  future native IMAP engine
```

## Boundaries

- `internal/migrator` defines the engine contract. The UI never invokes a
  process directly.
- `internal/jobs` owns job state, cancellation, concurrency and event fan-out.
- `internal/api` validates HTTP input and streams progress with SSE.
- `internal/webui` embeds the production interface in the Go binary.
- `cmd/mailbox-migrator` is a thin process entry point.

Passwords and access tokens are runtime-only data and must never appear in API
responses or logs. The imapsync adapter passes passwords through imapsync's
dedicated `IMAPSYNC_PASSWORD1` / `IMAPSYNC_PASSWORD2` child-process environment
variables; they are never placed in command-line arguments or disk files, and
the parent drops its environment reference immediately after process start.
Completed job views never include secrets. On systems where process
environments are inspectable by privileged users, host-level process isolation
is still required. The hardened Compose profile mounts `/tmp` and imapsync's
home/work directory (`/var/tmp`) as tmpfs so its transient working data is not
committed to an image layer or container filesystem.

The HTTP boundary accepts only exact configured `Host` values plus automatic
loopback entries. Custom domains belong in `MOVEMAILBOX_ALLOWED_HOSTS`; this
allowlist complements origin/request checks and must also be enforced by the
fronting reverse proxy.

The local job manager is deliberately bounded: queued plus retained jobs cannot
exceed `MOVEMAILBOX_MAX_JOBS`, and terminal in-memory history expires after
`MOVEMAILBOX_HISTORY_TTL`. These controls prevent an unattended preview process
from growing forever; they are not substitutes for durable hosted queues,
per-tenant quotas or back-pressure shared across workers.

## Build and container trust

- The module's minimum language version remains distinct from its reproducible
  build toolchain: CI and Docker use the exact toolchain named in `go.mod`.
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

The preview intentionally binds to loopback by default. A hosted business
edition still needs authentication, encrypted persistent secrets, CSRF
protection, audit logging, per-tenant limits and an HTTPS reverse proxy before
it is safe to expose publicly.

Deployments should drain running jobs before restart. Normal process/container
shutdown must receive a grace period for job cancellation and child-process
exit; an uncatchable hard kill cannot provide that guarantee.
