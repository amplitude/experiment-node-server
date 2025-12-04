import { Exposure } from 'src/exposure/exposure';
import { InMemoryExposureFilter } from 'src/exposure/exposure-filter';
import { ExperimentUser } from 'src/types/user';
import { sleep } from 'src/util/time';

test('filter - single exposure', async () => {
  const user: ExperimentUser = { user_id: 'user' };
  const results = {
    'flag-key-1': { key: 'on', value: 'on' },
    'flag-key-2': { key: 'control', value: 'control' },
  };
  const filter = new InMemoryExposureFilter(100);
  const exposure = new Exposure(user, results);
  expect(filter.shouldTrack(exposure)).toEqual(true);
});

test('filter - duplicate exposure', async () => {
  const user: ExperimentUser = { user_id: 'user' };
  const results = {
    'flag-key-1': { key: 'on', value: 'on' },
    'flag-key-2': { key: 'control', value: 'control' },
  };
  const filter = new InMemoryExposureFilter(100);
  const exposure1 = new Exposure(user, results);
  const exposure2 = new Exposure(user, results);
  filter.shouldTrack(exposure1);
  expect(filter.shouldTrack(exposure2)).toEqual(false);
});

test('filter - same user different results', async () => {
  const user: ExperimentUser = { user_id: 'user' };
  const results1 = {
    'flag-key-1': { key: 'on', value: 'on' },
    'flag-key-2': { key: 'control', value: 'control' },
  };

  const results2 = {
    'flag-key-1': { key: 'control', value: 'control' },
    'flag-key-2': { key: 'on', value: 'on' },
  };

  const filter = new InMemoryExposureFilter(100);
  const exposure1 = new Exposure(user, results1);
  const exposure2 = new Exposure(user, results2);
  expect(filter.shouldTrack(exposure1)).toEqual(true);
  expect(filter.shouldTrack(exposure2)).toEqual(true);
});

test('filter - same result different user', async () => {
  const user1: ExperimentUser = { user_id: 'user' };
  const user2: ExperimentUser = { user_id: 'different-user' };
  const results = {
    'flag-key-1': { key: 'on', value: 'on' },
    'flag-key-2': { key: 'control', value: 'control' },
  };

  const filter = new InMemoryExposureFilter(100);
  const exposure1 = new Exposure(user1, results);
  const exposure2 = new Exposure(user2, results);
  expect(filter.shouldTrack(exposure1)).toEqual(true);
  expect(filter.shouldTrack(exposure2)).toEqual(true);
});

test('filter - empty result', async () => {
  const user1: ExperimentUser = { user_id: 'user' };
  const user2: ExperimentUser = { user_id: 'different-user' };

  const filter = new InMemoryExposureFilter(100);
  const exposure1 = new Exposure(user1, {});
  const exposure2 = new Exposure(user1, {});
  const exposure3 = new Exposure(user2, {});
  expect(filter.shouldTrack(exposure1)).toEqual(false);
  expect(filter.shouldTrack(exposure2)).toEqual(false);
  expect(filter.shouldTrack(exposure3)).toEqual(false);
});

test('filter - duplicate exposures with different result ordering', async () => {
  const user: ExperimentUser = { user_id: 'user' };
  const results1 = {
    'flag-key-1': { key: 'on', value: 'on' },
    'flag-key-2': { key: 'control', value: 'control' },
  };
  const results2 = {
    'flag-key-2': { key: 'control', value: 'control' },
    'flag-key-1': { key: 'on', value: 'on' },
  };
  const filter = new InMemoryExposureFilter(100);
  const exposure1 = new Exposure(user, results1);
  const exposure2 = new Exposure(user, results2);
  expect(filter.shouldTrack(exposure1)).toEqual(true);
  expect(filter.shouldTrack(exposure2)).toEqual(false);
});

test('filter - lru replacement', async () => {
  const user1: ExperimentUser = { user_id: 'user1' };
  const user2: ExperimentUser = { user_id: 'user2' };
  const user3: ExperimentUser = { user_id: 'user3' };
  const results = {
    'flag-key-1': { key: 'on', value: 'on' },
    'flag-key-2': { key: 'control', value: 'control' },
  };

  const filter = new InMemoryExposureFilter(2);
  const exposure1 = new Exposure(user1, results);
  const exposure2 = new Exposure(user2, results);
  const exposure3 = new Exposure(user3, results);
  expect(filter.shouldTrack(exposure1)).toEqual(true);
  expect(filter.shouldTrack(exposure2)).toEqual(true);
  expect(filter.shouldTrack(exposure3)).toEqual(true);
  expect(filter.shouldTrack(exposure1)).toEqual(true);
});

test('filter - ttl-based eviction', async () => {
  const user1: ExperimentUser = { user_id: 'user' };
  const user2: ExperimentUser = { user_id: 'different-user' };
  const results = {
    'flag-key-1': { key: 'on', value: 'on' },
    'flag-key-2': { key: 'control', value: 'control' },
  };

  const filter = new InMemoryExposureFilter(100, 1000);
  const exposure1 = new Exposure(user1, results);
  const exposure2 = new Exposure(user2, results);
  // expect exposure1 to be evicted
  expect(filter.shouldTrack(exposure1)).toEqual(true);
  await sleep(1050);
  expect(filter.shouldTrack(exposure1)).toEqual(true);
  // expect exposure2 to not be evicted
  expect(filter.shouldTrack(exposure2)).toEqual(true);
  await sleep(950);
  expect(filter.shouldTrack(exposure2)).toEqual(false);
});
