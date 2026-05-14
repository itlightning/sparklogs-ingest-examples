package main

import (
	"context"
	"os"
	"os/signal"
	"strconv"
	"syscall"
	"time"

	"github.com/sirupsen/logrus"
	"go.opentelemetry.io/contrib/bridges/otellogrus"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/exporters/otlp/otlplog/otlploghttp"
	"go.opentelemetry.io/otel/sdk/log"
	"go.opentelemetry.io/otel/sdk/resource"
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
			attribute.String("service.name", "sparklogs-example-go-logrus"),
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

	logrusLogger := logrus.New()
	logrusLogger.SetLevel(logrus.InfoLevel)
	logrusLogger.AddHook(otellogrus.NewHook("sparklogs.example.go.logrus", otellogrus.WithLoggerProvider(provider)))

	marker := os.Getenv("SPARKLOGS_MARKER")
	if marker == "" {
		marker = "sparklogs-ingest-example-marker"
	}

	logrusLogger.WithFields(logrus.Fields{
		"marker":          marker,
		"language":        "go",
		"logging_library": "logrus",
	}).Info("SparkLogsExample: hello from Go logrus OTel example language=go log_library=logrus")

	logrusLogger.WithFields(logrus.Fields{
		"marker":          marker,
		"language":        "go",
		"logging_library": "logrus",
	}).Warn("SparkLogsExample: Storage: disk usage warning [pid=" + strconv.Itoa(os.Getpid()) + "] mount=/dev/sda1 used_pct=92 free_gb=8.4")

	logrusLogger.WithFields(logrus.Fields{
		"marker":          marker,
		"language":        "go",
		"logging_library": "logrus",
		"request_id":      "req-7e2a9f",
	}).Error("SparkLogsExample: Network: connection refused to 203.0.113.42 attempt=3 detail={\"endpoint\": \"/api/orders\", \"latency_ms\": 250}")
}
