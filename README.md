<div align="center">

<img src="docs/assets/banner.svg" alt="MoveMailbox — email migration, without the terminal. Local client and self-hosted worker powered by imapsync." width="100%">

# MoveMailbox

**Your mail. A new home. A clear way there.**

An IMAP migration tool with a browser UI, a local client and a separate hosted worker.

[Website](https://movemailbox.com) · [Download preview](https://github.com/Anton-Babaskin/MoveMailbox/releases/tag/v0.4.0-preview) · [Documentation](docs/README.md) · [Русский](docs/README.ru.md)

[![CI](https://github.com/Anton-Babaskin/MoveMailbox/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/Anton-Babaskin/MoveMailbox/actions/workflows/ci.yml)
[![Preview](https://img.shields.io/github/v/release/Anton-Babaskin/MoveMailbox?include_prereleases&label=preview&color=087f66)](https://github.com/Anton-Babaskin/MoveMailbox/releases)
[![Go toolchain](https://img.shields.io/badge/Go-1.27-00ADD8?logo=go&logoColor=white)](go.mod)
[![Engine](https://img.shields.io/badge/powered_by-imapsync-087f66)](https://imapsync.lamiral.info/)
[![License status](https://img.shields.io/badge/license-pending_owner_choice-8b6508)](docs/LICENSING.md)

</div>

> [!IMPORTANT]
> **Engineering preview, not a public-cloud launch.** Real migrations work locally
> with imapsync and in controlled self-hosted deployments. The hosted API/worker
> is implemented and tested; public deployment still needs HTTPS, enforced
> network egress, operations and the [launch gates](docs/ROADMAP.md).
> A separate website mockup is not proof of a live migration service.

## Why MoveMailbox?

| Start simply | Stay in control | Know what happened |
| :--- | :--- | :--- |
| Server **name or IP**, login and password | Select folders and a destination subfolder | Progress, counters and readable logs |
| Automatic TLS ports; local manual override | Preview changes or run preflight-only modes | Credential-free API job history |
| Browser UI throughout the migration | Copy by default; confirm destructive mirror | Tested recovery and documented limits |

- **Built on imapsync:** a UI, API and orchestration layer around the established engine.
- **Local or self-hosted:** our infrastructure is not required.
- **Guest-first hosted design:** no account wall for the planned free tier. Paid accounts, OAuth and billing remain roadmap work.
- **Operational depth:** encrypted envelopes, durable queues, bounded retries, key rotation and metadata-backup drills.

## Choose where it runs

| Mode | Available today | Important |
| :--- | :--- | :--- |
| **Windows** | ZIP with launchers and a local browser UI | Install imapsync separately |
| **Linux / macOS** | Native launcher with the same UI; amd64 and arm64 | Install imapsync separately |
| **Docker** | Pinned imapsync runtime and hardened Compose setup | linux/amd64; private deployment first |
| **Hosted worker** | Separate API/worker, guest ownership and quotas | Closed pilot; public launch pending |

The planned free hosted tier admits a **whole source mailbox up to 5 GB**, not
the first 5 GB of a larger mailbox. Local use has no MoveMailbox cloud-size cap;
provider quotas and machine resources still apply. See [quota behavior](docs/MAILBOX-QUOTA.md),
including mailbox growth during a transfer.

## Get started

### Windows

[Download Windows amd64](https://github.com/Anton-Babaskin/MoveMailbox/releases/download/v0.4.0-preview/movemailbox-windows-amd64-v0.4.0-preview.zip) → extract the ZIP → run **START-DEMO.cmd**.

Demo mode contacts no mail servers. For real work, install imapsync and run
**START-REAL.cmd**. Administrator privileges are not required.

### Linux & macOS

Extract the matching archive from [v0.4.0-preview](https://github.com/Anton-Babaskin/MoveMailbox/releases/tag/v0.4.0-preview), then run:

```sh
./movemailbox --demo --open=true
```

Native archives do **not** bundle imapsync. Previews are not signed/notarized.
Compare downloads with **SHA256SUMS.txt** and inspect **BUILD-INFO.txt**.
Checksums verify a match to the published file, not an independent publisher signature.

### From source

Go 1.25+ is required; `go.mod` pins the Go 1.27.0 toolchain.

```sh
git clone https://github.com/Anton-Babaskin/MoveMailbox.git
cd MoveMailbox
go run ./cmd/mailbox-migrator --demo --open
```

Open **http://127.0.0.1:8080**. For real work, install imapsync and omit `--demo`.

### Docker / private deployment

```sh
docker compose up --build
```

Builds locally and binds the UI to **127.0.0.1:8080**; it does not open a public
service. For separate API/worker deployment, follow the [worker guide](docs/WORKER.md).

[Full setup](docs/GETTING-STARTED.md) · [Configuration](docs/CONFIGURATION.md) · [VPS checklist](docs/STAGING-VPS.md)

## How mail moves

<img src="docs/assets/mail-flow.svg" alt="Hosted topology: browser to API over HTTPS; API submits encrypted credentials and commands to worker. Worker runs imapsync, reading source and writing destination over TLS. API metadata and encrypted worker queue have separate stores." width="100%">

Mail passes through **your computer or your worker server**. The source does not
push directly to the destination. The API creates credential envelopes; the worker
holds the recipient private key. This is not browser-to-worker end-to-end encryption.
In local mode, the UI and engine run on your machine.

[Architecture](docs/ARCHITECTURE.md) · [Credential boundaries](SECURITY.md)

## Migration controls

| Control | Behavior |
| :--- | :--- |
| Connection checks | Verify authentication and TLS on both endpoints |
| Folder selection | Choose source folders after discovery |
| Destination subfolder | Group imports under a name such as `Imported mail` |
| Dry run | Preview planned work without modifying mailboxes |
| Credentials / sizes / folders only | Check logins, estimate volume or create folders without copying messages |
| Start / stop / progress | Submit work, request cancellation and follow streamed events |
| Strict mirror | Delete destination-only messages in relevant folders; explicit acknowledgement required |

> [!CAUTION]
> **Strict mirror can permanently delete destination mail.** Back up and inspect
> a dry run first. Destructive jobs are never automatically replayed after failure
> or interruption. Ordinary reruns still need verification; universal exactly-once
> delivery is not guaranteed across IMAP providers.

## Reliability with evidence

Scenario tests — **not benchmarks, certifications or an uptime guarantee**.

| Scenario | Recorded evidence |
| :--- | :--- |
| Disconnect inside APPEND / lose the final acknowledgement | Real IMAP fault-proxy drills; content and repeat-copy checks |
| API / worker restart | Durable recovery, guest ownership and bounded retry checks |
| Worker disk full | Bounded tmpfs tests; no false success during pending finalization |
| Mailbox grows after estimation | Runtime whole-message quota rejection; overshoot limitation documented |
| Credential rotation | Drained-queue guard; mismatched keys and stale tokens fail closed |
| Damaged or incomplete backup | Archive validation, encrypted round trip and fresh-volume demo restore |

[Pilot evidence](docs/PILOT.md) · [Backup runbook](docs/BACKUP-RUNBOOK.md) · [CI runs](https://github.com/Anton-Babaskin/MoveMailbox/actions/workflows/ci.yml)

## Security, plainly

- Verified IMAP certificate chains and peer names; no "ignore TLS errors" switch.
- Hosted guest ownership, CSRF checks, limits and restricted public targets.
- Credential-free API history; encrypted envelopes in the separate worker queue.
- Passwords passed through imapsync's child environment, not command-line arguments.
- Privileged host access can expose runtime secrets. Deletion does not securely erase WAL or backups.
- Docker hardening is not a per-job container guarantee or a substitute for a firewall.

**Found a vulnerability?** Use [private reporting](https://github.com/Anton-Babaskin/MoveMailbox/security/advisories/new),
not a public issue. Never attach passwords, cookies, tokens or message content.

## Documentation & project

| I want to… | Start here |
| :--- | :--- |
| Install or configure | [Getting started](docs/GETTING-STARTED.md) · [Configuration](docs/CONFIGURATION.md) |
| Understand the system | [Architecture](docs/ARCHITECTURE.md) · [Worker](docs/WORKER.md) |
| Operate a private pilot | [VPS](docs/STAGING-VPS.md) · [Backups](docs/BACKUP-RUNBOOK.md) |
| See what shipped / what is next | [Changelog](CHANGELOG.md) · [Roadmap](docs/ROADMAP.md) |
| Report a bug or propose a change | [Support](SUPPORT.md) · [Contributing](CONTRIBUTING.md) |
| Continue on another computer | [Shared workflow](docs/TWO-COMPUTERS.md) · [Handoff](docs/HANDOFF.md) |

### Next milestones

1. **Closed VPS pilot:** HTTPS, egress enforcement, monitoring, retention and real off-site restore.
2. **Commercial layer:** verified email, magic links and payment entitlements without registration for free transfers.
3. **Broader compatibility:** provider coverage, OAuth, signing and business workflows.

### License & credits

The owner has **not yet selected a license for MoveMailbox**. Public source is
not automatically open-source permission. Read [licensing status](docs/LICENSING.md)
before reusing or redistributing code.

imapsync is a separate project by **Gilles Lamiral**, under its own
[NO LIMIT PUBLIC LICENSE](https://imapsync.lamiral.info/LICENSE).
Our [third-party inventory](THIRD_PARTY_NOTICES.md) does not relicense upstream software.

---

<div align="center">

Created and maintained by [Anton Babaskin](https://github.com/Anton-Babaskin)

[movemailbox.com](https://movemailbox.com) · Built for the next home of your mail.

</div>
