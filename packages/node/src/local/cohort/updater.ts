import { CohortStorage } from 'src/types/cohort';

export interface CohortUpdater {
  /**
   * Force a cohort fetch and store the update with an optional callback
   * which gets called if the cohorts change in any way.
   *
   * @param onChange optional callback which will get called if the cohorts
   * in the storage have changed.
   * @throws error if update failed.
   */
  update(onChange?: (storage: CohortStorage) => Promise<void>): Promise<void>;

  start(onChange?: (storage: CohortStorage) => Promise<void>): Promise<void>;

  stop(): void;
}
