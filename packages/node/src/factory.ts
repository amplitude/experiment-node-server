import { SkylabClient } from './client';
import { Defaults, SkylabConfig } from './config';

const instances = {};

/**
 * Initializes a singleton {@link SkylabClient} identified by the value of
 * `config.name`, defaulting to {@link Defaults}.
 * @param apiKey The environment API Key
 * @param config See {@link SkylabConfig} for config options
 */
const init = (apiKey: string, config?: SkylabConfig): SkylabClient => {
  const normalizedName = config?.instanceName || Defaults.instanceName;
  if (!instances[normalizedName]) {
    instances[normalizedName] = new SkylabClient(apiKey, {
      ...config,
      instanceName: normalizedName,
    });
  }
  return instances[normalizedName];
};

/**
 * Returns the {@link SkylabClient} identified by `name`.
 * If no such instance exists, returns `undefined`.
 */
const instance = (name: string = Defaults.instanceName): SkylabClient => {
  const instance = instances[name];
  if (!instance) {
    console.warn(
      `[Skylab] Instance ${name} has not been initialized. Call init before calling getInstance.`,
    );
  }
  return instance;
};

/**
 *
 * Provides factory methods for storing singleton instances of {@link SkylabClient}
 * @category Core Usage
 */
export const Skylab = {
  init,
  instance,
};
