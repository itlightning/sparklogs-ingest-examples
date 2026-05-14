# Aggregator Makefile for Ruby OTel examples.

include ../mk/visual-banner.mk

BUNDLE := $(shell command -v bundle 2>/dev/null)

ifeq ($(strip $(BUNDLE)),)

.PHONY: build mock-test test clean
build mock-test test clean:
	@$(call VISUAL_TOOLCHAIN_SKIP,Ruby,bundle (Bundler) not found in PATH — install Ruby + Bundler to build/run Ruby examples.)
	@true

else

EXAMPLES := sparklogs-otel-logger

.PHONY: build mock-test test clean
build: $(addprefix build-,$(EXAMPLES))

mock-test:
	@$(call VISUAL_LANGUAGE_BEGIN,💎,Ruby); \
	for ex in $(EXAMPLES); do \
	  $(MAKE) --no-print-directory -C $$ex mock-test || exit 1; \
	  $(call VISUAL_INTER_EXAMPLE_GAP); \
	done; \
	$(call VISUAL_LANGUAGE_END,Ruby)

test:
	@$(call VISUAL_LANGUAGE_BEGIN,💎,Ruby); \
	for ex in $(EXAMPLES); do \
	  $(MAKE) --no-print-directory -C $$ex test || exit 1; \
	  $(call VISUAL_INTER_EXAMPLE_GAP); \
	done; \
	$(call VISUAL_LANGUAGE_END,Ruby)

clean: $(addprefix clean-,$(EXAMPLES))

define EX_TEMPLATE
.PHONY: build-$(1) clean-$(1)
build-$(1):     ; @$$(MAKE) -C $(1) build
clean-$(1):     ; @$$(MAKE) -C $(1) clean
endef
$(foreach ex,$(EXAMPLES),$(eval $(call EX_TEMPLATE,$(ex))))

endif
