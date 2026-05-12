include ../../mk/sparklogs-otel.mk

EXAMPLE_NAME := dotnet/mel
MARKER       := sparklogs-otel-mel-$(shell date +%s)
DOTNET       ?= dotnet

# Auto-detect the highest installed .NET SDK major version, fall back to net8.0
# (the csproj default). Override via `make DOTNET_TFM=net8.0 ...` if you want
# to pin a specific framework when multiple SDKs are installed.
DOTNET_SDK_MAJOR := $(shell $(DOTNET) --list-sdks 2>/dev/null | awk -F. '{print $$1}' | sort -nu | tail -1)
DOTNET_TFM       ?= $(if $(DOTNET_SDK_MAJOR),net$(DOTNET_SDK_MAJOR).0,net8.0)
DOTNET_TFM_PROP  := -p:TargetFramework=$(DOTNET_TFM)

.PHONY: build run mock-test test clean

build:
	$(DOTNET) restore $(DOTNET_TFM_PROP)
	$(DOTNET) build -c Release --no-restore $(DOTNET_TFM_PROP)

run: build
	$(DOTNET) run -c Release --no-build --project sparklogs-otel-mel.csproj $(DOTNET_TFM_PROP)

mock-test: build
	@$(call VISUAL_EXAMPLE_RUN_BEGIN,$(EXAMPLE_NAME),mock-test); \
	$(SPARKLOGS_AUTO_MOCK_LIFECYCLE); \
	  SPARKLOGS_MARKER="$(MARKER)" $(SPARKLOGS_MOCK_ENV) $(DOTNET) run -c Release --no-build --project sparklogs-otel-mel.csproj $(DOTNET_TFM_PROP) && \
	  $(SPARKLOGS_ASSERT_MARKER) && \
	$(call VISUAL_EXAMPLE_RUN_END,$(EXAMPLE_NAME))

test: _check_cloud_credentials build
	@$(call VISUAL_EXAMPLE_RUN_BEGIN,$(EXAMPLE_NAME),test · cloud); \
	$(SPARKLOGS_RESOLVE_BASE_URI); \
	  SPARKLOGS_MARKER="$(MARKER)" $(SPARKLOGS_CLOUD_ENV) $(DOTNET) run -c Release --no-build --project sparklogs-otel-mel.csproj $(DOTNET_TFM_PROP) && \
	echo "[$(EXAMPLE_NAME)] sent batch with marker $(MARKER) — verify in SparkLogs UI." && \
	$(call VISUAL_EXAMPLE_RUN_END,$(EXAMPLE_NAME))

clean:
	$(DOTNET) clean -c Release || true
	rm -rf bin obj
