include ../../mk/sparklogs-otel.mk

EXAMPLE_NAME := java/log4j2
MARKER       := sparklogs-otel-log4j2-$(shell date +%s)
JAR          := target/sparklogs-otel-log4j2-1.0.0.jar
MVN          ?= mvn

.PHONY: build run mock-test test clean

build:
	$(MVN) -q -DskipTests package

run: build
	java -jar $(JAR)

mock-test: build
	@$(call VISUAL_EXAMPLE_RUN_BEGIN,$(EXAMPLE_NAME),mock-test); \
	$(SPARKLOGS_AUTO_MOCK_LIFECYCLE); \
	  SPARKLOGS_MARKER="$(MARKER)" \
	  OTEL_LOGS_EXPORTER=otlp \
	  OTEL_SERVICE_NAME=sparklogs-example-java-log4j2 \
	  OTEL_RESOURCE_ATTRIBUTES=service.version=1.0.0,deployment.environment=ingest-examples \
	  $(SPARKLOGS_MOCK_ENV) java -jar $(JAR) && \
	  $(SPARKLOGS_ASSERT_MARKER) && \
	$(call VISUAL_EXAMPLE_RUN_END,$(EXAMPLE_NAME))

test: _check_cloud_credentials build
	@$(call VISUAL_EXAMPLE_RUN_BEGIN,$(EXAMPLE_NAME),test · cloud); \
	$(SPARKLOGS_RESOLVE_BASE_URI); \
	  SPARKLOGS_MARKER="$(MARKER)" \
	  OTEL_LOGS_EXPORTER=otlp \
	  OTEL_SERVICE_NAME=sparklogs-example-java-log4j2 \
	  OTEL_RESOURCE_ATTRIBUTES=service.version=1.0.0,deployment.environment=ingest-examples \
	  $(SPARKLOGS_CLOUD_ENV) java -jar $(JAR) && \
	echo "[$(EXAMPLE_NAME)] sent batch with marker $(MARKER) — verify in SparkLogs UI." && \
	$(call VISUAL_EXAMPLE_RUN_END,$(EXAMPLE_NAME))

clean:
	$(MVN) -q clean || true
