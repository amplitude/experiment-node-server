let ExperimentLocal;
if (typeof window === 'undefined') {
  console.debug('Initializing Server Experiment');
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  ExperimentLocal = require('@amplitude/experiment-node-server').Experiment.initializeLocal(
    'server-cIhZGyYxKwre1fCbvHbk7kBAcBUXs85w',
    {
      debug: true,
      flagConfigPollingIntervalMillis: 5000,
    },
  );
  ExperimentLocal.start();
}

export { ExperimentLocal as ExperimentServer };
