import { Assignment, AssignmentFilter } from 'src/assignment/assignment';
import { DAY_MILLIS } from 'src/assignment/assignment-service';
import { LRUCache } from 'src/util/lrucache';

export const DEFAULT_FILTER_CAPACITY = 65536;

export class LRUAssignmentFilter implements AssignmentFilter {
  private readonly cache: LRUCache<number>;

  constructor(size: number) {
    this.cache = new LRUCache<number>(size);
  }

  public shouldTrack(assignment: Assignment): boolean {
    const now = Date.now();
    const canonicalAssignment = assignment.canonicalize();
    const lastSent = this.cache.get(canonicalAssignment);
    if (lastSent == null || now > lastSent + DAY_MILLIS) {
      this.cache.set(canonicalAssignment, now);
      return true;
    } else {
      return false;
    }
  }
}
