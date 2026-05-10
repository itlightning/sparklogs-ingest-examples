# SparkLogs Go OTel example — zerolog

Runnable project for the [Go ingestion guide](https://sparklogs.com/docs/ingest/data-sources/languages/go) (zerolog option). See also the [OpenTelemetry SDKs guide](https://sparklogs.com/docs/ingest/data-sources/languages/opentelemetry-sdks).

**Stability:** Go OTel logs APIs are pre-1.0; pin versions together when upgrading.

The `otelzerolog` bridge does not forward zerolog fields as OTel attributes (upstream limitation); this example embeds **marker** in the log body so `make mock-test` still finds it.

On Windows, run `make mock-test` inside **WSL**.

```bash
make mock-test
```
