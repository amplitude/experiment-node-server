export interface CohortStorage {
  getAllCohortIds(): Set<string>;
  getCohort(cohortId: string): Cohort | undefined;
  getCohortsForUser(userId: string, cohortIds: Set<string>): Set<string>;
  getCohortsForGroup(
    groupType: string,
    groupName: string,
    cohortIds: Set<string>,
  ): Set<string>;
  put(cohort: Cohort): void;
  delete(cohortIds: string): void;
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
