import {
  FlagConfigFetcher,
  FlagConfigPoller,
  InMemoryFlagConfigCache,
} from 'src/index';
import { CohortFetcher } from 'src/local/cohort/fetcher';
import { CohortPoller } from 'src/local/cohort/poller';
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
    2000,
    new CohortPoller(
      new CohortFetcher(
        'apikey',
        'secretkey',
        new MockHttpClient(async () => ({ status: 200, body: '' })),
      ),
      cohortStorage,
    ),
  );
  let flagPolled = 0;
  // Return FLAG for flag polls.
  jest
    .spyOn(FlagConfigFetcher.prototype, 'fetch')
    .mockImplementation(async () => {
      return { ...FLAG, flagPolled: { key: flagPolled++ } };
    });
  // Return cohort with their own cohortId.
  jest
    .spyOn(CohortFetcher.prototype, 'fetch')
    .mockImplementation(async (cohortId) => {
      return {
        cohortId: cohortId,
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
    flagPolled: { key: 0 },
  });
  expect(cohortStorage.getCohort('hahahaha1').cohortId).toBe('hahahaha1');
  expect(cohortStorage.getCohort('hahahaha2').cohortId).toBe('hahahaha2');
  expect(cohortStorage.getCohort('hahahaha3').cohortId).toBe('hahahaha3');
  expect(cohortStorage.getCohort('hahahaha4').cohortId).toBe('hahahaha4');
  expect(cohortStorage.getCohort('hahaorgname1').cohortId).toBe('hahaorgname1');
  expect(cohortStorage.getCohort('hahahaha1').lastModified).toBe(1);
  expect(cohortStorage.getCohort('hahahaha2').lastModified).toBe(1);
  expect(cohortStorage.getCohort('hahahaha3').lastModified).toBe(1);
  expect(cohortStorage.getCohort('hahahaha4').lastModified).toBe(1);
  expect(cohortStorage.getCohort('hahaorgname1').lastModified).toBe(1);

  // On update, flag and cohort should both be updated.
  await new Promise((f) => setTimeout(f, 2000));
  expect(flagPolled).toBe(2);
  expect(await poller.cache.getAll()).toStrictEqual({
    ...FLAG,
    flagPolled: { key: 1 },
  });
  expect(cohortStorage.getCohort('hahahaha1').cohortId).toBe('hahahaha1');
  expect(cohortStorage.getCohort('hahahaha2').cohortId).toBe('hahahaha2');
  expect(cohortStorage.getCohort('hahahaha3').cohortId).toBe('hahahaha3');
  expect(cohortStorage.getCohort('hahahaha4').cohortId).toBe('hahahaha4');
  expect(cohortStorage.getCohort('hahaorgname1').cohortId).toBe('hahaorgname1');
  expect(cohortStorage.getCohort('hahahaha1').lastModified).toBe(2);
  expect(cohortStorage.getCohort('hahahaha2').lastModified).toBe(2);
  expect(cohortStorage.getCohort('hahahaha3').lastModified).toBe(2);
  expect(cohortStorage.getCohort('hahahaha4').lastModified).toBe(2);
  expect(cohortStorage.getCohort('hahaorgname1').lastModified).toBe(2);
  poller.stop();
});

test('flagConfig poller initial error', async () => {
  const poller = new FlagConfigPoller(
    new FlagConfigFetcher(
      'key',
      new MockHttpClient(async () => ({ status: 200, body: '' })),
    ),
    new InMemoryFlagConfigCache(),
    10,
    new CohortPoller(
      new CohortFetcher(
        'apikey',
        'secretkey',
        new MockHttpClient(async () => ({ status: 200, body: '' })),
      ),
      new InMemoryCohortStorage(),
    ),
  );
  // Fetch returns FLAG, but cohort fails.
  jest
    .spyOn(FlagConfigFetcher.prototype, 'fetch')
    .mockImplementation(async () => {
      return FLAG;
    });
  jest.spyOn(CohortPoller.prototype, 'update').mockImplementation(async () => {
    throw new Error();
  });
  // FLAG should be empty, as cohort failed. Poller should be stopped immediately and test exists cleanly.
  await poller.start();
  expect(await poller.cache.getAll()).toStrictEqual({});
});

test('flagConfig poller initial success, polling error and use old flags', async () => {
  const poller = new FlagConfigPoller(
    new FlagConfigFetcher(
      'key',
      new MockHttpClient(async () => ({ status: 200, body: '' })),
    ),
    new InMemoryFlagConfigCache(),
    2000,
    new CohortPoller(
      new CohortFetcher(
        'apikey',
        'secretkey',
        new MockHttpClient(async () => ({ status: 200, body: '' })),
      ),
      new InMemoryCohortStorage(),
    ),
  );

  // Only return the flag on first poll, return a different one on future polls where cohort would fail.
  let cohortPolled = 0;
  jest
    .spyOn(FlagConfigFetcher.prototype, 'fetch')
    .mockImplementation(async () => {
      if (cohortPolled === 0) return FLAG;
      return {};
    });
  // Only success on first poll and fail on all later ones.
  jest.spyOn(CohortPoller.prototype, 'update').mockImplementation(async () => {
    if (cohortPolled++ === 0) return;
    throw new Error();
  });

  // First poll should return FLAG.
  await poller.start();
  expect(await poller.cache.getAll()).toStrictEqual(FLAG);
  expect(cohortPolled).toBe(1);

  // Second poll should fail. The different flag should not be updated.
  await new Promise((f) => setTimeout(f, 2000));
  expect(cohortPolled).toBe(2);
  expect(await poller.cache.getAll()).toStrictEqual(FLAG);

  poller.stop();
});
