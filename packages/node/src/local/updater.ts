import { FlagConfigCache } from '..';

export interface FlagConfigUpdater {
  /**
   * Fetch initial flag configurations and start watching for updates.
   *
   * You must call this function to begin watching for flag config updates.
   * The promise returned by this function is resolved when the initial call
   * to fetch the flag configuration completes.
   */
  start(onChange?: (cache: FlagConfigCache) => Promise<void>): Promise<void>;

  /**
   * Stop updating flag configurations.
   */
  stop(): void;

  /**
   * Force a flag config fetch and cache the update with an optional callback
   * which gets called if the flag configs change in any way.
   *
   * @param onChange optional callback which will get called if the flag configs
   * in the cache have changed.
   */
  update(onChange?: (cache: FlagConfigCache) => Promise<void>): Promise<void>;
}
