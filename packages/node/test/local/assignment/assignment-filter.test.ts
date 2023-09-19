import { Assignment } from '../../../../node/src/assignment/assignment';
import { InMemoryAssignmentFilter } from '../../../../node/src/assignment/assignment-filter';
import { ExperimentUser } from '../../../../node/src/types/user';
import { sleep } from '../../../../node/src/util/time';

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

  const filter = new InMemoryAssignmentFilter(100);
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

  const filter = new InMemoryAssignmentFilter(100);
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
  results2['flag-key-1'] = {
    value: 'control',
    description: 'description-1',
    isDefaultVariant: false,
  };
  results2['flag-key-2'] = {
    value: 'on',
    description: 'description-2',
    isDefaultVariant: true,
  };

  const filter = new InMemoryAssignmentFilter(100);
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

  const filter = new InMemoryAssignmentFilter(100);
  const assignment1 = new Assignment(user1, results);
  const assignment2 = new Assignment(user2, results);
  expect(filter.shouldTrack(assignment1)).toEqual(true);
  expect(filter.shouldTrack(assignment2)).toEqual(true);
});

test('filter - empty result', async () => {
  const user1: ExperimentUser = { user_id: 'user' };
  const user2: ExperimentUser = { user_id: 'different-user' };

  const filter = new InMemoryAssignmentFilter(100);
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

  const filter = new InMemoryAssignmentFilter(100);
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

  const filter = new InMemoryAssignmentFilter(2);
  const assignment1 = new Assignment(user1, results);
  const assignment2 = new Assignment(user2, results);
  const assignment3 = new Assignment(user3, results);
  expect(filter.shouldTrack(assignment1)).toEqual(true);
  expect(filter.shouldTrack(assignment2)).toEqual(true);
  expect(filter.shouldTrack(assignment3)).toEqual(true);
  expect(filter.shouldTrack(assignment1)).toEqual(true);
});

test('filter - ttl-based eviction', async () => {
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

  const filter = new InMemoryAssignmentFilter(100, 1000);
  const assignment1 = new Assignment(user1, results);
  const assignment2 = new Assignment(user2, results);
  // expect assignment1 to be evicted
  expect(filter.shouldTrack(assignment1)).toEqual(true);
  await sleep(1050);
  expect(filter.shouldTrack(assignment1)).toEqual(true);
  // expect assignment2 to not be evicted
  expect(filter.shouldTrack(assignment2)).toEqual(true);
  await sleep(950);
  expect(filter.shouldTrack(assignment2)).toEqual(false);
});

test('filter - returns false on empty assignment results', () => {
  const filter = new InMemoryAssignmentFilter(100, 1000);
  const emptyAssignment = new Assignment({ user_id: 'user' }, {});
  expect(filter.shouldTrack(emptyAssignment)).toEqual(false);
});
