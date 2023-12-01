import { EvaluationFlag } from '@amplitude/experiment-core';

/**
 * Useful for clarity over functionality. Flag configs are JSON objects that
 * should not need to be inspected or modified after being received from the
 * server.
 */
export type FlagConfig = Record<string, unknown> | EvaluationFlag;

/**
 * Used to store flag configurations for use in local evaluations.
 */
export interface FlagConfigCache {
  /**
   * Get a flag configuration for the given flag key from the cache.
   *
   * @param flagKey the key to get the flag configuration for
   */
  get(flagKey: string): Promise<FlagConfig>;

  /**
   * Get all the flag configurations from the cache.
   */
  getAll(): Promise<Record<string, FlagConfig>>;

  /**
   * Put a flag configuration in the cache, overwriting an existing
   * configuration for the same flag key.
   *
   * @param flagKey The flag key for the given flag configuration.
   * @param flagConfig The flag configuration to store in the cache.
   */
  put(flagKey: string, flagConfig: FlagConfig): Promise<void>;

  /**
   * Put all the flag configurations into the cache, overwriting any existing
   * configurations for the same key, but not clearing the cache completely.
   *
   * @param flagConfigs The flag keys and configurations to put into the cache.
   */
  putAll(flagConfigs: Record<string, FlagConfig>): Promise<void>;

  /**
   * Delete a flag key and configuration from the cache.
   *
   * @param flagKey The key and configuration to delete.
   */
  delete(flagKey: string): Promise<void>;

  /**
   * Clear the cache of all flag keys and configurations.
   */
  clear(): Promise<void>;
}
