import { InMemoryFlagConfigCache } from './local/cache';
import { LocalEvaluationClient } from './local/client';
import { ExperimentClient, RemoteEvaluationClient } from './remote/client';
import {
  ExperimentConfig,
  RemoteEvaluationConfig,
  LocalEvaluationConfig,
} from './types/config';

const remoteEvaluationInstances = {};
const localEvaluationInstances = {};

/**
 * Initializes a singleton {@link ExperimentClient} for remote evaluation.
 *
 * @param apiKey The environment API Key
 * @param config See {@link ExperimentConfig} for config options
 * @deprecated use initializeRemote
 */
const initialize = (
  apiKey: string,
  config?: ExperimentConfig,
): ExperimentClient => {
  return initializeRemote(apiKey, config) as ExperimentClient;
};

/**
 * Initializes a remote evaluation client.
 *
 * @param apiKey The environment API Key
 * @param config See {@link ExperimentConfig} for config options
 */
const initializeRemote = (
  apiKey: string,
  config?: RemoteEvaluationConfig,
): RemoteEvaluationClient => {
  const instanceKey = getInstanceKey(apiKey, config?.instanceName);
  if (!remoteEvaluationInstances[instanceKey]) {
    remoteEvaluationInstances[instanceKey] = new RemoteEvaluationClient(
      apiKey,
      config,
    );
  }
  return remoteEvaluationInstances[instanceKey];
};

/**
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
 */
const initializeLocal = (
  apiKey: string,
  config?: LocalEvaluationConfig,
): LocalEvaluationClient => {
  const instanceKey = getInstanceKey(apiKey, config?.instanceName);
  if (!localEvaluationInstances[instanceKey]) {
    localEvaluationInstances[instanceKey] = new LocalEvaluationClient(
      apiKey,
      config,
      new InMemoryFlagConfigCache(),
    );
  }
  return localEvaluationInstances[instanceKey];
};

const getInstanceKey = (apiKey: string, instanceName: string) => {
  return `${apiKey}-${instanceName}`;
};

/**
 * Provides factory methods for storing singleton instances of
 * {@link ExperimentClient}.
 *
 * @category Core Usage
 */
export const Experiment = {
  initialize,
  initializeRemote,
  initializeLocal,
};
