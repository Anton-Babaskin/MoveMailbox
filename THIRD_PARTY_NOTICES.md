# Third-party components

MoveMailbox is maintained by Anton Babaskin. It is an independent project, not an
official imapsync product or an endorsement by a mail provider.

This inventory explains component boundaries. It is **not** a replacement for
upstream license texts, a complete container software bill of materials, or a
legal determination that every redistribution obligation has been satisfied.

## Migration runtime

**imapsync 2.319**, by Gilles Lamiral, is licensed separately under the
[NO LIMIT PUBLIC LICENSE](https://imapsync.lamiral.info/LICENSE).
The Dockerfile pins `gilleslamiral/imapsync:2.319` to digest
`sha256:161336e1a6db587bc42ea1126cfc9b6afa67ea92b408ea4c4454f7f771561aa4`.

- Native preview archives do not bundle imapsync.
- The Docker image includes the upstream runtime and its dependencies.
- Preserve upstream notices; review the exact image, Perl dependencies and OS
  packages before redistribution. Do not treat the entire image as NLPL.

## Direct Go dependencies

Versions below match [go.mod](go.mod). Their license files were checked in the
downloaded module sources for the repository documentation update.

| Module | Version | License |
| --- | --- | --- |
| github.com/emersion/go-imap/v2 | v2.0.0-beta.8 | MIT |
| modernc.org/sqlite | v1.58.0 | BSD-3-Clause |

Upstream: [go-imap](https://github.com/emersion/go-imap) and
[modernc SQLite](https://modernc.org/sqlite).

Transitive modules are pinned in go.mod/go.sum and have their own notices.
This table is intentionally not a full transitive license inventory.
Use `go list -m all` for the resolved graph and inspect each module's exact
license before producing a distributable notice bundle.

## External operator tools

The backup workflow uses **age 1.3.2** ([source](https://github.com/FiloSottile/age/tree/v1.3.2)),
installed separately. age is not an application Go dependency or a bundled native
executable. The operator scripts also require Python 3.11+ on Linux/WSL.

## Repository artwork

The banner and architecture drawing in `docs/assets/` are original MoveMailbox
SVG assets. They are diagrams, not screenshots, benchmark results or independent
security certifications. Brand names and upstream logos remain with their owners.

## Release checklist

- Resolve the MoveMailbox licensing choice in [docs/LICENSING.md](docs/LICENSING.md).
- Review exact source, compiled modules and image contents, not only direct dependencies.
- Include required upstream copyright/license texts with redistributed artifacts.
- Revisit this inventory whenever dependency versions or packaging change.
