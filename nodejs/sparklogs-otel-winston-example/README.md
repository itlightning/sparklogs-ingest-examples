# SparkLogs Node.js + Winston + OpenTelemetry transport

Runnable project for [Node.js ingestion](https://sparklogs.com/docs/ingest/data-sources/languages/nodejs). See also the [OpenTelemetry SDKs guide](https://sparklogs.com/docs/ingest/data-sources/languages/opentelemetry-sdks).

Uses `@opentelemetry/winston-transport` only (not Winston auto-instrumentation) to avoid duplicate log records.

**Out of scope until SparkLogs supports traces:** Winston instrumentation for trace correlation is not enabled.

```bash
make mock-test
```
