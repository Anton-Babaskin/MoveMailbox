# Engineering handoff — 2026-09-11

## Active task: public static website

- Branch `web/github-pages-seo`, based on main `be9af16`. User requested public
  website publishing on GitHub Pages with movemailbox.com; deployment from this
  branch is authorized, but no backend PR merge or release is implied.
- Imported the owner's Next.js website into `web/`; preserved the framework,
  stylesheet and design. Did not import replacement Dockerfile, Go handlers or
  permissive CSP instructions. Backend and Proxmox were not modified.
- Public Pages is a documentation/product preview, not an online migration
  backend. Server-rendered disabled fieldset prevents credential entry; its API
  adapter is retained but not imported/initialized. No payment collection.
- Static export: 30 sitemap URLs, trailing-slash directory routes, matching
  canonical links, unique titles/descriptions and h1 headings, valid JSON-LD.
  Removed nonexistent-language hreflang, fake health status and open-source
  license claim; corrected missing assets and preview download links.
- Blog/legal drafts have noindex and are excluded from sitemap. Placeholder
  legal claims replaced with honest current static-site notices. Owner must
  supply full online-service terms before backend/payment launch.
- Local production build and TypeScript validation passed; export checker
  passed 30 indexable pages and 1090 local link/asset references. npm audit found
  zero vulnerabilities after Next 15.5.24 and scoped PostCSS/sharp overrides.
  Live public DNS/HTTPS is not yet validated: owner must change Namecheap DNS.
- Pages custom domain configured; deployment workflow only publishes on explicit
  main/site-branch pushes, never PR events. Inspect the site PR and Pages run for
  exact commit/deployment result. Initial site branch allowed in github-pages
  environment; remove that allowance and workflow branch after merging.
- Existing backend PR #11 remains open and its CI passed. VM is closed; user
  explicitly rejected changes to existing Proxmox services/443, which is occupied.
  Read `ops/private-vm-staging` handoff for VM evidence. Do not add port forwards.
- Next: (1) owner sets DNS from [website instructions](../web/README.md), verify
  certificate/apex/www/deep routes and enforce HTTPS; (2) owner supplies Search
  Console verification token, then submit sitemap; backend integration is separate.
- User's unrelated ZIP exports, log and nested `website/` remain untouched and
  uncommitted. Credentials and local machine paths are not synchronized.

Historical records below describe earlier tasks.

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
