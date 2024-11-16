import { Console } from 'console';
import os from 'os';
import winston from 'winston';
import { ElasticsearchTransport } from 'winston-elasticsearch';
import { performStressTest } from '../sparklogs-js-common/stress.js';

// ========================== SETUP TRANSPORT AND LOGGER ==========================

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
    // Customize the region from us to eu if needed
    node: 'https://es8.ingest-us.engine.sparklogs.app/',
    auth: {
      //bearer: "<AGENT-ID>:<AGENT-PASSWORD>",
      bearer: process.env.CLOUD_LOGGING_AUTH_TOKEN,
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

const logger = winston.createLogger({
  level: 'info',
  // must use timestamp and format
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [
    cloudLoggingTransport,
    // and any other transports here as you desire, for example:
    new winston.transports.Console({level: 'warn'}),
  ],
});
// Make sure to log errors attempting to ship logs to the cloud in some way for diagnostics
cloudLoggingTransport.on('error', (error) => {
  console.error('Error shipping logs to cloud', error);
});
logger.on('error', (error) => {
  console.error('Logger error', error);
})

// ========================== EXAMPLE USAGE ==========================

// Log messages at different levels
logger.info('Hello, Winston shipping logs to SparkLogs!');
logger.warn('This is a warning message');
logger.error('This is an error message');
logger.error('Test internal severity field');
logger.info('message with more fields', {"hello": "world", "f2": 42, "f3": "v3", "f4": "v4"});

// Simulate some application logic and logging
function runApp() {
  logger.info('Test application started');
  
  try {
    // Simulate an operation that could throw an error
    throw new Error('Oops, something went wrong!');
  } catch (error) {
    logger.error('Caught an error:', error);
  }

  logger.info('Test application finished');
}

// Start the application
runApp();

// ========================== STRESS TESTING ==========================

const stressTestParams = {
  numSeconds: 5,
  linesPerIteration: 100,
  msPerIteration: 100.0,
  slicesPerSecond: 100,
  cpuBusyPercentage: 90,
};
await performStressTest(logger, stressTestParams);

// ========================== APP SHUTDOWN ==========================

logger.info(`==========-----------==========-----------==========----------- WAITING FOR FINAL FLUSH`)
logger.close()
