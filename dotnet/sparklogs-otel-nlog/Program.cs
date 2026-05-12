using Microsoft.Extensions.Logging;
using NLog.Extensions.Logging;
using OpenTelemetry.Exporter;
using OpenTelemetry.Logs;
using OpenTelemetry.Resources;

// NLog is registered as an MEL provider; OpenTelemetry captures ILogger output.
// Alternative: set resource attributes via OTEL_RESOURCE_ATTRIBUTES.
//
// We use LoggerFactory.Create directly (no host) and configure the OTLP
// exporter explicitly from env vars — see the MEL example for why.
var endpoint = Environment.GetEnvironmentVariable("OTEL_EXPORTER_OTLP_LOGS_ENDPOINT")
               ?? Environment.GetEnvironmentVariable("OTEL_EXPORTER_OTLP_ENDPOINT")
               ?? "http://localhost:4318/v1/logs";

using var loggerFactory = LoggerFactory.Create(builder =>
{
    builder.AddNLog();
    builder.AddOpenTelemetry(options =>
    {
        options.SetResourceBuilder(ResourceBuilder.CreateDefault()
            .AddService("sparklogs-example-dotnet-nlog", "1.0.0")
            .AddAttributes(new Dictionary<string, object>
            {
                ["deployment.environment"] = "ingest-examples",
            }));
        options.AddOtlpExporter(otlp =>
        {
            otlp.Endpoint = new Uri(endpoint);
            otlp.Protocol = OtlpExportProtocol.HttpProtobuf;
        });
        options.IncludeFormattedMessage = true;
        options.IncludeScopes = true;
        options.ParseStateValues = true;
    });
    builder.SetMinimumLevel(LogLevel.Information);
});

var log = loggerFactory.CreateLogger("sparklogs.example.dotnet.nlog");

var marker = Environment.GetEnvironmentVariable("SPARKLOGS_MARKER")
             ?? "sparklogs-ingest-example-marker";

log.LogInformation(
    "SparkLogsExample: hello from .NET NLog→MEL OTel example language=dotnet log_library=nlog marker={Marker}",
    marker);
log.LogWarning(
    "SparkLogsExample: Storage: disk usage warning [pid={Pid}] mount=/dev/sda1 used_pct=92 free_gb=8.4",
    Environment.ProcessId);
log.LogError(
    new InvalidOperationException("simulated failure"),
    "SparkLogsExample: Network: connection refused to 203.0.113.42 attempt=3 detail={{\"endpoint\": \"/api/orders\", \"latency_ms\": 250}} request_id={RequestId}",
    "req-7e2a9f");

// `using` on the LoggerFactory above will dispose it (and the OTel provider)
// synchronously, flushing the BatchExportProcessor.
NLog.LogManager.Shutdown();
