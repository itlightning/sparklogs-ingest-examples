package main

import (
	"context"
	"os"
	"os/signal"
	"strconv"
	"syscall"
	"time"

	"github.com/rs/zerolog"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/exporters/otlp/otlplog/otlploghttp"
	"go.opentelemetry.io/otel/log"
	sdklog "go.opentelemetry.io/otel/sdk/log"
	"go.opentelemetry.io/otel/sdk/resource"
)

func emitOTel(ctx context.Context, lg log.Logger, sev log.Severity, sevText, body string, attrs ...log.KeyValue) {
	var r log.Record
	r.SetSeverity(sev)
	r.SetSeverityText(sevText)
	r.SetBody(log.StringValue(body))
	r.SetTimestamp(time.Now())
	if len(attrs) > 0 {
		r.AddAttributes(attrs...)
	}
	lg.Emit(ctx, r)
}

func main() {
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	exporter, err := otlploghttp.New(ctx)
	if err != nil {
		panic(err)
	}
	res, err := resource.New(ctx,
		resource.WithAttributes(
			attribute.String("service.name", "sparklogs-example-go-zerolog"),
			attribute.String("service.version", "1.0.0"),
			attribute.String("deployment.environment", "ingest-examples"),
		),
	)
	if err != nil {
		panic(err)
	}
	provider := sdklog.NewLoggerProvider(
		sdklog.WithResource(res),
		sdklog.WithProcessor(sdklog.NewBatchProcessor(exporter)),
	)
	defer func() {
		shCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		_ = provider.Shutdown(shCtx)
	}()

	// Zerolog for local console; OTel Logger emits the same lines to OTLP.
	// (The contrib otelzerolog bridge is not on a stable version tag aligned with
	// this logs SDK — manual Emit keeps dependency versions consistent.)
	zl := zerolog.New(os.Stdout).With().Timestamp().Logger()
	lg := provider.Logger("sparklogs.example.go.zerolog")

	marker := os.Getenv("SPARKLOGS_MARKER")
	if marker == "" {
		marker = "sparklogs-ingest-example-marker"
	}

	body1 := "SparkLogsExample: hello from Go zerolog OTel example language=go log_library=zerolog marker=" + marker
	zl.Info().Msg(body1)
	emitOTel(ctx, lg, log.SeverityInfo, "INFO", body1,
		log.String("marker", marker), log.String("language", "go"), log.String("logging_library", "zerolog"))

	body2 := "SparkLogsExample: Storage: disk usage warning [pid=" + strconv.Itoa(os.Getpid()) + "] mount=/dev/sda1 used_pct=92 free_gb=8.4 marker=" + marker
	zl.Warn().Msg(body2)
	emitOTel(ctx, lg, log.SeverityWarn, "WARN", body2,
		log.String("marker", marker), log.String("language", "go"), log.String("logging_library", "zerolog"))

	body3 := "SparkLogsExample: Network: connection refused to 203.0.113.42 attempt=3 detail={\"endpoint\": \"/api/orders\", \"latency_ms\": 250} marker=" + marker + " request_id=req-7e2a9f"
	zl.Error().Msg(body3)
	emitOTel(ctx, lg, log.SeverityError, "ERROR", body3,
		log.String("marker", marker), log.String("language", "go"), log.String("logging_library", "zerolog"),
		log.String("request_id", "req-7e2a9f"))
}
