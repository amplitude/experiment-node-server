import { SdkCohortApi } from 'src/local/cohort/cohort-api';
import { CohortFetcher } from 'src/local/cohort/fetcher';
import { CohortPoller } from 'src/local/cohort/poller';
import { InMemoryCohortStorage } from 'src/local/cohort/storage';
import { CohortStorage } from 'src/types/cohort';
import { sleep } from 'src/util/time';

const OLD_COHORTS = {
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

const NEW_COHORTS = {
  c1: {
    cohortId: 'c1',
    groupType: 'a',
    groupTypeId: 0,
    lastComputed: 1,
    lastModified: 2,
    size: 2,
    memberIds: new Set<string>(['membera1', 'membera2']),
  },
  c2: {
    cohortId: 'c2',
    groupType: 'a',
    groupTypeId: 0,
    lastComputed: 0,
    lastModified: 20,
    size: 3,
    memberIds: new Set<string>(['membera1', 'membera2', 'membera3']),
  },
  c3: {
    cohortId: 'c3',
    groupType: 'a',
    groupTypeId: 0,
    lastComputed: 0,
    lastModified: 20,
    size: 3,
    memberIds: new Set<string>(['membera1', 'membera2', 'membera3']),
  },
};

const POLL_MILLIS = 500;
let storage: CohortStorage;
let fetcher: CohortFetcher;
let poller: CohortPoller;
let storageGetAllCohortIdsSpy: jest.SpyInstance;
let storageGetCohortSpy: jest.SpyInstance;
let storagePutSpy: jest.SpyInstance;

beforeEach(() => {
  storage = new InMemoryCohortStorage();
  fetcher = new CohortFetcher('', '', null);
  poller = new CohortPoller(fetcher, storage, POLL_MILLIS);

  storageGetAllCohortIdsSpy = jest.spyOn(storage, 'getAllCohortIds');
  storageGetAllCohortIdsSpy.mockImplementation(
    () => new Set<string>(['c1', 'c2']),
  );
  storageGetCohortSpy = jest.spyOn(storage, 'getCohort');
  storageGetCohortSpy.mockImplementation(
    (cohortId: string) => OLD_COHORTS[cohortId],
  );
  storagePutSpy = jest.spyOn(storage, 'put');
});

afterEach(() => {
  poller.stop();
  jest.clearAllMocks();
});

test('CohortPoller update success', async () => {
  const fetcherFetchSpy = jest.spyOn(fetcher, 'fetch');
  fetcherFetchSpy.mockImplementation(
    async (cohortId: string) => NEW_COHORTS[cohortId],
  );

  await poller.update();

  for (const cohortId of storage.getAllCohortIds()) {
    expect(storageGetCohortSpy).toHaveBeenCalledWith(cohortId);
    expect(fetcherFetchSpy).toHaveBeenCalledWith(
      cohortId,
      OLD_COHORTS[cohortId].lastModified,
    );
  }
  expect(storagePutSpy).toHaveBeenCalledWith(NEW_COHORTS['c1']);
  expect(storagePutSpy).toHaveBeenCalledWith(NEW_COHORTS['c2']);
});

test("CohortPoller update don't update unchanged cohort", async () => {
  const fetcherFetchSpy = jest.spyOn(fetcher, 'fetch');
  fetcherFetchSpy.mockImplementation(async (cohortId) => {
    if (cohortId === 'c1') {
      return NEW_COHORTS['c1'];
    }
    return undefined;
  });

  await poller.update();

  for (const cohortId of storage.getAllCohortIds()) {
    expect(storageGetCohortSpy).toHaveBeenCalledWith(cohortId);
    expect(fetcherFetchSpy).toHaveBeenCalledWith(
      cohortId,
      OLD_COHORTS[cohortId].lastModified,
    );
  }
  expect(storagePutSpy).toHaveBeenCalledWith(NEW_COHORTS['c1']);
  expect(storagePutSpy).toHaveBeenCalledTimes(1);
});

test("CohortPoller update error don't update cohort", async () => {
  const fetcherFetchSpy = jest.spyOn(fetcher, 'fetch');
  fetcherFetchSpy.mockImplementation(async (cohortId) => {
    if (cohortId === 'c1') {
      return NEW_COHORTS['c1'];
    }
    throw Error();
  });

  await poller.update();

  for (const cohortId of storage.getAllCohortIds()) {
    expect(storageGetCohortSpy).toHaveBeenCalledWith(cohortId);
    expect(fetcherFetchSpy).toHaveBeenCalledWith(
      cohortId,
      OLD_COHORTS[cohortId].lastModified,
    );
  }
  expect(storagePutSpy).toHaveBeenCalledTimes(1);
  expect(storagePutSpy).toHaveBeenCalledWith(NEW_COHORTS['c1']);
});

test('CohortPoller update no lastModified still fetches cohort', async () => {
  const fetcherFetchSpy = jest.spyOn(fetcher, 'fetch');
  fetcherFetchSpy.mockImplementation(async (cohortId) => NEW_COHORTS[cohortId]);
  storageGetCohortSpy.mockImplementation((cohortId: string) => {
    const cohort = OLD_COHORTS[cohortId];
    if (cohortId === 'c2') {
      delete cohort['lastModified'];
    }
    return cohort;
  });

  await poller.update();

  expect(storageGetCohortSpy).toHaveBeenCalledWith('c1');
  expect(fetcherFetchSpy).toHaveBeenCalledWith(
    'c1',
    OLD_COHORTS['c1'].lastModified,
  );
  expect(storageGetCohortSpy).toHaveBeenCalledWith('c2');
  expect(fetcherFetchSpy).toHaveBeenCalledWith('c2', undefined);
  expect(storagePutSpy).toHaveBeenCalledTimes(2);
  expect(storagePutSpy).toHaveBeenCalledWith(NEW_COHORTS['c1']);
  expect(storagePutSpy).toHaveBeenCalledWith(NEW_COHORTS['c2']);
});

test('CohortPoller polls every defined ms', async () => {
  const fetcherFetchSpy = jest.spyOn(fetcher, 'fetch');
  fetcherFetchSpy.mockImplementation(async (cohortId) => {
    return NEW_COHORTS[cohortId];
  });

  const pollerUpdateSpy = jest.spyOn(poller, 'update');

  await poller.start();

  await sleep(100);
  expect(pollerUpdateSpy).toHaveBeenCalledTimes(0);
  expect(storageGetCohortSpy).toHaveBeenCalledTimes(0);
  expect(fetcherFetchSpy).toHaveBeenCalledTimes(0);
  expect(storagePutSpy).toHaveBeenCalledTimes(0);

  await sleep(POLL_MILLIS);
  expect(pollerUpdateSpy).toHaveBeenCalledTimes(1);
  expect(storageGetCohortSpy).toHaveBeenCalledTimes(2);
  expect(fetcherFetchSpy).toHaveBeenCalledTimes(2);
  expect(storagePutSpy).toHaveBeenCalledTimes(2);

  await sleep(POLL_MILLIS);
  expect(pollerUpdateSpy).toHaveBeenCalledTimes(2);
  expect(storageGetCohortSpy).toHaveBeenCalledTimes(4);
  expect(fetcherFetchSpy).toHaveBeenCalledTimes(4);
  expect(storagePutSpy).toHaveBeenCalledTimes(4);

  await sleep(POLL_MILLIS);
  expect(pollerUpdateSpy).toHaveBeenCalledTimes(3);
  expect(storageGetCohortSpy).toHaveBeenCalledTimes(6);
  expect(fetcherFetchSpy).toHaveBeenCalledTimes(6);
  expect(storagePutSpy).toHaveBeenCalledTimes(6);

  for (const cohortId of storage.getAllCohortIds()) {
    expect(storageGetCohortSpy).toHaveBeenCalledWith(cohortId);
    expect(fetcherFetchSpy).toHaveBeenCalledWith(
      cohortId,
      OLD_COHORTS[cohortId].lastModified,
    );
  }
});

test('CohortPoller polls takes long time but only makes necessary requests', async () => {
  const cohortApiGetCohortSpy = jest.spyOn(SdkCohortApi.prototype, 'getCohort');
  cohortApiGetCohortSpy.mockImplementation(async (options) => {
    await new Promise((resolve) => setTimeout(resolve, POLL_MILLIS * 2.25));
    return NEW_COHORTS[options.cohortId];
  });

  const pollerUpdateSpy = jest.spyOn(poller, 'update');

  await poller.start();

  await sleep(100);
  expect(pollerUpdateSpy).toHaveBeenCalledTimes(0);
  expect(storageGetCohortSpy).toHaveBeenCalledTimes(0);
  expect(cohortApiGetCohortSpy).toHaveBeenCalledTimes(0);

  await sleep(POLL_MILLIS);
  expect(pollerUpdateSpy).toHaveBeenCalledTimes(1);
  expect(storageGetCohortSpy).toHaveBeenCalledTimes(2);
  expect(cohortApiGetCohortSpy).toHaveBeenCalledTimes(2);

  await sleep(POLL_MILLIS);
  expect(pollerUpdateSpy).toHaveBeenCalledTimes(2);
  expect(storageGetCohortSpy).toHaveBeenCalledTimes(4);
  expect(cohortApiGetCohortSpy).toHaveBeenCalledTimes(2);

  await sleep(POLL_MILLIS);
  expect(pollerUpdateSpy).toHaveBeenCalledTimes(3);
  expect(storageGetCohortSpy).toHaveBeenCalledTimes(6);
  expect(cohortApiGetCohortSpy).toHaveBeenCalledTimes(2);

  for (const cohortId of storage.getAllCohortIds()) {
    expect(storageGetCohortSpy).toHaveBeenCalledWith(cohortId);
  }
  expect(storagePutSpy).toHaveBeenCalledTimes(0);

  await sleep(POLL_MILLIS / 2);

  expect(storagePutSpy).toHaveBeenCalledTimes(6);
});

test('CohortPoller polls every defined ms with failures', async () => {
  const fetcherFetchSpy = jest.spyOn(fetcher, 'fetch');

  const pollerUpdateSpy = jest.spyOn(poller, 'update');

  await poller.start();

  await sleep(100);
  expect(pollerUpdateSpy).toHaveBeenCalledTimes(0);
  expect(storageGetCohortSpy).toHaveBeenCalledTimes(0);
  expect(fetcherFetchSpy).toHaveBeenCalledTimes(0);
  expect(storagePutSpy).toHaveBeenCalledTimes(0);

  // Error case.
  fetcherFetchSpy.mockImplementation(async () => {
    throw Error();
  });
  await sleep(POLL_MILLIS);
  expect(pollerUpdateSpy).toHaveBeenCalledTimes(1);
  expect(storageGetCohortSpy).toHaveBeenCalledTimes(2);
  expect(fetcherFetchSpy).toHaveBeenCalledTimes(2);
  expect(storagePutSpy).toHaveBeenCalledTimes(0);

  // No update.
  fetcherFetchSpy.mockImplementation(async () => {
    return undefined;
  });
  await sleep(POLL_MILLIS);
  expect(pollerUpdateSpy).toHaveBeenCalledTimes(2);
  expect(storageGetCohortSpy).toHaveBeenCalledTimes(4);
  expect(fetcherFetchSpy).toHaveBeenCalledTimes(4);
  expect(storagePutSpy).toHaveBeenCalledTimes(0);

  // Success case.
  fetcherFetchSpy.mockImplementation(async (cohortId) => {
    return NEW_COHORTS[cohortId];
  });
  await sleep(POLL_MILLIS);
  expect(pollerUpdateSpy).toHaveBeenCalledTimes(3);
  expect(storageGetCohortSpy).toHaveBeenCalledTimes(6);
  expect(fetcherFetchSpy).toHaveBeenCalledTimes(6);
  expect(storagePutSpy).toHaveBeenCalledTimes(2);

  for (const cohortId of storage.getAllCohortIds()) {
    expect(storageGetCohortSpy).toHaveBeenCalledWith(cohortId);
    expect(fetcherFetchSpy).toHaveBeenCalledWith(
      cohortId,
      OLD_COHORTS[cohortId].lastModified,
    );
    expect(storagePutSpy).toHaveBeenCalledWith(NEW_COHORTS[cohortId]);
  }
});
