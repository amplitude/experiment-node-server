import { FlagConfig, FlagConfigCache } from '..';
import { CohortStorage } from '../types/cohort';
import { CohortUtils } from '../util/cohort';
import { ConsoleLogger, Logger } from '../util/logger';

import { CohortFetcher } from './cohort/fetcher';

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

export class FlagConfigUpdaterBase {
  protected readonly logger: Logger;

  public readonly cache: FlagConfigCache;

  public readonly cohortStorage: CohortStorage;
  public readonly cohortFetcher?: CohortFetcher;

  constructor(
    cache: FlagConfigCache,
    cohortStorage: CohortStorage,
    cohortFetcher?: CohortFetcher,
    debug = false,
  ) {
    this.cache = cache;
    this.cohortFetcher = cohortFetcher;
    this.cohortStorage = cohortStorage;
    this.logger = new ConsoleLogger(debug);
  }

  protected async _update(
    flagConfigs: Record<string, FlagConfig>,
    onChange?: (cache: FlagConfigCache) => Promise<void>,
  ): Promise<void> {
    let changed = false;
    if (onChange) {
      const current = await this.cache.getAll();
      if (!Object.is(current, flagConfigs)) {
        changed = true;
      }
    }

    // Get all cohort needs update.
    const cohortIds = CohortUtils.extractCohortIds(flagConfigs);
    if (cohortIds && cohortIds.size > 0 && !this.cohortFetcher) {
      this.logger.error(
        'Cohorts found in flag configs but no cohort download configured',
      );
    } else {
      // Download new cohorts into cohortStorage.
      await this.downloadNewCohorts(cohortIds);
    }

    // Update the flags with new flags.
    await this.cache.clear();
    await this.cache.putAll(flagConfigs);

    // Remove cohorts not used by new flags.
    await this.removeUnusedCohorts(cohortIds);

    if (changed) {
      await onChange(this.cache);
    }
  }

  protected async downloadNewCohorts(
    cohortIds: Set<string>,
  ): Promise<Set<string>> {
    const oldCohortIds = this.cohortStorage?.getAllCohortIds();
    const newCohortIds = CohortUtils.setSubtract(cohortIds, oldCohortIds);
    const failedCohortIds = new Set<string>();
    const cohortDownloadPromises = [...newCohortIds].map((cohortId) =>
      this.cohortFetcher
        ?.fetch(cohortId)
        .then((cohort) => {
          if (cohort) {
            this.cohortStorage.put(cohort);
          }
        })
        .catch((err) => {
          this.logger.error(
            `[Experiment] Cohort download failed ${cohortId}`,
            err,
          );
          failedCohortIds.add(cohortId);
        }),
    );
    await Promise.all(cohortDownloadPromises);
    return failedCohortIds;
  }

  protected async removeUnusedCohorts(
    validCohortIds: Set<string>,
  ): Promise<void> {
    const cohortIdsToBeRemoved = CohortUtils.setSubtract(
      this.cohortStorage.getAllCohortIds(),
      validCohortIds,
    );
    cohortIdsToBeRemoved.forEach((id) => {
      this.cohortStorage.delete(id);
    });
  }
}
