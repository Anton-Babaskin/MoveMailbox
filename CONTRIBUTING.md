# Contributing to MoveMailbox

Thanks for helping make mailbox migration easier to understand and safer to operate.
This is a preview with real mailbox access: correctness matters more than feature count.

## Before you start

- Read [licensing status](docs/LICENSING.md). The owner has not yet selected a
  project license; discuss reuse and contribution terms before submitting code.
  This guide does not grant a license or impose a contributor license agreement.
- Open a feature request before a large change. A bug report or a reproducible
  failing test is welcome; English and Russian are both fine.
- See [security reporting](SECURITY.md) for vulnerabilities. Never report
  credentials, tokens, message content or sensitive infrastructure in public.
- Use a feature branch and a focused PR. Do not combine design work with changes
  to credential handling, destructive migration semantics or release policy.

## Development

The module requires Go 1.25+ and pins Go 1.27.0. Full backup harness testing uses
Python 3.11+ and age 1.3.2 on Linux/WSL. Docker is required for container drills.

```sh
go run ./cmd/mailbox-migrator --demo --open
go test ./...
go vet ./...
python3 scripts/check-docs.py
python3 -m unittest discover -s scripts -p 'test_*.py' -v
```

Format changed Go files with gofmt. Linux CI additionally runs the race detector,
dependency vulnerability checks, five cross-builds and Docker fault drills.
Some local age tests skip if tools are missing: report skips as skips, not passes.
Follow [.github/workflows/ci.yml](.github/workflows/ci.yml) for the full setup.

Do not use a real mailbox unless its owner explicitly authorizes the exact test.
Start with demo fixtures. Destructive mirror requires separate test intent and
a disposable destination; generic permission to test is not permission to erase.

## PR checklist

- Explain the user-visible change and its scope.
- Include tests or a precise reason they are not applicable.
- Preserve verified TLS, ownership checks, CSRF and credential redaction.
- Keep ordinary recovery distinct from destructive mirror; never auto-replay mirror.
- Explain migration compatibility, rollback and changed configuration defaults.
- Update relevant docs without overstating guarantees or provider support.
- Include no logs, SQLite files, passwords, cookies, keys or real message content.
- Run the docs checker for changed Markdown and repository SVGs.

## Repository map

| Path | Responsibility |
| --- | --- |
| `cmd/mailbox-migrator/` | Process entry point |
| `internal/api/` | HTTP API, guest ownership and security boundaries |
| `internal/credentials/` | Credential envelopes and leases |
| `internal/jobs/` | Lifecycle, events, cancellation and history |
| `internal/migrator/` | IMAP preflight and imapsync adapter |
| `internal/worker/` | Independent and embedded worker runtimes |
| `internal/webui/dist/` | Embedded browser interface |
| `scripts/` | Launchers, drills and release helpers |
| `docs/` | Architecture, operator guides and evidence |

## Working together

Be respectful and specific. Discuss the code, not the person. Do not publish
someone's personal information, harass contributors or pressure them into unsafe
changes. Maintainers may close abusive or out-of-scope discussions.

For the owner's multi-computer workflow, read [AGENTS.md](AGENTS.md) and
[the shared GitHub procedure](docs/TWO-COMPUTERS.md).
