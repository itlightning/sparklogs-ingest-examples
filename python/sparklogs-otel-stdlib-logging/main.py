"""SparkLogs OTel SDK example using Python's stdlib logging.

Sends one batch of log records to whatever endpoint OTEL_EXPORTER_OTLP_LOGS_ENDPOINT
points at, then flushes and exits.

Run:
    OTEL_EXPORTER_OTLP_LOGS_PROTOCOL=http/protobuf \
    OTEL_EXPORTER_OTLP_LOGS_ENDPOINT="https://ingest-us.engine.sparklogs.app/v1/logs" \
    OTEL_EXPORTER_OTLP_LOGS_HEADERS="Authorization=Bearer <AGENT-ID>:<AGENT-ACCESS-TOKEN>" \
    OTEL_EXPORTER_OTLP_LOGS_COMPRESSION=gzip \
    OTEL_EXPORTER_OTLP_LOGS_TIMEOUT=25000 \
    python main.py

Each emitted log line is prefixed with `SparkLogsExample:` so SparkLogs
AutoExtract sets `category=SparkLogsExample`. Some lines use a sub-category
(e.g. `SparkLogsExample: Storage:` -> `category=SparkLogsExample.Storage`) and
embed AutoExtract demo features inline (key=value pairs, [bracketed values],
IP addresses with GeoIP lookup, embedded JSON). See this example's README for
the full list of features each line exercises.

QA marker: every run emits records containing MARKER (settable via
SPARKLOGS_MARKER env var, default "sparklogs-ingest-example-marker"); the
Makefile uses this to verify the batch landed.
"""

from __future__ import annotations

import importlib.metadata
import logging
import os
import sys

from opentelemetry._logs import set_logger_provider
from opentelemetry.exporter.otlp.proto.http._log_exporter import OTLPLogExporter
from opentelemetry.sdk._logs import LoggerProvider, LoggingHandler
from opentelemetry.sdk._logs.export import BatchLogRecordProcessor
from opentelemetry.sdk.resources import Resource

MARKER = os.environ.get("SPARKLOGS_MARKER", "sparklogs-ingest-example-marker")


def configure_otel() -> LoggerProvider:
    resource = Resource.create(
        {
            "service.name": os.environ.get("OTEL_SERVICE_NAME", "sparklogs-python-example"),
            "service.version": "1.0.0",
            "deployment.environment": os.environ.get(
                "DEPLOYMENT_ENV", "ingest-examples"
            ),
        }
    )
    provider = LoggerProvider(resource=resource)
    provider.add_log_record_processor(BatchLogRecordProcessor(OTLPLogExporter()))
    set_logger_provider(provider)
    return provider


def configure_stdlib_logging(provider: LoggerProvider) -> None:
    otel_handler = LoggingHandler(logger_provider=provider)
    root = logging.getLogger()
    root.setLevel(logging.INFO)
    root.addHandler(otel_handler)
    root.addHandler(logging.StreamHandler(sys.stdout))


def emit_examples() -> None:
    log = logging.getLogger("sparklogs.example")
    pid = os.getpid()
    try:
        otel_sdk_version = importlib.metadata.version("opentelemetry-sdk")
    except importlib.metadata.PackageNotFoundError:
        otel_sdk_version = "unknown"

    # Demonstrates: AutoExtract category extraction (-> category=SparkLogsExample)
    # plus key=value pair extraction (-> x.library, x.version).
    log.info(
        "SparkLogsExample: hello from Python OTel SDK example, library=opentelemetry-sdk version=%s",
        otel_sdk_version,
        extra={"marker": MARKER},
    )

    # Demonstrates: multi-level category (-> category=SparkLogsExample.Storage),
    # bracketed value extraction (-> x.b[]: ["pid=..."]), key=value pairs with
    # numeric type detection (-> x.used_pct: 92, x.free_gb: 8.4 as numbers).
    log.warning(
        "SparkLogsExample: Storage: disk usage warning [pid=%d] mount=/dev/sda1 used_pct=92 free_gb=8.4",
        pid,
        extra={"marker": MARKER},
    )

    # Demonstrates: multi-level category (-> category=SparkLogsExample.Network),
    # IP address detection with GeoIP lookup (-> x.ips[], x.ips_location[]),
    # key=value pairs (-> x.attempt=3 as number), embedded JSON
    # (-> x.detail.endpoint, x.detail.latency_ms), and exception capture via
    # exc_info=True. The IP is RFC 5737 (TEST-NET-3) documentation range.
    try:
        raise RuntimeError("simulated failure")
    except RuntimeError:
        log.error(
            'SparkLogsExample: Network: connection refused to 203.0.113.42 attempt=3'
            ' detail={"endpoint": "/api/orders", "latency_ms": 250}',
            exc_info=True,
            extra={"marker": MARKER, "request_id": "req-7e2a9f"},
        )


def main() -> int:
    provider = configure_otel()
    configure_stdlib_logging(provider)
    try:
        emit_examples()
    finally:
        # Critical: flush and wait for in-flight exports before exit.
        provider.shutdown()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
