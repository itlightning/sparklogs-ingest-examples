import bunyan from 'bunyan';
import createESStream from 'bunyan-elasticsearch-bulk';
import { performStressTest } from '../sparklogs-js-common/stress.js';

// ========================== SETUP TRANSPORT AND LOGGER ==========================

// The Bunyan stream that will ship logs to the SparkLogs cloud
const cloudLoggingStream = createESStream({
  indexPattern: '[app-logs-]YYYY[-]MM[-]DD', // index name for these logs (could be anything you want)
  interval: 2000, // how often to flush pending logs in milliseconds
  limit: 4000,
  // -- Elasticsearch client options
  // Customize the region from us to eu if needed
  node: 'https://es8.ingest-us.engine.sparklogs.app/',
  auth: {
    //bearer: "<AGENT-ID>:<AGENT-PASSWORD>",
    bearer: process.env.CLOUD_LOGGING_AUTH_TOKEN,
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

const logger = bunyan.createLogger({
  name: "sparklogs-bunyan-example",
  serializers: bunyan.stdSerializers,
  streams: [
    {
      level: 'info',
      stream: cloudLoggingStream,
    },
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

// ========================== EXAMPLE USAGE ==========================

// Log messages at different levels
logger.info('Hello, Bunyan shipping logs to SparkLogs!');
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
// IMPORTANT: call this before you exit your process
forceFlushAndCloseCloudLogs();
