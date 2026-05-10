include ../../mk/sparklogs-otel.mk

EXAMPLE_NAME := dotnet/nlog
MARKER       := sparklogs-otel-nlog-$(shell date +%s)
DOTNET       ?= dotnet

.PHONY: build run mock-test test clean

build:
	$(DOTNET) restore
	$(DOTNET) build -c Release --no-restore

run: build
	$(DOTNET) run -c Release --no-build --project sparklogs-otel-nlog.csproj

mock-test: build
	@$(call VISUAL_EXAMPLE_RUN_BEGIN,$(EXAMPLE_NAME),mock-test); \
	$(SPARKLOGS_AUTO_MOCK_LIFECYCLE); \
	  SPARKLOGS_MARKER="$(MARKER)" $(SPARKLOGS_MOCK_ENV) $(DOTNET) run -c Release --no-build --project sparklogs-otel-nlog.csproj && \
	  $(SPARKLOGS_ASSERT_MARKER) && \
	$(call VISUAL_EXAMPLE_RUN_END,$(EXAMPLE_NAME))

test: _check_cloud_credentials build
	@$(call VISUAL_EXAMPLE_RUN_BEGIN,$(EXAMPLE_NAME),test · cloud); \
	$(SPARKLOGS_RESOLVE_BASE_URI); \
	  SPARKLOGS_MARKER="$(MARKER)" $(SPARKLOGS_CLOUD_ENV) $(DOTNET) run -c Release --no-build --project sparklogs-otel-nlog.csproj && \
	echo "[$(EXAMPLE_NAME)] sent batch with marker $(MARKER) — verify in SparkLogs UI." && \
	$(call VISUAL_EXAMPLE_RUN_END,$(EXAMPLE_NAME))

clean:
	$(DOTNET) clean -c Release || true
	rm -rf bin obj
