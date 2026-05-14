# SparkLogs Node.js manual OpenTelemetry logs (CommonJS)

Runnable project for [Node.js ingestion](https://sparklogs.com/docs/ingest/data-sources/languages/nodejs) and the [OpenTelemetry SDKs guide](https://sparklogs.com/docs/ingest/data-sources/languages/opentelemetry-sdks).

This directory uses **CommonJS** (`app.cjs`) so `require()` order matches typical production services. The website walkthrough may show **ESM** for readability — the wiring is the same once packages are loaded.

The app uses `@opentelemetry/api-logs` + `@opentelemetry/sdk-logs` + `@opentelemetry/exporter-logs-otlp-proto` (protobuf over HTTP). **Trace correlation is omitted** until SparkLogs supports traces end-to-end.

## Quick run (local OTLP mock)

From this directory (with the repo’s mock receiver running — `make mock-start` from the repo root):

```bash
make mock-test
```

## Run against SparkLogs

Set credentials and region (or a full ingest base URI). The shared [`mk/sparklogs-otel.mk`](../../mk/sparklogs-otel.mk) documents resolution order; typical cloud run:

```bash
export SPARKLOGS_REGION=us   # or eu
export SPARKLOGS_AGENT_ID=<your-agent-id>
export SPARKLOGS_AGENT_ACCESS_TOKEN=<your-agent-access-token>
make test
```

For a non-public endpoint, set **`SPARKLOGS_INGEST_BASE_URI`** (wins over **`SPARKLOGS_REGION`** when both are set).

## What it demonstrates

- `Resource` with **`service.name`**, **`service.version`**, **`deployment.environment`** — SparkLogs derives **`source`**, **`service`**, and **`app`** pivots from these.
- Records at INFO / WARN / ERROR via `SeverityNumber` + `severityText`.
- A single-string body line so SparkLogs [AutoExtract](https://sparklogs.com/docs/ingest/autoextract/overview) can extract structured fields.

## Tested versions

Pin OpenTelemetry JS **logs** packages together while upstream is `0.x`.

| Package | Version |
| --- | --- |
| `@opentelemetry/api` | 1.9.1 |
| `@opentelemetry/api-logs` | 0.55.0 |
| `@opentelemetry/exporter-logs-otlp-proto` | 0.55.0 |
| `@opentelemetry/sdk-logs` | 0.55.0 |
| `@opentelemetry/resources` | 1.30.1 |
| `@opentelemetry/semantic-conventions` | 1.40.0 |

## Learn more

- [SparkLogs OTLP/HTTP API](https://sparklogs.com/docs/ingest/tools/otlp-http)
- [OpenTelemetry Logs SDK for JavaScript](https://opentelemetry.io/docs/languages/js/instrumentation/#logs)
- [Ingest examples on GitHub](https://github.com/sparklogs/sparklogs-ingest-examples/tree/main/nodejs/sparklogs-otel-example) (this directory)
