using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using NLog.Extensions.Logging;
using OpenTelemetry.Logs;
using OpenTelemetry.Resources;

// NLog is registered as an MEL provider; OpenTelemetry captures ILogger output.
// Alternative: set resource attributes via OTEL_RESOURCE_ATTRIBUTES.
var builder = Host.CreateApplicationBuilder(args);
builder.Logging.ClearProviders();
builder.Logging.AddNLog();
builder.Logging.AddOpenTelemetry(options =>
{
    options.SetResourceBuilder(ResourceBuilder.CreateDefault()
        .AddService("sparklogs-example-dotnet-nlog", "1.0.0")
        .AddAttributes(new Dictionary<string, object>
        {
            ["deployment.environment"] = "ingest-examples",
        }));
    options.AddOtlpExporter();
    options.IncludeFormattedMessage = true;
    options.IncludeScopes = true;
    options.ParseStateValues = true;
});
builder.Logging.SetMinimumLevel(LogLevel.Information);

await using var host = builder.Build();
var log = host.Services.GetRequiredService<ILoggerFactory>()
    .CreateLogger("sparklogs.example.dotnet.nlog");

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

await host.StopAsync();
NLog.LogManager.Shutdown();
