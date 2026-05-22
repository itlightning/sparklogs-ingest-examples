# Top-level Makefile for SparkLogs ingest examples.
#
# Targets:
#   make build        - install / compile every example (no execution).
#   make mock-test    - run every example against the local OTLP mock receiver.
#                       Verifies examples produce well-formed batches without
#                       needing cloud credentials. CI-friendly.
#   make test         - run every example against real SparkLogs. Requires:
#                         SPARKLOGS_AGENT_ID
#                         SPARKLOGS_AGENT_ACCESS_TOKEN
#                       and one of:
#                         SPARKLOGS_INGEST_BASE_URI  (e.g. https://ingest-us.engine.sparklogs.app/
#                                                    or http://localhost:8080/ for QA / dev-cloud)
#                         SPARKLOGS_REGION           (product region code, e.g. us|eu|...)
#                       Each example logs a known marker payload; QA can
#                       confirm ingestion via the SparkLogs query API.
#   make test-<lang>  - same as `make test` but scoped to one language.
#   make clean        - remove build outputs across all examples.

# Shared validation + env-var construction lives in mk/sparklogs-otel.mk and
# is included by every per-example Makefile. Including it here too lets the
# top-level `check-credentials` reuse the same validation rules.
include mk/sparklogs-otel.mk

LANGUAGES := nodejs python java dotnet go ruby php rust

# ---------------------------------------------------------------------------
# Aggregate targets
# ---------------------------------------------------------------------------

.PHONY: build
build:
	@$(call VISUAL_SUITE_BEGIN,build · all languages); \
	for lang in $(LANGUAGES); do \
	  if [ -f $$lang/Makefile ]; then \
	    $(MAKE) --no-print-directory -C $$lang build || exit 1; \
	  else \
	    echo "[skip] $$lang (no Makefile)"; \
	  fi; \
	done; \
	$(call VISUAL_SUITE_END,build)

.PHONY: mock-test
mock-test:
	@$(call VISUAL_SUITE_BEGIN,mock-test · OTLP mock · all languages); \
	$(MAKE) mock-start; \
	trap '$(MAKE) -s mock-stop' EXIT; \
	for lang in $(LANGUAGES); do \
	  if [ -f $$lang/Makefile ]; then \
	    $(MAKE) --no-print-directory -C $$lang mock-test || exit 1; \
	  else \
	    echo "[skip] $$lang (no Makefile)"; \
	  fi; \
	done; \
	$(call VISUAL_SUITE_END,mock-test)

.PHONY: test
test: check-credentials
	@$(call VISUAL_SUITE_BEGIN,test · SparkLogs cloud · all languages); \
	for lang in $(LANGUAGES); do \
	  if [ -f $$lang/Makefile ]; then \
	    $(MAKE) --no-print-directory -C $$lang test || exit 1; \
	  else \
	    echo "[skip] $$lang (no Makefile)"; \
	  fi; \
	done; \
	$(call VISUAL_SUITE_END,test)

.PHONY: clean
clean:
	@$(call VISUAL_SUITE_BEGIN,clean · all languages); \
	for lang in $(LANGUAGES); do \
	  if [ -f $$lang/Makefile ]; then \
	    $(MAKE) --no-print-directory -C $$lang clean || true; \
	  fi; \
	done; \
	$(call VISUAL_SUITE_END,clean)

# ---------------------------------------------------------------------------
# Per-language pass-through targets — each language's Makefile must define
# `build`, `mock-test`, `test`, and `clean`.
# ---------------------------------------------------------------------------

define LANG_TEMPLATE
.PHONY: build-$(1) mock-test-$(1) test-$(1) clean-$(1)
build-$(1):
	@if [ -f $(1)/Makefile ]; then $$(MAKE) -C $(1) build; else echo "[skip] $(1) (no Makefile)"; fi
mock-test-$(1):
	@if [ -f $(1)/Makefile ]; then $$(MAKE) -C $(1) mock-test; else echo "[skip] $(1) (no Makefile)"; fi
test-$(1):
	@if [ -f $(1)/Makefile ]; then $$(MAKE) -C $(1) test; else echo "[skip] $(1) (no Makefile)"; fi
clean-$(1):
	@if [ -f $(1)/Makefile ]; then $$(MAKE) -C $(1) clean; else true; fi
endef
$(foreach lang,$(LANGUAGES),$(eval $(call LANG_TEMPLATE,$(lang))))

# ---------------------------------------------------------------------------
# Mock OTLP receiver lifecycle
# ---------------------------------------------------------------------------

.PHONY: mock-start mock-stop
mock-start:
	@./localenv/otel-mock/start.sh -d
	@sleep 2
mock-stop:
	@./localenv/otel-mock/stop.sh

# ---------------------------------------------------------------------------
# Credential check for `make test` — delegates to the shared validation in
# mk/sparklogs-otel.mk so this stays consistent with each per-example
# Makefile. Accepts either SPARKLOGS_INGEST_BASE_URI or SPARKLOGS_REGION.
# ---------------------------------------------------------------------------

.PHONY: check-credentials
check-credentials: _check_cloud_credentials
