# Changelog

All notable changes to Mailbox Migrator are documented here.

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

[0.1.1-preview]: https://github.com/Anton-Babaskin/mailbox-migrator/releases/tag/v0.1.1-preview
