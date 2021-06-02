import { ExperimentClient } from './client';
import { ExperimentConfig } from './config';

const instances = {};
const defaultInstance = '$default_instance';

/**
 * Initializes a singleton {@link ExperimentClient}.
 *
 * @param apiKey The environment API Key
 * @param config See {@link ExperimentConfig} for config options
 */
const initialize = (
  apiKey: string,
  config?: ExperimentConfig,
): ExperimentClient => {
  if (!instances[defaultInstance]) {
    instances[defaultInstance] = new ExperimentClient(apiKey, config);
  }
  return instances[defaultInstance];
};

/**
 *
 * Provides factory methods for storing singleton instances of {@link ExperimentClient}
 * @category Core Usage
 */
export const Experiment = {
  initialize,
};
