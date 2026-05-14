"""SparkLogs OTel SDK example using structlog routed through stdlib logging."""

from __future__ import annotations

import importlib.metadata
import logging
import os
import sys

import structlog
from opentelemetry._logs import set_logger_provider
from opentelemetry.exporter.otlp.proto.http._log_exporter import OTLPLogExporter
from opentelemetry.sdk._logs import LoggerProvider, LoggingHandler
from opentelemetry.sdk._logs.export import BatchLogRecordProcessor
from opentelemetry.sdk.resources import Resource

MARKER = os.environ.get("SPARKLOGS_MARKER", "sparklogs-ingest-example-marker")


def configure_otel() -> LoggerProvider:
    resource = Resource.create(
        {
            "service.name": os.environ.get(
                "OTEL_SERVICE_NAME", "sparklogs-example-python-structlog"
            ),
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


def configure_structlog() -> None:
    structlog.configure(
        processors=[
            structlog.contextvars.merge_contextvars,
            structlog.processors.add_log_level,
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.dict_tracebacks,
            structlog.processors.JSONRenderer(),
        ],
        wrapper_class=structlog.make_filtering_bound_logger(logging.INFO),
        logger_factory=structlog.stdlib.LoggerFactory(),
        cache_logger_on_first_use=True,
    )


def configure_stdlib_logging(provider: LoggerProvider) -> None:
    otel_handler = LoggingHandler(logger_provider=provider)
    root = logging.getLogger()
    root.setLevel(logging.INFO)
    root.addHandler(otel_handler)
    root.addHandler(logging.StreamHandler(sys.stdout))


def emit_examples() -> None:
    base = {"marker": MARKER, "language": "python", "logging_library": "structlog"}
    log = structlog.get_logger("sparklogs.example.python.structlog").bind(**base)
    try:
        otel_sdk_version = importlib.metadata.version("opentelemetry-sdk")
    except importlib.metadata.PackageNotFoundError:
        otel_sdk_version = "unknown"

    log.info(
        "SparkLogsExample: hello from Python structlog OTel example language=python log_library=structlog otel_sdk_version=%s",
        otel_sdk_version,
    )

    log.warning(
        "SparkLogsExample: Storage: disk usage warning [pid=%s] mount=/dev/sda1 used_pct=92 free_gb=8.4",
        str(os.getpid()),
    )

    try:
        raise RuntimeError("simulated failure")
    except RuntimeError:
        log.error(
            'SparkLogsExample: Network: connection refused to 203.0.113.42 attempt=3'
            ' detail={"endpoint": "/api/orders", "latency_ms": 250}',
            exc_info=True,
            request_id="req-7e2a9f",
        )


def main() -> int:
    provider = configure_otel()
    configure_structlog()
    configure_stdlib_logging(provider)
    try:
        emit_examples()
    finally:
        provider.shutdown()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
