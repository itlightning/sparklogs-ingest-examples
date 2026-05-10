#!/usr/bin/env bash
# Stop a detached mock collector started by start.sh -d.

set -euo pipefail

LOG_DIR=/tmp/sparklogs-otel-mock
PID_FILE="${LOG_DIR}/collector.pid"

if [[ -f "${PID_FILE}" ]]; then
    PID="$(cat "${PID_FILE}")"
    if kill -0 "${PID}" 2>/dev/null; then
        kill "${PID}"
        echo "[mock] stopped pid=${PID}"
    else
        echo "[mock] already stopped pid=${PID}"
    fi
    rm -f "${PID_FILE}"
fi

# Also stop any Docker variant.
docker rm -f sparklogs-otel-mock >/dev/null 2>&1 || true
