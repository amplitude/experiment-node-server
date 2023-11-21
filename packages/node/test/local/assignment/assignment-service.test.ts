import * as amplitude from '@amplitude/analytics-node';
import { Assignment, AssignmentFilter } from 'src/assignment/assignment';
import {
  AmplitudeAssignmentService,
  DAY_MILLIS,
  toEvent,
} from 'src/assignment/assignment-service';
import { ExperimentUser } from 'src/types/user';
import { hashCode } from 'src/util/hash';

const testFilter: AssignmentFilter = {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  shouldTrack(assignment: Assignment): boolean {
    return true;
  },
};

const instance = amplitude.createInstance();
const service = new AmplitudeAssignmentService(instance, testFilter);
test('assignment to event as expected', async () => {
  const user: ExperimentUser = { user_id: 'user', device_id: 'device' };
  const results = {
    basic: {
      key: 'control',
      value: 'control',
      metadata: {
        segmentName: 'All Other Users',
        flagType: 'experiment',
        flagVersion: 10,
        default: false,
      },
    },
    different_value: {
      key: 'on',
      value: 'control',
      metadata: {
        segmentName: 'All Other Users',
        flagType: 'experiment',
        flagVersion: 10,
        default: false,
      },
    },
    default: {
      key: 'off',
      metadata: {
        segmentName: 'All Other Users',
        flagType: 'experiment',
        flagVersion: 10,
        default: true,
      },
    },
    mutex: {
      key: 'slot-1',
      value: 'slot-1',
      metadata: {
        segmentName: 'All Other Users',
        flagType: 'mutual-exclusion-group',
        flagVersion: 10,
        default: false,
      },
    },
    holdout: {
      key: 'holdout',
      value: 'holdout',
      metadata: {
        segmentName: 'All Other Users',
        flagType: 'holdout-group',
        flagVersion: 10,
        default: false,
      },
    },
    partial_metadata: {
      key: 'on',
      value: 'on',
      metadata: {
        segmentName: 'All Other Users',
        flagType: 'release',
      },
    },
    empty_metadata: {
      key: 'on',
      value: 'on',
    },
    empty_variant: {},
  };
  const assignment = new Assignment(user, results);
  const event = toEvent(assignment);
  expect(event.user_id).toEqual(user.user_id);
  expect(event.device_id).toEqual(user.device_id);
  expect(event.event_type).toEqual('[Experiment] Assignment');
  // Event Properties
  const eventProperties = event.event_properties;
  expect(eventProperties['basic.variant']).toEqual('control');
  expect(eventProperties['basic.details']).toEqual('v10 rule:All Other Users');
  expect(eventProperties['different_value.variant']).toEqual('on');
  expect(eventProperties['different_value.details']).toEqual(
    'v10 rule:All Other Users',
  );
  expect(eventProperties['default.variant']).toEqual('off');
  expect(eventProperties['default.details']).toEqual(
    'v10 rule:All Other Users',
  );
  expect(eventProperties['mutex.variant']).toEqual('slot-1');
  expect(eventProperties['default.details']).toEqual(
    'v10 rule:All Other Users',
  );
  expect(eventProperties['holdout.variant']).toEqual('holdout');
  expect(eventProperties['holdout.details']).toEqual(
    'v10 rule:All Other Users',
  );
  expect(eventProperties['partial_metadata.variant']).toEqual('on');
  expect(eventProperties['partial_metadata.details']).toBeUndefined();
  expect(eventProperties['empty_metadata.variant']).toEqual('on');
  expect(eventProperties['empty_metadata.details']).toBeUndefined();
  // User properties
  const userProperties = event.user_properties;
  expect(Object.keys(userProperties).length).toEqual(2);
  const setProperties = userProperties['$set'];
  expect(Object.keys(setProperties).length).toEqual(5);
  expect(setProperties['[Experiment] basic']).toEqual('control');
  expect(setProperties['[Experiment] different_value']).toEqual('on');
  expect(setProperties['[Experiment] holdout']).toEqual('holdout');
  expect(setProperties['[Experiment] partial_metadata']).toEqual('on');
  expect(setProperties['[Experiment] empty_metadata']).toEqual('on');
  const unsetProperties = userProperties['$unset'];
  expect(Object.keys(unsetProperties).length).toEqual(1);
  expect(unsetProperties['[Experiment] default']).toEqual('-');

  const canonicalization =
    'user device basic control default off different_value on empty_metadata on holdout holdout mutex slot-1 partial_metadata on ';
  const expected = `user device ${hashCode(canonicalization)} ${Math.floor(
    assignment.timestamp / DAY_MILLIS,
  )}`;
  expect(event.insert_id).toEqual(expected);
});

test('tracking called', async () => {
  const logEventMock = jest.spyOn(instance, 'logEvent');
  await service.track(new Assignment({}, {}));
  expect(logEventMock).toHaveBeenCalled();
});
