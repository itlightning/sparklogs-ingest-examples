# SparkLogs Rust + tracing + OpenTelemetry OTLP

Runnable project for [Rust ingestion](https://sparklogs.com/docs/ingest/data-sources/languages/rust). See also the [OpenTelemetry SDKs guide](https://sparklogs.com/docs/ingest/data-sources/languages/opentelemetry-sdks).

**Stability:** keep all `opentelemetry*` crate versions on the same release line when upgrading.

```bash
make mock-test
```

**`make test`** (SparkLogs cloud) sets **`OTEL_EXPORTER_OTLP_LOGS_COMPRESSION=gzip`**, **`OTEL_EXPORTER_OTLP_LOGS_HEADERS`** (Bearer token from **`SPARKLOGS_INGEST_KEY_ID`** and **`SPARKLOGS_INGEST_KEY_ACCESS_TOKEN`**), and the usual OTLP endpoint env vars via the shared Make file. This crate enables **`gzip-http`**. Flip **`FORCE_IPV4_OTLP_HTTP`** in **`src/main.rs`** when you need a **Reqwest** client bound to **IPv4** with a fixed **30s** timeout (e.g. broken local **IPv6** on **WSL**); leave it **`false`** to use the exporter’s default HTTP client and normal **OTEL** timeout env vars. For **`make mock-test`**, follow the mock env from **`mk/sparklogs-otel.mk`** (no SparkLogs cloud credentials required).

Add **`zstd-http`** if you switch env to **`zstd`**.

## OTLP transport and Tokio

This example enables **`reqwest-blocking-client`** on `opentelemetry-otlp`, not **`reqwest-client`**. The default **batch log processor** runs on a **dedicated background thread**; the async reqwest client expects a **Tokio 1.x runtime** on that thread, which leads to shutdown panics (`there is no reactor running`) when combined with the blocking-style processor.

For a **CLI or mostly synchronous** app (including this repo’s pattern), **blocking HTTP + `with_batch_exporter(exporter)`** is the straightforward, documented path on current OpenTelemetry Rust releases.

If you run **inside a Tokio-heavy async service** and need the **async** HTTP client (or gRPC) wired to your runtime, read upstream first — the APIs and feature flags move quickly:

- [OpenTelemetry Rust migration notes (0.28+)](https://github.com/open-telemetry/opentelemetry-rust/blob/main/docs/migration_0.28.md) — batch processors, runtime parameters, and `reqwest-blocking-client` vs `reqwest-client`.
- [`opentelemetry-otlp` on docs.rs](https://docs.rs/opentelemetry-otlp) — feature flags and exporter builders for your release.
- [`opentelemetry_sdk::logs`](https://docs.rs/opentelemetry_sdk/latest/opentelemetry_sdk/logs/index.html) — `SdkLoggerProvider`, `shutdown` / `shutdown_with_timeout`.

Experimental **`experimental_logs_batch_log_processor_with_async_runtime`** exists for advanced wiring; prefer upstream docs over copying stale snippets.

## Shutdown

The binary calls **`shutdown_with_timeout(Duration::from_secs(10))`** on the `SdkLoggerProvider` after emitting sample logs so buffered OTLP batches flush before exit. Adjust the timeout for slower networks or larger batches.
