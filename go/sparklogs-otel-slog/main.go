// Copyright (C) 2025-2026 IT Lightning, LLC. All rights reserved.
// Confidential and proprietary - see LICENSE.

// SparkLogs OTel example: Go stdlib slog bridged via otelslog.
//
// Alternative: set service.name, service.version, deployment.environment via
// OTEL_RESOURCE_ATTRIBUTES instead of the in-code Resource below.
//
// Scope vs service: otelslog.NewLogger's first argument is the OTel
// instrumentation scope name (here sparklogs.example.go.slog), not
// service.name — service.name is a resource attribute.
package main

import (
	"context"
	"log/slog"
	"os"
	"os/signal"
	"strconv"
	"syscall"
	"time"

	"go.opentelemetry.io/contrib/bridges/otelslog"
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
	// BatchLogRecordProcessor is production-correct; do not use SimpleLogRecordProcessor outside tests.
	res, err := resource.New(ctx,
		resource.WithAttributes(
			attribute.String("service.name", "sparklogs-example-go-slog"),
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

	logger := otelslog.NewLogger("sparklogs.example.go.slog", otelslog.WithLoggerProvider(provider))
	slog.SetDefault(logger)

	marker := os.Getenv("SPARKLOGS_MARKER")
	if marker == "" {
		marker = "sparklogs-ingest-example-marker"
	}

	slog.InfoContext(ctx,
		"SparkLogsExample: hello from Go slog OTel example language=go log_library=slog",
		slog.String("marker", marker),
		slog.String("language", "go"),
		slog.String("logging_library", "slog"),
	)

	slog.WarnContext(ctx,
		"SparkLogsExample: Storage: disk usage warning [pid="+strconv.Itoa(os.Getpid())+"] mount=/dev/sda1 used_pct=92 free_gb=8.4",
		slog.String("marker", marker),
		slog.String("language", "go"),
		slog.String("logging_library", "slog"),
	)

	slog.ErrorContext(ctx,
		`SparkLogsExample: Network: connection refused to 203.0.113.42 attempt=3 detail={"endpoint": "/api/orders", "latency_ms": 250}`,
		slog.String("marker", marker),
		slog.String("language", "go"),
		slog.String("logging_library", "slog"),
		slog.String("request_id", "req-7e2a9f"),
	)
}
