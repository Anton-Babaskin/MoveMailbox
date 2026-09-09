#!/bin/sh
# Isolated Docker test only. Preserve the worker's exact arguments and secrets.
set -eu
: > /tmp/growth-ready
attempt=0
while [ ! -f /tmp/growth-release ]; do
    attempt=$((attempt + 1))
    if [ "$attempt" -ge 120 ]; then
        exit 124
    fi
    sleep 1
done
exec /usr/bin/imapsync "$@"
