# Logging Setup with Node.Js Winston and SparkLogs

This example Node.js application uses the [Bunyan](https://github.com/trentm/node-bunyan) library to ship logs to [SparkLogs](https://sparklogs.com/).

## Overview

[Bunyan](https://github.com/trentm/node-bunyan) is a popular logging library for Node.js. It allows you to log messages to various streams (e.g., console, file, HTTP) with different levels of severity (e.g., info, error, debug).

It's easy to ship logs in Bunyan to SparkLogs by using the [`bunyan-elasticsearch-bulk`](https://github.com/Milad/bunyan-elasticsearch-bulk) transport.

## Instructions

### 1. Install NPM packages

```bash
npm install bunyan bunyan-elasticsearch-bulk
```

### 2. Configure the Bunyan stream

In the file where you currently setup Bunyan, add code to configure the `cloudLoggingStream` stream.
```javascript
import bunyan from 'bunyan';
import createESStream from 'bunyan-elasticsearch-bulk';

// The Bunyan stream that will ship logs to the SparkLogs cloud
const cloudLoggingStream = createESStream({
  indexPattern: '[app-logs-]YYYY[-]MM[-]DD', // index name for these logs (could be anything you want)
  interval: 2000, // how often to flush pending logs in milliseconds
  limit: 4000,
  // -- Elasticsearch client options
  node: 'https://es8.ingest-<REGION>.engine.sparklogs.app/',
  auth: {
    bearer: "<AGENT-ID>:<AGENT-PASSWORD>",
    //bearer: process.env.CLOUD_LOGGING_AUTH_TOKEN, // get it from the env
  },
  headers: {
    "X-Timezone": Intl.DateTimeFormat().resolvedOptions().timeZone,
    // Map Bunyan numeric levels to standard textual severity levels
    "X-Severity-Map": "10=TRACE,20=DEBUG,30=INFO,40=WARN,50=ERROR,60=FATAL",
  },
  maxRetries: 20,
  requestTimeout: 30000,
});
// Call before you manually exit the process. Warning: this will actually return BEFORE all logs are shipped!
function forceFlushAndCloseCloudLogs() {
  cloudLoggingStream.flush();
  cloudLoggingStream.end();
}
// Make sure to log errors attempting to ship logs to the cloud in some way for diagnostics
cloudLoggingStream.on('error', (error) => {
  console.error('Error shipping logs to cloud', error);
});
```

> **💡Tip**: Replace `<REGION>` (`us` or `eu`), `<AGENT-ID>`, and `<AGENT-PASSWORD>` with appropriate values.

Then use `cloudLoggingStream` where you setup your bunyan logger:
```javascript
const logger = bunyan.createLogger({
  name: "my-app-name",
  serializers: bunyan.stdSerializers,
  streams: [
    {
      level: 'info',
      stream: cloudLoggingStream,
    },
    // other streams as you desire, for example:
    {
      level: 'info',
      stream: process.stdout,
    }
  ],
});
// You probably want to log uncaught exceptions to the cloud
process.on('uncaughtException', function (err) {
  logger.error("Uncaught Exception", err);
  forceFlushAndCloseCloudLogs();
  setTimeout(() => process.exit(1), 5000);
});
```

### 3. Use bunyan for logging as usual

For example:
```javascript
logger.info('Hello, Bunyan shipping logs to SparkLogs!');
logger.warn('This is a warning message');
logger.error('This is an error message');
logger.error('Test internal severity field');
```

### 4. Be sure to manually flush logs before exiting the process

Before you exit you must manually flush logs or the event loop will not exit:
```javascript
forceFlushAndCloseCloudLogs();
```

## Running the Example

Edit app.js to customize the region from `us` to `eu` if needed.
```bash
$ export CLOUD_LOGGING_AUTH_TOKEN="<AGENT-ID>:<AGENT-PASSWORD>"
$ node app.js
```
