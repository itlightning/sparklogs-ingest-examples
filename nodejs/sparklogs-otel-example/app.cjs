'use strict';

/**
 * SparkLogs Node.js manual OpenTelemetry logs (CommonJS).
 *
 * The website snippet uses ESM for readability; this runnable project uses CJS
 * so instrumentation order matches typical production Node services.
 *
 * **Out of scope until SparkLogs supports traces:** trace correlation is not used here.
 */

const { logs, SeverityNumber } = require('@opentelemetry/api-logs');
const { LoggerProvider, BatchLogRecordProcessor } = require('@opentelemetry/sdk-logs');
const { OTLPLogExporter } = require('@opentelemetry/exporter-logs-otlp-proto');
const { Resource } = require('@opentelemetry/resources');

const marker = process.env.SPARKLOGS_MARKER || 'sparklogs-ingest-example-marker';

// Alternative: set service.name / service.version / deployment.environment via OTEL_RESOURCE_ATTRIBUTES.
const resource = new Resource({
  'service.name': 'sparklogs-example-nodejs-manual',
  'service.version': '1.0.0',
  'deployment.environment': 'ingest-examples',
});

// BatchLogRecordProcessor is production-correct; do not use SimpleLogRecordProcessor outside tests.
const exporter = new OTLPLogExporter();
const loggerProvider = new LoggerProvider({ resource });
loggerProvider.addLogRecordProcessor(new BatchLogRecordProcessor(exporter));
logs.setGlobalLoggerProvider(loggerProvider);

const logger = logs.getLogger('sparklogs.example.nodejs.manual');

function emit(sevNum, sevText, body, attributes) {
  logger.emit({
    severityNumber: sevNum,
    severityText: sevText,
    body,
    attributes: attributes || {},
  });
}

emit(SeverityNumber.INFO, 'INFO',
  `SparkLogsExample: hello from Node.js manual OTel example language=nodejs log_library=manual marker=${marker}`,
  { marker, language: 'nodejs', logging_library: 'manual' });

emit(SeverityNumber.WARN, 'WARN',
  `SparkLogsExample: Storage: disk usage warning [pid=${process.pid}] mount=/dev/sda1 used_pct=92 free_gb=8.4`,
  { marker, language: 'nodejs', logging_library: 'manual' });

emit(SeverityNumber.ERROR, 'ERROR',
  'SparkLogsExample: Network: connection refused to 203.0.113.42 attempt=3 detail={"endpoint": "/api/orders", "latency_ms": 250}',
  { marker, language: 'nodejs', logging_library: 'manual', request_id: 'req-7e2a9f' });

async function shutdown() {
  await loggerProvider.shutdown();
}

shutdown()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
