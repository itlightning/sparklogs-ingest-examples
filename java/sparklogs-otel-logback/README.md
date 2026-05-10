# SparkLogs Java OTel example — Logback

Runnable project for [Java ingestion](https://sparklogs.com/docs/ingest/data-sources/languages/java) (Logback). See also the [OpenTelemetry SDKs guide](https://sparklogs.com/docs/ingest/data-sources/languages/opentelemetry-sdks).

Uses **SDK autoconfigure** + `opentelemetry-logback-appender-1.0`. Build with **Maven** (`mvn package`), run the shaded JAR.

**Out of scope until SparkLogs supports traces:** trace/log correlation is not demonstrated here.

On Windows, run `make mock-test` inside **WSL** (requires `mvn` and `java` on PATH).

```bash
make mock-test
```
