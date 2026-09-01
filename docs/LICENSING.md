# Licensing status

## MoveMailbox

No `LICENSE` file has been selected for the MoveMailbox source code yet. Until
the copyright holder makes that choice, a public GitHub repository should not
be interpreted as permission to copy, modify, redistribute or sell the
MoveMailbox code.

Before a general public or commercial binary/container release, the owner must
choose and publish a project licensing model, for example:

- a recognized open-source license;
- a proprietary/source-available license with explicit evaluation terms; or
- separate community and commercial licenses.

That choice affects outside contributions, hosted and desktop distribution,
trademark policy and third-party notice requirements. It is intentionally not
made by this technical patch and should be reviewed with qualified counsel for
the intended countries and business model.

## imapsync

imapsync is a separate upstream project. Its official source identifies its
license as NOLIMIT Public License (NLPL) and states that there are no limits on
what may be done with the work and license:

- <https://imapsync.lamiral.info/LICENSE>
- <https://github.com/imapsync/imapsync/blob/master/LICENSE>

The fact that the upstream author sells official downloads and support does not
create a commercial-use ban in that license. MoveMailbox currently builds on
the upstream Docker image `gilleslamiral/imapsync:2.319`, pinned to digest
`sha256:161336e1a6db587bc42ea1126cfc9b6afa67ea92b408ea4c4454f7f771561aa4`.

Before each release that bundles or redistributes imapsync, re-check the exact
artifact's license and dependencies, retain upstream notices, and record the
reviewed imapsync version/digest in the release materials. This document is a
technical inventory, not legal advice.
