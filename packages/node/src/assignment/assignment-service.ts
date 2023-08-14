import { BaseEvent } from '@amplitude/analytics-types';
import { CoreClient } from '@amplitude/analytics-types';

import { hashCode } from '../util/hash';

import { Assignment, AssignmentFilter, AssignmentService } from './assignment';

export const DAY_MILLIS = 24 * 60 * 60 * 1000;
export const FLAG_TYPE_MUTUAL_EXCLUSION_GROUP = 'mutual-exclusion-group';
export const FLAG_TYPE_HOLDOUT_GROUP = 'holdout-group';

export class AmplitudeAssignmentService implements AssignmentService {
  private readonly amplitude: CoreClient;
  private readonly assignmentFilter: AssignmentFilter;

  constructor(amplitude: CoreClient, assignmentFilter: AssignmentFilter) {
    this.amplitude = amplitude;
    this.assignmentFilter = assignmentFilter;
  }

  async track(assignment: Assignment): Promise<void> {
    if (this.assignmentFilter.shouldTrack(assignment)) {
      this.amplitude.logEvent(this.toEvent(assignment));
    }
  }

  public toEvent(assignment: Assignment): BaseEvent {
    const event: BaseEvent = {
      event_type: '[Experiment] Assignment',
      user_id: assignment.user.user_id,
      device_id: assignment.user.device_id,
      event_properties: {},
      user_properties: {},
    };

    for (const resultsKey in assignment.results) {
      event.event_properties[`${resultsKey}.variant`] =
        assignment.results[resultsKey].value;
    }

    const set = {};
    const unset = {};
    for (const resultsKey in assignment.results) {
      if (
        assignment.results[resultsKey].type == FLAG_TYPE_MUTUAL_EXCLUSION_GROUP
      ) {
        continue;
      } else if (assignment.results[resultsKey].isDefaultVariant) {
        unset[`[Experiment] ${resultsKey}`] = '-';
      } else {
        set[`[Experiment] ${resultsKey}`] =
          assignment.results[resultsKey].value;
      }
    }
    event.user_properties['$set'] = set;
    event.user_properties['$unset'] = unset;

    event.insert_id = `${event.user_id} ${event.device_id} ${hashCode(
      assignment.canonicalize(),
    )} ${assignment.timestamp / DAY_MILLIS}`;
    return event;
  }
}
