import os from 'os';
import { trace, context } from '@opentelemetry/api';
import { logs, SeverityNumber } from '@opentelemetry/api-logs';
import { Resource } from '@opentelemetry/resources';
import { LoggerProvider, BatchLogRecordProcessor } from '@opentelemetry/sdk-logs';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-proto';
import { BasicTracerProvider } from '@opentelemetry/sdk-trace-base';
import {
  SEMRESATTRS_SERVICE_NAME,
  SEMRESATTRS_SERVICE_NAMESPACE,
  SEMRESATTRS_SERVICE_INSTANCE_ID,
  SEMRESATTRS_DEPLOYMENT_ENVIRONMENT,
  SEMRESATTRS_HOST_NAME,
} from '@opentelemetry/semantic-conventions';

// ========================== CONFIG ==========================

const region = process.env.SPARKLOGS_REGION || 'us'; // 'us' or 'eu'
const ingestUrl = process.env.SPARKLOGS_INGEST_URL ||
  `https://ingest-${region}.engine.sparklogs.app/v1/logs`;
const authPair = process.env.CLOUD_LOGGING_AUTH_TOKEN; // "<AGENT-ID>:<AGENT-PASSWORD>"
if (!authPair) {
  console.error('Set CLOUD_LOGGING_AUTH_TOKEN="<AGENT-ID>:<AGENT-PASSWORD>" before running.');
  process.exit(1);
}

// ========================== SDK SETUP ==========================

const resource = new Resource({
  [SEMRESATTRS_SERVICE_NAME]: 'checkout',
  [SEMRESATTRS_SERVICE_NAMESPACE]: 'storefront',
  [SEMRESATTRS_SERVICE_INSTANCE_ID]: `${os.hostname()}-${process.pid}`,
  [SEMRESATTRS_DEPLOYMENT_ENVIRONMENT]: 'production',
  [SEMRESATTRS_HOST_NAME]: os.hostname(),
});

const exporter = new OTLPLogExporter({
  url: ingestUrl,
  headers: {
    Authorization: 'Basic ' + Buffer.from(authPair).toString('base64'),
  },
  compression: 'gzip',
});

const loggerProvider = new LoggerProvider({ resource });
loggerProvider.addLogRecordProcessor(new BatchLogRecordProcessor(exporter));
logs.setGlobalLoggerProvider(loggerProvider);

const tracerProvider = new BasicTracerProvider({ resource });
trace.setGlobalTracerProvider(tracerProvider);

const logger = logs.getLogger('sparklogs-otel-example', '1.0.0');
const tracer = trace.getTracer('sparklogs-otel-example');

// ========================== EXAMPLE USAGE ==========================

logger.emit({
  severityNumber: SeverityNumber.INFO,
  severityText: 'INFO',
  body: 'Hello from the SparkLogs OpenTelemetry example',
});

logger.emit({
  severityNumber: SeverityNumber.WARN,
  severityText: 'WARN',
  body: 'Inventory cache miss, falling back to source of truth',
  attributes: { 'cache.key': 'sku:42', 'cache.region': 'us-east-1' },
});

logger.emit({
  severityNumber: SeverityNumber.ERROR,
  severityText: 'ERROR',
  body: 'Payment authorization failed',
  attributes: { 'order.id': 1315, 'order.amount_usd': 79.99, 'gateway.error': 'declined' },
});

// Emit one record inside an active span so trace_id and span_id are correlated.
await tracer.startActiveSpan('checkout.submit', async (span) => {
  logger.emit({
    severityNumber: SeverityNumber.INFO,
    severityText: 'INFO',
    body: 'Order submitted within span context',
    attributes: { 'order.id': 1316, 'user.id': 'happy-bear' },
    context: context.active(),
  });
  span.end();
});

// Body containing structured text — exercises SparkLogs AutoExtract on the message field.
logger.emit({
  severityNumber: SeverityNumber.DEBUG,
  severityText: 'DEBUG',
  body: '2026-05-07T12:34:56Z [production] 29.20.23.224 user=happy-bear req("HEAD /orders/list HTTP/2.0") code=200 bytes=2581',
});

// ========================== SHUTDOWN ==========================

await loggerProvider.forceFlush();
await loggerProvider.shutdown();
console.log('Sent OTLP logs to', ingestUrl);
