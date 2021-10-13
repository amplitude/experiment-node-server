let ExperimentLocal;
if (typeof window === 'undefined') {
  console.debug('Initializing Server Experiment');
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const experiment = require('@amplitude/experiment-node-server');
  ExperimentLocal = experiment.Experiment.initializeLocal(
    'server-cIhZGyYxKwre1fCbvHbk7kBAcBUXs85w',
    {
      debug: true,
    },
  );
}

export { ExperimentLocal as ExperimentServer };
