# Mailbox Migrator

[![CI](https://github.com/Anton-Babaskin/mailbox-migrator/actions/workflows/ci.yml/badge.svg)](https://github.com/Anton-Babaskin/mailbox-migrator/actions/workflows/ci.yml)
[![GitHub release](https://img.shields.io/github/v/release/Anton-Babaskin/mailbox-migrator?include_prereleases)](https://github.com/Anton-Babaskin/mailbox-migrator/releases)

A friendly, self-hosted interface for safe IMAP-to-IMAP mailbox migrations.
It wraps the battle-tested `imapsync` engine with connection checks, live
progress, cancellation, understandable errors and migration history.

> [!IMPORTANT]
> Mailbox Migrator is currently a preview. Use it locally and verify the result
> before deleting anything from the source mailbox. Authentication and durable
> storage must be implemented before exposing it to the public internet.

## What is already here

- polished responsive web interface embedded in the Go binary;
- separate source and destination connection checks;
- safe one-way migration defaults;
- passwords passed to imapsync through protected temporary files, never CLI args;
- streaming progress and logs over Server-Sent Events;
- cancellation, concurrency limits and in-memory history;
- explicit demo engine for UI and workflow testing;
- Docker packaging based on the official imapsync image;
- architecture ready for a future Wails desktop shell.

## Quick start: demo mode

Requires Go 1.23 or newer.

```bash
go run ./cmd/mailbox-migrator --demo --open
```

Open <http://127.0.0.1:8080>. Demo credentials are filled automatically and no
external mail servers are contacted.

### Windows preview

Download the newest Windows ZIP from
[Releases](https://github.com/Anton-Babaskin/mailbox-migrator/releases), extract
it completely, then run `START-DEMO.cmd`. Keep the small console window open
while using the preview. Startup diagnostics are written to
`mailbox-migrator.log` next to the executable.

If port `8080` is already occupied, the application now opens an existing
Mailbox Migrator instance or automatically selects another free local port.

The Windows preview archive does not bundle `imapsync`; its default launcher
uses safe demo mode. A real migration requires a compatible `imapsync`
installation or the Docker setup below.

## Run with imapsync

Install `imapsync`, make sure it is available in `PATH`, then run:

```bash
go run ./cmd/mailbox-migrator --open
```

Or provide an explicit binary path:

```bash
go run ./cmd/mailbox-migrator --imapsync /opt/imapsync/imapsync --open
```

## Docker

```bash
docker compose up --build
```

The included Compose configuration publishes the service only on
`127.0.0.1:8080`. Do not change it to a public interface until authentication
and HTTPS are configured.

## Configuration

| Flag | Environment | Default | Purpose |
| --- | --- | --- | --- |
| `--addr` | `MM_ADDR` | `127.0.0.1:8080` | HTTP listen address |
| `--imapsync` | `MM_IMAPSYNC_BIN` | `imapsync` | imapsync executable |
| `--max-concurrent` | `MM_MAX_CONCURRENT` | `2` | simultaneous migrations |
| `--demo` | `MM_DEMO` | `false` | use the safe simulated engine |
| `--open` | `MM_OPEN_BROWSER` | `true` | open the default browser |

## Development

```bash
go test ./...
go vet ./...
go run ./cmd/mailbox-migrator --demo
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for boundaries, security notes
and the desktop direction. Hosted product notes live in
[docs/HOSTED-PRODUCT.md](docs/HOSTED-PRODUCT.md).

Security issues should be reported privately as described in
[SECURITY.md](SECURITY.md). Release changes are listed in
[CHANGELOG.md](CHANGELOG.md).

## Roadmap

1. SQLite job persistence and structured imapsync progress parsing.
2. Authentication, encrypted credentials, audit log and HTTPS deployment.
3. Wails desktop packages for Windows, macOS and Linux.
4. CSV bulk migrations, reusable provider profiles and scheduling.
5. Gmail and Microsoft 365 OAuth, teams, billing and multi-tenant SaaS mode.

## Project owner

Created and maintained by [Anton Babaskin](https://github.com/Anton-Babaskin).
