import { Cohort, CohortStorage } from 'src/types/cohort';
import {
  CohortConfigDefaults,
  LocalEvaluationDefaults,
} from 'src/types/config';
import { BackoffPolicy, doWithBackoffFailLoudly } from 'src/util/backoff';

import { ConsoleLogger } from '../../util/logger';
import { Logger } from '../../util/logger';

import { CohortFetcher } from './fetcher';
import { CohortUpdater } from './updater';

const BACKOFF_POLICY: BackoffPolicy = {
  attempts: 5,
  min: 1,
  max: 1,
  scalar: 1,
};

export class CohortPoller implements CohortUpdater {
  private readonly logger: Logger;

  public readonly fetcher: CohortFetcher;
  public readonly storage: CohortStorage;
  private readonly maxCohortSize: number;

  constructor(
    fetcher: CohortFetcher,
    storage: CohortStorage,
    maxCohortSize = CohortConfigDefaults.maxCohortSize,
    debug = false,
  ) {
    this.fetcher = fetcher;
    this.storage = storage;
    this.maxCohortSize = maxCohortSize;
    this.logger = new ConsoleLogger(debug);
  }

  public async update(
    cohortIds: Set<string>,
    onChange?: (storage: CohortStorage) => Promise<void>,
  ): Promise<void> {
    let changed = false;
    const updatedCohorts: Record<string, Cohort> = {};
    for (const cohortId of cohortIds) {
      this.logger.debug(`[Experiment] updating cohort ${cohortId}`);

      // Get existing cohort and lastModified.
      const existingCohort = this.storage.getCohort(cohortId);
      let lastModified = undefined;
      if (existingCohort) {
        lastModified = existingCohort.lastModified;
        updatedCohorts[cohortId] = existingCohort;
      }

      // Download.
      let cohort = undefined;
      try {
        cohort = await doWithBackoffFailLoudly<Cohort>(async () => {
          return await this.fetcher.fetch(
            cohortId,
            this.maxCohortSize,
            lastModified,
          );
        }, BACKOFF_POLICY);
      } catch (e) {
        this.logger.error('[Experiment] cohort poll failed', e);
        throw e;
      }

      // Set.
      if (cohort) {
        updatedCohorts[cohortId] = cohort;
        changed = true;
      }
    }
    if (changed) {
      this.storage.replaceAll(updatedCohorts);
    }

    if (onChange && changed) {
      await onChange(this.storage);
    }
  }
}
