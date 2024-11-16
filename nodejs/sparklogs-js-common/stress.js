/**
 * Performs a stress test of the given logger by generating random log lines and stressing the CPU at the same time.
 *
 * @param {Object} logger - The logger object used to log messages.
 * @param {Object} options - The options for the stress test.
 * @param {number} options.numSeconds - The number of seconds to run the stress test.
 * @param {number} options.linesPerIteration - The number of log lines to generate per iteration.
 * @param {number} options.msPerIteration - The number of milliseconds to wait between iterations.
 * @param {number} options.slicesPerSecond - The number of CPU "slices" per second (the higher the number, the more often background tasks are allowed to run).
 * @param {number} options.cpuBusyPercentage - The percentage of time the CPU should be busy during each "slice."
 * @returns {Promise<void>} A promise that resolves when the stress test is complete.
 */
export async function performStressTest(logger, { numSeconds, linesPerIteration, msPerIteration, slicesPerSecond, cpuBusyPercentage }) {
  const randomWords = ["apple", "banana", "cherry", "dog", "elephant", "fish", "grape", "house", "igloo", "jungle"];

  async function doRandomLogging(iterationCounter) {
    for (var i = 0; i < linesPerIteration; i++, iterationCounter++) {
      logger.info(`Line ${iterationCounter + 1}: ${Array.from({ length: 15 }, () => randomWords[Math.floor(Math.random() * randomWords.length)]).join(' ')}`);
    }
    if (iterationCounter < linesPerIteration * (numSeconds / (msPerIteration / 1000.0))) {
      await new Promise(resolve => setTimeout(resolve, msPerIteration));
      await doRandomLogging(iterationCounter);
    }
  }

  async function stressCPU(totalMs, sliceCpuMs, sliceIdleMs) {
    if (totalMs <= 0) { return; }
    const startTime = Date.now();
    // Keep CPU busy without allowing IO queue to be processed
    while (Date.now() < (startTime + sliceCpuMs)) {
      Math.sqrt(Math.random() * Math.random());
    }
    await new Promise(resolve => setTimeout(resolve, sliceIdleMs));
    await stressCPU(totalMs - (sliceCpuMs + sliceIdleMs), sliceCpuMs, sliceIdleMs);
  }

  async function waitAndStress() {
    for (var i = 0; i < numSeconds; i++) {
      logger.warn(`=================================================== Background FUNCTION ================ clock=${i + 1} ==============================`)
      await stressCPU(1000, (1000.0 / slicesPerSecond) * (cpuBusyPercentage / 100.0), (1000.0 / slicesPerSecond) * (1 - (cpuBusyPercentage / 100.0)));
    }
  }

  logger.info(`==========-----------==========-----------==========----------- BEGIN STRESS TESTING`)
  var f = doRandomLogging(0);
  await waitAndStress();
  await f;
  logger.info(`==========-----------==========-----------==========----------- END STRESS TESTING`)
}
