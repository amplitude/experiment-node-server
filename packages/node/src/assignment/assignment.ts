import { ExperimentUser } from 'src/types/user';
import { Results } from 'src/types/variant';

export interface AssignmentService {
  track(assignment: Assignment): Promise<void>;
}

export interface AssignmentFilter {
  shouldTrack(assignment: Assignment): boolean;
}

export class Assignment {
  public user: ExperimentUser;
  public results: Results;
  public timestamp: number = Date.now();

  public constructor(user: ExperimentUser, results: Results) {
    this.user = user;
    this.results = results;
  }

  public canonicalize(): string {
    let canonical = `${this.user.user_id?.trim()} ${this.user.device_id?.trim()} `;
    for (const key of Object.keys(this.results).sort()) {
      const value = this.results[key];
      canonical += key.trim() + ' ' + value?.value?.trim() + ' ';
    }
    return canonical;
  }
}
