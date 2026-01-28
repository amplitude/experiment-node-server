import { EvaluationVariant } from '@amplitude/experiment-core';

import { ExperimentUser } from '../types/user';

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
    const userId =
      this.user.user_id != null
        ? String(this.user.user_id).trim()
        : this.user.user_id;
    const deviceId =
      this.user.device_id != null
        ? String(this.user.device_id).trim()
        : this.user.device_id;
    let canonical = `${userId} ${deviceId} `;
    for (const key of Object.keys(this.results).sort()) {
      const variant = this.results[key];
      if (variant?.key) {
        const variantKey = String(variant.key).trim();
        canonical += key.trim() + ' ' + variantKey + ' ';
      }
    }
    return canonical;
  }
}
