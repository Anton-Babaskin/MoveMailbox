# Hosted mailbox-size admission policy

The standalone worker defaults to **5,000,000,000 bytes (decimal 5 GB)** for
the entire source mailbox. Configure `MOVEMAILBOX_MAX_MAILBOX_BYTES` or
`worker-service --max-mailbox-bytes`. Invalid/negative limits stop startup;
`0` explicitly disables the policy for an unlimited self-hosted worker.
The local desktop engine is not wrapped in this hosted admission policy.
There are no client-supplied quota overrides or paid-tier exemptions yet.

Before each migration attempt (including preflight modes), the worker:

1. Lists all selectable source folders, regardless of the requested selection.
2. Opens each folder with EXAMINE (read-only) and fetches only UID and
   RFC822.SIZE, in batches of at most 500 messages.
3. Checks counts, duplicate UIDs, sizes, overflow and detectable mailbox changes.
4. Repeats the read-only inventory immediately before calling imapsync, so a
   mailbox that grows during the first pass is rejected before any copy.
5. Logs the aggregate bytes/message/folder counts and configured limit.
6. Allows exactly the limit; rejects a larger mailbox before calling imapsync.

Inventory failures fail closed, without automatic retries or destination writes.
Terminal job cleanup removes the credential envelope through the existing worker
lifecycle. Native connection checks and folder listing remain available.
The estimate is bounded by two minutes, 5,000 selectable folders and one million
messages. Missing or non-positive sizes require manual investigation, not a guess.
Folder aliases (including Gmail labels) may count the same message more than once;
this is a conservative sum of IMAP folder contents, not provider disk usage.

## Execution-time guard

The worker also passes its server-owned budget to imapsync through
`--exitwhenover`, using limit + 1 so the configured boundary stays inclusive
(MaxInt64 saturates conservatively). Clients cannot override this context value.
Native exit 118 becomes a permanent mailbox-policy failure: the worker does not
retry automatically and removes the credential envelope. Already copied mail is
retained. An engine reporting bytes above the limit cannot report success either.

This is a **whole-message guard**, not a strict network-byte cap: imapsync 2.319
checks completed transferred bytes after each message. The last whole message
can exceed the budget. Failed attempts, wire overhead and cumulative usage across
jobs are not accounted for; the threshold applies per migration attempt.

## Limitations / remaining launch gates

IMAP offers no atomic
whole-account snapshot: incoming mail, new folders or changes after the second
inspection can make the eventual transfer exceed the estimate. Before making
hard billing guarantees, implement strict byte accounting and cumulative quotas.
Growth in folders not selected for transfer is not continuously monitored.
Changing the environment does not add payment rights or per-customer quotas.
Do not expose the worker port publicly. Continue applying API target validation,
outbound network restrictions, TLS verification and guest rate/concurrency limits.

## Verification

`go test ./...` covers the limit boundary, selected-folder bypass attempts,
unavailable inventory, incomplete/duplicate/zero-sized IMAP replies, detectable
mailbox changes, and a remote worker rejection with one attempt and no copy call.
An opt-in read-only test is available with `MOVEMAILBOX_TEST_IMAP_HOST`,
`MOVEMAILBOX_TEST_IMAP_USER`, `MOVEMAILBOX_TEST_IMAP_PASSWORD` and:

```text
go test ./internal/migrator -run TestLiveMailboxEstimate -count=1 -v
```

Never commit test secrets or attach unredacted environment/log dumps.

September 8 live read-only checks passed on both authorized Mail-in-a-Box test
accounts: source 8,145 bytes / 2 messages / 8 folders; destination 14,699 bytes /
4 messages / 12 folders. This verifies the native estimator against real IMAP,
not the complete worker path by itself.

The subsequent WSL Docker run on image `movemailbox:quota-pilot` (backend
`76aebfb`) verified API -> remote worker -> real imapsync end to end:

- 1-byte worker limit: job `4497b5c1eef6200a` failed before creating a destination
  folder, even with one selected source folder.
- 100,000,000-byte worker limit: job `4417422772f49aed` copied a synthetic 6 MiB
  attachment (8,610,095-byte MIME message); SHA-256, flags and INTERNALDATE matched.
- Repeat `8efd7d7de824627a`: zero copied messages and no duplicate in destination.
- Worker SQLite confirmed all three terminal records with one attempt each;
  zero remaining credential envelopes; no mailbox passwords in container logs.
- Original source and destination INBOX snapshots remained unchanged.

Reproduce only with disposable mailboxes using `scripts/smoke-live-quota.py
--image movemailbox:quota-pilot --allow-test-mail`, supplying `MM_SOURCE_HOST`,
`MM_SOURCE_USER`, `MM_SOURCE_PASSWORD` and corresponding `MM_DESTINATION_*`
variables through the process environment. The script creates isolated folders,
keeps their test messages and Docker volumes, and stops its containers on exit.
Ports 8182/8183 must be free. No credentials should be saved in tracked files.

The execution-time guard has Go argument-boundary, process-exit and remote-worker
tests: growth after both inventories fails permanently with one attempt and no
remaining envelope. An opt-in native test, `scripts/smoke-live-budget.py --image
movemailbox:quota-pilot --allow-test-mail`, passed with two synthetic messages:
a 2-byte threshold retained one complete message, skipped the second and exited
118; the source stayed unchanged. This native test is separate from the Go worker
integration test, not a live end-to-end runtime-budget API assertion.
