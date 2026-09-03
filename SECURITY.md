# Security policy

## Preview status

MoveMailbox is currently intended for local and trusted-network use. Do
not expose the preview directly to the public internet. Public mode now adds
signed guest sessions, CSRF protection, request limits and job ownership, but
it is not yet approved for public traffic. Authenticated encrypted credential
envelopes and one-job worker processes are implemented; independently deployed
workers, external key isolation and shared multi-instance limits remain.

The Docker Compose profile is defense in depth for trusted deployments, not a
public-hosting security boundary. It binds to loopback, runs as a non-root user,
uses a read-only root filesystem, drops Linux capabilities and places `/tmp`
and `/var/tmp` on memory-backed filesystems. A public service still requires an
trusted HTTPS gateway, proxy-level abuse limits, isolated workers and a durable
queue.

The public-mode cookie is `HttpOnly`, `Secure`, `SameSite=Lax` and signed with
`MOVEMAILBOX_SESSION_SECRET`. Use at least 32 random bytes, keep it outside the
repository and rotate it after suspected exposure; rotation invalidates guest
sessions. The application does not trust `X-Forwarded-For`, so the reverse proxy
must enforce client-IP limits itself.

Public mode rejects private, loopback, link-local and reserved IP targets and
limits connections to IMAP ports 143/993. Public literal IPs are supported. DNS
can change after validation, so production workers must also run behind an
egress policy that blocks internal networks and cloud metadata services.

The API validates the HTTP `Host` header. Loopback hosts are added
automatically; a reverse proxy or custom domain must be listed exactly with
`MOVEMAILBOX_ALLOWED_HOSTS`/`--allowed-hosts`. Never configure a wildcard, and
ensure the proxy validates the public host and forwards that validated value in
`Host`; never trust a client-provided `X-Forwarded-Host`.

## Credential handling

Mailbox passwords are highly sensitive runtime data. The imapsync adapter uses
imapsync's dedicated `IMAPSYNC_PASSWORD1` and `IMAPSYNC_PASSWORD2`
child-process environment variables instead of command-line arguments or
passfiles. The parent releases its reference to that environment immediately
after process start and clears credentials from queued/completed job records.
Privileged host users and process-inspection tooling may still be able to read
a running child's environment, so workers require process isolation and strict
host access controls.

On a native desktop/server install, run MoveMailbox under a dedicated
low-privilege account and do not collect process environments or memory dumps
while real credentials are present. In a hosted edition this in-memory
handoff is not a substitute for encrypted durable secret storage with short
retention and per-job access controls.

In public mode, credential-bearing connection tests, folder reads and
migrations cross an encrypted worker boundary. Migration requests are sealed
with AES-256-GCM under a per-job key derived from a random external master key.
Only ciphertext, expiry metadata and renewable exclusive leases enter SQLite.
The worker clears `MOVEMAILBOX_MASTER_KEY` before launching imapsync, and normal
completion, failure or cancellation deletes the envelope. A hard kill can leave
ciphertext until its TTL; expiry cleanup removes it automatically.

The current preview starts the worker as a child process, so the API host still
receives the master key at startup. This reduces credential lifetime and process
exposure but is not the final hosted key boundary. Before public launch, run the
worker under a separate service identity and give only that service access to
the decrypting key or KMS operation.

The local SQLite database stores credential-free migration metadata. In public
mode the same database may additionally contain authenticated ciphertext and
lease metadata, never plaintext requests. Regression and end-to-end tests scan
the database, WAL and shared-memory files for test passwords. Treat mailbox
identifiers, ciphertext and logs as private metadata and protect the database
file and backups anyway.

## Safe shutdown and updates

Before updating, wait for migrations to finish whenever possible. Send a normal
interrupt (`Ctrl+C`, `SIGINT`, `docker compose stop`) and allow the configured
one-minute Compose grace period. Avoid `kill -9`, task-manager force termination
or VM power-off: a forced stop can interrupt a mailbox transfer. A one-way
imapsync job can normally be rerun, but its result must still be verified before
any source data is removed.

## Reporting a vulnerability

Please do not publish vulnerabilities as public issues. Report them privately
through [GitHub Security Advisories](https://github.com/Anton-Babaskin/MoveMailbox/security/advisories/new).

Include the affected version, reproduction steps and potential impact. Remove
mailbox passwords, access tokens, message contents and personal data from logs
or screenshots before sending a report.
