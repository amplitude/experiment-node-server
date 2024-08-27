import {
  EvaluationCondition,
  EvaluationOperator,
  EvaluationSegment,
} from '@amplitude/experiment-core';

import { FlagConfig } from '..';
import { USER_GROUP_TYPE } from '../types/cohort';

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
    const cohortIdsByFlag = {};
    for (const key in flagConfigs) {
      cohortIdsByFlag[key] = CohortUtils.mergeAllValues(
        CohortUtils.extractCohortIdsByGroupFromFlag(flagConfigs[key]),
      );
    }
    return CohortUtils.mergeAllValues(cohortIdsByFlag);
  }

  public static extractCohortIdsByGroupFromFlag(
    flag: FlagConfig,
  ): Record<string, Set<string>> {
    const cohortIdsByGroup = {};
    if (flag.segments && Array.isArray(flag.segments)) {
      const segments = flag.segments as EvaluationSegment[];
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
    return cohortIdsByGroup;
  }

  public static mergeValuesOfBIntoValuesOfA(
    a: Record<string, Set<string>>,
    b: Record<string, Set<string>>,
  ): void {
    for (const groupType in b) {
      if (!(groupType in a)) {
        a[groupType] = new Set<string>();
      }

      b[groupType].forEach(a[groupType].add, a[groupType]);
    }
  }

  public static mergeAllValues(a: Record<string, Set<string>>): Set<string> {
    const merged = new Set<string>();
    for (const key in a) {
      a[key].forEach(merged.add, merged);
    }
    return merged;
  }

  public static setSubtract(one: Set<string>, other: Set<string>): Set<string> {
    const result = new Set<string>();
    one.forEach((v) => {
      if (!other.has(v)) result.add(v);
    });

    return result;
  }
}
