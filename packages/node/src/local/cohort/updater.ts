import { CohortStorage } from 'src/types/cohort';

export interface CohortUpdater {
  /**
   * Force a cohort fetch and store the update with an optional callback
   * which gets called if the cohorts change in any way.
   *
   * @param onChange optional callback which will get called if the cohorts
   * in the storage have changed.
   */
  update(
    cohortIds: Set<string>,
    onChange?: (storage: CohortStorage) => Promise<void>,
  ): Promise<void>;
}
