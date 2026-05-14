<?php

declare(strict_types=1);

/**
 * SparkLogs PHP + Monolog + OpenTelemetry OTLP/HTTP example.
 *
 * The website's composer one-liner is intentionally short; this project pins
 * PSR-18/PSR-17 HTTP dependencies so `composer install` works standalone.
 */

require __DIR__ . '/vendor/autoload.php';

use Monolog\Level;
use Monolog\Logger;
use Monolog\Handler\StreamHandler;
use OpenTelemetry\API\Common\Time\Clock;
use OpenTelemetry\Contrib\Logs\Monolog\Handler as OtelMonologHandler;
use OpenTelemetry\SDK\Common\Attribute\Attributes;
use OpenTelemetry\SDK\Logs\LoggerProvider;
use OpenTelemetry\SDK\Logs\Processor\BatchLogRecordProcessor;
use OpenTelemetry\SDK\Resource\ResourceInfo;
use OpenTelemetry\Contrib\Otlp\LogsExporterFactory;
use OpenTelemetry\SemConv\ResourceAttributes;

$marker = getenv('SPARKLOGS_MARKER') ?: 'sparklogs-ingest-example-marker';

// Alternative: set service.name / service.version / deployment.environment.name via OTEL_RESOURCE_ATTRIBUTES.
$resource = ResourceInfo::create(Attributes::create([
    ResourceAttributes::SERVICE_NAME => 'sparklogs-example-php-monolog',
    ResourceAttributes::SERVICE_VERSION => '1.0.0',
    ResourceAttributes::DEPLOYMENT_ENVIRONMENT_NAME => 'ingest-examples',
]));

$exporter = (new LogsExporterFactory())->create();

// BatchLogRecordProcessor is production-correct; avoid SimpleLogRecordProcessor outside tests.
$loggerProvider = LoggerProvider::builder()
    ->setResource($resource)
    ->addLogRecordProcessor(new BatchLogRecordProcessor($exporter, Clock::getDefault()))
    ->build();

$otelHandler = new OtelMonologHandler($loggerProvider, Level::Info, true);

$log = new Logger('sparklogs.example.php.monolog');
$log->pushHandler($otelHandler);
$log->pushHandler(new StreamHandler('php://stdout', Level::Info));

$log->info(
    'SparkLogsExample: hello from PHP Monolog OTel example language=php log_library=monolog marker=' . $marker,
    ['marker' => $marker, 'language' => 'php', 'logging_library' => 'monolog']
);

$log->warning(
    'SparkLogsExample: Storage: disk usage warning [pid=' . getmypid() . '] mount=/dev/sda1 used_pct=92 free_gb=8.4',
    ['marker' => $marker, 'language' => 'php', 'logging_library' => 'monolog']
);

try {
    throw new RuntimeException('simulated failure');
} catch (Throwable $e) {
    $log->error(
        'SparkLogsExample: Network: connection refused to 203.0.113.42 attempt=3 detail={"endpoint": "/api/orders", "latency_ms": 250}',
        ['exception' => $e, 'marker' => $marker, 'request_id' => 'req-7e2a9f', 'language' => 'php', 'logging_library' => 'monolog']
    );
}

register_shutdown_function(static function () use ($loggerProvider): void {
    $loggerProvider->shutdown();
});
