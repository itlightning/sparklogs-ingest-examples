include ../../mk/sparklogs-otel.mk

EXAMPLE_NAME := nodejs/manual
MARKER       := sparklogs-otel-example-$(shell date +%s)

.PHONY: build run mock-test test clean

build:
	npm install --no-package-lock --no-fund --no-audit

run: build
	node app.cjs

mock-test: build
	@$(call VISUAL_EXAMPLE_RUN_BEGIN,$(EXAMPLE_NAME),mock-test); \
	$(SPARKLOGS_AUTO_MOCK_LIFECYCLE); \
	  SPARKLOGS_MARKER="$(MARKER)" $(SPARKLOGS_MOCK_ENV) node app.cjs && \
	  $(SPARKLOGS_ASSERT_MARKER) && \
	$(call VISUAL_EXAMPLE_RUN_END,$(EXAMPLE_NAME))

test: _check_cloud_credentials build
	@$(call VISUAL_EXAMPLE_RUN_BEGIN,$(EXAMPLE_NAME),test · cloud); \
	$(SPARKLOGS_RESOLVE_BASE_URI); \
	  SPARKLOGS_MARKER="$(MARKER)" $(SPARKLOGS_CLOUD_ENV) node app.cjs && \
	echo "[$(EXAMPLE_NAME)] sent batch with marker $(MARKER) — verify in SparkLogs UI." && \
	$(call VISUAL_EXAMPLE_RUN_END,$(EXAMPLE_NAME))

clean:
	rm -rf node_modules package-lock.json
