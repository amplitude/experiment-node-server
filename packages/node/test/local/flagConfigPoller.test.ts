import {
  FlagConfigFetcher,
  FlagConfigPoller,
  InMemoryFlagConfigCache,
} from 'src/index';
import { SdkCohortApi } from 'src/local/cohort/cohort-api';
import { CohortFetcher } from 'src/local/cohort/fetcher';
import { InMemoryCohortStorage } from 'src/local/cohort/storage';

import { MockHttpClient } from './util/mockHttpClient';

const FLAG = [
  {
    key: 'flag1',
    segments: [
      {
        conditions: [
          [
            {
              op: 'set contains any',
              selector: ['context', 'user', 'cohort_ids'],
              values: ['hahahaha1'],
            },
          ],
        ],
      },
      {
        metadata: {
          segmentName: 'All Other Users',
        },
        variant: 'off',
      },
    ],
    variants: {},
  },
  {
    key: 'flag2',
    segments: [
      {
        conditions: [
          [
            {
              op: 'set contains any',
              selector: ['context', 'user', 'cohort_ids'],
              values: ['hahahaha2'],
            },
          ],
        ],
        metadata: {
          segmentName: 'Segment 1',
        },
        variant: 'off',
      },
      {
        metadata: {
          segmentName: 'All Other Users',
        },
        variant: 'off',
      },
    ],
    variants: {},
  },
  {
    key: 'flag3',
    metadata: {
      deployed: true,
      evaluationMode: 'local',
      experimentKey: 'exp-1',
      flagType: 'experiment',
      flagVersion: 6,
    },
    segments: [
      {
        conditions: [
          [
            {
              op: 'set contains any',
              selector: ['context', 'user', 'cohort_ids'],
              values: ['hahahaha3'],
            },
          ],
        ],
        variant: 'off',
      },
      {
        conditions: [
          [
            {
              op: 'set contains any',
              selector: ['context', 'user', 'cocoids'],
              values: ['nohaha'],
            },
          ],
        ],
        variant: 'off',
      },
      {
        metadata: {
          segmentName: 'All Other Users',
        },
        variant: 'off',
      },
    ],
    variants: {},
  },
  {
    key: 'flag5',
    segments: [
      {
        conditions: [
          [
            {
              op: 'set contains any',
              selector: ['context', 'user', 'cohort_ids'],
              values: ['hahahaha3', 'hahahaha4'],
            },
          ],
        ],
      },
      {
        conditions: [
          [
            {
              op: 'set contains any',
              selector: ['context', 'groups', 'org name', 'cohort_ids'],
              values: ['hahaorgname1'],
            },
          ],
        ],
        metadata: {
          segmentName: 'Segment 1',
        },
      },
      {
        conditions: [
          [
            {
              op: 'set contains any',
              selector: ['context', 'gg', 'org name', 'cohort_ids'],
              values: ['nohahaorgname'],
            },
          ],
        ],
        metadata: {
          segmentName: 'Segment 1',
        },
      },
    ],
    variants: {},
  },
].reduce((acc, flag) => {
  acc[flag.key] = flag;
  return acc;
}, {});

const NEW_FLAGS = {
  ...FLAG,
  flag6: {
    key: 'flag6',
    segments: [
      {
        conditions: [
          [
            {
              op: 'set contains any',
              selector: ['context', 'user', 'cohort_ids'],
              values: ['anewcohortid'],
            },
          ],
        ],
      },
    ],
    variants: {},
  },
};

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
      if (flagPolled == 1) return { ...FLAG, flagPolled: { key: flagPolled } };
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
    ...FLAG,
    flagPolled: { key: flagPolled },
  });
  expect(cohortStorage.getCohort('hahahaha1').cohortId).toBe('hahahaha1');
  expect(cohortStorage.getCohort('hahahaha2').cohortId).toBe('hahahaha2');
  expect(cohortStorage.getCohort('hahahaha3').cohortId).toBe('hahahaha3');
  expect(cohortStorage.getCohort('hahahaha4').cohortId).toBe('hahahaha4');
  expect(cohortStorage.getCohort('hahaorgname1').cohortId).toBe('hahaorgname1');
  expect(cohortStorage.getCohort('newcohortid')).toBeUndefined();
  expect(cohortStorage.getCohort('hahahaha1').lastModified).toBe(1);
  expect(cohortStorage.getCohort('hahahaha2').lastModified).toBe(1);
  expect(cohortStorage.getCohort('hahahaha3').lastModified).toBe(1);
  expect(cohortStorage.getCohort('hahahaha4').lastModified).toBe(1);
  expect(cohortStorage.getCohort('hahaorgname1').lastModified).toBe(1);

  // On update, flag, existing cohort doesn't update.
  await new Promise((f) => setTimeout(f, 2000));
  expect(flagPolled).toBe(2);
  expect(await poller.cache.getAll()).toStrictEqual({
    ...NEW_FLAGS,
    flagPolled: { key: flagPolled },
  });
  expect(cohortStorage.getCohort('hahahaha1').cohortId).toBe('hahahaha1');
  expect(cohortStorage.getCohort('hahahaha2').cohortId).toBe('hahahaha2');
  expect(cohortStorage.getCohort('hahahaha3').cohortId).toBe('hahahaha3');
  expect(cohortStorage.getCohort('hahahaha4').cohortId).toBe('hahahaha4');
  expect(cohortStorage.getCohort('hahaorgname1').cohortId).toBe('hahaorgname1');
  expect(cohortStorage.getCohort('anewcohortid').cohortId).toBe('anewcohortid');
  expect(cohortStorage.getCohort('hahahaha1').lastModified).toBe(1);
  expect(cohortStorage.getCohort('hahahaha2').lastModified).toBe(1);
  expect(cohortStorage.getCohort('hahahaha3').lastModified).toBe(1);
  expect(cohortStorage.getCohort('hahahaha4').lastModified).toBe(1);
  expect(cohortStorage.getCohort('hahaorgname1').lastModified).toBe(1);
  expect(cohortStorage.getCohort('anewcohortid').lastModified).toBe(2);
  poller.stop();
});

test('flagConfig poller initial error', async () => {
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
  // Fetch returns FLAG, but cohort fails.
  jest
    .spyOn(FlagConfigFetcher.prototype, 'fetch')
    .mockImplementation(async () => {
      return FLAG;
    });
  jest
    .spyOn(SdkCohortApi.prototype, 'getCohort')
    .mockImplementation(async () => {
      throw new Error();
    });
  // FLAG should be empty, as cohort failed. Poller should be stopped immediately and test exists cleanly.
  try {
    // Should throw when init failed.
    await poller.start();
    fail();
    // eslint-disable-next-line no-empty
  } catch {}
  expect(await poller.cache.getAll()).toStrictEqual({});
});

test('flagConfig poller initial success, polling error and use old flags', async () => {
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
      if (++flagPolled === 1) return FLAG;
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

  // First poll should return FLAG.
  await poller.start();
  expect(await poller.cache.getAll()).toStrictEqual(FLAG);
  expect(flagPolled).toBe(1);

  // Second poll flags with new cohort should fail when new cohort download failed.
  // The different flag should not be updated.
  await new Promise((f) => setTimeout(f, 2000));
  expect(flagPolled).toBeGreaterThanOrEqual(2);
  expect(await poller.cache.getAll()).toStrictEqual(FLAG);

  poller.stop();
});
