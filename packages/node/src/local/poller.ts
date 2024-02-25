import { LocalEvaluationDefaults } from '../types/config';
import { FlagConfigCache } from '../types/flag';
import { doWithBackoff, BackoffPolicy } from '../util/backoff';
import { ConsoleLogger } from '../util/logger';
import { Logger } from '../util/logger';

import { FlagConfigFetcher } from './fetcher';
import { FlagConfigUpdater } from './updater';

const BACKOFF_POLICY: BackoffPolicy = {
  attempts: 5,
  min: 1,
  max: 1,
  scalar: 1,
};

export class FlagConfigPoller implements FlagConfigUpdater {
  private readonly logger: Logger;
  private readonly pollingIntervalMillis: number;

  private poller: NodeJS.Timeout;

  public readonly fetcher: FlagConfigFetcher;
  public readonly cache: FlagConfigCache;

  constructor(
    fetcher: FlagConfigFetcher,
    cache: FlagConfigCache,
    pollingIntervalMillis = LocalEvaluationDefaults.flagConfigPollingIntervalMillis,
    debug = false,
  ) {
    this.fetcher = fetcher;
    this.cache = cache;
    this.pollingIntervalMillis = pollingIntervalMillis;
    this.logger = new ConsoleLogger(debug);
  }

  /**
   * Fetch initial flag configurations and start polling for updates.
   *
   * You must call this function to begin polling for flag config updates.
   * The promise returned by this function is resolved when the initial call
   * to fetch the flag configuration completes.
   *
   * Calling this function while the poller is already running does nothing.
   */
  public async start(
    onChange?: (cache: FlagConfigCache) => Promise<void>,
  ): Promise<void> {
    if (!this.poller) {
      this.logger.debug('[Experiment] poller - start');
      this.poller = setInterval(async () => {
        try {
          await this.update(onChange);
        } catch (e) {
          this.logger.debug('[Experiment] flag config update failed', e);
        }
      }, this.pollingIntervalMillis);

      // Fetch initial flag configs and await the result.
      await doWithBackoff<void>(async () => {
        await this.update(onChange);
      }, BACKOFF_POLICY);
    }
  }

  /**
   * Stop polling for flag configurations.
   *
   * Calling this function while the poller is not running will do nothing.
   */
  public stop(): void {
    if (this.poller) {
      this.logger.debug('[Experiment] poller - stop');
      clearTimeout(this.poller);
      this.poller = undefined;
    }
  }

  /**
   * Force a flag config fetch and cache the update with an optional callback
   * which gets called if the flag configs change in any way.
   *
   * @param onChange optional callback which will get called if the flag configs
   * in the cache have changed.
   */
  public async update(
    onChange?: (cache: FlagConfigCache) => Promise<void>,
  ): Promise<void> {
    this.logger.debug('[Experiment] updating flag configs');
    const flagConfigs = await this.fetcher.fetch();
    let changed = false;
    if (onChange) {
      const current = await this.cache.getAll();
      if (!Object.is(current, flagConfigs)) {
        changed = true;
      }
    }
    await this.cache.clear();
    await this.cache.putAll(flagConfigs);
    if (changed) {
      await onChange(this.cache);
    }
  }
}
