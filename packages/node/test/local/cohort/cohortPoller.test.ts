import { CohortFetcher } from 'src/local/cohort/fetcher';
import { CohortPoller } from 'src/local/cohort/poller';
import { InMemoryCohortStorage } from 'src/local/cohort/storage';
import { CohortConfigDefaults } from 'src/types/config';

const COHORTS = {
  c1: {
    cohortId: 'c1',
    groupType: 'a',
    groupTypeId: 0,
    lastComputed: 0,
    lastModified: 1,
    size: 2,
    memberIds: new Set<string>(['membera1', 'membera2']),
  },
  c2: {
    cohortId: 'c2',
    groupType: 'a',
    groupTypeId: 0,
    lastComputed: 0,
    lastModified: 10,
    size: 3,
    memberIds: new Set<string>(['membera1', 'membera2', 'membera3']),
  },
  c3: {
    cohortId: 'c3',
    groupType: 'a',
    groupTypeId: 0,
    lastComputed: 0,
    lastModified: 10,
    size: 3,
    memberIds: new Set<string>(['membera1', 'membera2', 'membera3']),
  },
};

afterEach(() => {
  jest.clearAllMocks();
});

test('', async () => {
  const fetcher = new CohortFetcher('', '', null);
  const fetcherFetchSpy = jest.spyOn(fetcher, 'fetch');
  fetcherFetchSpy.mockImplementation(
    async (cohortId: string) => COHORTS[cohortId],
  );

  const storage = new InMemoryCohortStorage();
  const storageReplaceAllSpy = jest.spyOn(storage, 'replaceAll');
  const storageGetCohortSpy = jest.spyOn(storage, 'getCohort');

  const cohortPoller = new CohortPoller(fetcher, storage);

  await cohortPoller.update(new Set(['c1', 'c2']));

  expect(fetcherFetchSpy).toHaveBeenCalledWith(
    'c1',
    CohortConfigDefaults.maxCohortSize,
    undefined,
  );
  expect(fetcherFetchSpy).toHaveBeenCalledWith(
    'c2',
    CohortConfigDefaults.maxCohortSize,
    undefined,
  );
  expect(storageGetCohortSpy).toHaveBeenCalledWith('c1');
  expect(storageGetCohortSpy).toHaveBeenCalledWith('c2');
  expect(storageReplaceAllSpy).toHaveBeenCalledWith({
    c1: COHORTS['c1'],
    c2: COHORTS['c2'],
  });
});

test('cohort fetch all failed', async () => {
  const fetcher = new CohortFetcher('', '', null);
  const fetcherFetchSpy = jest.spyOn(fetcher, 'fetch');
  fetcherFetchSpy.mockImplementation(async () => {
    throw Error();
  });

  const storage = new InMemoryCohortStorage();
  const storageReplaceAllSpy = jest.spyOn(storage, 'replaceAll');
  const storageGetCohortSpy = jest.spyOn(storage, 'getCohort');
  expect(storageReplaceAllSpy).toHaveBeenCalledTimes(0);

  const cohortPoller = new CohortPoller(fetcher, storage);

  await expect(
    cohortPoller.update(new Set(['c1', 'c2', 'c3'])),
  ).rejects.toThrow();

  expect(fetcherFetchSpy).toHaveBeenCalled();
  expect(storageGetCohortSpy).toHaveBeenCalled();
  expect(storageReplaceAllSpy).toHaveBeenCalledTimes(0);
});

test('cohort fetch partial failed', async () => {
  const fetcher = new CohortFetcher('', '', null);
  const fetcherFetchSpy = jest.spyOn(fetcher, 'fetch');
  fetcherFetchSpy.mockImplementation(async (cohortId: string) => {
    if (cohortId === 'c3') {
      throw Error();
    }
    return COHORTS[cohortId];
  });

  const storage = new InMemoryCohortStorage();
  const storageReplaceAllSpy = jest.spyOn(storage, 'replaceAll');
  const storageGetCohortSpy = jest.spyOn(storage, 'getCohort');

  const cohortPoller = new CohortPoller(fetcher, storage);

  await expect(
    cohortPoller.update(new Set(['c1', 'c2', 'c3'])),
  ).rejects.toThrow();

  expect(fetcherFetchSpy).toHaveBeenCalled();
  expect(storageGetCohortSpy).toHaveBeenCalled();
  expect(storageReplaceAllSpy).toHaveBeenCalledTimes(0);
});

test('cohort fetch no change', async () => {
  const fetcher = new CohortFetcher('', '', null);
  const fetcherFetchSpy = jest.spyOn(fetcher, 'fetch');
  fetcherFetchSpy.mockImplementation(async () => undefined);

  const storage = new InMemoryCohortStorage();
  const storageReplaceAllSpy = jest.spyOn(storage, 'replaceAll');
  const storageGetCohortSpy = jest.spyOn(storage, 'getCohort');

  const cohortPoller = new CohortPoller(fetcher, storage);

  await cohortPoller.update(new Set(['c1', 'c2']));
  expect(fetcherFetchSpy).toHaveBeenCalledWith(
    'c1',
    CohortConfigDefaults.maxCohortSize,
    undefined,
  );
  expect(fetcherFetchSpy).toHaveBeenCalledWith(
    'c2',
    CohortConfigDefaults.maxCohortSize,
    undefined,
  );
  expect(storageGetCohortSpy).toHaveBeenCalledWith('c1');
  expect(storageGetCohortSpy).toHaveBeenCalledWith('c2');
  expect(storageReplaceAllSpy).toHaveBeenCalledTimes(0);
});

test('cohort fetch partial changed', async () => {
  const fetcher = new CohortFetcher('', '', null);
  const fetcherFetchSpy = jest.spyOn(fetcher, 'fetch');
  fetcherFetchSpy.mockImplementation(async (cohortId: string) => {
    if (cohortId === 'c1') {
      return undefined;
    }
    return COHORTS[cohortId];
  });

  const storage = new InMemoryCohortStorage();
  const storageReplaceAllSpy = jest.spyOn(storage, 'replaceAll');
  const storageGetCohortSpy = jest.spyOn(storage, 'getCohort');

  const cohortPoller = new CohortPoller(fetcher, storage);

  await cohortPoller.update(new Set(['c1', 'c2']));
  expect(fetcherFetchSpy).toHaveBeenCalledWith(
    'c1',
    CohortConfigDefaults.maxCohortSize,
    undefined,
  );
  expect(fetcherFetchSpy).toHaveBeenCalledWith(
    'c2',
    CohortConfigDefaults.maxCohortSize,
    undefined,
  );
  expect(storageGetCohortSpy).toHaveBeenCalledWith('c1');
  expect(storageGetCohortSpy).toHaveBeenCalledWith('c2');
  expect(storageReplaceAllSpy).toHaveBeenCalledTimes(1);
});

test('cohort fetch using maxCohortSize', async () => {
  const fetcher = new CohortFetcher('', '', null);
  const fetcherFetchSpy = jest.spyOn(fetcher, 'fetch');
  fetcherFetchSpy.mockImplementation(
    async (cohortId: string) => COHORTS[cohortId],
  );

  const storage = new InMemoryCohortStorage();
  const storageReplaceAllSpy = jest.spyOn(storage, 'replaceAll');
  const storageGetCohortSpy = jest.spyOn(storage, 'getCohort');

  const cohortPoller = new CohortPoller(fetcher, storage, 100);

  await cohortPoller.update(new Set(['c1', 'c2']));
  expect(fetcherFetchSpy).toHaveBeenCalledWith('c1', 100, undefined);
  expect(fetcherFetchSpy).toHaveBeenCalledWith('c2', 100, undefined);
  expect(storageGetCohortSpy).toHaveBeenCalledWith('c1');
  expect(storageGetCohortSpy).toHaveBeenCalledWith('c2');
  expect(storageReplaceAllSpy).toHaveBeenCalledTimes(1);
});

test('cohort fetch using lastModified', async () => {
  const fetcher = new CohortFetcher('', '', null);
  const fetcherFetchSpy = jest.spyOn(fetcher, 'fetch');
  fetcherFetchSpy.mockImplementation(
    async (cohortId: string, maxCohortSize: number, lastModified?) => {
      if (lastModified === COHORTS[cohortId].lastModified) {
        return undefined;
      }
      return COHORTS[cohortId];
    },
  );

  const storage = new InMemoryCohortStorage();
  const storageReplaceAllSpy = jest.spyOn(storage, 'replaceAll');
  const storageGetCohortSpy = jest.spyOn(storage, 'getCohort');

  const cohortPoller = new CohortPoller(fetcher, storage);

  await cohortPoller.update(new Set(['c1', 'c2']));
  expect(fetcherFetchSpy).toHaveBeenCalledWith(
    'c1',
    CohortConfigDefaults.maxCohortSize,
    undefined,
  );
  expect(fetcherFetchSpy).toHaveBeenCalledWith(
    'c2',
    CohortConfigDefaults.maxCohortSize,
    undefined,
  );
  expect(storageGetCohortSpy).toHaveBeenCalledWith('c1');
  expect(storageGetCohortSpy).toHaveBeenCalledWith('c2');
  expect(storageReplaceAllSpy).toHaveBeenCalledTimes(1);
  jest.clearAllMocks();

  await cohortPoller.update(new Set(['c1', 'c2']));
  expect(fetcherFetchSpy).toHaveBeenCalledWith(
    'c1',
    CohortConfigDefaults.maxCohortSize,
    COHORTS['c1'].lastModified,
  );
  expect(fetcherFetchSpy).toHaveBeenCalledWith(
    'c2',
    CohortConfigDefaults.maxCohortSize,
    COHORTS['c2'].lastModified,
  );
  expect(storageGetCohortSpy).toHaveBeenCalledWith('c1');
  expect(storageGetCohortSpy).toHaveBeenCalledWith('c2');
  expect(storageReplaceAllSpy).toHaveBeenCalledTimes(0);
  jest.clearAllMocks();

  await cohortPoller.update(new Set(['c1', 'c2', 'c3']));
  expect(fetcherFetchSpy).toHaveBeenCalledWith(
    'c1',
    CohortConfigDefaults.maxCohortSize,
    COHORTS['c1'].lastModified,
  );
  expect(fetcherFetchSpy).toHaveBeenCalledWith(
    'c2',
    CohortConfigDefaults.maxCohortSize,
    COHORTS['c2'].lastModified,
  );
  expect(fetcherFetchSpy).toHaveBeenCalledWith(
    'c3',
    CohortConfigDefaults.maxCohortSize,
    undefined,
  );
  expect(storageGetCohortSpy).toHaveBeenCalledWith('c1');
  expect(storageGetCohortSpy).toHaveBeenCalledWith('c2');
  expect(storageGetCohortSpy).toHaveBeenCalledWith('c3');
  expect(storageReplaceAllSpy).toHaveBeenCalledTimes(1);
  jest.clearAllMocks();
});
