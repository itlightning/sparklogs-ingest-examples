# Aggregator Makefile for .NET OTel examples.

include ../mk/visual-banner.mk

DOTNET := $(shell command -v dotnet 2>/dev/null)

ifeq ($(strip $(DOTNET)),)

.PHONY: build mock-test test clean
build mock-test test clean:
	@$(call VISUAL_TOOLCHAIN_SKIP,.NET,dotnet SDK not found in PATH — install .NET SDK to build/run .NET examples.)
	@true

else

EXAMPLES := sparklogs-otel-mel sparklogs-otel-serilog sparklogs-otel-nlog

.PHONY: build mock-test test clean
build: $(addprefix build-,$(EXAMPLES))

mock-test:
	@$(call VISUAL_LANGUAGE_BEGIN,💠,.NET); \
	for ex in $(EXAMPLES); do \
	  $(MAKE) --no-print-directory -C $$ex mock-test || exit 1; \
	  $(call VISUAL_INTER_EXAMPLE_GAP); \
	done; \
	$(call VISUAL_LANGUAGE_END,.NET)

test:
	@$(call VISUAL_LANGUAGE_BEGIN,💠,.NET); \
	for ex in $(EXAMPLES); do \
	  $(MAKE) --no-print-directory -C $$ex test || exit 1; \
	  $(call VISUAL_INTER_EXAMPLE_GAP); \
	done; \
	$(call VISUAL_LANGUAGE_END,.NET)

clean: $(addprefix clean-,$(EXAMPLES))

define EX_TEMPLATE
.PHONY: build-$(1) clean-$(1)
build-$(1):     ; @$$(MAKE) -C $(1) build
clean-$(1):     ; @$$(MAKE) -C $(1) clean
endef
$(foreach ex,$(EXAMPLES),$(eval $(call EX_TEMPLATE,$(ex))))

endif
