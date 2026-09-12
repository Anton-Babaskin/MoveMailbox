# Backend probes and progress streams

This is an API integration contract for operations and the separately maintained
frontend. It does not enable online transfers on the static public website.

## Liveness versus readiness

| Endpoint | Meaning | Response |
| --- | --- | --- |
| `GET /api/health` | Existing desktop discovery/liveness endpoint | HTTP 200; existing product, engine and storage fields remain compatible |
| `GET /api/ready` | Configured engine/worker available, no known history persistence error, manager not stopping/closed | HTTP 200 `{"status":"ready","ready":true}` or HTTP 503 `{"status":"not_ready","ready":false}` |

Both probes retain the exact Host allowlist and request/security guards. Neither
creates a guest session or consumes guest rate-limit state. Readiness uses
`Cache-Control: no-store`, exposes no job/credential data and needs no browser
login. Restrict probe frequency at the reverse proxy: remote worker availability
uses an authenticated check with a two-second deadline.

Use readiness for traffic admission/alerts, not automatic restart of an otherwise
live API during a worker outage. Existing Docker liveness probes are unchanged.
This is a point-in-time diagnostic, not a slot reservation, disk-space forecast
or end-to-end IMAP login. Per-owner/global/worker queue limits can still refuse a
new job; a later write or network operation can fail after a successful probe.
Persistence readiness reflects the most recent observed store result.

## Server-sent events

`GET /api/jobs/{id}/events` uses the same guest ownership check as job reads.
An unknown or another guest's job returns 404 without revealing its state.

- A first connection receives `event: snapshot`, an `id` equal to its sequence
  and the current credential-free job view. Replace local state and recent logs
  with this snapshot; do not append its logs to a previous snapshot.
- Reconnect using `Last-Event-ID`. Retained newer events are sent as
  `event: migration` with monotonically increasing IDs. A reconnect with no
  pending event immediately receives HTTP headers, then periodic keep-alives.
- If the requested history was evicted, or a cursor is ahead of restored state,
  a `migration` event with `type: gap` is followed by an owned snapshot with its
  current ID. That ID can intentionally move backwards after restoration.
  Reset local state/cursor and suppress buffered events represented by the
  snapshot. Full historical logs cannot be reconstructed after retention expiry.
- The server suppresses events already included in a snapshot. Clients must
  handle both terminal snapshots and `finished` events, close their EventSource
  when terminal, and tolerate replay after a connection failure. HTTP connection
  closure alone is not proof that a migration succeeded.
- A malformed `Last-Event-ID` returns 400. Keep credentials out of URLs/headers;
  the stream never requires mailbox passwords.

No frontend code is changed by this contract. Claude owns its integration and
presentation. Validate browser behavior separately before connecting a public UI.

[Configuration](CONFIGURATION.md) · [Worker topology](WORKER.md)
