import {
  FlagConfigFetcher,
  FlagConfigPoller,
  InMemoryFlagConfigCache,
} from 'src/index';
import { SdkCohortApi } from 'src/local/cohort/cohort-api';
import { CohortFetcher } from 'src/local/cohort/fetcher';
import { InMemoryCohortStorage } from 'src/local/cohort/storage';
import { sleep } from 'src/util/time';

import { FLAGS, NEW_FLAGS } from './util/mockData';
import { MockHttpClient } from './util/mockHttpClient';

afterEach(() => {
  // Note that if a test failed, and the poller has not stopped,
  // the test will hang and this won't be called.
  // So other tests may also fail as a result.
  jest.clearAllMocks();
});

test('flagConfig poller success', async () => {
  const cohortStorage = new InMemoryCohortStorage();
  const poller = new FlagConfigPoller(
    new FlagConfigFetcher(
      'key',
      new MockHttpClient(async () => ({ status: 200, body: '' })),
    ),
    new InMemoryFlagConfigCache(),
    cohortStorage,
    new CohortFetcher(
      'apikey',
      'secretkey',
      new MockHttpClient(async () => ({ status: 200, body: '' })),
    ),
    2000,
  );
  let flagPolled = 0;
  // Return FLAG for flag polls.
  jest
    .spyOn(FlagConfigFetcher.prototype, 'fetch')
    .mockImplementation(async () => {
      ++flagPolled;
      if (flagPolled == 1) return { ...FLAGS, flagPolled: { key: flagPolled } };
      return { ...NEW_FLAGS, flagPolled: { key: flagPolled } };
    });
  // Return cohort with their own cohortId.
  jest
    .spyOn(SdkCohortApi.prototype, 'getCohort')
    .mockImplementation(async (options) => {
      return {
        cohortId: options.cohortId,
        groupType: '',
        groupTypeId: 0,
        lastComputed: 0,
        lastModified: flagPolled,
        size: 0,
        memberIds: new Set<string>([]),
      };
    });
  // On start, polling should poll flags and storage should contains cohorts.
  await poller.start();
  expect(flagPolled).toBe(1);
  expect(await poller.cache.getAll()).toStrictEqual({
    ...FLAGS,
    flagPolled: { key: flagPolled },
  });
  expect(cohortStorage.getCohort('usercohort1').cohortId).toBe('usercohort1');
  expect(cohortStorage.getCohort('usercohort2').cohortId).toBe('usercohort2');
  expect(cohortStorage.getCohort('usercohort3').cohortId).toBe('usercohort3');
  expect(cohortStorage.getCohort('usercohort4').cohortId).toBe('usercohort4');
  expect(cohortStorage.getCohort('orgnamecohort1').cohortId).toBe(
    'orgnamecohort1',
  );
  expect(cohortStorage.getCohort('newcohortid')).toBeUndefined();
  expect(cohortStorage.getCohort('usercohort1').lastModified).toBe(1);
  expect(cohortStorage.getCohort('usercohort2').lastModified).toBe(1);
  expect(cohortStorage.getCohort('usercohort3').lastModified).toBe(1);
  expect(cohortStorage.getCohort('usercohort4').lastModified).toBe(1);
  expect(cohortStorage.getCohort('orgnamecohort1').lastModified).toBe(1);

  // On update, flag, existing cohort doesn't update.
  await sleep(2000);
  expect(flagPolled).toBe(2);
  expect(await poller.cache.getAll()).toStrictEqual({
    ...NEW_FLAGS,
    flagPolled: { key: flagPolled },
  });
  expect(cohortStorage.getCohort('usercohort1').cohortId).toBe('usercohort1');
  expect(cohortStorage.getCohort('usercohort2').cohortId).toBe('usercohort2');
  expect(cohortStorage.getCohort('usercohort3').cohortId).toBe('usercohort3');
  expect(cohortStorage.getCohort('usercohort4').cohortId).toBe('usercohort4');
  expect(cohortStorage.getCohort('orgnamecohort1').cohortId).toBe(
    'orgnamecohort1',
  );
  expect(cohortStorage.getCohort('anewcohortid').cohortId).toBe('anewcohortid');
  expect(cohortStorage.getCohort('usercohort1').lastModified).toBe(1);
  expect(cohortStorage.getCohort('usercohort2').lastModified).toBe(1);
  expect(cohortStorage.getCohort('usercohort3').lastModified).toBe(1);
  expect(cohortStorage.getCohort('usercohort4').lastModified).toBe(1);
  expect(cohortStorage.getCohort('orgnamecohort1').lastModified).toBe(1);
  expect(cohortStorage.getCohort('anewcohortid').lastModified).toBe(2);
  poller.stop();
});

test('flagConfig poller initial cohort error, still init', async () => {
  const poller = new FlagConfigPoller(
    new FlagConfigFetcher(
      'key',
      new MockHttpClient(async () => ({ status: 200, body: '' })),
    ),
    new InMemoryFlagConfigCache(),
    new InMemoryCohortStorage(),
    new CohortFetcher(
      'apikey',
      'secretkey',
      new MockHttpClient(async () => ({ status: 200, body: '' })),
    ),
    10,
  );
  // Fetch returns FLAGS, but cohort fails.
  jest
    .spyOn(FlagConfigFetcher.prototype, 'fetch')
    .mockImplementation(async () => {
      return FLAGS;
    });
  jest
    .spyOn(SdkCohortApi.prototype, 'getCohort')
    .mockImplementation(async () => {
      throw new Error();
    });
  // FLAGS should be empty, as cohort failed. Poller should be stopped immediately and test exists cleanly.
  try {
    // Should throw when init failed.
    await poller.start();
  } catch {
    fail();
  }
  expect(await poller.cache.getAll()).toStrictEqual(FLAGS);
  expect(poller.cohortStorage.getAllCohortIds()).toStrictEqual(
    new Set<string>(),
  );

  poller.stop();
});

test('flagConfig poller initial success, polling flag success, cohort failed, and still updates flags', async () => {
  const poller = new FlagConfigPoller(
    new FlagConfigFetcher(
      'key',
      new MockHttpClient(async () => ({ status: 200, body: '' })),
    ),
    new InMemoryFlagConfigCache(),
    new InMemoryCohortStorage(),
    new CohortFetcher(
      'apikey',
      'secretkey',
      new MockHttpClient(async () => ({ status: 200, body: '' })),
    ),
    2000,
  );

  // Only return the flag on first poll, return a different one on future polls where cohort would fail.
  let flagPolled = 0;
  jest
    .spyOn(FlagConfigFetcher.prototype, 'fetch')
    .mockImplementation(async () => {
      if (++flagPolled === 1) return FLAGS;
      return NEW_FLAGS;
    });
  // Only success on first poll and fail on all later ones.
  jest
    .spyOn(SdkCohortApi.prototype, 'getCohort')
    .mockImplementation(async (options) => {
      if (options.cohortId !== 'anewcohortid') {
        return {
          cohortId: options.cohortId,
          groupType: '',
          groupTypeId: 0,
          lastComputed: 0,
          lastModified: 10,
          size: 0,
          memberIds: new Set<string>([]),
        };
      }
      throw new Error();
    });

  // First poll should return FLAGS.
  await poller.start();
  expect(await poller.cache.getAll()).toStrictEqual(FLAGS);
  expect(flagPolled).toBe(1);

  // Second poll flags with new cohort should fail when new cohort download failed.
  // The different flag should not be updated.
  await sleep(2000);
  expect(flagPolled).toBeGreaterThanOrEqual(2);
  await sleep(250); // Wait for cohort download retry to finish.
  expect(await poller.cache.getAll()).toStrictEqual(NEW_FLAGS);

  poller.stop();
});
