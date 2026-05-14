using Serilog;
using Serilog.Sinks.OpenTelemetry;

// Alternative: set resource attributes via OTEL_RESOURCE_ATTRIBUTES.
//
// Serilog.Sinks.OpenTelemetry has its own option object and does NOT
// auto-read the OTEL_EXPORTER_OTLP_* env vars the way the OpenTelemetry SDK
// MEL exporter does. We read endpoint / auth header ourselves and pass them
// into the sink options so this works the same way regardless of which
// SDK / sink combination is in play.
var marker = Environment.GetEnvironmentVariable("SPARKLOGS_MARKER")
             ?? "sparklogs-ingest-example-marker";
var endpoint = Environment.GetEnvironmentVariable("OTEL_EXPORTER_OTLP_LOGS_ENDPOINT")
               ?? Environment.GetEnvironmentVariable("OTEL_EXPORTER_OTLP_ENDPOINT")
               ?? "http://localhost:4318/v1/logs";
var headersEnv = Environment.GetEnvironmentVariable("OTEL_EXPORTER_OTLP_LOGS_HEADERS")
                 ?? Environment.GetEnvironmentVariable("OTEL_EXPORTER_OTLP_HEADERS");

Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Information()
    .Enrich.WithProperty("language", "dotnet")
    .Enrich.WithProperty("logging_library", "serilog")
    .WriteTo.Console()
    .WriteTo.OpenTelemetry(options =>
    {
        options.Endpoint = endpoint;
        options.Protocol = OtlpProtocol.HttpProtobuf;
        options.ResourceAttributes = new Dictionary<string, object>
        {
            ["service.name"] = "sparklogs-example-dotnet-serilog",
            ["service.version"] = "1.0.0",
            ["deployment.environment"] = "ingest-examples",
        };
        if (!string.IsNullOrEmpty(headersEnv))
        {
            // Parse "k1=v1,k2=v2" form into the sink's header dictionary.
            options.Headers = headersEnv
                .Split(',', StringSplitOptions.RemoveEmptyEntries)
                .Select(pair => pair.Split('=', 2))
                .Where(parts => parts.Length == 2)
                .ToDictionary(parts => parts[0].Trim(), parts => parts[1].Trim());
        }
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
