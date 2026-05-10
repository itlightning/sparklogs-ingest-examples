# Makefile for Go slog + OpenTelemetry example.

include ../../mk/sparklogs-otel.mk

EXAMPLE_NAME := go/slog
MARKER       := sparklogs-otel-slog-$(shell date +%s)

GO ?= go

.PHONY: build run mock-test test clean

build:
	$(GO) mod download
	$(GO) build -o sparklogs-otel-slog .

run: build
	./sparklogs-otel-slog

mock-test: build
	@$(call VISUAL_EXAMPLE_RUN_BEGIN,$(EXAMPLE_NAME),mock-test); \
	$(SPARKLOGS_AUTO_MOCK_LIFECYCLE); \
	  SPARKLOGS_MARKER="$(MARKER)" $(SPARKLOGS_MOCK_ENV) ./sparklogs-otel-slog && \
	  $(SPARKLOGS_ASSERT_MARKER) && \
	$(call VISUAL_EXAMPLE_RUN_END,$(EXAMPLE_NAME))

test: _check_cloud_credentials build
	@$(call VISUAL_EXAMPLE_RUN_BEGIN,$(EXAMPLE_NAME),test · cloud); \
	$(SPARKLOGS_RESOLVE_BASE_URI); \
	  SPARKLOGS_MARKER="$(MARKER)" $(SPARKLOGS_CLOUD_ENV) ./sparklogs-otel-slog && \
	echo "[$(EXAMPLE_NAME)] sent batch with marker $(MARKER) — verify in SparkLogs UI." && \
	$(call VISUAL_EXAMPLE_RUN_END,$(EXAMPLE_NAME))

clean:
	rm -f sparklogs-otel-slog
	rm -rf .cache
