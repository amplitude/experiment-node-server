import { BaseEvent } from '@amplitude/analytics-types';
import { CoreClient } from '@amplitude/analytics-types';
import {
  Assignment,
  AssignmentFilter,
  AssignmentService,
} from 'src/assignment/assignment';
import { hashCode } from 'src/util/hash';

export const DEFAULT_EVENT_UPLOAD_THRESHOLD = 10;
export const DEFAULT_EVENT_UPLOAD_PERIOD_MILLIS = 10000;
export const DAY_MILLIS = 24 * 60 * 60 * 1000;

export class AmplitudeAssignmentService implements AssignmentService {
  private readonly amplitude: CoreClient;
  private readonly assignmentFilter: AssignmentFilter;

  constructor(amplitude: CoreClient, assignmentFilter: AssignmentFilter) {
    this.amplitude = amplitude;
    this.assignmentFilter = assignmentFilter;
  }

  async track(assignment: Assignment): Promise<void> {
    // TODO use assignment filter to determine whether to track the event
    // TODO translate assignment to event
    // TODO track event using analytics SDK
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
    // TODO loop over results add to event properties
    for (const resultsKey in assignment.results) {
      event.event_properties[`${resultsKey}.variant`] =
        assignment.results[resultsKey].value;
      event.event_properties[`${resultsKey}.details`] =
        assignment.results[resultsKey].description;
    }

    // TODO loop over results add to user properties
    const set = {};
    const unset = {};
    for (const resultsKey in assignment.results) {
      if (assignment.results[resultsKey].isDefaultVariant) {
        unset[`[Experiment] ${resultsKey}`] = '-';
      } else {
        set[`[Experiment] ${resultsKey}`] =
          assignment.results[resultsKey].value;
      }
    }
    event.user_properties['$set'] = set;
    event.user_properties['$unset'] = unset;

    // TODO set insert_id to canonical string + date stamp
    event.insert_id = `${event.user_id} ${event.device_id} ${hashCode(
      assignment.canonicalize(),
    )} ${assignment.timestamp / DAY_MILLIS}`;
    return event;
  }
}
