# Logging Setup with Node.Js Winston and SparkLogs

A runnable Node.js example that ships [Winston](https://github.com/winstonjs/winston) logs to [SparkLogs](https://sparklogs.com/) via the Elasticsearch-compatible bulk API, using the [`winston-elasticsearch`](https://github.com/vanthome/winston-elasticsearch) transport.

> **OpenTelemetry / OTLP is the recommended path.** See the [OpenTelemetry SDKs guide](https://sparklogs.com/docs/ingest/data-sources/languages/opentelemetry-sdks), the [Node.js ingestion guide](https://sparklogs.com/docs/ingest/data-sources/languages/nodejs), and the runnable [`nodejs/sparklogs-otel-winston-example`](../sparklogs-otel-winston-example/) project in this repo.

## What this example shows

- Configuring `winston-elasticsearch` to send to SparkLogs.
- Sensible defaults for batching, retries, and a logical-clock timestamp helper that preserves event ordering within the same millisecond.

For setup details and full guidance, see the [Node.js ingestion guide](https://sparklogs.com/docs/ingest/data-sources/languages/nodejs). The implementation lives in [`app.js`](app.js).

## Running the example

This example uses the same SparkLogs env vars as the OTel Node.js examples in this repo:

```bash
# Public cloud — use a valid region code like us or eu or ...
$ export SPARKLOGS_REGION="us"
# ...or, for QA / dev-cloud / on-prem, set an explicit base URI instead:
# $ export SPARKLOGS_INGEST_BASE_URI="https://es8.ingest-us.engine.sparklogs.app/"

$ export SPARKLOGS_AGENT_ID="<AGENT-ID>"
$ export SPARKLOGS_AGENT_ACCESS_TOKEN="<AGENT-ACCESS-TOKEN>"

$ npm install
$ node app.js
```

View or create an agent in the SparkLogs app under **Configure → Agents**.
