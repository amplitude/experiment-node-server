let ExperimentServer;
if (typeof window === 'undefined') {
  console.debug('Initializing Server Experiment');
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  ExperimentServer = require('@amplitude/experiment-node-server').Experiment.initialize(
    'client-IAxMYws9vVQESrrK88aTcToyqMxiiJoR',
    { debug: true },
  );
}

export { ExperimentServer };
