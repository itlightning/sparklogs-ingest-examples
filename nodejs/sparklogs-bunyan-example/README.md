# Logging setup with Node.js Bunyan and SparkLogs (Elasticsearch bulk)

A runnable Node.js example that ships [Bunyan](https://github.com/trentm/node-bunyan) logs to [SparkLogs](https://sparklogs.com/) via the Elasticsearch-compatible bulk API, using the [`bunyan-elasticsearch-bulk`](https://github.com/Milad/bunyan-elasticsearch-bulk) transport.

> **OpenTelemetry / OTLP is the recommended path.** See the [OpenTelemetry SDKs guide](https://sparklogs.com/docs/ingest/data-sources/languages/opentelemetry-sdks), the [Node.js ingestion guide](https://sparklogs.com/docs/ingest/data-sources/languages/nodejs), and the runnable [`nodejs/sparklogs-otel-bunyan-example`](../sparklogs-otel-bunyan-example/) project in this repo.

## What this example shows

- Configuring `bunyan-elasticsearch-bulk` to send to SparkLogs.
- Sensible defaults for batching and retries, and mapping Bunyan's numeric levels to standard textual severity levels.
- Manual flush on shutdown so logs aren't lost when the process exits.

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
