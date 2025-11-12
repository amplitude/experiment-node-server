import { EvaluationVariant } from '@amplitude/experiment-core';

import { ExperimentUser } from '../types/user';

/**
 * @deprecated Assignment tracking is deprecated. Use Exposure tracking.
 */
export interface AssignmentService {
  track(assignment: Assignment): Promise<void>;
}

/**
 * @deprecated Assignment tracking is deprecated. Use Exposure tracking.
 */
export interface AssignmentFilter {
  shouldTrack(assignment: Assignment): boolean;
}

/**
 * @deprecated Assignment tracking is deprecated. Use Exposure tracking.
 * Making this class a synonym for Exposure. They have the same fields. 
 * This class can be removed in the future with little effort.
 */
export class Assignment {
  public user: ExperimentUser;
  public results: Record<string, EvaluationVariant>;
  public timestamp: number = Date.now();

  public constructor(
    user: ExperimentUser,
    results: Record<string, EvaluationVariant>,
  ) {
    this.user = user;
    this.results = results;
  }

  public canonicalize(): string {
    let canonical = `${this.user.user_id?.trim()} ${this.user.device_id?.trim()} `;
    for (const key of Object.keys(this.results).sort()) {
      const variant = this.results[key];
      if (variant?.key) {
        canonical += key.trim() + ' ' + variant?.key?.trim() + ' ';
      }
    }
    return canonical;
  }
}
