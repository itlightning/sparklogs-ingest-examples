# Aggregator Makefile for PHP OTel examples.

include ../mk/visual-banner.mk

COMPOSER := $(shell command -v composer 2>/dev/null)

ifeq ($(strip $(COMPOSER)),)

.PHONY: build mock-test test clean
build mock-test test clean:
	@$(call VISUAL_TOOLCHAIN_SKIP,PHP,composer not found in PATH — install Composer to build/run PHP examples.)
	@true

else

EXAMPLES := sparklogs-otel-monolog

.PHONY: build mock-test test clean
build: $(addprefix build-,$(EXAMPLES))

mock-test:
	@$(call VISUAL_LANGUAGE_BEGIN,🐘,PHP); \
	for ex in $(EXAMPLES); do \
	  $(MAKE) --no-print-directory -C $$ex mock-test || exit 1; \
	  $(call VISUAL_INTER_EXAMPLE_GAP); \
	done; \
	$(call VISUAL_LANGUAGE_END,PHP)

test:
	@$(call VISUAL_LANGUAGE_BEGIN,🐘,PHP); \
	for ex in $(EXAMPLES); do \
	  $(MAKE) --no-print-directory -C $$ex test || exit 1; \
	  $(call VISUAL_INTER_EXAMPLE_GAP); \
	done; \
	$(call VISUAL_LANGUAGE_END,PHP)

clean: $(addprefix clean-,$(EXAMPLES))

define EX_TEMPLATE
.PHONY: build-$(1) clean-$(1)
build-$(1):     ; @$$(MAKE) -C $(1) build
clean-$(1):     ; @$$(MAKE) -C $(1) clean
endef
$(foreach ex,$(EXAMPLES),$(eval $(call EX_TEMPLATE,$(ex))))

endif
