import { CohortStorage } from 'src/types/cohort';
import { CohortUtils } from 'src/util/cohort';
import { ConsoleLogger, Logger } from 'src/util/logger';

import { FlagConfig, FlagConfigCache } from '..';

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
    isInit: boolean,
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
      throw Error(
        'cohort found in flag configs but no cohort download configured',
      );
    }

    // Download new cohorts into cohortStorage.
    const failedCohortIds = await this.downloadNewCohorts(cohortIds);
    if (isInit && failedCohortIds.size > 0) {
      throw Error('Cohort download failed');
    }

    // Update the flags that has all cohorts successfully updated into flags cache.
    const newFlagConfigs = await this.filterFlagConfigsWithFullCohorts(
      flagConfigs,
    );

    // Update the flags with new flags.
    await this.cache.clear();
    await this.cache.putAll(newFlagConfigs);

    // Remove cohorts not used by new flags.
    await this.removeUnusedCohorts(
      CohortUtils.extractCohortIds(newFlagConfigs),
    );

    if (changed) {
      await onChange(this.cache);
    }
  }

  private async downloadNewCohorts(
    cohortIds: Set<string>,
  ): Promise<Set<string>> {
    const oldCohortIds = this.cohortStorage?.getAllCohortIds();
    const newCohortIds = FlagConfigUpdaterBase.setSubtract(
      cohortIds,
      oldCohortIds,
    );
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
          this.logger.warn(
            `[Experiment] Cohort download failed ${cohortId}, using existing cohort`,
            err,
          );
          failedCohortIds.add(cohortId);
        }),
    );
    await Promise.all(cohortDownloadPromises);
    return failedCohortIds;
  }

  private async filterFlagConfigsWithFullCohorts(
    flagConfigs: Record<string, FlagConfig>,
  ) {
    const newFlagConfigs = {};
    for (const flagKey in flagConfigs) {
      // Get cohorts for this flag.
      const cohortIds = CohortUtils.extractCohortIdsFromFlag(
        flagConfigs[flagKey],
      );

      // Check if all cohorts for this flag has downloaded.
      // If any cohort failed, don't use the new flag.
      const updateFlag =
        cohortIds.size === 0 ||
        [...cohortIds]
          .map((id) => this.cohortStorage.getCohort(id))
          .reduce((acc, cur) => acc && cur);

      if (updateFlag) {
        newFlagConfigs[flagKey] = flagConfigs[flagKey];
      } else {
        this.logger.warn(
          `[Experiment] Flag ${flagKey} failed to update due to cohort update failure`,
        );
        const existingFlag = await this.cache.get(flagKey);
        if (existingFlag) {
          newFlagConfigs[flagKey] = existingFlag;
        }
      }
    }

    return newFlagConfigs;
  }

  private async removeUnusedCohorts(validCohortIds: Set<string>) {
    const cohortIdsToBeRemoved = FlagConfigUpdaterBase.setSubtract(
      this.cohortStorage.getAllCohortIds(),
      validCohortIds,
    );
    cohortIdsToBeRemoved.forEach((id) => {
      this.cohortStorage.delete(id);
    });
  }

  private static setSubtract(one: Set<string>, other: Set<string>) {
    const result = new Set<string>(one);
    other.forEach((v) => result.delete(v));

    return result;
  }
}
