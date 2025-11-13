import { EvaluationVariant } from '@amplitude/experiment-core';
import { ExperimentUser } from 'src/types/user';

export interface ExposureService {
  track(exposure: Exposure): Promise<void>;
}

export interface ExposureFilter {
  shouldTrack(exposure: Exposure): boolean;
  ttlMillis: number;
}

/**
 * Exposure is a class that represents a user's exposure to a set of flags.
 * It implements the FilterItem interface so it can be used with the dedupe filter.
 */
export class Exposure {
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
