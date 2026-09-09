# Production backup and off-site restore runbook

This runbook covers the current single-VPS SQLite deployment. It backs up
metadata and encrypted credential envelopes only; it never backs up mailbox
contents. A backup is sensitive because encrypted envelopes remain useful to
someone who later obtains the worker private key.

## Scope and policy

- Keep API and worker databases as a paired snapshot. Do not restore one without
  the other.
- Do not back up `MOVEMAILBOX_WORKER_PRIVATE_KEY`, session secrets, internal
  bearer tokens or `.env` files into the ordinary metadata archive.
- Do not copy SQLite files while either writer is active. A filesystem snapshot
  is acceptable only when its consistency guarantees are documented and tested.
- Retain daily encrypted backups for 14 days and weekly encrypted backups for
  8 weeks. Adjust to the actual privacy/retention policy before launch.
- Store at least one encrypted copy outside the VPS/provider account. The VPS
  backup must not be the only copy.

## Scheduled backup procedure

1. Stop new admissions at the reverse proxy/API, or put the service in a
   maintenance state. Existing jobs must drain or be explicitly cancelled.
2. Confirm worker queue has no `queued`, `running` or `accepting` jobs and the
   credential-envelope table is empty. If not empty, stop and investigate.
3. Stop API and worker gracefully. Verify both containers are stopped and no
   process has the database files open.
4. Copy the API and worker SQLite databases from their volumes into a new
   mode-`0600` staging directory. Include `-wal`/`-shm` only if the backup tool
   requires them; a clean shutdown should checkpoint WAL first.
5. Run `PRAGMA integrity_check` on each copy. Abort if the result is not exactly
   `ok`. Generate a manifest containing image version, schema versions, UTC
   timestamp, file sizes and SHA-256 hashes.
6. Create an encrypted archive with an externally managed key (for example,
   age recipient or a cloud KMS envelope key). Never put the decryption key on
   the VPS. Upload the archive and manifest to an off-site bucket with private
   ACLs, object lock/retention and versioning.
7. Verify the remote object checksum and that an independent restore operator
   can retrieve it. Only then restart worker/API and reopen admissions.
8. Delete local staging files using the approved secure-retention procedure;
   remember SQLite/WAL filesystem remnants may remain sensitive.

The exact storage provider and encryption tool are deployment choices. Pin the
CLI version and bucket policy in the VPS configuration repository; do not use a
shell `curl | sh` backup client. The first production deployment must perform a
real upload and restore, not just a successful local archive command.

## Restore / rollback

1. Announce maintenance and stop admissions. Drain or cancel jobs; capture the
   current image digest and database manifest for rollback.
2. Provision empty API and worker volumes. Never overwrite the only live copy.
3. Download the selected off-site archive, verify its object checksum and
   decrypt it on a trusted operator machine or ephemeral restore host.
4. Verify manifest hashes, file ownership/mode, schema versions and exact
   `PRAGMA integrity_check = ok` before mounting anything.
   Run `python3 scripts/backup_validation.py /path/to/backup` against the entire
   pair before creating restored volumes. This checks required tables, terminal
   job states, absence of envelopes and consistency of shared job identities.
   It is a read-only gate and does not launch services or overwrite data.
   SHA-256 detects damage relative to the manifest; it does not authenticate a
   manifest modified by an attacker. Use the authenticated encrypted archive and
   restricted off-site access for provenance. Retention can remove terminal rows
   independently, so the validator does not require identical job-ID sets.
5. Start a staging API/worker pair on private ports with the same image version.
   Confirm health, owner isolation, zero active jobs and zero credential
   envelopes. A damaged/truncated archive must fail here and must not be
   mounted as a live queue.
6. Confirm a known completed job is still terminal and is not replayed. Submit
   one disposable demo job and verify it completes, then stop the staging pair.
7. Promote the restored volumes only after the checks pass. Keep the previous
   live volumes read-only and recoverable until the rollback window closes.
8. Rotate worker recipient keys and internal tokens if compromise is suspected;
   otherwise follow the controlled drain/rotation sequence in `WORKER.md`.

## Recovery objectives and drills

Set these values before launch: maximum tolerable metadata loss (RPO), maximum
service outage (RTO), backup frequency, retention, owner for each alert and the
off-site provider. At least monthly, restore into empty volumes and record the
manifest, image digest, integrity results, terminal-job check, owner-isolation
check and a new disposable job result. Treat a failed restore as an incident.

The repository's `scripts/smoke-backup-restore.py` is a local demo drill. It
already checks paired stopped databases, empty-volume restore, integrity failure
for truncation/byte corruption, envelope cleanup, owner isolation and no replay
of terminal jobs. It does not replace an encrypted off-site provider drill.
