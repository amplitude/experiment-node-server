import { init, track } from '@amplitude/analytics-node';
import { BaseEvent } from '@amplitude/analytics-types';
import {
  Assignment,
  AssignmentFilter,
  AssignmentService,
} from 'src/types/assignment';
import { AssignmentConfiguration } from 'src/types/config';

export class AmplitudeAssignmentService implements AssignmentService {
  private readonly configuration: AssignmentConfiguration;
  private readonly filter: AssignmentFilter;
  constructor(
    configuration: AssignmentConfiguration,
    filter: AssignmentFilter,
  ) {
    init(configuration.apiKey);
    this.configuration = configuration;
    this.filter = filter;
  }

  async track(assignment: Assignment): Promise<void> {
    // TODO use assignment filter to determine whether to track the event
    // TODO translate assignment to event
    // TODO track event using analytics SDK
  }

  private toEvent(assignment: Assignment): BaseEvent {
    const event: BaseEvent = {
      event_type: '[Experiment] Assignment',
      user_id: assignment.user.user_id,
      device_id: assignment.user.device_id,
      event_properties: {},
      user_properties: {},
    };
    // TODO loop over results add to event properties
    // TODO loop over results add to user properties
    // TODO set insert_id to canonical string + date stamp
    return event;
  }
}
