# SparkLogs Python OTel SDK example — stdlib `logging`

A minimal Python application that ships logs to [SparkLogs](https://sparklogs.com/) via the [OpenTelemetry SDK](https://opentelemetry.io/docs/languages/python/) using Python's **stdlib `logging`** module (not structlog or loguru). Demonstrates the `BatchLogRecordProcessor` + `OTLPLogExporter` + `LoggingHandler` pattern with structured fields, exception capture, and graceful shutdown.

For the corresponding documentation page, see [SparkLogs Python ingestion guide](https://sparklogs.com/docs/ingest/data-sources/languages/python). For the cross-language OpenTelemetry matrix, see [OpenTelemetry SDKs guide](https://sparklogs.com/docs/ingest/data-sources/languages/opentelemetry-sdks).

## Prerequisites

- Python 3.9+
- A SparkLogs account with at least one Ingest Key provisioned (Configure → Ingest Keys in the SparkLogs app)

## Run against real SparkLogs

```bash
export SPARKLOGS_REGION=us           # or another valid region code
export SPARKLOGS_INGEST_KEY_ID=...        # from Configure → Ingest Keys
export SPARKLOGS_INGEST_KEY_ACCESS_TOKEN=...

make test
```

After the run, search for the marker in the SparkLogs UI to confirm the batch arrived. The marker is printed by `make test`.

To target a non-public instance (QA, dev-cloud, on-prem), set `SPARKLOGS_INGEST_BASE_URI` instead of `SPARKLOGS_REGION` — the URI replaces the constructed `https://ingest-<region>.engine.sparklogs.app/` endpoint:

```bash
export SPARKLOGS_INGEST_BASE_URI=http://localhost:8080/
export SPARKLOGS_INGEST_KEY_ID=...
export SPARKLOGS_INGEST_KEY_ACCESS_TOKEN=...
make test
```

If both `SPARKLOGS_INGEST_BASE_URI` and `SPARKLOGS_REGION` are set, the URI wins. A missing trailing slash is added automatically.

## Run against the local OTLP mock receiver (no cloud credentials)

```bash
make mock-test
```

That's it. `make mock-test` self-manages the local OTLP mock receiver: if the mock isn't already running, it starts one for the duration of the run and stops it on exit. If a mock is already running (e.g. you started it yourself for interactive debugging, or the repo-root `make mock-test` started one to share across all examples), this target detects it and leaves the lifecycle alone.

On Windows, run `make mock-test` inside **WSL** (the mock scripts are shell-based); the cloud `make test` path works from native Windows shells.

The example emits a unique marker, then greps the mock receiver's capture (`/tmp/sparklogs-otel-mock/collector.stderr` — the otelcol `debug` exporter writes there) to confirm the batch was received and parsed.

If you'd rather drive the mock lifecycle by hand:

```bash
../../localenv/otel-mock/start.sh -d   # start once
make mock-test                          # run any number of times — detects the running mock
../../localenv/otel-mock/stop.sh       # stop when done
```

## Manually run

```bash
make build          # create .venv and install dependencies
make run            # execute main.py with whatever OTEL_* env vars you've set
```

## Files

- `main.py` — the example application. Configures the OTel SDK, attaches an OTel handler to stdlib `logging`, emits three sample records, and flushes on exit.
- `requirements.txt` — pinned dependency versions.
- `Makefile` — `build` / `run` / `mock-test` / `test` / `clean` targets.

## What the emitted log lines demonstrate

Each invocation emits three log lines that exercise both the OpenTelemetry SDK's `extra=` attribute pattern and several SparkLogs [AutoExtract](https://sparklogs.com/docs/ingest/autoextract/overview) conventions. All three lines share a `SparkLogsExample` [category prefix](https://sparklogs.com/docs/ingest/autoextract/category-extraction) so you can isolate (or filter out) example traffic in the SparkLogs UI with `category: SparkLogsExample*`.

| Severity | Body shape | AutoExtract features exercised |
| --- | --- | --- |
| INFO | `SparkLogsExample: hello from Python stdlib logging OTel example language=python log_library=stdlib_logging otel_sdk_version=...` | category → `SparkLogsExample`; [key=value extraction](https://sparklogs.com/docs/ingest/autoextract/example-and-key-conventions) → `x.language`, `x.log_library`, `x.otel_sdk_version` |
| WARNING | `SparkLogsExample: Storage: disk usage warning [pid=...] mount=/dev/sda1 used_pct=92 free_gb=8.4` | multi-level category → `SparkLogsExample.Storage`; [bracketed-value extraction](https://sparklogs.com/docs/ingest/autoextract/special-value-extraction) → `x.b[]`; key=value with [numeric type detection](https://sparklogs.com/docs/ingest/autoextract/field-type-detection) → `x.used_pct=92` (number), `x.free_gb=8.4` (number) |
| ERROR | `SparkLogsExample: Network: connection refused to 203.0.113.42 attempt=3 detail={"endpoint": "/api/orders", "latency_ms": 250}` | multi-level category → `SparkLogsExample.Network`; [IP + GeoIP](https://sparklogs.com/docs/ingest/autoextract/special-value-extraction#ip-addresses-and-geoip) → `x.ips[]`, `x.ips_location[]`; embedded JSON → `x.detail.endpoint`, `x.detail.latency_ms`; plus exception capture via `exc_info=True` |

The `extra={"marker": MARKER, "language": "python", "logging_library": "stdlib_logging", "request_id": ...}` payload is preserved as event-level OpenTelemetry attributes (separate from the AutoExtract `x.*` fields parsed from the body). Both kinds of fields are searchable in the SparkLogs UI.

## Why these env vars?

See the [OTel SDKs in production guide](https://sparklogs.com/docs/ingest/data-sources/languages/opentelemetry-sdks-production) for the rationale behind `OTEL_EXPORTER_OTLP_LOGS_TIMEOUT=25000` (Cloud Run cold-start tolerance), the gzip default, the `BatchLogRecordProcessor` choice, and graceful shutdown.
