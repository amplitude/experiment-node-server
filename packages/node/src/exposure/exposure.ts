import { EvaluationVariant } from '@amplitude/experiment-core';

import { ExperimentUser } from '../types/user';
import { safeStringTrim } from '../util/string';

export interface ExposureService {
  track(exposure: Exposure): Promise<void>;
}

export interface ExposureFilter {
  shouldTrack(exposure: Exposure): boolean;
  ttlMillis: number;
}

/**
 * Exposure is a class that represents a user's exposure to a set of flags.

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
    let canonical = `${safeStringTrim(this.user.user_id)} ${safeStringTrim(this.user.device_id)} `;
    for (const key of Object.keys(this.results).sort()) {
      const variant = this.results[key];
      if (variant?.key) {
        canonical += safeStringTrim(key) + ' ' + safeStringTrim(variant.key) + ' ';
      }
    }
    return canonical;
  }
}
