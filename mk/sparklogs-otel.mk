# Shared SparkLogs / OpenTelemetry SDK Make logic for examples in this repo.
#
# Each per-example Makefile includes this file with:
#   include ../../mk/sparklogs-otel.mk
#
# What it provides:
#
#   Shared variables (overridable from the environment):
#     MOCK_OTLP_PORT       = 14318    HTTP port the local mock receiver listens on
#     MOCK_HEALTH_PORT     = 14133    health-check port on the local mock
#     MOCK_LOG_FILE        = /tmp/sparklogs-otel-mock/collector.stderr
#     OTEL_LOGS_TIMEOUT_MS = 25000    OTEL_EXPORTER_OTLP_LOGS_TIMEOUT used by examples
#
#   Guard targets (.PHONY) — depend on these from your example's targets:
#     _check_mock_running         curl-pings the mock; fail with a useful
#                                 message if it isn't reachable.
#     _check_cloud_credentials    require SPARKLOGS_AGENT_ID, SPARKLOGS_AGENT_ACCESS_TOKEN,
#                                 and at least one of SPARKLOGS_INGEST_BASE_URI or
#                                 SPARKLOGS_REGION.
#
#   Splat-able env-var blocks for the run command in your recipe:
#     SPARKLOGS_MOCK_ENV          OTLP env vars pointed at the local mock.
#     SPARKLOGS_CLOUD_ENV         OTLP env vars pointed at SparkLogs cloud
#                                 (or whatever SPARKLOGS_INGEST_BASE_URI points at —
#                                 QA / local-dev / dev-cloud overrides go through here).
#                                 References the shell variable
#                                 SPARKLOGS_INGEST_BASE_URI which the resolve helper
#                                 below sets.
#
#   Shell-snippet helpers (splat them as the head of a recipe shell line):
#     SPARKLOGS_RESOLVE_BASE_URI  Sets the shell variable SPARKLOGS_INGEST_BASE_URI
#                                 to a normalized form (with trailing slash).
#                                 Prefers the user-provided SPARKLOGS_INGEST_BASE_URI;
#                                 falls back to the SPARKLOGS_REGION template.
#                                 Idempotent on the trailing slash.
#     SPARKLOGS_ASSERT_MARKER     post-run check that $(MARKER) appears in
#                                 $(MOCK_LOG_FILE). Examples must define MARKER
#                                 and EXAMPLE_NAME before splatting this.
#
# What your example's Makefile must define:
#     EXAMPLE_NAME    short label used in PASS / FAIL output
#     MARKER          a unique string the example logs and the mock-test grep
#                     looks for; conventional pattern is
#                     "<example-id>-$(shell date +%s)"
#
# Typical recipe shape:
#
#     mock-test: _check_mock_running build
#         @SPARKLOGS_MARKER="$(MARKER)" $(SPARKLOGS_MOCK_ENV) $(PY) main.py
#         @$(SPARKLOGS_ASSERT_MARKER)
#
#     test: _check_cloud_credentials build
#         @$(SPARKLOGS_RESOLVE_BASE_URI); \
#           SPARKLOGS_MARKER="$(MARKER)" $(SPARKLOGS_CLOUD_ENV) $(PY) main.py

# --- Repo-root resolution (no work required from the includer) --------------

SPARKLOGS_OTEL_MK := $(lastword $(MAKEFILE_LIST))
REPO_ROOT        := $(realpath $(dir $(SPARKLOGS_OTEL_MK))..)

# --- Shared variables (overridable) -----------------------------------------

MOCK_OTLP_PORT       ?= 14318
MOCK_HEALTH_PORT     ?= 14133
MOCK_LOG_FILE        ?= /tmp/sparklogs-otel-mock/collector.stderr
OTEL_LOGS_TIMEOUT_MS ?= 25000

# --- Guard targets ----------------------------------------------------------

.PHONY: _check_mock_running _check_cloud_credentials

_check_mock_running:
	@curl -sf http://localhost:$(MOCK_HEALTH_PORT)/ >/dev/null 2>&1 || { \
	  echo "ERROR: mock OTLP receiver not reachable on http://localhost:$(MOCK_HEALTH_PORT)/."; \
	  echo "       Start it with: $(REPO_ROOT)/localenv/otel-mock/start.sh -d"; \
	  echo "       Or run from the repo root: make mock-start"; \
	  exit 1; \
	}

_check_cloud_credentials:
	@if [ -z "$$SPARKLOGS_AGENT_ID" ] || [ -z "$$SPARKLOGS_AGENT_ACCESS_TOKEN" ]; then \
	  echo "ERROR: set SPARKLOGS_AGENT_ID and SPARKLOGS_AGENT_ACCESS_TOKEN before 'make test'."; \
	  exit 1; \
	fi
	@if [ -z "$$SPARKLOGS_INGEST_BASE_URI" ] && [ -z "$$SPARKLOGS_REGION" ]; then \
	  echo "ERROR: set either SPARKLOGS_INGEST_BASE_URI (e.g. https://ingest-us.engine.sparklogs.app/)"; \
	  echo "       or SPARKLOGS_REGION (us|eu) before 'make test'."; \
	  exit 1; \
	fi

# --- Shell-snippet helpers --------------------------------------------------
#
# Each helper expands to a single logical shell line (Make joins backslash-
# continued lines into one). Splat into a recipe with $(NAME) and chain other
# commands with `;` or `&&`.

# Resolves and normalizes SPARKLOGS_INGEST_BASE_URI as a SHELL variable so
# subsequent commands in the same recipe line can reference it. The trailing
# slash is normalized so $${SPARKLOGS_INGEST_BASE_URI}v1/logs is always a
# well-formed URL.
SPARKLOGS_RESOLVE_BASE_URI = \
if [ -n "$$SPARKLOGS_INGEST_BASE_URI" ]; then \
  SPARKLOGS_INGEST_BASE_URI="$${SPARKLOGS_INGEST_BASE_URI%/}/"; \
elif [ -n "$$SPARKLOGS_REGION" ]; then \
  SPARKLOGS_INGEST_BASE_URI="https://ingest-$${SPARKLOGS_REGION}.engine.sparklogs.app/"; \
else \
  echo "ERROR: set either SPARKLOGS_INGEST_BASE_URI or SPARKLOGS_REGION." >&2; exit 1; \
fi

# Post-run mock-test assertion. Examples must define MARKER and EXAMPLE_NAME.
SPARKLOGS_ASSERT_MARKER = \
sleep 2 && \
if grep -F "$(MARKER)" "$(MOCK_LOG_FILE)" > /dev/null; then \
  echo "[$(EXAMPLE_NAME)] mock-test PASS — marker found in $(MOCK_LOG_FILE)"; \
else \
  echo "[$(EXAMPLE_NAME)] mock-test FAIL — marker '$(MARKER)' not found in $(MOCK_LOG_FILE)"; \
  exit 1; \
fi

# --- Splat-able env-var blocks for the run command --------------------------
#
# `$$VAR` in these expansions is Make's `$$` → `$` escape; the shell sees `$VAR`.
# `$(VAR)` is a Make-time substitution; baked into the value.

SPARKLOGS_MOCK_ENV = \
  OTEL_EXPORTER_OTLP_LOGS_PROTOCOL=http/protobuf \
  OTEL_EXPORTER_OTLP_LOGS_ENDPOINT=http://localhost:$(MOCK_OTLP_PORT)/v1/logs \
  OTEL_EXPORTER_OTLP_LOGS_COMPRESSION=none \
  OTEL_EXPORTER_OTLP_LOGS_TIMEOUT=$(OTEL_LOGS_TIMEOUT_MS)

SPARKLOGS_CLOUD_ENV = \
  OTEL_EXPORTER_OTLP_LOGS_PROTOCOL=http/protobuf \
  OTEL_EXPORTER_OTLP_LOGS_ENDPOINT="$${SPARKLOGS_INGEST_BASE_URI}v1/logs" \
  OTEL_EXPORTER_OTLP_LOGS_HEADERS="Authorization=Bearer $${SPARKLOGS_AGENT_ID}:$${SPARKLOGS_AGENT_ACCESS_TOKEN}" \
  OTEL_EXPORTER_OTLP_LOGS_COMPRESSION=gzip \
  OTEL_EXPORTER_OTLP_LOGS_TIMEOUT=$(OTEL_LOGS_TIMEOUT_MS)
