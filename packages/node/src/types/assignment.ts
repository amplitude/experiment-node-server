import { ExperimentUser } from 'src/types/user';
import { Results } from 'src/types/variant';

export type Assignment = {
  user: ExperimentUser;
  results: Results;
};

export interface AssignmentService {
  track(assignment: Assignment): Promise<void>;
}

export interface AssignmentFilter {
  shouldTrack(assignment: Assignment): boolean;
}
