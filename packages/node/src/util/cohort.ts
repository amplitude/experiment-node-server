import {
  EvaluationCondition,
  EvaluationOperator,
  EvaluationSegment,
} from '@amplitude/experiment-core';
import { USER_GROUP_TYPE } from 'src/types/cohort';

import { FlagConfig } from '..';

export class CohortUtils {
  public static isCohortFilter(condition: EvaluationCondition): boolean {
    return (
      (condition.op == EvaluationOperator.SET_CONTAINS_ANY ||
        condition.op == EvaluationOperator.SET_DOES_NOT_CONTAIN_ANY) &&
      condition.selector.length != 0 &&
      condition.selector[condition.selector.length - 1] == 'cohort_ids'
    );
  }

  public static extractCohortIds(
    flagConfigs: Record<string, FlagConfig>,
  ): Set<string> {
    const cohorts = this.extractCohortIdsByGroup(flagConfigs);
    const cohortIds = new Set<string>();
    for (const groupType in cohorts) {
      cohorts[groupType].forEach(cohortIds.add, cohortIds);
    }
    return cohortIds;
  }

  public static extractCohortIdsByGroup(
    flagConfigs: Record<string, FlagConfig>,
  ): Record<string, Set<string>> {
    const cohortIdsByGroup = {};
    for (const key in flagConfigs) {
      if (
        flagConfigs[key].segments &&
        Array.isArray(flagConfigs[key].segments)
      ) {
        const segments = flagConfigs[key].segments as EvaluationSegment[];
        for (const segment of segments) {
          if (!segment || !segment.conditions) {
            continue;
          }

          for (const outer of segment.conditions) {
            for (const condition of outer) {
              if (CohortUtils.isCohortFilter(condition)) {
                // User cohort selector is [context, user, cohort_ids]
                // Groups cohort selector is [context, groups, {group_type}, cohort_ids]
                let groupType;
                if (condition.selector.length > 2) {
                  if (condition.selector[1] == 'user') {
                    groupType = USER_GROUP_TYPE;
                  } else if (condition.selector.includes('groups')) {
                    groupType = condition.selector[2];
                  } else {
                    continue;
                  }
                  if (!(groupType in cohortIdsByGroup)) {
                    cohortIdsByGroup[groupType] = new Set<string>();
                  }
                  condition.values.forEach(
                    cohortIdsByGroup[groupType].add,
                    cohortIdsByGroup[groupType],
                  );
                }
              }
            }
          }
        }
      }
    }
    return cohortIdsByGroup;
  }
}
