import { DefaultFlagConfigCache } from './cache/flags';
import { ExperimentClient } from './client';
import { ExperimentConfig, LocalEvaluationConfig } from './config';
import { LocalEvaluationClient } from './localEvaluation';

const instances = {};
const defaultInstance = '$default_instance';

const localEvaluationInstances = {};

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
 * (ALPHA, EXPERIMENTAL)
 *
 * Initialize a local evaluation client.
 *
 * A local evaluation client can evaluate local flags or experiments for a user
 * without requiring a remote call to the amplitude evaluation server. In order
 * to best leverage local evaluation, all flags and experiments being evaluated
 * server side should be configured as local.
 *
 * @param apiKey The environment API Key
 * @param config See {@link ExperimentConfig} for config options
 * @returns The local evaluation client.
 * @deprecated This feature is experimental and may change in the future.
 */
const initializeLocal = (
  apiKey: string,
  config?: LocalEvaluationConfig,
): LocalEvaluationClient => {
  if (!localEvaluationInstances[apiKey]) {
    localEvaluationInstances[apiKey] = new LocalEvaluationClient(
      apiKey,
      config,
      new DefaultFlagConfigCache(),
    );
  }
  return localEvaluationInstances[apiKey];
};

/**
 * Provides factory methods for storing singleton instances of
 * {@link ExperimentClient}.
 *
 * @category Core Usage
 */
export const Experiment = {
  initialize,
  initializeLocal,
};
