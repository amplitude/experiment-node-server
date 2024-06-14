import { CohortStorage } from 'src/types/cohort';
import {
  CohortConfigDefaults,
  LocalEvaluationDefaults,
} from 'src/types/config';

import { ConsoleLogger } from '../../util/logger';
import { Logger } from '../../util/logger';

import { CohortFetcher } from './fetcher';
import { CohortUpdater } from './updater';

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
    for (const cohortId of cohortIds) {
      this.logger.debug(`[Experiment] updating cohort ${cohortId}`);

      // Get existing lastModified.
      const existingCohort = this.storage.getCohort(cohortId);
      let lastModified = undefined;
      if (existingCohort) {
        lastModified = existingCohort.lastModified;
      }

      // Download.
      const cohort = await this.fetcher.fetch(
        cohortId,
        this.maxCohortSize,
        lastModified,
      );

      // Set.
      if (cohort) {
        this.storage.put(cohort);
        changed = true;
      }
    }

    if (onChange && changed) {
      await onChange(this.storage);
    }
  }
}
