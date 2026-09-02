# Changelog

All notable changes to MoveMailbox are documented here.

## [Unreleased]

### Added

- Added credential-free SQLite job history with schema versioning, bounded
  snapshots and recovery after application restarts.
- Added storage health reporting and a persistent Docker data volume.

### Changed

- Raised the minimum Go version to 1.25 and selected the current pure-Go SQLite
  dependency line so known fixed Windows dependency vulnerabilities are not
  retained in release binaries.
- Interrupted jobs are restored as failed after restart because mailbox
  passwords are intentionally never written to the history database.
- Technical event messages and folder display values are length-bounded before
  entering browser or persistent history.

## [0.3.0-preview] - 2026-09-01

### Changed

- Renamed the product from Mailbox Migrator to MoveMailbox.
- Added `MOVEMAILBOX_*` configuration variables while keeping the legacy
  `MM_*` names compatible during the preview transition.
- Windows and Docker binaries are now named `movemailbox`.
- CI now enforces formatting, race-enabled tests, vetting and vulnerability
  scanning, cross-compiles Windows/Linux/macOS targets, and verifies a Docker
  build. All GitHub Actions are pinned to immutable commit revisions.
- Go 1.27.0 is the reproducible build toolchain while Go 1.23 remains the
  module's minimum language version.
- Docker builds pin Go and imapsync images by digest, include version metadata,
  run as a non-root user and expose a health check.

### Added

- Added live source-folder discovery and selective folder migration.
- Added destination subfolder support through imapsync `--subfolder2`.
- Added strict destination mirroring with a destructive warning, double UI
  confirmation and server-side confirmation validation.
- Connection ports are now automatic by default, with a manual override inside
  the advanced connection settings.
- Both IMAP connections must be verified before a migration can start.
- Source and destination cannot point to the same mailbox.
- Password fields are cleared from the browser after a job is accepted.
- Added an exact HTTP `Host` allowlist for custom domains and reverse proxies;
  loopback hosts remain automatic.
- Added a bounded job capacity and TTL-based cleanup for terminal in-memory
  history, with environment and CLI configuration.
- The Compose profile now uses a read-only root filesystem, tmpfs for secrets
  and imapsync working data, dropped capabilities, resource limits and a
  graceful shutdown period.
- Added explicit licensing-status documentation; choosing a MoveMailbox source
  and distribution license remains an owner decision before general release.

### Fixed

- Connection checks now use a native TLS-validating IMAP client instead of
  launching imapsync with temporary credential files.
- imapsync passwords now travel only in dedicated child-process environment
  variables and are scrubbed from job errors, logs and API responses.
- Concurrent stdout/stderr draining, bounded cancellation and platform process
  handling prevent stalled or orphaned imapsync jobs.
- Progress parsing now understands current imapsync output and exposes stable
  machine-readable phase codes with indeterminate progress when totals are not
  known.
- Job history, event replay and browser logs are bounded; SSE reconnects use
  sequence IDs and explicitly report gaps rather than silently losing events.
- Graceful application shutdown rejects new work, cancels queued/running jobs
  and clears stored credentials.
- The local HTTP API now validates Host, Origin, Fetch Metadata and JSON
  content types, returns structured errors and serves cache-validatable assets.
- The embedded interface now supports Russian and English, accessible modal
  focus handling, bounded log rendering and reliable completed-job streams.
- Successful IMAP checks no longer fail when a server closes immediately after
  logout, and the connection-mode regression suite is stable under repetition.
- Connection settings are locked and revalidated while a browser-side check is
  in flight, preventing a stale verification result from authorizing changed
  migration credentials.
- API validation now bounds server names, usernames, passwords and folder names;
  the HTTP server also limits request-read time and header size.
- Every folder advertised by the demo engine now transfers representative data.

## [0.1.1-preview] - 2026-08-20

First public preview.

### Added

- Embedded responsive web interface for IMAP source and destination settings.
- Safe demo engine that never contacts external mail servers.
- `imapsync` adapter with passwords passed through protected temporary files.
- Connection checks, live progress, cancellation and in-memory job history.
- Docker and Compose configuration for local self-hosting.
- Windows preview launcher and diagnostic launcher.

### Fixed

- Windows startup now opens the browser only after the server is ready.
- A busy local port reuses an existing Mailbox Migrator instance or selects a
  free port instead of silently failing.
- Windows startup diagnostics are written to `mailbox-migrator.log`.

[0.1.1-preview]: https://github.com/Anton-Babaskin/MoveMailbox/releases/tag/v0.1.1-preview
[0.3.0-preview]: https://github.com/Anton-Babaskin/MoveMailbox/releases/tag/v0.3.0-preview
