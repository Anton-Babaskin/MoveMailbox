"""Read-only validation for a drained, paired SQLite backup before restore."""
import hashlib
from contextlib import closing
import json
import sqlite3


def ensure_worker_drained(path):
    """Read-only rotation/backup gate. Caller must first stop admissions/writer."""
    if path.is_symlink() or not path.is_file():
        raise ValueError("worker database is missing or linked")
    with closing(sqlite3.connect(path.resolve().as_uri() + "?mode=ro", uri=True)) as db:
        if db.execute("PRAGMA integrity_check").fetchall() != [("ok",)]:
            raise ValueError("worker integrity failed")
        if db.execute("SELECT count(*) FROM credential_envelopes").fetchone()[0]:
            raise ValueError("worker still holds credential envelopes; retain old key")
        if db.execute("SELECT count(*) FROM worker_jobs WHERE status NOT IN ('completed','failed','cancelled')").fetchone()[0]:
            raise ValueError("worker queue is not drained; retain old key")


def validate_pair(directory, manifest):
    if set(manifest.get("files", {})) != {"api", "worker"}:
        raise ValueError("both database checksums are required")
    statuses = {}
    for role in ("api", "worker"):
        path = directory / (role + ".db")
        if path.is_symlink() or not path.is_file() or path.stat().st_size < 512:
            raise ValueError("missing or invalid database file")
        if hashlib.sha256(path.read_bytes()).hexdigest() != manifest["files"][role]:
            raise ValueError("database checksum mismatch")
        with closing(sqlite3.connect(path.resolve().as_uri() + "?mode=ro", uri=True)) as db:
            if db.execute("PRAGMA integrity_check").fetchall() != [("ok",)]:
                raise ValueError("database integrity failed")
            if role == "worker":
                if db.execute("SELECT count(*) FROM credential_envelopes").fetchone()[0] != 0:
                    raise ValueError("backup contains active credentials")
                statuses[role] = dict(db.execute("SELECT job_id, status FROM worker_jobs"))
            else:
                statuses[role] = {}
                for job_id, payload in db.execute("SELECT id, snapshot_json FROM job_snapshots"):
                    snapshot = json.loads(payload)
                    view = snapshot["view"]
                    if view["id"] != job_id:
                        raise ValueError("snapshot identity mismatch")
                    statuses[role][job_id] = view["status"]
            if any(status not in ("completed", "failed", "cancelled") for status in statuses[role].values()):
                raise ValueError("backup contains non-terminal jobs")
    # Stores have independent retention; an absent terminal record can be valid.
    # Contradictory states for a shared identity are not safe to restore blindly.
    for job_id in statuses["api"].keys() & statuses["worker"].keys():
        if statuses["api"][job_id] != statuses["worker"][job_id]:
            raise ValueError("paired databases disagree on job state")


if __name__ == "__main__":
    import argparse
    from pathlib import Path
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("directory", type=Path)
    args = parser.parse_args()
    try:
        manifest = json.loads((args.directory / "manifest.json").read_text())
        validate_pair(args.directory, manifest)
    except (OSError, ValueError, KeyError, TypeError, sqlite3.DatabaseError):
        parser.exit(1, "FAIL: backup pair rejected; no database restored or started\n")
    print("PASS: checksums, SQLite integrity, terminal queue and paired states verified")
