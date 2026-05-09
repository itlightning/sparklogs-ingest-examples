# Logging Setup with the Node.Js OpenTelemetry SDK and SparkLogs

This example Node.js application uses the [OpenTelemetry SDK](https://opentelemetry.io/docs/languages/js/) to ship logs natively over OTLP/HTTP to [SparkLogs](https://sparklogs.com/).

## Overview

[OpenTelemetry](https://opentelemetry.io/) is the open, vendor-neutral standard for telemetry data. SparkLogs accepts OpenTelemetry logs natively over OTLP/HTTP — no vendor adapter or custom exporter required. Your instrumentation stays portable: ship the same OTLP stream to SparkLogs today and to any other OTLP-compatible backend tomorrow.

This example demonstrates:

- The `@opentelemetry/exporter-logs-otlp-proto` exporter shipping protobuf-encoded logs over HTTPS.
- A `Resource` populated with `service.name`, `service.namespace`, `service.instance.id`, `deployment.environment`, and `host.name` — SparkLogs auto-derives the `source`, `service`, and `app` pivot fields from these.
- Records spanning DEBUG/INFO/WARN/ERROR severities.
- A record emitted inside an active span so SparkLogs correlates it with `trace_id` and `span_id`.
- A record with a single-string body — SparkLogs [AutoExtract](https://sparklogs.com/docs/ingest/autoextract/overview) extracts structured fields (timestamps, IPs, key/value pairs) automatically.

## Instructions

### 1. Install NPM packages

```bash
npm install
```

### 2. Set credentials and region

```bash
export CLOUD_LOGGING_AUTH_TOKEN="<AGENT-ID>:<AGENT-PASSWORD>"
export SPARKLOGS_REGION=us   # or 'eu'
```

Override the full ingest URL (e.g., for staging) with `SPARKLOGS_INGEST_URL`.

### 3. Run the example

```bash
npm start
```

Within a few seconds, the events appear in SparkLogs with auto-derived `source`, `service`, and `app`, severity coloring, and trace correlation on the span-scoped record.

## Tested versions

This example has been verified against the following OpenTelemetry JS package versions. The logs SDK is still in `0.x` upstream — pin minor versions in production until it stabilizes.

| Package | Version |
| --- | --- |
| `@opentelemetry/api` | 1.9.1 |
| `@opentelemetry/api-logs` | 0.55.0 |
| `@opentelemetry/exporter-logs-otlp-proto` | 0.55.0 |
| `@opentelemetry/sdk-logs` | 0.55.0 |
| `@opentelemetry/sdk-trace-base` | 1.30.1 |
| `@opentelemetry/resources` | 1.30.1 |
| `@opentelemetry/semantic-conventions` | 1.40.0 |

## Learn more

- [SparkLogs OTLP/HTTP API](https://sparklogs.com/docs/ingest/tools/otlp-http)
- [OpenTelemetry Logs SDK for JavaScript](https://opentelemetry.io/docs/languages/js/instrumentation/#logs)
- [OTLP specification](https://opentelemetry.io/docs/specs/otlp/)
