# SparkLogs Node.js + Pino + OpenTelemetry transport

Runnable project for [Node.js ingestion](https://sparklogs.com/docs/ingest/data-sources/languages/nodejs). See also the [OpenTelemetry SDKs guide](https://sparklogs.com/docs/ingest/data-sources/languages/opentelemetry-sdks).

The website snippet uses **ESM**; this directory uses **CommonJS** (`app.cjs`) for predictable OTel transport wiring.

**Out of scope until SparkLogs supports traces:** Pino OTel instrumentation for trace IDs is not enabled.

```bash
make mock-test
```
