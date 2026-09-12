# Configuration reference

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
| `--credential-ttl` | `MOVEMAILBOX_CREDENTIAL_TTL` | `24h` | maximum encrypted credential-envelope lifetime |
| `--worker-lease-ttl` | `MOVEMAILBOX_WORKER_LEASE_TTL` | `2h` | renewable exclusive worker lease |
| `--worker-url` | `MOVEMAILBOX_WORKER_URL` | empty | independent worker service URL required for hosted public mode |
| `--worker-public-key` | `MOVEMAILBOX_WORKER_PUBLIC_KEY` | empty | worker X25519 public recipient key |
| — | `MOVEMAILBOX_WORKER_TOKEN` | empty | internal API/worker authentication token; environment only |
| — | `MOVEMAILBOX_WORKER_ALLOW_HTTP` | `false` | opt in to cleartext HTTP only on a trusted private network; Compose enables it |
| `--embedded-worker` | `MOVEMAILBOX_EMBEDDED_WORKER` | `false` | development-only child-worker fallback |
| — | `MOVEMAILBOX_MASTER_KEY` | empty | legacy embedded-worker key; never use for the hosted topology |

Legacy `MM_*` variables remain supported during the preview transition.
The API and worker service reject invalid boolean, integer and duration
environment settings before opening listeners, storage or log files. An unset
or whitespace-only value uses the default; surrounding whitespace is ignored.
Explicit concurrency/history/session limits and durations must be positive.
An invalid value is rejected even if a command-line flag would override it;
remove or correct the setting. Errors identify its name, never its value.
Only settings consumed by the selected process role are checked. Worker mailbox
quota remains special: an explicit `MOVEMAILBOX_MAX_MAILBOX_BYTES=0` disables it.

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
Generate the worker recipient keys and token with `movemailbox keygen`. Changing
the private key invalidates pending worker envelopes, so rotate it only after
draining or explicitly cancelling the queue.

See [backend health and event-stream contract](BACKEND-OPERATIONS.md) for probes
and frontend integration (maintained independently from the website).

[Back to documentation](README.md)
