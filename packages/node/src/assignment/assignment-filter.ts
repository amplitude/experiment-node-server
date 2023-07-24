import { Assignment, AssignmentFilter } from 'src/assignment/assignment';
import { DAY_MILLIS } from 'src/assignment/assignment-service';
import { Cache } from 'src/util/cache';

export const DEFAULT_FILTER_CAPACITY = 65536;

export class InMemoryAssignmentFilter implements AssignmentFilter {
  private readonly cache: Cache<number>;

  constructor(size: number) {
    this.cache = new Cache<number>(size, DAY_MILLIS);
  }

  public shouldTrack(assignment: Assignment): boolean {
    const canonicalAssignment = assignment.canonicalize();
    const track = this.cache.get(canonicalAssignment) == null;
    if (track) {
      this.cache.put(canonicalAssignment, 0);
    }
    return track;
  }
}
