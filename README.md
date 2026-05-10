# SparkLogs Ingest Examples

[SparkLogs](https://sparklogs.com/) is a cloud-first log management platform that is limitless (petabyte-scale), easy (schemaless + auto-extract), affordable (ingest everything), and a joy to use (cross-platform modern UX).

This repository provides runnable examples showing how to ship logs to SparkLogs from applications in different languages, using both the **OpenTelemetry SDK over OTLP/HTTP** (recommended) and language-specific transports.

## Examples

### OpenTelemetry SDK (recommended)

Each language pairs the OTel SDK with the popular logging library used in that ecosystem. See the matching [SparkLogs documentation page](https://sparklogs.com/docs/ingest/data-sources/languages/opentelemetry-sdks) for the conceptual walkthrough.

| Language | Logging library | Status | Path |
| --- | --- | --- | --- |
| Python | stdlib `logging` | ✅ Runnable | [`python/sparklogs-otel-stdlib-logging`](python/sparklogs-otel-stdlib-logging/README.md) |
| Python | structlog | 🟡 Coming soon | `python/sparklogs-otel-structlog` |
| Node.js | OTLP/HTTP (manual) | ✅ Runnable | [`nodejs/sparklogs-otel-example`](nodejs/sparklogs-otel-example/README.md) |
| Node.js | Pino | 🟡 Coming soon | `nodejs/sparklogs-otel-pino-example` |
| Node.js | Winston | 🟡 Coming soon | `nodejs/sparklogs-otel-winston-example` |
| Node.js | Bunyan | 🟡 Coming soon | `nodejs/sparklogs-otel-bunyan-example` |
| Java | Logback | 🟡 Coming soon | `java/sparklogs-otel-logback` |
| Java | Log4j2 | 🟡 Coming soon | `java/sparklogs-otel-log4j2` |
| .NET | Microsoft.Extensions.Logging | 🟡 Coming soon | `dotnet/sparklogs-otel-mel` |
| .NET | Serilog | 🟡 Coming soon | `dotnet/sparklogs-otel-serilog` |
| Go | slog | 🟡 Coming soon | `go/sparklogs-otel-slog` |
| Go | zap | 🟡 Coming soon | `go/sparklogs-otel-zap` |
| Ruby | stdlib Logger (beta SDK) | 🟡 Coming soon | `ruby/sparklogs-otel-logger` |
| PHP | Monolog | 🟡 Coming soon | `php/sparklogs-otel-monolog` |
| Rust | tracing | 🟡 Coming soon | `rust/sparklogs-otel-tracing` |

### Language-specific transports (legacy / alternative)

| Language | Transport | Path |
| --- | --- | --- |
| Node.js | Winston via Elasticsearch bulk | [`nodejs/sparklogs-winston-example`](nodejs/sparklogs-winston-example/README.md) |
| Node.js | Bunyan via Elasticsearch bulk | [`nodejs/sparklogs-bunyan-example`](nodejs/sparklogs-bunyan-example/README.md) |

## QA / orchestration

The repo's top-level `Makefile` runs every example in batch:

```bash
# Compile / install deps for every example:
make build

# Run every example against the local OTLP mock receiver and verify the
# emitted batch was received (no cloud credentials needed):
make mock-test

# Run every example against real SparkLogs and emit a marker payload that QA
# can confirm via the SparkLogs query API:
export SPARKLOGS_REGION=us                       # or eu — picks the public ingest endpoint
export SPARKLOGS_AGENT_ID=<your-agent-id>
export SPARKLOGS_AGENT_ACCESS_TOKEN=<your-agent-token>
make test

# Or scope to one language:
make test-python
```

To target a non-public SparkLogs instance (QA pointing at a locally-running cluster, a dev-cloud deployment, or a private deployment), set `SPARKLOGS_INGEST_BASE_URI` instead of `SPARKLOGS_REGION`. The URI is taken as-is — provide whatever scheme and host you need:

```bash
export SPARKLOGS_INGEST_BASE_URI=http://localhost:8080/    # local QA instance
# or
export SPARKLOGS_INGEST_BASE_URI=https://ingest.dev-cloud.sparklogs.example/
export SPARKLOGS_AGENT_ID=...
export SPARKLOGS_AGENT_ACCESS_TOKEN=...
make test
```

If both `SPARKLOGS_INGEST_BASE_URI` and `SPARKLOGS_REGION` are set, the URI wins (the override semantics QA uses). A missing trailing slash is added automatically before joining `/v1/logs`.

The mock OTLP receiver lives in [`localenv/otel-mock`](localenv/otel-mock/README.md) — a tiny [OpenTelemetry Collector](https://opentelemetry.io/docs/collector/) that captures OTLP/HTTP payloads locally. Useful for CI verification and for users debugging their own setup ("can I get OTLP working at all?") without involving SparkLogs credentials.

Shared per-language env-var construction, credential checks, and URI resolution live in [`mk/sparklogs-otel.mk`](mk/sparklogs-otel.mk), included by each example's Makefile — so adding a new example is mostly "create a directory and a small Makefile."

## Example log line conventions

Every example in this repo prefixes its emitted log lines with `SparkLogsExample:` so SparkLogs' [AutoExtract](https://sparklogs.com/docs/ingest/autoextract/overview) automatically tags the events with `category=SparkLogsExample`. This makes it trivial to isolate (or filter out) example traffic in the SparkLogs UI — `category: SparkLogsExample*` in LQL catches every event from every language/library variant in this repo.

Where it makes sense, examples nest a sub-category — `SparkLogsExample: Storage:` produces `category=SparkLogsExample.Storage` — and embed AutoExtract demo features inline (key=value pairs, [bracketed values](https://sparklogs.com/docs/ingest/autoextract/special-value-extraction), IP addresses with [GeoIP lookup](https://sparklogs.com/docs/ingest/autoextract/special-value-extraction#ip-addresses-and-geoip), embedded JSON values). The intent isn't to demonstrate AutoExtract exhaustively — it's to keep the messages plausible-looking while still exercising real features a curious reader can poke at in the UI. Each example's README lists exactly which features its messages exercise.

If you're authoring a new example, follow the convention: prefix every log line with `SparkLogsExample:` and pick body content that demonstrates one or two AutoExtract features naturally. See [AutoExtract conventions](https://sparklogs.com/docs/ingest/autoextract/example-and-key-conventions) for the full list.

## Contributing

We welcome contributions. If you have an example you'd like to add please fork the repository and submit a pull request. The Python example at `python/sparklogs-otel-stdlib-logging` is the reference layout (Makefile, `mock-test` / `test` targets, marker-based verification, `README.md` linking to the corresponding doc page).

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE).
