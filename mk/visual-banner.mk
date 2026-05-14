# Visual separators for Makefile-driven example runs (stdout only).
# Include from repo root or language aggregators:   include ../mk/visual-banner.mk
# Included automatically with ../../mk/sparklogs-otel.mk for leaf examples.
#
# Use with $(call VISUAL_NAME,arg1,arg2) as the first token of a recipe line, e.g.:
#   @$(call VISUAL_EXAMPLE_RUN_BEGIN,$(EXAMPLE_NAME),mock-test); \
#
# Borders are ASCII (+ - |) so 80-column terminals do not split UTF-8 box chars.

# --- Suite (repo root: build / mock-test / test) ----------------------------

define VISUAL_SUITE_BEGIN
printf '\n\n\n'; \
printf '%s\n' "================================================================================"; \
printf '%s\n' "  🧪  SPARKLOGS INGEST EXAMPLES"; \
printf '%s\n' "      $(strip $(1))"; \
printf '%s\n' "================================================================================"; \
printf '\n\n'
endef

define VISUAL_SUITE_END
printf '\n\n'; \
printf '%s\n' "--------------------------------------------------------------------------------"; \
printf '%s\n' "  ✅  suite finished: $(strip $(1))"; \
printf '%s\n' "--------------------------------------------------------------------------------"; \
printf '\n\n\n'
endef

# --- Language aggregator (nodejs / go / …) ----------------------------------

define VISUAL_LANGUAGE_BEGIN
printf '\n\n'; \
printf '%s\n' "+------------------------------------------------------------------------------+"; \
printf '%s\n' "|  $(strip $(1))   $(strip $(2))"; \
printf '%s\n' "|     ⤷  language batch — blocks below are individual example projects"; \
printf '%s\n' "+------------------------------------------------------------------------------+"; \
printf '\n\n'
endef

define VISUAL_LANGUAGE_END
printf '\n'; \
printf '%s\n' "  ···  end of $(strip $(1)) language batch  ···"; \
printf '\n\n\n'
endef

# --- Optional gap between two example runs (aggregator for-loop) ------------

define VISUAL_INTER_EXAMPLE_GAP
printf '\n'; \
printf '%s\n' "  ------------------------------------------------------------------------------"; \
printf '\n\n'
endef

# --- Whole language skipped (no toolchain) ----------------------------------
# Same outer frame as VISUAL_LANGUAGE_BEGIN so skipped languages read like a
# language batch block in the log.

define VISUAL_TOOLCHAIN_SKIP
printf '\n\n'; \
printf '%s\n' "+------------------------------------------------------------------------------+"; \
printf '%s\n' "|  ⏭️   SKIP   $(strip $(1))"; \
printf '%s\n' "|     $(strip $(2))"; \
printf '%s\n' "+------------------------------------------------------------------------------+"; \
printf '\n\n'
endef

# --- Single example (leaf Makefile: mock-test / test) -----------------------

define VISUAL_EXAMPLE_RUN_BEGIN
printf '\n'; \
printf '%s\n' "  +--------------------------------------------------------------------------+"; \
printf '%s\n' "  |  🔸  $(strip $(2))  |  $(strip $(1))"; \
printf '%s\n' "  +--------------------------------------------------------------------------+"; \
printf '\n'
endef

define VISUAL_EXAMPLE_RUN_END
printf '\n%s\n\n' "     🔹  done: $(strip $(1))  —  run completed successfully"
endef
