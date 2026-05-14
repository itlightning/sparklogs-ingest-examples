# SparkLogs Go OTel example — zap

Runnable project for the [Go ingestion guide](https://sparklogs.com/docs/ingest/data-sources/languages/go) (zap option). See also the [OpenTelemetry SDKs guide](https://sparklogs.com/docs/ingest/data-sources/languages/opentelemetry-sdks).

**Stability:** Go OTel logs APIs are pre-1.0; pin versions together when upgrading.

On Windows, run `make mock-test` inside **WSL**.

## Run

```bash
make mock-test   # local mock
make test        # cloud (needs SPARKLOGS_* credentials)
```
