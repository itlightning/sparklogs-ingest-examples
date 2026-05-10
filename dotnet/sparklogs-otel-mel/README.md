# SparkLogs .NET OTel example — Microsoft.Extensions.Logging

Runnable project for [.NET ingestion](https://sparklogs.com/docs/ingest/data-sources/languages/dotnet). See also the [OpenTelemetry SDKs guide](https://sparklogs.com/docs/ingest/data-sources/languages/opentelemetry-sdks).

**Out of scope until SparkLogs supports traces:** trace correlation is not demonstrated here.

On Windows you can run `dotnet build` / `dotnet run` from PowerShell; use **WSL** for `make mock-test` (shell-based mock tooling).

```bash
make mock-test
```
