import { Cohort, CohortStorage, USER_GROUP_TYPE } from 'src/types/cohort';

export class InMemoryCohortStorage implements CohortStorage {
  store: Record<string, Cohort> = {};

  getAllCohortIds(): Set<string> {
    return new Set<string>(Object.keys(this.store));
  }

  getCohort(cohortId: string): Cohort | undefined {
    return cohortId in this.store ? this.store[cohortId] : undefined;
  }

  getCohortsForUser(userId: string, cohortIds: Set<string>): Set<string> {
    return this.getCohortsForGroup(USER_GROUP_TYPE, userId, cohortIds);
  }

  getCohortsForGroup(
    groupType: string,
    groupName: string,
    cohortIds: Set<string>,
  ): Set<string> {
    const validCohortIds = new Set<string>();
    for (const cohortId of cohortIds) {
      if (
        this.store[cohortId]?.groupType == groupType &&
        this.store[cohortId]?.memberIds.has(groupName)
      ) {
        validCohortIds.add(cohortId);
      }
    }
    return validCohortIds;
  }

  put(cohort: Cohort): void {
    this.store[cohort.cohortId] = cohort;
  }

  delete(cohortId: string): void {
    delete this.store[cohortId];
  }
}
