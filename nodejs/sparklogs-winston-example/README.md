# Logging Setup with Node.Js Winston and SparkLogs

This example Node.js application uses the [Winston](https://github.com/winstonjs/winston) library to ship logs to [SparkLogs](https://sparklogs.com/).

## Overview

[Winston](https://github.com/winstonjs/winston) is a popular logging library for Node.js. It allows you to log messages to various transports (e.g., console, file, HTTP) with different levels of severity (e.g., info, error, debug).

It's easy to ship logs in Winston to SparkLogs by using the [`winston-elasticsearch`](https://github.com/vanthome/winston-elasticsearch) transport.

## Instructions

### 1. Install NPM packages

```bash
npm install winston winston-elasticsearch
```

### 2. Configure the Winston transport

In the file where you currently setup Winston, add code to configure the `cloudLoggingTransport` transport.
```javascript
import os from 'os';
import winston from 'winston';
import { ElasticsearchTransport } from 'winston-elasticsearch';

// Uses the microseconds part of the timestamp to ensure events are ordered properly for events logged on the same millisecond
let logicalTimeCounter = 0, logicalTimeLastMs = ""
function formatDateWithLogicalClock(dt) {
  let s = ((dt instanceof Date) ? dt.toISOString() : dt.toString()).substring(0, 23);
  let curMs = s.substring(20);
  logicalTimeCounter = (curMs == logicalTimeLastMs) ? ((logicalTimeCounter + 1) % 1000) : 0;
  logicalTimeLastMs = curMs;
  return s + logicalTimeCounter.toString().padStart(3, '0') + 'Z';
}

// The Winston transport that will ship logs to the SparkLogs cloud
const cloudLoggingTransport = new ElasticsearchTransport({
  level: 'info', // minimum severity of log lines to send via this transport
  indexPrefix: 'app-logs', // index name for these logs (could be anything you want)
  handleExceptions: true, // include exceptions in logged data
  flushInterval: 2000, // how often to flush pending logs in milliseconds
  buffering: true, // must be true for proper performance and to avoid blocking
  bufferLimit: 4000,
  retryLimit: 20,
  source: os.hostname(),
  clientOpts: {
    node: 'https://es8.ingest-<REGION>.engine.sparklogs.app/',
    auth: {
      bearer: "<AGENT-ID>:<AGENT-PASSWORD>",
      //bearer: process.env.CLOUD_LOGGING_AUTH_TOKEN, // get it from the env
    },
    headers: {"X-Timezone": Intl.DateTimeFormat().resolvedOptions().timeZone},
    maxRetries: 20,
    requestTimeout: 30000,
  },
  transformer: (e) => {
    const fieldTimestamp = 'timestamp', fieldSeverity = 'severity', fieldMessage = 'textpayload'
    delete e.meta[fieldTimestamp];
    delete e.meta[fieldSeverity];
    delete e.meta[fieldMessage]
    return {
      [fieldTimestamp]: formatDateWithLogicalClock(e.timestamp || (new Date())),
      [fieldSeverity]: e.level,
      [fieldMessage]: e.message,
      ...e.meta,
    };
  },
});
// Make sure to log errors attempting to ship logs to the cloud in some way for diagnostics
cloudLoggingTransport.on('error', (error) => {
  console.error('Error shipping logs to cloud', error);
});
```

> **💡Tip**: Replace `<REGION>` (`us` or `eu`), `<AGENT-ID>`, and `<AGENT-PASSWORD>` with appropriate values.

Then use the transport where you setup your winston logger, making sure to use at least the json and timestamp formats:
```javascript
const logger = winston.createLogger({
  level: 'info',
  // must use timestamp and json formats
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [
    cloudLoggingTransport,
    // and any other transports here as you desire, for example:
    new winston.transports.Console({level: 'warn'}),
  ],
});
logger.on('error', (error) => {
  console.error('Logger error', error);
});
```

### 3. Use Winston for logging as usual

For example:
```javascript
logger.info('Hello, Winston shipping logs to SparkLogs!');
logger.warn('This is a warning message');
logger.error('This is an error message');
logger.info('message with more fields', {"hello": "world", "f2": 42, "f3": "v3", "f4": "v4"});
```

## Running the Example

Edit app.js to customize the region from `us` to `eu` if needed.
```bash
$ export CLOUD_LOGGING_AUTH_TOKEN="<AGENT-ID>:<AGENT-PASSWORD>"
$ node app.js
```
