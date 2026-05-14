# SparkLogs Python + loguru + OpenTelemetry

Runnable project for [Python ingestion](https://sparklogs.com/docs/ingest/data-sources/languages/python) (loguru). See also the [OpenTelemetry SDKs guide](https://sparklogs.com/docs/ingest/data-sources/languages/opentelemetry-sdks).

Loguru forwards to the same OTel `LoggingHandler` used by the stdlib example. Caller/source metadata reflects the bridge rather than original call sites (see loguru docs if you need deeper frames).

```bash
make mock-test
```
