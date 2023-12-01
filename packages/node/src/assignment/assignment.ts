import { EvaluationVariant } from '@amplitude/experiment-core';

import { ExperimentUser } from '../types/user';

export interface AssignmentService {
  track(assignment: Assignment): Promise<void>;
}

export interface AssignmentFilter {
  shouldTrack(assignment: Assignment): boolean;
}

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
