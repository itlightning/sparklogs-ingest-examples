# Aggregator Makefile for Java OTel examples.

include ../mk/visual-banner.mk

MVN := $(shell command -v mvn 2>/dev/null)

ifeq ($(strip $(MVN)),)

.PHONY: build mock-test test clean
build mock-test test clean:
	@$(call VISUAL_TOOLCHAIN_SKIP,Java,Apache Maven (mvn) not found in PATH — install Maven to build/run Java examples.)
	@true

else

EXAMPLES := sparklogs-otel-logback sparklogs-otel-log4j2

.PHONY: build mock-test test clean
build: $(addprefix build-,$(EXAMPLES))

mock-test:
	@$(call VISUAL_LANGUAGE_BEGIN,☕,Java); \
	for ex in $(EXAMPLES); do \
	  $(MAKE) --no-print-directory -C $$ex mock-test || exit 1; \
	  $(call VISUAL_INTER_EXAMPLE_GAP); \
	done; \
	$(call VISUAL_LANGUAGE_END,Java)

test:
	@$(call VISUAL_LANGUAGE_BEGIN,☕,Java); \
	for ex in $(EXAMPLES); do \
	  $(MAKE) --no-print-directory -C $$ex test || exit 1; \
	  $(call VISUAL_INTER_EXAMPLE_GAP); \
	done; \
	$(call VISUAL_LANGUAGE_END,Java)

clean: $(addprefix clean-,$(EXAMPLES))

define EX_TEMPLATE
.PHONY: build-$(1) clean-$(1)
build-$(1):     ; @$$(MAKE) -C $(1) build
clean-$(1):     ; @$$(MAKE) -C $(1) clean
endef
$(foreach ex,$(EXAMPLES),$(eval $(call EX_TEMPLATE,$(ex))))

endif
