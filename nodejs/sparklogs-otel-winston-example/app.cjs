'use strict';

const { logs } = require('@opentelemetry/api-logs');
const { LoggerProvider, BatchLogRecordProcessor } = require('@opentelemetry/sdk-logs');
const { OTLPLogExporter } = require('@opentelemetry/exporter-logs-otlp-proto');
const { Resource } = require('@opentelemetry/resources');
const { OpenTelemetryTransportV3 } = require('@opentelemetry/winston-transport');
const winston = require('winston');

const marker = process.env.SPARKLOGS_MARKER || 'sparklogs-ingest-example-marker';

const resource = new Resource({
  'service.name': 'sparklogs-example-nodejs-winston',
  'service.version': '1.0.0',
  'deployment.environment': 'ingest-examples',
});

const exporter = new OTLPLogExporter();
const loggerProvider = new LoggerProvider({ resource });
loggerProvider.addLogRecordProcessor(new BatchLogRecordProcessor(exporter));
logs.setGlobalLoggerProvider(loggerProvider);

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({ format: winston.format.simple() }),
    new OpenTelemetryTransportV3({ loggerProvider }),
  ],
});

logger.info('SparkLogsExample: hello from Node.js Winston OTel example language=nodejs log_library=winston', {
  marker,
  language: 'nodejs',
  logging_library: 'winston',
});
logger.warn('SparkLogsExample: Storage: disk usage warning [pid=' + process.pid + '] mount=/dev/sda1 used_pct=92 free_gb=8.4', {
  marker,
  language: 'nodejs',
  logging_library: 'winston',
});
logger.error('SparkLogsExample: Network: connection refused to 203.0.113.42 attempt=3 detail={"endpoint": "/api/orders", "latency_ms": 250}', {
  marker,
  language: 'nodejs',
  logging_library: 'winston',
  request_id: 'req-7e2a9f',
});

loggerProvider
  .shutdown()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
