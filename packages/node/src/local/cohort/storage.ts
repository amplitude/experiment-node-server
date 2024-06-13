import { Cohort, CohortStorage, USER_GROUP_TYPE } from 'src/types/cohort';

export class InMemoryCohortStorage implements CohortStorage {
  store: Record<string, Cohort> = {};

  getCohort(cohortId: string): Cohort | undefined {
    return cohortId in this.store ? this.store[cohortId] : undefined;
  }

  getCohortsForUser(userId: string, cohortIds: string[]): string[] {
    return this.getCohortsForGroup(USER_GROUP_TYPE, userId, cohortIds);
  }

  getCohortsForGroup(
    groupType: string,
    groupName: string,
    cohortIds: string[],
  ): string[] {
    const validCohortIds = [];
    for (const cohortId of cohortIds) {
      if (
        this.store[cohortId]?.groupType == groupType &&
        this.store[cohortId]?.memberIds.has(groupName)
      ) {
        validCohortIds.push(cohortId);
      }
    }
    return validCohortIds;
  }

  put(cohort: Cohort): void {
    this.store[cohort.cohortId] = cohort;
  }
}
