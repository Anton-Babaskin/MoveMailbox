# Architecture

Mailbox Migrator is web-first and desktop-ready. The same Go application owns
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

Passwords exist only in the request and the active job record. The imapsync
adapter writes them to a mode `0600` temporary directory and passes only
`--passfile1` / `--passfile2` paths to the child process. Completed job views
never include credentials.

## Desktop direction

The first local distribution opens the embedded web UI on loopback using
`mailbox-migrator --open`. A Wails v2 entry point can later host the same assets
and call the same application services. No migration behavior belongs in the
Wails layer; this keeps desktop and hosted editions compatible.

## Before public hosting

The preview intentionally binds to loopback by default. A hosted business
edition still needs authentication, encrypted persistent secrets, CSRF
protection, audit logging, per-tenant limits and an HTTPS reverse proxy before
it is safe to expose publicly.
