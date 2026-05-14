include ../../mk/sparklogs-otel.mk

EXAMPLE_NAME := php/monolog
MARKER       := sparklogs-otel-monolog-$(shell date +%s)
COMPOSER     ?= composer

.PHONY: build run mock-test test clean

build:
	@if ! command -v $(COMPOSER) >/dev/null 2>&1; then echo "ERROR: install Composer (https://getcomposer.org/) to build this example."; exit 1; fi
	$(COMPOSER) install --no-interaction --prefer-dist --no-progress

run: build
	php main.php

mock-test: build
	@$(call VISUAL_EXAMPLE_RUN_BEGIN,$(EXAMPLE_NAME),mock-test); \
	$(SPARKLOGS_AUTO_MOCK_LIFECYCLE); \
	  SPARKLOGS_MARKER="$(MARKER)" $(SPARKLOGS_MOCK_ENV) php main.php && \
	  $(SPARKLOGS_ASSERT_MARKER) && \
	$(call VISUAL_EXAMPLE_RUN_END,$(EXAMPLE_NAME))

test: _check_cloud_credentials build
	@$(call VISUAL_EXAMPLE_RUN_BEGIN,$(EXAMPLE_NAME),test · cloud); \
	$(SPARKLOGS_RESOLVE_BASE_URI); \
	  SPARKLOGS_MARKER="$(MARKER)" $(SPARKLOGS_CLOUD_ENV) php main.php && \
	echo "[$(EXAMPLE_NAME)] sent batch with marker $(MARKER) — verify in SparkLogs UI." && \
	$(call VISUAL_EXAMPLE_RUN_END,$(EXAMPLE_NAME))

clean:
	rm -rf vendor
