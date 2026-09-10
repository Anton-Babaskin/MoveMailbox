# Engineering handoff — 2026-09-10

## Where to continue

- Repository: `Anton-Babaskin/MoveMailbox` (GitHub is canonical).
- Baseline: `main` at `5315ce2`, merged PR #8. Its CI run `34399888643` passed.
- Current task branch: `feature/live-imap-storage-recovery`, based on that main.
  [PR #9](https://github.com/Anton-Babaskin/MoveMailbox/pull/9). Verify its current
  state and CI by branch, not by the old merged PR #8.
- Follow root `AGENTS.md` and [two-computer workflow](TWO-COMPUTERS.md). Fetch all
  branches first; do not reset another computer's local work or merge all refs.

## Completed in this task

1. Finished the previous stage's handoff: confirmed PR #8 merged and main CI
   green, then started this branch from the updated main.
2. Added portable Codex instructions, safe start/end Git synchronization rules
   and this progress record. No global settings or automatic background sync.
3. Extended the bounded ENOSPC harness with an explicitly authorized real-IMAP
   mode. The test wrapper pauses **after native imapsync success, before worker
   finalization**; it never modifies native arguments or production code.
4. Real copy + ENOSPC without restart passed: no false success; terminal failure
   persisted after capacity returned, attempts=1, credential envelope removed.
5. Real copy + ENOSPC + SIGKILL passed: same database retained by a holder,
   opted-in ordinary recovery completed in attempts=2 after lease expiry.
6. Both runs: SHA-256, flags, INTERNALDATE and message count matched; subsequent
   transfers copied zero messages; source unchanged, guest isolation and empty
   terminal envelopes verified, no mailbox passwords in service logs.

Evidence, sanitized job IDs and reproduction: [PILOT.md](PILOT.md), September 10
section. All temporary lab containers were stopped. Test mail and ordinary lab
volumes were retained; the bounded worker tmpfs disappears after its last mount.
The test gate bind mount was temporary; recreate these labs with the harness,
do not just restart their stopped containers.

## Verification and honest limits

- Local Windows Go 1.27: `go test ./...` and `go vet ./...` passed.
- WSL Python: 19 offline harness tests passed, including 4 new gate/CLI tests.
- Both new live-mail modes passed with native imapsync and verified IMAP TLS,
  guest API and encrypted remote-worker queue, not the demo engine.
- CI is authoritative for the exact pushed SHA: inspect the current branch PR
  checks for Linux race/vet/vulnerability tests, builds and Docker regression
  matrix. Do not infer a new head is green from the baseline run above.
- This is disk exhaustion at **post-copy finalization**, not ENOSPC injected
  during the APPEND literal. Exact APPEND disconnect/lost-ACK tests are separate
  previous proofs. Neither result establishes universal exactly-once delivery.
- Live strict mirror was not rerun here; destructive replay remains forbidden
  and is covered by the earlier demo crash matrix. No production policy changed.
- No VPS, production KMS, off-site provider or public launch is implied.

## Next two proposed technical steps

1. Reproduce coordinated API/worker key rotation in isolated Docker, including
   already queued envelopes, correct key retention and fail-closed behavior for
   a missing/wrong old key. Record the actual supported operational procedure;
   do not weaken the cryptographic boundary to make rotation pass.
2. Exercise encrypted off-site backup/restore using a separate local test target
   first: interrupted upload, corrupt/incomplete objects, clean restore and a
   post-restore migration. Real off-site credentials/VPS are a later user-provided
   deployment step; local storage alone must not be called an off-site proof.

MVP release gates still include deployment egress/SSRF enforcement, external
provider coverage, load/abuse tests, ownership of retention/alerts, HTTPS and
production secrets. See [ROADMAP.md](ROADMAP.md).

## Files deliberately not synchronized

This machine has unrelated site ZIP/tar exports, a local log, a Replit prompt
and an untracked nested `website/` repository. They were preserved, not staged
or deleted. Site-source synchronization needs its own explicit repository scope.
Mailbox credentials and generated service keys are never part of the handoff.
