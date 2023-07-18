import { Assignment, AssignmentFilter } from 'src/assignment/assignment';
import { Cache } from 'src/util/cache';

export class MockAssignmentFilter implements AssignmentFilter {
  private readonly cache: Cache<number>;

  constructor(size: number, ttlMillis: number) {
    this.cache = new Cache<number>(size, ttlMillis);
  }

  public shouldTrack(assignment: Assignment): boolean {
    const now = Date.now();
    const canonicalAssignment = assignment.canonicalize();
    const track = this.cache.get(canonicalAssignment) == null;
    if (track) {
      this.cache.put(canonicalAssignment, now);
    }
    return track;
  }
}
