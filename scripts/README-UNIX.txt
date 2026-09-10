MoveMailbox — Linux / macOS preview

Unpack the archive, open a terminal in that directory and run:
  ./movemailbox --demo --open=true

For real migration, install imapsync separately and make it available in PATH:
  ./movemailbox --open=true

imapsync is NOT bundled in these native archives. The repository's Dockerfile
provides a pinned imapsync runtime. Do not expose the local UI to the Internet.
Hosted API/worker deployment is a separate topology documented in operations/.
Backup operator scripts require Python 3.11+ and age 1.3.2 on Linux/WSL.

These preview binaries are not signed/notarized. macOS may require approval in
Privacy & Security; only approve an archive you verified from the official repo.
Verify SHA256SUMS.txt and BUILD-INFO.txt before running. Report problems without
mailbox passwords, cookies or message content.
