# Security policy

## Preview status

MoveMailbox is currently intended for local and trusted-network use. Do
not expose the preview directly to the public internet. Public mode now adds
signed guest sessions, CSRF protection, request limits and job ownership, but
it is not yet approved for public traffic. Authenticated encrypted credential
envelopes, an independently deployable worker and API/worker key isolation are
implemented; trusted HTTPS, egress enforcement, operations and shared
multi-instance limits remain launch gates.

The Docker Compose profile is defense in depth for trusted deployments, not a
public-hosting security boundary. It binds to loopback, runs as a non-root user,
uses a read-only root filesystem, drops Linux capabilities and places `/tmp`
and `/var/tmp` on memory-backed filesystems. A public service still requires an
trusted HTTPS gateway, proxy-level abuse limits, worker egress filtering and
operational monitoring.

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

The imapsync adapter explicitly enables certificate-chain and IMAP peer-name
verification for both implicit TLS and STARTTLS. It does not inherit imapsync's
permissive certificate defaults. An IP address requires a certificate valid for
that IP; use the certificate's DNS name otherwise. There is no browser option to
ignore certificate errors. Private CAs must be trusted by both the Go connection
checker and the imapsync runtime; an in-memory Go TLSConfig does not configure Perl.
Explicit plain IMAP remains a local-only, unencrypted compatibility mode.

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

In the hosted topology, credential-bearing connection tests, folder reads and
migrations cross an authenticated worker-service boundary. The API has only an
X25519 public recipient key. It creates an ephemeral key for each envelope,
derives an AES-256-GCM key with HKDF-SHA256 and authenticates the job ID, key ID
and expiry metadata. Only the worker container receives the matching private
key. The API does not retain the ephemeral private key. A database dump and the
API's long-lived public key cannot decrypt envelopes. A compromised live API
can still capture newly entered passwords and holds the internal service token;
recipient encryption does not make the API safe to compromise.

The worker keeps its ciphertext queue, bounded events and terminal results in a
separate SQLite volume. An OS-level database lock admits one service process;
renewable per-job leases coordinate credential use. Normal
completion, final failure or cancellation deletes the envelope; a hard stop
leaves only expiring ciphertext. Accepted work survives API restarts, and an
interrupted non-destructive worker attempt is retried at most the configured
number of times when whole-process-tree recovery is enabled (as in Compose).
Native daemons default to failing interrupted attempts for manual review because
killing a parent does not necessarily stop its imapsync children. Strict mirror
is never automatically retried after an error or crash.

Admission is staged: ciphertext and queue metadata are committed together, then
the API persists its owner/job record before activating execution. Cancellation
is acknowledged only after the worker stores it. Terminal tombstones remain for
48 hours to block replay of a still-valid envelope. Queue capacity and event
history are bounded. A transport outage does not cause a fresh migration.

HTTP worker redirects are refused. HTTPS is required except for loopback or an
explicit `MOVEMAILBOX_WORKER_ALLOW_HTTP=true` private-network opt-in. Compose
does not publish the worker port. Internal HTTP encrypts credential envelopes,
not bearer tokens or returned metadata; never send it across an untrusted network.

The older master-key child-process path remains available only behind
`MOVEMAILBOX_EMBEDDED_WORKER=true` for development and self-hosted compatibility.
Do not enable that fallback on the public service.

The API SQLite database stores credential-free migration metadata. The separate
worker database contains authenticated ciphertext, lease/status metadata and
redacted bounded events, never plaintext requests. Regression and end-to-end
tests scan database, WAL and shared-memory files for test passwords. Treat
mailbox identifiers, ciphertext and logs as private metadata and protect both
volumes and their backups anyway.

Deleting a SQLite row is logical deletion, not guaranteed secure erasure from
WAL, free pages, disks or backups. Ciphertext plus a subsequently stolen worker
private key can expose historical credentials. TTL is enforced by application
code; it does not make a retained ciphertext mathematically undecryptable.
Go/runtime copies also prevent a guarantee of complete memory zeroization.

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
