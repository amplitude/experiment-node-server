export interface CohortStorage {
  getCohort(cohortId: string): Cohort | undefined;
  getCohortsForUser(userId: string, cohortIds: string[]): string[];
  getCohortsForGroup(
    groupType: string,
    groupName: string,
    cohortIds: string[],
  ): string[];
  put(cohort: Cohort): undefined;
}

export const USER_GROUP_TYPE = 'User';

export type CohortDescription = {
  cohortId: string;
  groupType: string;
  groupTypeId: number;
  lastComputed: number;
  lastModified: number;
  size: number;
};

export type Cohort = CohortDescription & { memberIds: Set<string> };
