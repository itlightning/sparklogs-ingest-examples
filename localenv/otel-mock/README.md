# Mock OTLP receiver for `make mock-test`

A local [OpenTelemetry Collector](https://opentelemetry.io/docs/collector/) configured to receive OTLP/HTTP on `localhost:14318` and print every received batch (in human-readable form) to its log stream, which `start.sh` redirects to `/tmp/sparklogs-otel-mock/collector.stderr`. The health-check extension listens on `localhost:14133`.

> **Why stderr, not stdout?** otelcol's `debug` exporter emits its received-batch dumps via the collector's own structured logger, and that logger writes to stderr by default. `collector.stdout` will be empty in normal operation; `collector.stderr` is where the marker lives.

> **Why non-default ports?** Many dev machines have an otelcol or similar already running on the canonical `4317/4318/8888/13133` ports. Using `14318/14133` lets this mock coexist with whatever else you have running. Each example's `mock-test` target points `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` at port 14318.

`make mock-test` (in the repo root) starts this, runs each example pointed at `http://localhost:4318/v1/logs`, and verifies the expected marker payload appears in the captured file. This is a CI-safe verification path that doesn't depend on cloud SparkLogs.

It's also useful for users who want to debug their own setup ("can I get OTLP working at all?") without involving SparkLogs credentials.

## Usage

```bash
# Foreground (Ctrl-C to stop):
./start.sh

# Detached (use stop.sh to stop):
./start.sh -d
./stop.sh
```

In detached mode, `start.sh` does a pre-flight check that ports `14318` and `14133` are free, then waits for the collector's `health_check` endpoint at `http://localhost:14133/` to come up (or for the process to exit) before returning, so a config or port-binding failure surfaces immediately instead of silently letting the next example hang.

## What it captures

The collector's `debug` exporter writes each received OTLP batch as readable text to `/tmp/sparklogs-otel-mock/collector.stderr` (otelcol's logger writes to stderr by default). To verify a marker:

```bash
grep -F 'my-marker-string' /tmp/sparklogs-otel-mock/collector.stderr
```

`debug` is in the **core** OpenTelemetry Collector distribution, so this works with both `otelcol` and `otelcol-contrib` (no need for the contrib `file` exporter).

## Files in `/tmp/sparklogs-otel-mock/` while running

| File | What |
| --- | --- |
| `collector.pid` | Detached collector process ID (used by `stop.sh`). |
| `collector.stdout` | Empty in normal operation. |
| `collector.stderr` | Where the `debug` exporter prints received batches **and** where the collector emits its own diagnostic output. The file the marker grep reads, and the file to inspect if `start.sh` reports the collector exited before becoming healthy. |

## Requirements

Either:
- `otelcol-contrib` or `otelcol` on PATH (preferred), or
- Docker (the script falls back to `otel/opentelemetry-collector` when `start.sh` is run in foreground without `-d`).
