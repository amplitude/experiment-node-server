import * as amplitude from '@amplitude/analytics-node';
import { Assignment, AssignmentFilter } from 'src/assignment/assignment';
import { LRUAssignmentFilter } from 'src/assignment/assignment-filter';
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

test('filter - single assignment', async () => {
  const user: ExperimentUser = { user_id: 'user' };
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

  const filter = new LRUAssignmentFilter(100);
  const assignment = new Assignment(user, results);
  expect(filter.shouldTrack(assignment)).toEqual(true);
});

test('filter - duplicate assignment', async () => {
  const user: ExperimentUser = { user_id: 'user' };
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

  const filter = new LRUAssignmentFilter(100);
  const assignment1 = new Assignment(user, results);
  const assignment2 = new Assignment(user, results);
  filter.shouldTrack(assignment1);
  expect(filter.shouldTrack(assignment2)).toEqual(false);
});

test('filter - same user different results', async () => {
  const user: ExperimentUser = { user_id: 'user' };
  const results1 = {};
  results1['flag-key-1'] = {
    value: 'on',
    description: 'description-1',
    isDefaultVariant: false,
  };
  results1['flag-key-2'] = {
    value: 'control',
    description: 'description-2',
    isDefaultVariant: true,
  };

  const results2 = {};
  results1['flag-key-1'] = {
    value: 'control',
    description: 'description-1',
    isDefaultVariant: false,
  };
  results1['flag-key-2'] = {
    value: 'on',
    description: 'description-2',
    isDefaultVariant: true,
  };

  const filter = new LRUAssignmentFilter(100);
  const assignment1 = new Assignment(user, results1);
  const assignment2 = new Assignment(user, results2);
  expect(filter.shouldTrack(assignment1)).toEqual(true);
  expect(filter.shouldTrack(assignment2)).toEqual(true);
});

test('filter - same result different user', async () => {
  const user1: ExperimentUser = { user_id: 'user' };
  const user2: ExperimentUser = { user_id: 'different-user' };
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

  const filter = new LRUAssignmentFilter(100);
  const assignment1 = new Assignment(user1, results);
  const assignment2 = new Assignment(user2, results);
  expect(filter.shouldTrack(assignment1)).toEqual(true);
  expect(filter.shouldTrack(assignment2)).toEqual(true);
});

test('filter - empty result', async () => {
  const user1: ExperimentUser = { user_id: 'user' };
  const user2: ExperimentUser = { user_id: 'different-user' };

  const filter = new LRUAssignmentFilter(100);
  const assignment1 = new Assignment(user1, {});
  const assignment2 = new Assignment(user1, {});
  const assignment3 = new Assignment(user2, {});
  expect(filter.shouldTrack(assignment1)).toEqual(true);
  expect(filter.shouldTrack(assignment2)).toEqual(false);
  expect(filter.shouldTrack(assignment3)).toEqual(true);
});

test('filter - duplicate assignments with different result ordering', async () => {
  const user: ExperimentUser = { user_id: 'user' };
  const result1 = {
    value: 'on',
    description: 'description-1',
    isDefaultVariant: false,
  };
  const result2 = {
    value: 'control',
    description: 'description-2',
    isDefaultVariant: true,
  };

  const results1 = {};
  const results2 = {};
  results1['flag-key-1'] = result1;
  results1['flag-key-2'] = result2;
  results2['flag-key-2'] = result2;
  results2['flag-key-1'] = result1;

  const filter = new LRUAssignmentFilter(100);
  const assignment1 = new Assignment(user, results1);
  const assignment2 = new Assignment(user, results2);
  expect(filter.shouldTrack(assignment1)).toEqual(true);
  expect(filter.shouldTrack(assignment2)).toEqual(false);
});

test('filter - lru replacement', async () => {
  const user1: ExperimentUser = { user_id: 'user1' };
  const user2: ExperimentUser = { user_id: 'user2' };
  const user3: ExperimentUser = { user_id: 'user3' };
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

  const filter = new LRUAssignmentFilter(2);
  const assignment1 = new Assignment(user1, results);
  const assignment2 = new Assignment(user2, results);
  const assignment3 = new Assignment(user3, results);
  expect(filter.shouldTrack(assignment1)).toEqual(true);
  expect(filter.shouldTrack(assignment2)).toEqual(true);
  expect(filter.shouldTrack(assignment3)).toEqual(true);
  expect(filter.shouldTrack(assignment1)).toEqual(true);
});
