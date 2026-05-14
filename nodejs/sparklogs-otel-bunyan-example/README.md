# SparkLogs Node.js + Bunyan + OpenTelemetry instrumentation

Runnable project for [Node.js ingestion](https://sparklogs.com/docs/ingest/data-sources/languages/nodejs). See also the [OpenTelemetry SDKs guide](https://sparklogs.com/docs/ingest/data-sources/languages/opentelemetry-sdks).

Uses `BunyanInstrumentation` with **`disableLogSending: false`** so log records reach the global `LoggerProvider`.

**Out of scope until SparkLogs supports traces:** Bunyan trace-field injection is not the focus of this sample.

```bash
make mock-test
```
