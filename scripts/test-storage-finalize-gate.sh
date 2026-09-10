#!/bin/sh
# Isolated live-mail lab only: pause AFTER native copy, BEFORE worker finalization.
# Native arguments, exit status and secret environment are preserved.
set -eu
/usr/bin/imapsync "$@"
# Durable test-only marker makes a resumed attempt pass without a second gate.
if [ ! -f /worker-data/test-storage-gated ]; then
    : > /worker-data/test-storage-gated
    : > /tmp/storage-copy-ready
    attempt=0
    while [ ! -f /tmp/storage-copy-release ]; do
        attempt=$((attempt + 1))
        if [ "$attempt" -ge 120 ]; then
            exit 124
        fi
        sleep 1
    done
fi
