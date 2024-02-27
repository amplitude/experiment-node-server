import {
  LocalEvaluationClient,
  RemoteEvaluationClient,
} from '@amplitude/experiment-node-server';

let ExperimentServer;
if (typeof window === 'undefined') {
  console.debug('Initializing Server Experiment');
  const SERVER_DEPLOYMENT_KEY = 'server-qz35UwzJ5akieoAdIgzM4m9MIiOLXLoz';
  const LOCAL_EVALUATION = true;
  if (LOCAL_EVALUATION) {
    // Initialize local experiment if it's not already initialized
    ExperimentServer = new LocalEvaluationClient(SERVER_DEPLOYMENT_KEY, {
      debug: true,
    });
  } else {
    // Initialize remote experiment if it's not already initialized
    ExperimentServer = new RemoteEvaluationClient(SERVER_DEPLOYMENT_KEY, {
      debug: true,
    });
  }
}

export { ExperimentServer };
