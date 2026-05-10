package main

import (
	"context"
	"os"
	"os/signal"
	"strconv"
	"syscall"
	"time"

	"go.opentelemetry.io/contrib/bridges/otelzap"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/exporters/otlp/otlplog/otlploghttp"
	"go.opentelemetry.io/otel/sdk/log"
	"go.opentelemetry.io/otel/sdk/resource"
	"go.uber.org/zap"
)

func main() {
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	exporter, err := otlploghttp.New(ctx)
	if err != nil {
		panic(err)
	}
	res, err := resource.New(ctx,
		resource.WithAttributes(
			attribute.String("service.name", "sparklogs-example-go-zap"),
			attribute.String("service.version", "1.0.0"),
			attribute.String("deployment.environment", "ingest-examples"),
		),
	)
	if err != nil {
		panic(err)
	}
	provider := log.NewLoggerProvider(
		log.WithResource(res),
		log.WithProcessor(log.NewBatchProcessor(exporter)),
	)
	defer func() {
		shCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		_ = provider.Shutdown(shCtx)
	}()

	otelCore := otelzap.NewCore("sparklogs.example.go.zap", otelzap.WithLoggerProvider(provider))
	logger := zap.New(otelCore)
	defer func() { _ = logger.Sync() }()

	marker := os.Getenv("SPARKLOGS_MARKER")
	if marker == "" {
		marker = "sparklogs-ingest-example-marker"
	}

	logger.Info("SparkLogsExample: hello from Go zap OTel example language=go log_library=zap",
		zap.String("marker", marker),
		zap.String("language", "go"),
		zap.String("logging_library", "zap"),
	)

	logger.Warn("SparkLogsExample: Storage: disk usage warning [pid="+strconv.Itoa(os.Getpid())+"] mount=/dev/sda1 used_pct=92 free_gb=8.4",
		zap.String("marker", marker),
		zap.String("language", "go"),
		zap.String("logging_library", "zap"),
	)

	logger.Error("SparkLogsExample: Network: connection refused to 203.0.113.42 attempt=3 detail={\"endpoint\": \"/api/orders\", \"latency_ms\": 250}",
		zap.String("marker", marker),
		zap.String("language", "go"),
		zap.String("logging_library", "zap"),
		zap.String("request_id", "req-7e2a9f"),
	)
}
