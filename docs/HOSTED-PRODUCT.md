# Hosted product direction

MoveMailbox should keep one migration core while offering two editions:

1. **Community edition** — free desktop/self-hosted build with an optional
   donation link.
2. **Hosted edition** — a paid service where our server continues the migration
   after the customer closes the browser.

The marketing site and the migration application should use the same brand but
run as separate deployable components:

```text
movemailbox.com      static marketing, guides, SEO, donations
app.movemailbox.com  authentication, billing, job dashboard
api/worker               Go job manager and isolated imapsync processes
PostgreSQL               users, jobs, payments and audit metadata
```

## Honest launch offer

Suggested initial positioning:

- Local desktop and self-hosted use: free, unlimited, donations welcome.
- Hosted connection test and dry run: free.
- First hosted mailbox up to 3 GB: free or pay-what-you-want.
- Standard hosted mailbox up to 25 GB: draft price USD 5.90.
- Large hosted mailbox up to 100 GB: draft price USD 11.90.
- Business batches: quote or volume credits, starting around USD 2.90 per
  mailbox with a minimum order.

These are launch hypotheses, not hard-coded prices. Keep them in configuration
and validate server, bandwidth and support costs before publishing them.

Do not claim that a free limit is technical when it is commercial. Say clearly
what is free, what is paid and what donations fund: hosting, testing against
mail providers and continued development.

## Required hosted foundations

Before accepting real public migrations:

- account authentication and verified email;
- PostgreSQL-backed durable jobs;
- encrypted credentials with a short lifetime and per-job keys;
- credentials deleted automatically after completion or expiry;
- isolated worker processes with CPU, memory and time limits;
- non-root, read-only worker containers with isolated in-memory credential
  handoff and transient working data on tmpfs;
- global and per-account concurrency limits;
- mailbox size estimation before payment;
- payment webhooks that are idempotent;
- TLS-only traffic and strict secret redaction;
- exact public `Host` allowlists shared by the gateway and application;
- rate limiting, CSRF protection and abuse monitoring;
- privacy policy, terms, refund rules and a subprocessors list;
- backups for job metadata, never for mailbox passwords or message contents.

Workers must support graceful draining: stop accepting new jobs, cancel or
finish active child processes within a bounded grace period, remove runtime
credentials, and only then terminate. Platform hard-kill timeouts must exceed
the application's cleanup timeout. Docker Compose's local one-minute grace
period is a development baseline, not a hosted-service sizing decision.

## Product sequence

1. Stabilize Windows demo and one real local imapsync migration.
2. Add SQLite locally, PostgreSQL in hosted mode, behind one store interface.
3. Add accounts and a durable queue.
4. Run the worker on a dedicated server or VM with imapsync installed.
5. Add a payment provider and configurable migration credits.
6. Publish the marketing site, security page, guides and status page.
7. Add business CSV batches, OAuth and team roles.

The marketing site may start on Replit. The worker should remain portable and
container-ready so it can move to a dedicated VPS without changing the UI or
database model.
