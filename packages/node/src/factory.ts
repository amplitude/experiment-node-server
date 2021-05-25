import { ExperimentClient } from './client';
import { Defaults, ExperimentConfig } from './config';

const instances = {};

/**
 * Initializes a singleton {@link ExperimentClient} identified by the value of
 * `config.name`, defaulting to {@link Defaults}.
 * @param apiKey The environment API Key
 * @param config See {@link ExperimentConfig} for config options
 */
const init = (apiKey: string, config?: ExperimentConfig): ExperimentClient => {
  const normalizedName = config?.instanceName || Defaults.instanceName;
  if (!instances[normalizedName]) {
    instances[normalizedName] = new ExperimentClient(apiKey, {
      ...config,
      instanceName: normalizedName,
    });
  }
  return instances[normalizedName];
};

/**
 * Returns the {@link ExperimentClient} identified by `name`.
 * If no such instance exists, returns `undefined`.
 */
const instance = (name: string = Defaults.instanceName): ExperimentClient => {
  const instance = instances[name];
  if (!instance) {
    console.warn(
      `[Experiment] Instance ${name} has not been initialized. Call init before calling getInstance.`,
    );
  }
  return instance;
};

/**
 *
 * Provides factory methods for storing singleton instances of {@link ExperimentClient}
 * @category Core Usage
 */
export const Experiment = {
  init,
  instance,
};
