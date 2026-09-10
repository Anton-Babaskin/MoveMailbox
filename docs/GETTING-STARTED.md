# Getting started

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
service declares that platform explicitly.

For the separated hosted topology, generate a recipient key pair and internal
token once, copy the output into a private environment file, and add the public
gateway settings:

```bash
umask 077
./movemailbox keygen > .env.hosted
chmod 600 .env.hosted
# Add MOVEMAILBOX_PUBLIC_MODE=true, MOVEMAILBOX_SESSION_SECRET and
# MOVEMAILBOX_ALLOWED_HOSTS=movemailbox.com to .env.hosted.
docker compose --env-file .env.hosted --profile hosted up --build
```

Never commit `.env.hosted`. The API container receives only the X25519 public
key and the internal authentication token. The private recipient key and
encrypted job queue live only in `movemailbox-worker`, on a separate volume.
The worker continues accepted jobs across API restarts and applies bounded
retries after an interrupted worker run. Destructive strict-mirror jobs never
automatically retry after failure or interruption. This topology is a security boundary,
but not by itself a public-launch approval: trusted HTTPS, egress filtering,
operational monitoring and the remaining roadmap gates are still required.

See the [worker deployment and recovery guide](WORKER.md) for key isolation,
transport security, native-process limitations and the reproducible crash drill.
Keep `.env.hosted` as a Compose interpolation file: **do not source it into the
API process**, which deliberately refuses to start with a worker private key.


## Linux and macOS native archives

See [native preview instructions](../scripts/README-UNIX.txt). Packages are unsigned;
imapsync must be installed separately. The release page includes SHA256SUMS.txt.

## Advanced migration modes

Dry run maps to `--dry`; credentials only to `--justlogin`; sizes only to
`--justfoldersizes`; folder creation only to `--justfolders`.
Choose at most one of credentials, sizes or folder creation. These can be combined
with dry run, but not strict mirror. Dry run alone can preview a confirmed mirror.
The legacy API field `justVerbose` aliases `dryRun`, not a separate engine option.

Strict mirror is destructive: test on disposable mailboxes and back up the
destination. UI confirmation does not replace checking the chosen destination,
folder selection and subfolder before every destructive run.

[Configuration](CONFIGURATION.md) · [Documentation](README.md)
