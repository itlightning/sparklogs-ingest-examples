# Makefile for the stdlib-logging Python OTel example.
#
# Targets:
#   make build      - create venv and install dependencies.
#   make run        - execute main.py against whatever OTEL_* env vars are set.
#   make mock-test  - run against the local OTLP mock receiver, then verify the
#                     marker appears in the mock receiver's capture.
#   make test       - run against real SparkLogs cloud (or whatever URL
#                     SPARKLOGS_INGEST_BASE_URI points at). Requires:
#                       SPARKLOGS_AGENT_ID, SPARKLOGS_AGENT_ACCESS_TOKEN
#                       and one of SPARKLOGS_INGEST_BASE_URI or SPARKLOGS_REGION
#   make clean      - remove the venv.
#
# All shared OTel / SparkLogs env-var construction lives in
# ../../mk/sparklogs-otel.mk.

include ../../mk/sparklogs-otel.mk

EXAMPLE_NAME := python/stdlib-logging
MARKER       := sparklogs-otel-stdlib-logging-$(shell date +%s)

VENV   := .venv
PYTHON := python3
PIP    := $(VENV)/bin/pip
PY     := $(VENV)/bin/python

.PHONY: build run mock-test test clean

build: $(VENV)/.installed

$(VENV)/.installed: requirements.txt
	$(PYTHON) -m venv $(VENV)
	$(PIP) install --upgrade pip
	$(PIP) install -r requirements.txt
	touch $(VENV)/.installed

run: build
	$(PY) main.py

mock-test: _check_mock_running build
	@SPARKLOGS_MARKER="$(MARKER)" $(SPARKLOGS_MOCK_ENV) $(PY) main.py
	@$(SPARKLOGS_ASSERT_MARKER)

test: _check_cloud_credentials build
	@$(SPARKLOGS_RESOLVE_BASE_URI); \
	  SPARKLOGS_MARKER="$(MARKER)" $(SPARKLOGS_CLOUD_ENV) $(PY) main.py
	@echo "[$(EXAMPLE_NAME)] sent batch with marker $(MARKER) — verify in SparkLogs UI."

clean:
	rm -rf $(VENV) __pycache__
