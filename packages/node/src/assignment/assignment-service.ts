import { BaseEvent } from '@amplitude/analytics-types';
import { CoreClient } from '@amplitude/analytics-types';

import { hashCode } from '../util/hash';

import { Assignment, AssignmentFilter, AssignmentService } from './assignment';

export const DAY_MILLIS = 24 * 60 * 60 * 1000;
export const FLAG_TYPE_MUTUAL_EXCLUSION_GROUP = 'mutual-exclusion-group';

/**
 * @deprecated Assignment tracking is deprecated. Use Exposure tracking.
 */
export class AmplitudeAssignmentService implements AssignmentService {
  private readonly amplitude: CoreClient;
  private readonly assignmentFilter: AssignmentFilter;

  constructor(amplitude: CoreClient, assignmentFilter: AssignmentFilter) {
    this.amplitude = amplitude;
    this.assignmentFilter = assignmentFilter;
  }

  async track(assignment: Assignment): Promise<void> {
    if (this.assignmentFilter.shouldTrack(assignment)) {
      this.amplitude.logEvent(toEvent(assignment));
    }
  }
}

/**
 * @deprecated Assignment tracking is deprecated. Use Exposure tracking.
 */
export const toEvent = (assignment: Assignment): BaseEvent => {
  const event: BaseEvent = {
    event_type: '[Experiment] Assignment',
    user_id: assignment.user.user_id,
    device_id: assignment.user.device_id,
    event_properties: {},
    user_properties: {},
  };
  const set = {};
  const unset = {};
  for (const flagKey in assignment.results) {
    const variant = assignment.results[flagKey];
    if (!variant.key) {
      continue;
    }
    const version = variant.metadata?.flagVersion;
    const segmentName = variant.metadata?.segmentName;
    const flagType = variant.metadata?.flagType;
    const isDefault: boolean = variant.metadata?.default as boolean;
    event.event_properties[`${flagKey}.variant`] = variant.key;
    if (version && segmentName) {
      event.event_properties[
        `${flagKey}.details`
      ] = `v${version} rule:${segmentName}`;
    }
    if (flagType != FLAG_TYPE_MUTUAL_EXCLUSION_GROUP) {
      if (isDefault) {
        unset[`[Experiment] ${flagKey}`] = '-';
      } else {
        set[`[Experiment] ${flagKey}`] = variant.key;
      }
    }
  }
  event.user_properties['$set'] = set;
  event.user_properties['$unset'] = unset;
  event.insert_id = `${event.user_id} ${event.device_id} ${hashCode(
    assignment.canonicalize(),
  )} ${Math.floor(assignment.timestamp / DAY_MILLIS)}`;
  return event;
};
