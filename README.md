<div align="center">

# MoveMailbox

### Move email between IMAP servers without living in a terminal

[Website](https://movemailbox.com) · [Downloads](https://github.com/Anton-Babaskin/MoveMailbox/releases) · [Documentation](docs/ARCHITECTURE.md) · [Security](SECURITY.md)

[![CI](https://github.com/Anton-Babaskin/MoveMailbox/actions/workflows/ci.yml/badge.svg)](https://github.com/Anton-Babaskin/MoveMailbox/actions/workflows/ci.yml)
[![Latest release](https://img.shields.io/github/v/release/Anton-Babaskin/MoveMailbox?include_prereleases&label=release)](https://github.com/Anton-Babaskin/MoveMailbox/releases)
[![Go](https://img.shields.io/badge/Go-1.25%2B-00ADD8?logo=go&logoColor=white)](go.mod)
[![Powered by imapsync](https://img.shields.io/badge/engine-imapsync-0f9f79)](https://imapsync.lamiral.info/)

</div>

MoveMailbox is a friendly interface for controlled IMAP-to-IMAP migrations. It
wraps the proven `imapsync` engine with connection checks, automatic ports,
folder selection, live progress, cancellation, readable errors, and migration
history.

> [!IMPORTANT]
> MoveMailbox is currently a preview. The local client can run real migrations
> when `imapsync` is installed. The online form at
> [movemailbox.com](https://movemailbox.com) remains a no-data demo until the
> authenticated hosted backend and durable job storage are ready.

## Why MoveMailbox

- **Simple by default:** enter a server or IP address, mailbox username, and
  app password. The free hosted flow does not require a MoveMailbox account.
- **Automatic connection settings:** port `993` for SSL/TLS and `143` for
  STARTTLS, with a manual override when a provider needs something different.
- **Safe preflight:** source and destination are tested before migration starts.
- **Useful control:** migrate every folder or choose specific folders, place the
  result under a destination subfolder, preserve dates and flags, or run dry.
- **Visible work:** Server-Sent Events stream progress, folder names, metrics,
  logs, completion, and cancellation state into the UI.
- **Durable local history:** credential-free SQLite snapshots survive restarts;
  interrupted jobs are marked failed and can be safely started again.
- **Local-first security:** passwords are supplied only to the child `imapsync`
  process through dedicated environment variables and are not stored by the app.
- **Portable deployment:** one Go binary for the web UI and API, plus Docker and
  Compose files for self-hosting.

## Editions

| Edition | Best for | Current status |
| --- | --- | --- |
| Windows/local client | Personal migrations and IT work without a cloud size limit | Preview releases available |
| Docker/Linux | Administrators and self-hosted infrastructure | Ready for controlled private deployment |
| Hosted at movemailbox.com | Occasional browser-based migration without registration, planned free tier up to 5 GB | Interface demo; protected backend in development |

## Migration controls

### Folder selection

After testing the source connection, MoveMailbox reads selectable IMAP folders.
Choose any subset; leaving the selection at “All folders” keeps the normal
imapsync behavior.

### Destination subfolder

Set a name such as `Imported mail` to keep the copied hierarchy grouped under a
single folder in the destination mailbox.

### Strict mirror

Strict mirror maps to imapsync's destination cleanup mode. Messages that do not
exist in the source can be deleted from the corresponding destination folders.
The UI marks this as destructive and requires a separate acknowledgement plus a
confirmation action. The API also rejects unconfirmed strict-mirror requests.

> [!CAUTION]
> Test strict mirror with **Dry run** and make a backup before using it on an
> important destination mailbox. The source mailbox is not deleted or modified,
> but destination cleanup can be irreversible.

## Quick start

### Windows preview

1. Download the newest ZIP from [Releases](https://github.com/Anton-Babaskin/MoveMailbox/releases).
2. Extract the archive completely.
3. Run `START-DEMO.cmd` to explore the interface without contacting mail servers.
4. After installing a compatible `imapsync`, run `START-REAL.cmd` for real work.

Keep the small console window open while the app is running. Diagnostics are
written to `movemailbox.log` next to the executable. If port `8080` is occupied,
MoveMailbox opens the existing instance or selects another free local port.
Migration history is stored in `%AppData%\MoveMailbox\movemailbox.db` by default.
The database contains mailbox identifiers, status, counters and bounded logs,
but never IMAP passwords. Use `--database` to select another location.

### Go demo

The module requires Go 1.25 or newer and declares a reproducible Go
toolchain in `go.mod`.

```bash
go run ./cmd/mailbox-migrator --demo --open
```

Open <http://127.0.0.1:8080>. Demo credentials are filled automatically and no
external IMAP servers are contacted.

### Real migration with imapsync

Install `imapsync`, make sure it is available in `PATH`, then run:

```bash
go run ./cmd/mailbox-migrator --open
```

Or pass an explicit binary path:

```bash
go run ./cmd/mailbox-migrator --imapsync /opt/imapsync/imapsync --open
```

### Docker

```bash
docker compose up --build
```

Compose publishes MoveMailbox only on `127.0.0.1:8080`. The service runs with a
read-only root filesystem, drops Linux capabilities, uses memory-backed working
directories, persists credential-free history in the `movemailbox-data` volume,
and applies configurable CPU, memory, and process limits.

The upstream imapsync image is currently built for `linux/amd64`, so the Compose
service declares that platform explicitly. Protected guest sessions can be
enabled with `MOVEMAILBOX_PUBLIC_MODE=true`, a unique session secret, HTTPS and
an explicit `MOVEMAILBOX_ALLOWED_HOSTS` value. This gateway layer is not yet a
public-launch approval: encrypted worker credential envelopes are still being
built.

## How it works

```text
Source IMAP server
        │
        │ encrypted IMAP connection
        ▼
MoveMailbox + imapsync on your computer or server
        │
        │ encrypted IMAP connection
        ▼
Destination IMAP server
```

Messages pass through the machine running MoveMailbox. The app does not relay a
direct server-to-server command, and normal migration does not remove messages
from the source.

## Configuration

| Flag | Environment | Default | Purpose |
| --- | --- | --- | --- |
| `--addr` | `MOVEMAILBOX_ADDR` | `127.0.0.1:8080` | HTTP listen address |
| `--imapsync` | `MOVEMAILBOX_IMAPSYNC_BIN` | `imapsync` | imapsync executable |
| `--max-concurrent` | `MOVEMAILBOX_MAX_CONCURRENT` | `2` | simultaneous migrations |
| `--max-jobs` | `MOVEMAILBOX_MAX_JOBS` | `256` | queued and retained jobs |
| `--history-ttl` | `MOVEMAILBOX_HISTORY_TTL` | `24h` | completed-job history retention |
| `--database` | `MOVEMAILBOX_DATABASE` | platform default | SQLite history path; use `off` for memory-only history |
| `--demo` | `MOVEMAILBOX_DEMO` | `false` | use the safe simulated engine |
| `--open` | `MOVEMAILBOX_OPEN_BROWSER` | `true` | open the default browser |
| `--allowed-hosts` | `MOVEMAILBOX_ALLOWED_HOSTS` | empty | additional exact HTTP `Host` values |
| `--public` | `MOVEMAILBOX_PUBLIC_MODE` | `false` | protected guest sessions behind HTTPS |
| — | `MOVEMAILBOX_SESSION_SECRET` | empty | secret of at least 32 random bytes; required in public mode |
| `--session-ttl` | `MOVEMAILBOX_SESSION_TTL` | `24h` | guest session lifetime |
| `--max-active-per-session` | `MOVEMAILBOX_MAX_ACTIVE_PER_SESSION` | `1` | active migrations per public guest session |
| `--session-rate` | `MOVEMAILBOX_SESSION_REQUESTS_PER_MINUTE` | `120` | request limit for one public session per minute |
| `--ip-rate` | `MOVEMAILBOX_IP_REQUESTS_PER_MINUTE` | `600` | request limit for a directly connected client IP per minute |

Legacy `MM_*` variables remain supported during the preview transition.
Loopback hostnames are allowed automatically. Do not use wildcards in
`MOVEMAILBOX_ALLOWED_HOSTS`; include a non-default port when the reverse proxy
forwards one.

Public mode issues a signed `HttpOnly`, `Secure`, `SameSite=Lax` guest cookie,
requires a CSRF token for state changes and returns only jobs owned by that
session. The application deliberately ignores forwarded client-IP headers;
configure the HTTPS proxy to enforce its own IP limit before forwarding traffic.
It accepts public hostnames and public IP addresses on standard IMAP ports 143
and 993, while rejecting private, loopback, link-local and reserved targets.
The unrestricted manual-port option remains available in local/self-hosted mode.

## Development

```bash
gofmt -w .
go test ./...
go vet ./...
go run ./cmd/mailbox-migrator --demo
```

CI also runs the race detector, vulnerability scanning, cross-platform builds,
and a hardened Docker build.

```text
cmd/mailbox-migrator/   process entry point
internal/api/           local HTTP API and security headers
internal/jobs/          queue, lifecycle, events, cancellation, history
internal/migrator/      IMAP preflight and imapsync integration
internal/webui/dist/    embedded browser interface
scripts/windows/        Windows launchers and release helpers
```

Architecture and hosted-service boundaries are documented in
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) and
[docs/HOSTED-PRODUCT.md](docs/HOSTED-PRODUCT.md). The agreed MVP scope is in
[docs/MVP.md](docs/MVP.md). Public-launch stages and exit
criteria live in [docs/ROADMAP.md](docs/ROADMAP.md).

## Security and responsible use

- Keep the local service bound to loopback. A hosted pilot additionally needs
  public mode, trusted HTTPS and the remaining worker/credential security gates.
- Use provider app passwords or OAuth credentials where available.
- Verify migrated counts and folders before deleting or disabling the source.
- Report vulnerabilities privately through
  [GitHub Security Advisories](https://github.com/Anton-Babaskin/MoveMailbox/security/advisories/new).

## Roadmap

- ✅ SQLite job persistence and restart-safe history.
- Authentication, encrypted credential envelopes, audit logs, and hosted workers.
- Signed Windows, macOS, and Linux desktop packages.
- CSV bulk migrations, reusable provider profiles, and scheduling.
- Gmail and Microsoft 365 OAuth, teams, billing, and multi-tenant SaaS mode.

## Licensing status

MoveMailbox does not yet include a project `LICENSE` file. A public repository
does not by itself grant reuse rights. The project owner must choose the final
distribution model before a non-preview commercial release. See
[docs/LICENSING.md](docs/LICENSING.md) for the separate imapsync licensing notes.

---

Created and maintained by [Anton Babaskin](https://github.com/Anton-Babaskin) ·
[movemailbox.com](https://movemailbox.com)
