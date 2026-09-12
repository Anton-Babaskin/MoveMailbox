# Engineering handoff — 2026-09-12

## Active task: real-mail acceptance on the closed VM

- Continue `test/private-staging-mail`, based on main `3889632`. PR #11 is already
  merged. This new technical branch is independent of the public website PR #12
  (`web/github-pages-seo`); inspect both PR states after fetching all refs.
- Owner explicitly resumed the previously cancelled mailbox tests. A real
  Mail-in-a-Box pilot passed on the deployed API/worker image `staging-be9af16`.
  No Go/application code or deployment configuration changed.
- Added `scripts/smoke-private-staging-mail.py`: bounded stdin credentials,
  fixed loopback guest API, selected synthetic folders, 6 MiB attachment,
  preflight modes, bidirectional copies and repeats, guest isolation,
  cancellation and opt-in worker SIGKILL with exclusive-active-job guard.
- All 13 real jobs reached expected terminal states. Copy verification compares
  complete-message SHA-256, flags and INTERNALDATE. Repeats copied zero messages;
  original INBOXes and source fixture stayed unchanged. Crash recovery used two
  attempts for the same job. SQLite integrity and terminal envelope cleanup
  passed; raw mailbox passwords absent from inspected DB/WAL/SHM and service logs.
- Four new offline guard tests passed. WSL suite: 39 passed, one age integration
  test skipped because age/age-keygen are unavailable in that WSL environment.
  Consult the current PR's CI for pinned age integration and Go/Docker checks;
  a previous branch's green CI is not proof for this branch.
- Test scripts were staged temporarily on the VM; credentials were supplied
  through SSH stdin after hidden local input. No credential file was created.
  Synthetic folders remain for inspection; both deployed services are healthy.
  Details, job IDs and limitations: [pilot record](PILOT.md).
- Next two technical steps: (1) encrypted off-host backup and independent restore
  using an owner-designated destination; (2) VM reboot acceptance and readiness
  monitoring/retention checks. Separate future scope: paid identity/entitlements.
- Website DNS/HTTPS and all 30 sitemap pages were verified on September 12;
  source and deployment checker are in PR #12. Search-engine ownership records
  and sitemap submission are still pending with the owner. Do not lose the
  website branch when continuing technical work on another computer.

## Previous task: closed VM stage (PR #11 merged)

- Historical branch `ops/private-vm-staging`, based on main `be9af16`, was merged
  through PR #11 as `3889632`. Continue the active branch above.
- Deployed a closed Ubuntu 24.04 VM stage: Docker/Compose, separate API/worker,
  root-only generated credentials, loopback-only API, host UFW allowing SSH,
  project-scoped nftables egress policy and systemd startup ordering.
- Application image was built from `be9af16fa7b718f16028c7b746f7807d5c896d7d`:
  `sha256:15d062fa52b8d9bb3e3cdea83045e4481ae72eb7476be87087404ccaafd476b3`.
  Ops files are deployed separately from that immutable application image.
- Fixed worker Compose healthcheck: GET instead of wget spider/HEAD. The old
  probe falsely reported unhealthy although GET and authenticated API health
  succeeded. Both services are now healthy after stage service restart.
- VM checks passed: non-root/read-only/capability/resource limits, API loopback
  binding, worker unpublished, real remote-worker health, Secure/HttpOnly guest
  cookie, CSRF rejection, private-target rejection and untrusted Host rejection.
- Live network checks passed: metadata, bridge-host, NAT hairpin and arbitrary
  HTTPS denied with increasing nftables rejection counters; API direct IMAP
  denied; worker DNS and certificate-verified IMAP TLS reached two authorized
  servers. No mailbox login, migration job or message mutation in this stage.
- Python: all 36 tests passed in WSL with age, including six new staging tests.
  Native Windows Go could not run: incomplete temporary toolchain, missing
  standard-library `unsafe`. Do not describe that attempt as a test pass.
- Fallback verification passed on the VM in the pinned Go builder container:
  `go test -race ./...` and `go vet ./...`, with no network and bounded resources.
  Application Go sources are unchanged from the image baseline. Documentation
  checker passed (92 local link references); Python syntax compilation passed.
- No DNS/NAT, HTTPS, Proxmox settings, filesystem resize, full VM reboot,
  off-site backup or public deployment was performed. SSH authentication was
  not weakened or disabled. Temporary deployment sudo access remains; arrange
  its removal only after verifying a normal administrative fallback.
- Next two steps: (1) owner confirms staging DNS and NAT/reverse proxy, then
  configure HTTPS and a restricted pilot; (2) configure an owner-provided off-site
  backup destination, prove restore, then schedule VM reboot acceptance.
- See [private staging runbook](../deploy/staging/README.md). Server addresses,
  SSH keys and generated secrets are intentionally absent from the repository.

The sections below retain historical implementation evidence; their statements
about no VPS refer to the earlier tasks, not the current closed stage.

## Where to continue

- Repository: `Anton-Babaskin/MoveMailbox` (GitHub is canonical).
- Presentation task: `docs/repository-showcase`, based on main `162353a`, is
  complete. PR #10 passed CI run `34491518564` and was integrated into main as
  merge commit `1949d02ac83b4eae35e18d3dda7746e8780df102` on September 10.
  The branch remains as a historical remote ref; start new work from updated
  `main`, not from the presentation branch.
- This task adds a new English/Russian repository overview, original SVG banner
  and mail-flow diagram, setup/configuration guides, documentation index,
  contribution/support instructions, issue/PR templates and a changelog.
  GitHub description, website and topics were refreshed; private vulnerability
  reporting was verified enabled. No release tag or asset was replaced.
- Local verification: Go tests/vet, documentation links and all 30 Python tests
  passed in Linux/WSL with age installed, including four docs-checker tests.
  The full backup suite is not native-Windows compatible (POSIX directory fsync
  and symlinks); its initial Windows attempt failed and was rerun in WSL.
  Both SVGs were rasterized and visually inspected. Consult this
  task's exact PR SHA for full CI results; no production behavior was changed.
- The MoveMailbox license choice is still awaiting the owner. Do not select a
  license, label the project open source or reinterpret imapsync's license as
  permission for the whole repository. THIRD_PARTY_NOTICES.md is a scoped
  inventory, not a completed transitive/container redistribution audit.
- Integrated baseline: `main`, merge commit `c1b2c601fe128baa31505f4b6e247a5522081d3f`.
  [PR #9](https://github.com/Anton-Babaskin/MoveMailbox/pull/9) was merged on
  September 10 with the owner's authorization. Its development branch
  `feature/live-imap-storage-recovery` is retained for reference, not active work.
- Continue new implementation on a fresh feature branch from safely updated main.
  Fetch and inspect the current main CI; do not mistake pre-merge checks for a
  completed post-merge run.
- Published [v0.4.0-preview](https://github.com/Anton-Babaskin/MoveMailbox/releases/tag/v0.4.0-preview)
  still points to `b1eca4b2494712b1492ddcc165187b76056bb8c5`, now an ancestor of main.
  Its tag and five platform archives were not rewritten or promoted to stable.
  CI `34469906451` and release workflow `34470545536` passed for that exact SHA.
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
7. Added an operator-safe `age` metadata backup utility with atomic object commit,
   manifest/checksum validation, traversal/link/size limits and no-overwrite
   restore. It never includes worker private keys or mailbox contents.
8. Added 26 offline tests and a Docker backup drill. Demo encrypted backup,
   interrupted/corrupt/truncated object rejection, fresh-volume restore and a
   post-restore migration all pass. Rotation guard and coordinated key/token
   rotation pass in the Docker remote-worker drill.

Evidence, sanitized job IDs and reproduction: [PILOT.md](PILOT.md), September 10
section. All temporary lab containers were stopped. Test mail and ordinary lab
volumes were retained; the bounded worker tmpfs disappears after its last mount.
The test gate bind mount was temporary; recreate these labs with the harness,
do not just restart their stopped containers.

## Verification and honest limits

- Local Windows Go 1.27: `go test ./...` and `go vet ./...` passed.
- WSL Python: 26 offline harness tests passed, including age round-trip, archive
  commit, corruption, path-safety, rotation-gate and ENOSPC tests.
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
- The encrypted backup drill uses a local directory as an object-store model; it
  is not evidence of an actual S3/B2/Wasabi off-site upload or provider ACL.

## Next two proposed technical steps

1. Run the same backup/restore against a user-provided encrypted off-site bucket
   on the VPS, with object lock/versioning and independent checksum retrieval.
2. Add paid-account/magic-link entitlements and a production deployment gate
   only after VPS egress firewall, HTTPS, retention and incident contacts are
   configured. Keep free guest migration without registration.

MVP release gates still include deployment egress/SSRF enforcement, external
provider coverage, load/abuse tests, ownership of retention/alerts, HTTPS and
production secrets. See [ROADMAP.md](ROADMAP.md).

## Files deliberately not synchronized

This machine has unrelated site ZIP/tar exports, a local log, a Replit prompt
and an untracked nested `website/` repository. They were preserved, not staged
or deleted. Site-source synchronization needs its own explicit repository scope.
Mailbox credentials and generated service keys are never part of the handoff.
