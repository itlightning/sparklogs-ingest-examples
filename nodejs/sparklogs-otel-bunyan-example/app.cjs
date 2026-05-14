'use strict';

const { logs } = require('@opentelemetry/api-logs');
const { LoggerProvider, BatchLogRecordProcessor } = require('@opentelemetry/sdk-logs');
const { OTLPLogExporter } = require('@opentelemetry/exporter-logs-otlp-proto');
const { Resource } = require('@opentelemetry/resources');
const { registerInstrumentations } = require('@opentelemetry/instrumentation');
const { BunyanInstrumentation } = require('@opentelemetry/instrumentation-bunyan');

const marker = process.env.SPARKLOGS_MARKER || 'sparklogs-ingest-example-marker';

const resource = new Resource({
  'service.name': 'sparklogs-example-nodejs-bunyan',
  'service.version': '1.0.0',
  'deployment.environment': 'ingest-examples',
});

const exporter = new OTLPLogExporter();
const loggerProvider = new LoggerProvider({ resource });
loggerProvider.addLogRecordProcessor(new BatchLogRecordProcessor(exporter));
logs.setGlobalLoggerProvider(loggerProvider);

registerInstrumentations({
  instrumentations: [
    new BunyanInstrumentation({ disableLogSending: false }),
  ],
});

// require('bunyan') must run after instrumentation is registered.
const bunyan = require('bunyan');

const log = bunyan.createLogger({
  name: 'sparklogs.example.nodejs.bunyan',
  level: 'info',
});

log.info(
  { marker, language: 'nodejs', logging_library: 'bunyan' },
  `SparkLogsExample: hello from Node.js Bunyan OTel example language=nodejs log_library=bunyan marker=${marker}`
);
log.warn(
  { marker, language: 'nodejs', logging_library: 'bunyan' },
  `SparkLogsExample: Storage: disk usage warning [pid=${process.pid}] mount=/dev/sda1 used_pct=92 free_gb=8.4`
);
log.error(
  { marker, language: 'nodejs', logging_library: 'bunyan', request_id: 'req-7e2a9f' },
  'SparkLogsExample: Network: connection refused to 203.0.113.42 attempt=3 detail={"endpoint": "/api/orders", "latency_ms": 250}'
);

loggerProvider
  .shutdown()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
