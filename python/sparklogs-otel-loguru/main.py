"""SparkLogs OTel SDK example using loguru with a stdlib LoggingHandler sink."""

from __future__ import annotations

import importlib.metadata
import logging
import os
import sys

from loguru import logger
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
                "OTEL_SERVICE_NAME", "sparklogs-example-python-loguru"
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


def configure_loguru_sink(handler: LoggingHandler) -> None:
    logger.remove()
    logger.add(sys.stderr, level="INFO", format="{time} {level} {message}\n")
    logger.add(handler, level="INFO", format="{message}")


def emit_examples() -> None:
    try:
        otel_sdk_version = importlib.metadata.version("opentelemetry-sdk")
    except importlib.metadata.PackageNotFoundError:
        otel_sdk_version = "unknown"

    logger.bind(
        marker=MARKER, language="python", logging_library="loguru"
    ).info(
        "SparkLogsExample: hello from Python loguru OTel example language=python "
        "log_library=loguru otel_sdk_version={otel_sdk_version}",
        otel_sdk_version=otel_sdk_version,
    )

    logger.bind(marker=MARKER, language="python", logging_library="loguru").warning(
        "SparkLogsExample: Storage: disk usage warning [pid={}] mount=/dev/sda1 used_pct=92 free_gb=8.4",
        os.getpid(),
    )

    try:
        raise RuntimeError("simulated failure")
    except RuntimeError as e:
        logger.bind(
            marker=MARKER,
            language="python",
            logging_library="loguru",
            request_id="req-7e2a9f",
        ).error(
            'SparkLogsExample: Network: connection refused to 203.0.113.42 attempt=3'
            ' detail={"endpoint": "/api/orders", "latency_ms": 250}'
        )
        _ = e  # noqa: F841 — keep exception path realistic


def main() -> int:
    provider = configure_otel()
    otel_handler = LoggingHandler(logger_provider=provider)
    configure_loguru_sink(otel_handler)
    try:
        emit_examples()
    finally:
        provider.shutdown()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
