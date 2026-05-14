# Aggregator Makefile for Rust OTel examples.

include ../mk/visual-banner.mk

CARGO := $(shell command -v cargo 2>/dev/null)

ifeq ($(strip $(CARGO)),)

.PHONY: build mock-test test clean
build mock-test test clean:
	@$(call VISUAL_TOOLCHAIN_SKIP,Rust,cargo not found in PATH — install Rust (rustup) to build/run Rust examples.)
	@true

else

EXAMPLES := sparklogs-otel-tracing

.PHONY: build mock-test test clean
build: $(addprefix build-,$(EXAMPLES))

mock-test:
	@$(call VISUAL_LANGUAGE_BEGIN,🦀,Rust); \
	for ex in $(EXAMPLES); do \
	  $(MAKE) --no-print-directory -C $$ex mock-test || exit 1; \
	  $(call VISUAL_INTER_EXAMPLE_GAP); \
	done; \
	$(call VISUAL_LANGUAGE_END,Rust)

test:
	@$(call VISUAL_LANGUAGE_BEGIN,🦀,Rust); \
	for ex in $(EXAMPLES); do \
	  $(MAKE) --no-print-directory -C $$ex test || exit 1; \
	  $(call VISUAL_INTER_EXAMPLE_GAP); \
	done; \
	$(call VISUAL_LANGUAGE_END,Rust)

clean: $(addprefix clean-,$(EXAMPLES))

define EX_TEMPLATE
.PHONY: build-$(1) clean-$(1)
build-$(1):     ; @$$(MAKE) -C $(1) build
clean-$(1):     ; @$$(MAKE) -C $(1) clean
endef
$(foreach ex,$(EXAMPLES),$(eval $(call EX_TEMPLATE,$(ex))))

endif
