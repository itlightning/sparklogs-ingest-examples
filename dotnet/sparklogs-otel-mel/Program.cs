using Microsoft.Extensions.Logging;
using OpenTelemetry.Exporter;
using OpenTelemetry.Logs;
using OpenTelemetry.Resources;

// Alternative: set service.name / service.version / deployment.environment via
// OTEL_RESOURCE_ATTRIBUTES instead of AddService/AddAttributes below.
//
// Note on OTLP export configuration: when constructing a LoggerFactory
// directly (no host / no DI configuration), the no-args AddOtlpExporter()
// overload does not reliably pick up `OTEL_EXPORTER_OTLP_LOGS_*` env vars
// because OtlpExporterOptions is normally bound from IConfiguration. We read
// the endpoint and protocol ourselves so this works the same way regardless
// of how the program is launched.

var endpoint = Environment.GetEnvironmentVariable("OTEL_EXPORTER_OTLP_LOGS_ENDPOINT")
               ?? Environment.GetEnvironmentVariable("OTEL_EXPORTER_OTLP_ENDPOINT")
               ?? "http://localhost:4318/v1/logs";

using var loggerFactory = LoggerFactory.Create(builder =>
{
    builder.AddOpenTelemetry(options =>
    {
        options.SetResourceBuilder(ResourceBuilder.CreateDefault()
            .AddService("sparklogs-example-dotnet-mel", "1.0.0")
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

var log = loggerFactory.CreateLogger("sparklogs.example.dotnet.mel");

var marker = Environment.GetEnvironmentVariable("SPARKLOGS_MARKER")
             ?? "sparklogs-ingest-example-marker";

using (log.BeginScope(new Dictionary<string, object>
       {
           ["marker"] = marker,
           ["language"] = "dotnet",
           ["logging_library"] = "mel",
       }))
{
    log.LogInformation(
        "SparkLogsExample: hello from .NET MEL OTel example language=dotnet log_library=mel marker={Marker}",
        marker);
    log.LogWarning(
        "SparkLogsExample: Storage: disk usage warning [pid={Pid}] mount=/dev/sda1 used_pct=92 free_gb=8.4",
        Environment.ProcessId);
    log.LogError(
        new InvalidOperationException("simulated failure"),
        "SparkLogsExample: Network: connection refused to 203.0.113.42 attempt=3 detail={{\"endpoint\": \"/api/orders\", \"latency_ms\": 250}} request_id={RequestId}",
        "req-7e2a9f");
}

// `using` on the LoggerFactory above will dispose it (and the OTel provider)
// when the program exits, synchronously flushing the batch processor.
