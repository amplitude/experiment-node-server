import { CohortStorage } from '../../types/cohort';
import { FlagConfigCache } from '../../types/flag';
import { CohortUtils } from '../../util/cohort';
import { ConsoleLogger } from '../../util/logger';
import { Logger } from '../../util/logger';

import { CohortFetcher } from './fetcher';
import { CohortUpdater } from './updater';

export class CohortPoller implements CohortUpdater {
  private readonly logger: Logger;

  public readonly fetcher: CohortFetcher;
  public readonly storage: CohortStorage;
  public readonly flagCache: FlagConfigCache;

  private poller: NodeJS.Timeout;
  private pollingIntervalMillis: number;

  constructor(
    fetcher: CohortFetcher,
    storage: CohortStorage,
    flagCache: FlagConfigCache,
    pollingIntervalMillis = 60000,
    debug = false,
  ) {
    this.fetcher = fetcher;
    this.storage = storage;
    this.flagCache = flagCache;
    this.pollingIntervalMillis = pollingIntervalMillis;
    this.logger = new ConsoleLogger(debug);
  }

  /**
   * You must call this function to begin polling for cohort updates.
   *
   * Calling this function while the poller is already running does nothing.
   */
  public async start(
    onChange?: (storage: CohortStorage) => Promise<void>,
  ): Promise<void> {
    if (!this.poller) {
      this.logger.debug('[Experiment] cohort poller - start');
      this.poller = setInterval(async () => {
        try {
          await this.update(onChange);
        } catch (e) {
          this.logger.debug('[Experiment] cohort update failed', e);
        }
      }, this.pollingIntervalMillis);
    }
  }

  /**
   * Stop polling for cohorts.
   *
   * Calling this function while the poller is not running will do nothing.
   */
  public stop(): void {
    if (this.poller) {
      this.logger.debug('[Experiment] cohort poller - stop');
      clearTimeout(this.poller);
      this.poller = undefined;
    }
  }

  public async update(
    onChange?: (storage: CohortStorage) => Promise<void>,
  ): Promise<void> {
    let changed = false;
    const promises = [];
    const cohortIds = CohortUtils.extractCohortIds(
      await this.flagCache.getAll(),
    );

    for (const cohortId of cohortIds) {
      this.logger.debug(`[Experiment] updating cohort ${cohortId}`);

      // Get existing cohort and lastModified.
      const existingCohort = this.storage.getCohort(cohortId);
      let lastModified = undefined;
      if (existingCohort) {
        lastModified = existingCohort.lastModified;
      }

      promises.push(
        this.fetcher
          .fetch(cohortId, lastModified)
          .then((cohort) => {
            // Set.
            if (cohort) {
              this.storage.put(cohort);
              changed = true;
            }
          })
          .catch((err) => {
            this.logger.error('[Experiment] cohort poll failed', err);
          }),
      );
    }

    await Promise.all(promises);

    this.logger.debug(`[Experiment] cohort polled, changed: ${changed}`);

    if (onChange && changed) {
      await onChange(this.storage);
    }
  }
}
