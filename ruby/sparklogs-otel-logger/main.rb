# frozen_string_literal: true

# SparkLogs Ruby stdlib Logger + OpenTelemetry logs (beta).
#
# Gems are published on RubyGems (opentelemetry-logs-sdk, opentelemetry-exporter-otlp-logs).
# **Out of scope until SparkLogs supports traces:** trace context on log records is not used here.

require 'logger'
require 'opentelemetry/sdk'
require 'opentelemetry-logs-sdk'
require 'opentelemetry/exporter/otlp_logs'

marker = ENV.fetch('SPARKLOGS_MARKER', 'sparklogs-ingest-example-marker')

resource = OpenTelemetry::SDK::Resources::Resource.create({
  'service.name' => 'sparklogs-example-ruby-logger',
  'service.version' => '1.0.0',
  'deployment.environment' => 'ingest-examples'
})

exporter = OpenTelemetry::Exporter::OTLP::Logs::LogsExporter.new
processor = OpenTelemetry::SDK::Logs::Export::BatchLogRecordProcessor.new(exporter)
provider = OpenTelemetry::SDK::Logs::LoggerProvider.new(resource: resource)
provider.add_log_record_processor(processor)

otel = provider.logger(name: 'sparklogs.example.ruby.logger')

# BatchLogRecordProcessor is production-correct; avoid SimpleLogRecordProcessor outside tests.

def emit_otel(otel, body, severity_text, severity_number, attrs)
  otel.on_emit(
    severity_text: severity_text,
    severity_number: severity_number,
    body: body,
    attributes: attrs
  )
end

emit_otel(
  otel,
  "SparkLogsExample: hello from Ruby Logger OTel example language=ruby log_library=logger marker=#{marker}",
  'INFO', 9,
  { 'marker' => marker, 'language' => 'ruby', 'logging_library' => 'logger' }
)

emit_otel(
  otel,
  "SparkLogsExample: Storage: disk usage warning [pid=#{Process.pid}] mount=/dev/sda1 used_pct=92 free_gb=8.4",
  'WARN', 13,
  { 'marker' => marker, 'language' => 'ruby', 'logging_library' => 'logger' }
)

emit_otel(
  otel,
  'SparkLogsExample: Network: connection refused to 203.0.113.42 attempt=3 detail={"endpoint": "/api/orders", "latency_ms": 250}',
  'ERROR', 17,
  { 'marker' => marker, 'language' => 'ruby', 'logging_library' => 'logger', 'request_id' => 'req-7e2a9f' }
)

$stdout.puts '[ruby] emitted OTLP log records (see OpenTelemetry for bodies).'

provider.shutdown
