package com.sparklogs.example;

import io.opentelemetry.instrumentation.logback.appender.v1_0.OpenTelemetryAppender;
import io.opentelemetry.sdk.OpenTelemetrySdk;
import io.opentelemetry.sdk.autoconfigure.AutoConfiguredOpenTelemetrySdk;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * SparkLogs OTel + Logback example. Uses autoconfigure (reads OTEL_* env vars).
 *
 * <p>Alternative: set {@code service.name}, {@code service.version}, and
 * {@code deployment.environment} via {@code OTEL_RESOURCE_ATTRIBUTES} instead of
 * relying on defaults from env.
 */
public final class Main {
  private static final Logger log =
      LoggerFactory.getLogger("sparklogs.example.java.logback");

  private Main() {}

  public static void main(String[] args) {
    OpenTelemetrySdk sdk =
        AutoConfiguredOpenTelemetrySdk.initialize().getOpenTelemetrySdk();
    OpenTelemetryAppender.install(sdk);

    String marker =
        System.getenv().getOrDefault("SPARKLOGS_MARKER", "sparklogs-ingest-example-marker");
    log.info(
        "SparkLogsExample: hello from Java Logback OTel example language=java log_library=logback marker={}",
        marker);
    log.warn(
        "SparkLogsExample: Storage: disk usage warning [pid={}] mount=/dev/sda1 used_pct=92 free_gb=8.4",
        ProcessHandle.current().pid());
    log.error(
        "SparkLogsExample: Network: connection refused to 203.0.113.42 attempt=3 detail={\"endpoint\": \"/api/orders\", \"latency_ms\": 250}",
        new RuntimeException("simulated failure"));

    // close() blocks up to ~10s for the BatchLogRecordProcessor to drain its
    // queue and complete the in-flight export. shutdown() alone is async
    // (returns a CompletableResultCode we don't await), so main() returning
    // immediately after it would let the JVM exit before the batch leaves.
    sdk.close();
  }
}
