include ../../mk/sparklogs-otel.mk

EXAMPLE_NAME := ruby/logger
MARKER       := sparklogs-otel-logger-$(shell date +%s)

.PHONY: build run mock-test test clean

build:
	@if ! command -v bundle >/dev/null 2>&1; then echo "ERROR: install Ruby + Bundler to build this example."; exit 1; fi
	bundle config set --local path 'vendor/bundle'
	bundle install --quiet

run: build
	bundle exec ruby main.rb

mock-test: build
	@$(call VISUAL_EXAMPLE_RUN_BEGIN,$(EXAMPLE_NAME),mock-test); \
	$(SPARKLOGS_AUTO_MOCK_LIFECYCLE); \
	  SPARKLOGS_MARKER="$(MARKER)" $(SPARKLOGS_MOCK_ENV) bundle exec ruby main.rb && \
	  $(SPARKLOGS_ASSERT_MARKER) && \
	$(call VISUAL_EXAMPLE_RUN_END,$(EXAMPLE_NAME))

test: _check_cloud_credentials build
	@$(call VISUAL_EXAMPLE_RUN_BEGIN,$(EXAMPLE_NAME),test · cloud); \
	$(SPARKLOGS_RESOLVE_BASE_URI); \
	  SPARKLOGS_MARKER="$(MARKER)" $(SPARKLOGS_CLOUD_ENV) bundle exec ruby main.rb && \
	echo "[$(EXAMPLE_NAME)] sent batch with marker $(MARKER) — verify in SparkLogs UI." && \
	$(call VISUAL_EXAMPLE_RUN_END,$(EXAMPLE_NAME))

clean:
	rm -rf vendor .bundle
