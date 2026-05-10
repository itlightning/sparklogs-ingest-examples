using Serilog;
using Serilog.Sinks.OpenTelemetry;

// Alternative: set resource attributes via OTEL_RESOURCE_ATTRIBUTES.
var marker = Environment.GetEnvironmentVariable("SPARKLOGS_MARKER")
             ?? "sparklogs-ingest-example-marker";

Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Information()
    .Enrich.WithProperty("language", "dotnet")
    .Enrich.WithProperty("logging_library", "serilog")
    .WriteTo.Console()
    .WriteTo.OpenTelemetry(options =>
    {
        options.ResourceAttributes = new Dictionary<string, object>
        {
            ["service.name"] = "sparklogs-example-dotnet-serilog",
            ["service.version"] = "1.0.0",
            ["deployment.environment"] = "ingest-examples",
        };
        options.Protocol = OtlpProtocol.HttpProtobuf;
    })
    .CreateLogger();

Log.Information(
    "SparkLogsExample: hello from .NET Serilog OTel example language=dotnet log_library=serilog marker={Marker}",
    marker);
Log.Warning(
    "SparkLogsExample: Storage: disk usage warning [pid={Pid}] mount=/dev/sda1 used_pct=92 free_gb=8.4",
    Environment.ProcessId);
Log.Error(
    new InvalidOperationException("simulated failure"),
    "SparkLogsExample: Network: connection refused to 203.0.113.42 attempt=3 detail={{\"endpoint\": \"/api/orders\", \"latency_ms\": 250}} request_id={RequestId}",
    "req-7e2a9f");

await Log.CloseAndFlushAsync();
