//! SparkLogs Rust `tracing` + OpenTelemetry OTLP/HTTP logs.
//!
//! Keep all `opentelemetry*` crate versions on the **same release** when upgrading.
//!
//! OTLP/HTTP uses the **blocking** reqwest client (`reqwest-blocking-client` feature) so
//! the SDK's batch log processor (a dedicated OS thread) never calls into Tokio without
//! a reactor — see upstream [migration notes](https://github.com/open-telemetry/opentelemetry-rust/blob/main/docs/migration_0.28.md) for async / Tokio-oriented options.
//!
//! Verbose **`tracing`** from OpenTelemetry HTTP stacks (**`hyper`**, **`opentelemetry*`**,
//! **`reqwest`**, etc.) is gated by **`TRACE_OPENTELEMETRY_HTTP`** (see the constant after imports).
//!
//! **Forcing use of IPv4:** when **`FORCE_IPV4_OTLP_HTTP`** is **`true`**, this example passes a
//! custom **`reqwest::blocking::Client`** with **`local_address`** set to **IPv4** and a fixed
//! **30s** timeout (workaround for broken local **IPv6**, e.g. some **WSL** setups).

use std::net::{IpAddr, Ipv4Addr};
use std::time::Duration;

use anyhow::{Context, Result};
use opentelemetry_appender_tracing::layer::OpenTelemetryTracingBridge;
use opentelemetry_otlp::LogExporter;
use opentelemetry_otlp::WithHttpConfig;
use opentelemetry_sdk::logs::SdkLoggerProvider;
use opentelemetry_sdk::Resource;
use tracing_subscriber::prelude::*;
use tracing_subscriber::EnvFilter;

/// When **`true`**, turn on debug logging for OpenTelemetry HTTP requests (for debugging only).
const TRACE_OPENTELEMETRY_HTTP: bool = false;

/// When **`true`** force OTLP HTTP to only use IPv4. Use on WSL2 env where IPv6 is often broken.
const FORCE_IPV4_OTLP_HTTP: bool = true;

/// Build the OTLP log exporter. Uses standard **`OTEL_EXPORTER_OTLP_LOGS_*`** env vars for
/// endpoint, protocol, compression, and timeout.
fn build_log_exporter() -> Result<LogExporter> {
    if FORCE_IPV4_OTLP_HTTP {
        let http_client = reqwest::blocking::Client::builder()
            .local_address(IpAddr::V4(Ipv4Addr::UNSPECIFIED))
            .timeout(Duration::from_secs(30))
            .build()
            .context("failed to build reqwest blocking client for OTLP (IPv4)")?;

        LogExporter::builder()
            .with_http()
            .with_http_client(http_client)
            .build()
            .context("failed to build OTLP HTTP log exporter (check OTEL_EXPORTER_OTLP_LOGS_* env vars and TLS)")
    } else {
        LogExporter::builder()
            .with_http()
            .build()
            .context("failed to build OTLP HTTP log exporter (check OTEL_EXPORTER_OTLP_LOGS_* env vars and TLS)")
    }
}

fn main() -> Result<()> {
    let exporter = build_log_exporter()?;

    let resource = Resource::builder()
        .with_service_name("sparklogs-example-rust-tracing")
        .with_attribute(opentelemetry::KeyValue::new("service.version", "1.0.0"))
        .with_attribute(opentelemetry::KeyValue::new(
            "deployment.environment",
            "ingest-examples",
        ))
        .build();

    let provider = SdkLoggerProvider::builder()
        .with_resource(resource)
        .with_batch_exporter(exporter)
        .build();

    if TRACE_OPENTELEMETRY_HTTP {
        let otel_layer = OpenTelemetryTracingBridge::new(&provider);
        tracing_subscriber::registry()
            .with(otel_layer)
            .with(
                tracing_subscriber::fmt::layer().with_filter(EnvFilter::new("trace")),
            )
            .init();
    } else {
        let filter_otel = EnvFilter::new("info")
            .add_directive("hyper=off".parse()?)
            .add_directive("opentelemetry=off".parse()?)
            .add_directive("opentelemetry_sdk=off".parse()?)
            .add_directive("tonic=off".parse()?)
            .add_directive("h2=off".parse()?)
            .add_directive("reqwest=off".parse()?);

        let otel_layer = OpenTelemetryTracingBridge::new(&provider).with_filter(filter_otel);
        tracing_subscriber::registry()
            .with(otel_layer)
            .with(tracing_subscriber::fmt::layer().with_filter(EnvFilter::new("info")))
            .init();
    }

    let marker = std::env::var("SPARKLOGS_MARKER")
        .unwrap_or_else(|_| "sparklogs-ingest-example-marker".to_string());

    tracing::info!(
        target = "sparklogs.example.rust.tracing",
        marker = %marker,
        language = "rust",
        logging_library = "tracing",
        "SparkLogsExample: hello from Rust tracing OTel example language=rust log_library=tracing marker={}",
        marker
    );

    tracing::warn!(
        target = "sparklogs.example.rust.tracing",
        marker = %marker,
        language = "rust",
        logging_library = "tracing",
        "SparkLogsExample: Storage: disk usage warning [pid={}] mount=/dev/sda1 used_pct=92 free_gb=8.4",
        std::process::id()
    );

    tracing::error!(
        target = "sparklogs.example.rust.tracing",
        marker = %marker,
        language = "rust",
        logging_library = "tracing",
        request_id = "req-7e2a9f",
        "SparkLogsExample: Network: connection refused to 203.0.113.42 attempt=3 detail={{\"endpoint\": \"/api/orders\", \"latency_ms\": 250}}"
    );

    provider.shutdown_with_timeout(Duration::from_secs(10)).map_err(|e| {
        anyhow::anyhow!("OpenTelemetry logger provider shutdown failed: {e:?}")
    })?;
    Ok(())
}
