#!/usr/bin/env bash
# Start a local OpenTelemetry Collector that captures OTLP/HTTP log batches.
# Received log records are written by the `debug` exporter (in core otelcol)
# to the collector's stdout, which we redirect to
# /tmp/sparklogs-otel-mock/collector.stdout. Used by `make mock-test`.
#
# Usage:
#   ./localenv/otel-mock/start.sh        # start in foreground (Ctrl-C to stop)
#   ./localenv/otel-mock/start.sh -d     # start detached (use stop.sh to stop)
#
# In detached mode this waits for the collector's health endpoint to come up
# before returning, so a config / port-binding failure surfaces immediately
# instead of hanging the example that runs next.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR=/tmp/sparklogs-otel-mock
OTLP_PORT=14318
HEALTH_PORT=14133
HEALTH_URL="http://localhost:${HEALTH_PORT}/"
mkdir -p "${LOG_DIR}"
: > "${LOG_DIR}/collector.stdout"
: > "${LOG_DIR}/collector.stderr"

# Pre-flight: refuse to start if either port is already bound. Without this
# check, otelcol exits the moment it tries to bind, and a wait_for_health
# loop can return a false positive by hitting some other collector's health
# endpoint on the same port.
port_in_use() {
    local port="$1"
    if command -v ss >/dev/null 2>&1; then
        ss -ltn "sport = :${port}" 2>/dev/null | tail -n +2 | grep -q .
    elif command -v lsof >/dev/null 2>&1; then
        lsof -nP -iTCP:"${port}" -sTCP:LISTEN >/dev/null 2>&1
    else
        # Fall through; we'll let otelcol fail loudly via wait_for_health.
        return 1
    fi
}
for p in "${OTLP_PORT}" "${HEALTH_PORT}"; do
    if port_in_use "$p"; then
        echo "[mock] ERROR: port ${p} is already bound on localhost." >&2
        echo "        Stop whatever's using it, or edit localenv/otel-mock/config.yaml" >&2
        echo "        and start.sh to pick different ports." >&2
        exit 1
    fi
done

# Prefer a system-installed otelcol; fall back to docker.
if command -v otelcol-contrib >/dev/null 2>&1; then
    BIN="otelcol-contrib"
elif command -v otelcol >/dev/null 2>&1; then
    BIN="otelcol"
elif [[ "${1-}" == "-d" ]]; then
    echo "[mock] otelcol not found on PATH; install otelcol or run via Docker without -d." >&2
    exit 1
else
    echo "[mock] otelcol not found on PATH; using Docker." >&2
    exec docker run --rm \
        --name sparklogs-otel-mock \
        -p ${OTLP_PORT}:${OTLP_PORT} -p ${HEALTH_PORT}:${HEALTH_PORT} \
        -v "${SCRIPT_DIR}/config.yaml:/etc/otelcol/config.yaml:ro" \
        otel/opentelemetry-collector:0.116.0 \
        --config /etc/otelcol/config.yaml
fi

wait_for_health() {
    local pid="$1"
    for _ in $(seq 1 40); do
        if ! kill -0 "$pid" 2>/dev/null; then
            echo "[mock] ERROR: collector exited before becoming healthy. Last 20 lines of stderr:" >&2
            tail -20 "${LOG_DIR}/collector.stderr" >&2
            return 1
        fi
        if curl -sf --connect-timeout 1 "${HEALTH_URL}" >/dev/null 2>&1; then
            return 0
        fi
        sleep 0.25
    done
    echo "[mock] ERROR: collector did not become healthy within 10s. Last 20 lines of stderr:" >&2
    tail -20 "${LOG_DIR}/collector.stderr" >&2
    kill "$pid" 2>/dev/null || true
    return 1
}

if [[ "${1-}" == "-d" ]]; then
    nohup "${BIN}" --config "${SCRIPT_DIR}/config.yaml" \
        > "${LOG_DIR}/collector.stdout" 2> "${LOG_DIR}/collector.stderr" &
    PID=$!
    echo "$PID" > "${LOG_DIR}/collector.pid"
    if ! wait_for_health "$PID"; then
        rm -f "${LOG_DIR}/collector.pid"
        exit 1
    fi
    echo "[mock] mock OTLP receiver started and healthy (pid=${PID}, binary=${BIN})"
    echo "       OTLP/HTTP endpoint:  http://localhost:${OTLP_PORT}/v1/logs"
    echo "       health check:        http://localhost:${HEALTH_PORT}/"
    echo "       captured batches:    ${LOG_DIR}/collector.stderr  (debug exporter writes here)"
    echo "       stop with:           ${SCRIPT_DIR}/stop.sh  (or 'make mock-stop' from repo root)"
else
    exec "${BIN}" --config "${SCRIPT_DIR}/config.yaml"
fi
