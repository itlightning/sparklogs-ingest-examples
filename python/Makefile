# Aggregator Makefile for Python OTel examples.
# Each example subdirectory must define its own build / mock-test / test / clean targets.

EXAMPLES := sparklogs-otel-stdlib-logging

.PHONY: build mock-test test clean
build:     $(addprefix build-,$(EXAMPLES))
mock-test: $(addprefix mock-test-,$(EXAMPLES))
test:      $(addprefix test-,$(EXAMPLES))
clean:     $(addprefix clean-,$(EXAMPLES))

define EX_TEMPLATE
.PHONY: build-$(1) mock-test-$(1) test-$(1) clean-$(1)
build-$(1):     ; @$$(MAKE) -C $(1) build
mock-test-$(1): ; @$$(MAKE) -C $(1) mock-test
test-$(1):      ; @$$(MAKE) -C $(1) test
clean-$(1):     ; @$$(MAKE) -C $(1) clean
endef
$(foreach ex,$(EXAMPLES),$(eval $(call EX_TEMPLATE,$(ex))))
