# Release candidate acceptance

The current release scope is the local utility and single-VM, invite-only hosted
pilot. Paid accounts, payment entitlements and public self-service are separate
stages, not implied by a release-candidate tag. Website source and SEO stay with
Claude; this process builds that source without redesigning it.

## Immutable artifacts

1. Start from a reviewed commit in `main` with successful CI for that exact SHA.
2. `.github/workflows/release.yml` builds the API-enabled interface with the npm
   lockfile, runs Go/race/vet/vulnerability and Python checks, then cross-builds
   five native targets. Missing exported assets stop packaging.
3. Each archive contains `BUILD-INFO.txt` (tag, full commit, target),
   `BUILD-DEPENDENCIES.txt` (the executable's Go/module build information),
   launch instructions, security and licensing information. A chosen `LICENSE`
   is included if present; this process does not choose licensing for the owner.
   Stable tags are blocked until an owner-approved `LICENSE` exists.
4. Native Windows amd64 and Linux amd64 runners validate all five archives and
   SHA-256 checksums, unpack only the intended executable into a temporary
   directory, and start it on loopback with a fresh SQLite database. Tests cover
   embedded RU/EN/UK pages and their assets/CSP, a demo job, history after restart
   and absence of synthetic passwords in the resulting files. No browser or real
   IMAP connection is opened.
5. The existing independent API/worker recovery test also runs against the built
   Linux executable. Publication depends on both native acceptance jobs, not
   just successful compilation.

The workflow's manual `candidate_tag` input validates and retains artifacts for
seven days **without publishing a tag/release**. Push an approved `v*-rc.*` tag
to publish a prerelease after the same gates. Do not overwrite an existing tag
or publish failed/unverified artifacts. `scripts/build-release.sh` intentionally
refuses an existing `dist` directory instead of deleting or mixing older output.

## What these checks do not prove

- Linux arm64 and both macOS targets are compiled and archive-checked, not run
  on those operating systems. Do not call them native acceptance-tested.
- Demo launch on Windows is not a real Windows IMAP migration test. imapsync is
  installed separately in native packages; only Docker bundles the pinned engine.
- Checksums detect a difference from the published archive, not a publisher
  signature. These artifacts are not signed/notarized.
- The test fetches rendered pages and assets; it does not replace Claude's
  browser/UI integration acceptance or prove that the public Pages site has API.

## Staging promotion

Build a Docker image from the same reviewed commit and version. Keep the old
immutable image on the VM. Use the dedicated transactional updater after it
confirms no active API/worker jobs; it snapshots the metadata pair and rolls back
both image and pair if readiness fails. This is a deployment safeguard, not the
deferred off-site backup project. Do not alter the owner-managed host routing or
VPN, or recreate Compose with a different project name.

After promotion check image IDs, `/api/health`, `/api/ready`, the trusted HTTPS
invitation gate, and one explicitly authorized disposable-mail fixture including
repeat without duplicates. Report deployed version separately from published
native version. Reference [pilot evidence](PILOT.md) and the latest
[handoff](HANDOFF.md); do not reinterpret older provider tests as a fresh run.

## Before a stable/public launch

- Owner chooses the project distribution license; unsigned artifact warnings
  and the imapsync installation requirement remain explicit.
- Complete native real-migration acceptance for every advertised platform, or
  label unverified platforms as previews.
- Configure automatic HTTPS renewal and verify it; a manual DNS certificate is
  not unattended renewal. Confirm operational alerts have an owner.
- Finish the invited-user acceptance with the same-origin UI/API deployment.
  Account/payment access and broader provider coverage have their own gates in
  the [roadmap](ROADMAP.md), not mandatory infrastructure for a local demo.
