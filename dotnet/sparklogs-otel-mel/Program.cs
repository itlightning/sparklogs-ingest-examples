using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using OpenTelemetry.Logs;
using OpenTelemetry.Resources;

// Alternative: set service.name / service.version / deployment.environment via
// OTEL_RESOURCE_ATTRIBUTES instead of AddService/AddAttributes below.
var builder = Host.CreateApplicationBuilder(args);
builder.Logging.ClearProviders();
builder.Logging.AddOpenTelemetry(options =>
{
    options.SetResourceBuilder(ResourceBuilder.CreateDefault()
        .AddService("sparklogs-example-dotnet-mel", "1.0.0")
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
    .CreateLogger("sparklogs.example.dotnet.mel");

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

await host.StopAsync();
