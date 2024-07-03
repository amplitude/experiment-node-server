import { CohortStorage } from 'src/types/cohort';

import { LocalEvaluationDefaults } from '../types/config';
import { FlagConfigCache } from '../types/flag';
import { doWithBackoff, BackoffPolicy } from '../util/backoff';

import { CohortFetcher } from './cohort/fetcher';
import { FlagConfigFetcher } from './fetcher';
import { FlagConfigUpdater, FlagConfigUpdaterBase } from './updater';

const BACKOFF_POLICY: BackoffPolicy = {
  attempts: 5,
  min: 1,
  max: 1,
  scalar: 1,
};

export class FlagConfigPoller
  extends FlagConfigUpdaterBase
  implements FlagConfigUpdater
{
  private readonly pollingIntervalMillis: number;

  private poller: NodeJS.Timeout;

  public readonly fetcher: FlagConfigFetcher;

  constructor(
    fetcher: FlagConfigFetcher,
    cache: FlagConfigCache,
    cohortStorage: CohortStorage,
    cohortFetcher?: CohortFetcher,
    pollingIntervalMillis = LocalEvaluationDefaults.flagConfigPollingIntervalMillis,
    debug = false,
  ) {
    super(cache, cohortStorage, cohortFetcher, debug);
    this.fetcher = fetcher;
    this.pollingIntervalMillis = pollingIntervalMillis;
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
        try {
          const flagConfigs = await this.fetcher.fetch();
          await super._update(flagConfigs, true, onChange);
        } catch (e) {
          this.logger.error(
            '[Experiment] flag config initial poll failed, stopping',
            e,
          );
          this.stop();
        }
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

  public async update(
    onChange?: (cache: FlagConfigCache) => Promise<void>,
  ): Promise<void> {
    this.logger.debug('[Experiment] updating flag configs');
    const flagConfigs = await this.fetcher.fetch();
    await super._update(flagConfigs, false, onChange);
  }
}
