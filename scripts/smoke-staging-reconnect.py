#!/usr/bin/env python3
"""Opt-in idle staging worker restart; API stays up. Run in an exclusive window."""
import argparse
import json
import sqlite3
import time
import urllib.error
import urllib.request
from contextlib import closing
from staging_update import CONTAINERS, database_paths, run


def readiness():
    request = urllib.request.Request("http://127.0.0.1:8080/api/ready",
                                     headers={"Host": "staging.movemailbox.com"})
    try:
        response = urllib.request.urlopen(request, timeout=5)
    except urllib.error.HTTPError as error:
        response = error
    with response:
        return response.status, json.load(response)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--allow-worker-restart", action="store_true", required=True)
    parser.parse_args()
    paths = database_paths()
    with closing(sqlite3.connect(paths["worker"].as_uri() + "?mode=ro", uri=True)) as db:
        active = db.execute("SELECT count(*) FROM worker_jobs WHERE status NOT IN ('completed','failed','cancelled')").fetchone()[0]
        envelopes = db.execute("SELECT count(*) FROM credential_envelopes").fetchone()[0]
        if active or envelopes:
            raise RuntimeError("stage is not idle; refusing worker restart")
    if readiness() != (200, {"ready": True, "status": "ready"}):
        raise RuntimeError("stage was not ready before the drill")
    api_started = run("docker", "inspect", CONTAINERS[0], "--format={{.State.StartedAt}}").stdout
    old_image = run("docker", "inspect", CONTAINERS[1], "--format={{.Image}}").stdout
    started = time.monotonic()
    try:
        run("docker", "stop", "--time=20", CONTAINERS[1])
        if readiness() != (503, {"ready": False, "status": "not_ready"}):
            raise RuntimeError("API did not report worker unavailability")
    finally:
        run("docker", "start", CONTAINERS[1])
    deadline = time.monotonic() + 45
    while readiness()[0] != 200:
        if time.monotonic() > deadline:
            raise RuntimeError("API did not reconnect within 45 seconds")
        time.sleep(0.5)
    if api_started != run("docker", "inspect", CONTAINERS[0], "--format={{.State.StartedAt}}").stdout:
        raise RuntimeError("API restarted during worker outage")
    if old_image != run("docker", "inspect", CONTAINERS[1], "--format={{.Image}}").stdout:
        raise RuntimeError("worker image changed")
    print(json.dumps({"result": "PASS", "readiness": [200, 503, 200],
                      "apiRestarted": False, "elapsedSeconds": round(time.monotonic()-started, 2)}))


if __name__ == "__main__":
    main()
