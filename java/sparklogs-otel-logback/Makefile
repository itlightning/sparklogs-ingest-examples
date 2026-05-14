# Java Logback + OpenTelemetry (Maven + shaded jar)

include ../../mk/sparklogs-otel.mk

EXAMPLE_NAME := java/logback
MARKER       := sparklogs-otel-logback-$(shell date +%s)
JAR          := target/sparklogs-otel-logback-1.0.0.jar
MVN          ?= mvn

.PHONY: build run mock-test test clean

build:
	$(MVN) -q -DskipTests package

run: build
	java -jar $(JAR)

# OTEL_LOGS_EXPORTER=otlp required by autoconfigure for logs pipeline.
# OTEL_TRACES_EXPORTER=none / OTEL_METRICS_EXPORTER=none disable the other
# signals — SparkLogs is logs-only today, and leaving them at the default
# (otlp) would make autoconfigure try to initialize three pipelines.
mock-test: build
	@$(call VISUAL_EXAMPLE_RUN_BEGIN,$(EXAMPLE_NAME),mock-test); \
	$(SPARKLOGS_AUTO_MOCK_LIFECYCLE); \
	  SPARKLOGS_MARKER="$(MARKER)" \
	  OTEL_LOGS_EXPORTER=otlp \
	  OTEL_TRACES_EXPORTER=none \
	  OTEL_METRICS_EXPORTER=none \
	  OTEL_SERVICE_NAME=sparklogs-example-java-logback \
	  OTEL_RESOURCE_ATTRIBUTES=service.version=1.0.0,deployment.environment=ingest-examples \
	  $(SPARKLOGS_MOCK_ENV) java -jar $(JAR) && \
	  $(SPARKLOGS_ASSERT_MARKER) && \
	$(call VISUAL_EXAMPLE_RUN_END,$(EXAMPLE_NAME))

test: _check_cloud_credentials build
	@$(call VISUAL_EXAMPLE_RUN_BEGIN,$(EXAMPLE_NAME),test · cloud); \
	$(SPARKLOGS_RESOLVE_BASE_URI); \
	  SPARKLOGS_MARKER="$(MARKER)" \
	  OTEL_LOGS_EXPORTER=otlp \
	  OTEL_TRACES_EXPORTER=none \
	  OTEL_METRICS_EXPORTER=none \
	  OTEL_SERVICE_NAME=sparklogs-example-java-logback \
	  OTEL_RESOURCE_ATTRIBUTES=service.version=1.0.0,deployment.environment=ingest-examples \
	  $(SPARKLOGS_CLOUD_ENV) java -jar $(JAR) && \
	echo "[$(EXAMPLE_NAME)] sent batch with marker $(MARKER) — verify in SparkLogs UI." && \
	$(call VISUAL_EXAMPLE_RUN_END,$(EXAMPLE_NAME))

clean:
	$(MVN) -q clean || true
