import {
  EvaluationCondition,
  EvaluationOperator,
  EvaluationSegment,
} from '@amplitude/experiment-core';

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
    const cohortIds = new Set<string>();
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
                if (condition.selector.length > 2) {
                  if (
                    condition.selector[1] != 'user' &&
                    !condition.selector.includes('groups')
                  ) {
                    continue;
                  }
                  condition.values.forEach(cohortIds.add, cohortIds);
                }
              }
            }
          }
        }
      }
    }
    return cohortIds;
  }
}
