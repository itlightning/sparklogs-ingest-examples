# SparkLogs PHP + Monolog + OpenTelemetry

Runnable project for [PHP ingestion](https://sparklogs.com/docs/ingest/data-sources/languages/php). See also the [OpenTelemetry SDKs guide](https://sparklogs.com/docs/ingest/data-sources/languages/opentelemetry-sdks).

`register_shutdown_function` flushes the `LoggerProvider` on CLI exit (best-effort; see plan for production caveats).

On Windows, use **WSL** for `make mock-test`.

```bash
composer install
make mock-test
```
