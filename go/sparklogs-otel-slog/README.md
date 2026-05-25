# SparkLogs Go OTel example — `slog`

Runnable project backing [SparkLogs Go ingestion guide](https://sparklogs.com/docs/ingest/data-sources/languages/go) (slog option). See also the [OpenTelemetry SDKs guide](https://sparklogs.com/docs/ingest/data-sources/languages/opentelemetry-sdks).

**Stability:** Go OTel logs APIs are pre-1.0 (`v0.x`); pin versions together when upgrading.

On Windows, run `make mock-test` inside **WSL**; `make test` works from native shells with `SPARKLOGS_*` set.

## Run (mock)

```bash
make mock-test
```

## Run (cloud)

```bash
export SPARKLOGS_REGION=us   # or another valid region code
export SPARKLOGS_AGENT_ID=...
export SPARKLOGS_AGENT_ACCESS_TOKEN=...
make test
```

## Files

- `main.go` — OTLP HTTP exporter, batch processor, `otelslog` bridge, three sample lines.
- `Makefile` — `build`, `mock-test`, `test`, `clean`.
- `go.mod` / `go.sum` — dependency pins.
