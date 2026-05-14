# Aggregator Makefile for Node.js OTel examples.

include ../mk/visual-banner.mk

EXAMPLES := sparklogs-otel-example sparklogs-otel-pino-example sparklogs-otel-winston-example sparklogs-otel-bunyan-example

.PHONY: build mock-test test clean
build: $(addprefix build-,$(EXAMPLES))

mock-test:
	@$(call VISUAL_LANGUAGE_BEGIN,🟢,Node.js); \
	for ex in $(EXAMPLES); do \
	  $(MAKE) --no-print-directory -C $$ex mock-test || exit 1; \
	  $(call VISUAL_INTER_EXAMPLE_GAP); \
	done; \
	$(call VISUAL_LANGUAGE_END,Node.js)

test:
	@$(call VISUAL_LANGUAGE_BEGIN,🟢,Node.js); \
	for ex in $(EXAMPLES); do \
	  $(MAKE) --no-print-directory -C $$ex test || exit 1; \
	  $(call VISUAL_INTER_EXAMPLE_GAP); \
	done; \
	$(call VISUAL_LANGUAGE_END,Node.js)

clean: $(addprefix clean-,$(EXAMPLES))

define EX_TEMPLATE
.PHONY: build-$(1) clean-$(1)
build-$(1):     ; @$$(MAKE) -C $(1) build
clean-$(1):     ; @$$(MAKE) -C $(1) clean
endef
$(foreach ex,$(EXAMPLES),$(eval $(call EX_TEMPLATE,$(ex))))
