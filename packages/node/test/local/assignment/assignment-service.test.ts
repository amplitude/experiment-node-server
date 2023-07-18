import * as amplitude from '@amplitude/analytics-node';
import { Assignment, AssignmentFilter } from 'src/assignment/assignment';
import {
  AmplitudeAssignmentService,
  DAY_MILLIS,
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
  const results = {};
  results['flag-key-1'] = {
    value: 'on',
    description: 'description-1',
    isDefaultVariant: false,
  };
  results['flag-key-2'] = {
    value: 'control',
    description: 'description-2',
    isDefaultVariant: true,
  };
  const assignment = new Assignment(user, results);
  const instance = amplitude.createInstance();
  const service = new AmplitudeAssignmentService(instance, testFilter);
  const event = service.toEvent(assignment);
  expect(event.user_id).toEqual(user.user_id);
  expect(event.device_id).toEqual(user.device_id);
  expect(event.event_type).toEqual('[Experiment] Assignment');
  const eventProperties = event.event_properties;
  expect(Object.keys(eventProperties).length).toEqual(2);
  expect(eventProperties['flag-key-1.variant']).toEqual('on');
  expect(eventProperties['flag-key-2.variant']).toEqual('control');
  const userProperties = event.user_properties;
  expect(Object.keys(userProperties).length).toEqual(2);
  expect(Object.keys(userProperties['$set']).length).toEqual(1);
  expect(Object.keys(userProperties['$unset']).length).toEqual(1);
  const canonicalization = 'user device flag-key-1 on flag-key-2 control ';
  const expected = `user device ${hashCode(canonicalization)} ${
    assignment.timestamp / DAY_MILLIS
  }`;
  expect(event.insert_id).toEqual(expected);
});

test('tracking called', async () => {
  const logEventMock = jest.spyOn(instance, 'logEvent');
  await service.track(new Assignment({}, {}));
  expect(logEventMock).toHaveBeenCalled();
});
