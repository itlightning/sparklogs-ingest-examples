'use strict';

/**
 * Pino ships logs via `pino-opentelemetry-transport` only (no second OTel Logs SDK in-process).
 * OTEL_EXPORTER_OTLP_LOGS_* env vars configure the transport's internal SDK.
 *
 * **Out of scope until SparkLogs supports traces:** `@opentelemetry/instrumentation-pino` is not used.
 */

const pino = require('pino');

const marker = process.env.SPARKLOGS_MARKER || 'sparklogs-ingest-example-marker';

const logger = pino({
  level: 'info',
  name: 'sparklogs.example.nodejs.pino',
  transport: {
    target: 'pino-opentelemetry-transport',
  },
});

logger.info(
  { marker, language: 'nodejs', logging_library: 'pino' },
  `SparkLogsExample: hello from Node.js Pino OTel example language=nodejs log_library=pino marker=${marker}`
);
logger.warn(
  { marker, language: 'nodejs', logging_library: 'pino' },
  `SparkLogsExample: Storage: disk usage warning [pid=${process.pid}] mount=/dev/sda1 used_pct=92 free_gb=8.4`
);
logger.error(
  { marker, language: 'nodejs', logging_library: 'pino', request_id: 'req-7e2a9f' },
  'SparkLogsExample: Network: connection refused to 203.0.113.42 attempt=3 detail={"endpoint": "/api/orders", "latency_ms": 250}'
);
