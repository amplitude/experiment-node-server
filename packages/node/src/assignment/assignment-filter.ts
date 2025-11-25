import { Cache } from '../util/cache';

import { Assignment, AssignmentFilter } from './assignment';
import { DAY_MILLIS } from './assignment-service';

/**
 * @deprecated Assignment tracking is deprecated. Use Exposure tracking.
 * Making this class a synonym for InMemoryExposureFilter. They perform same function.
 * This class can be removed in the future with little effort.
 */
export class InMemoryAssignmentFilter implements AssignmentFilter {
  private readonly cache: Cache<number>;

  constructor(size: number, ttlMillis: number = DAY_MILLIS) {
    this.cache = new Cache<number>(size, ttlMillis);
  }

  public shouldTrack(assignment: Assignment): boolean {
    if (Object.keys(assignment.results).length === 0) {
      // Don't track empty assignments.
      return false;
    }
    const canonicalAssignment = assignment.canonicalize();
    const track = this.cache.get(canonicalAssignment) == undefined;
    if (track) {
      this.cache.put(canonicalAssignment, 0);
    }
    return track;
  }
}
