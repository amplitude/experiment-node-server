import { SdkCohortApi } from 'src/local/cohort/cohort-api';
import { COHORT_CONFIG_TIMEOUT, CohortFetcher } from 'src/local/cohort/fetcher';
import { CohortConfigDefaults } from 'src/types/config';

import { version as PACKAGE_VERSION } from '../../../gen/version';

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

test('cohort fetch success', async () => {
  const cohortApiGetCohortSpy = jest.spyOn(SdkCohortApi.prototype, 'getCohort');
  cohortApiGetCohortSpy.mockImplementation(
    async (options) => COHORTS[options.cohortId],
  );

  const cohortFetcher = new CohortFetcher('', '', null);

  const c1 = await cohortFetcher.fetch('c1');
  expect(c1).toBe(COHORTS['c1']);

  expect(cohortApiGetCohortSpy).toHaveBeenCalledWith({
    cohortId: 'c1',
    lastModified: undefined,
    libraryName: 'experiment-node-server',
    libraryVersion: PACKAGE_VERSION,
    maxCohortSize: CohortConfigDefaults.maxCohortSize,
    timeoutMillis: COHORT_CONFIG_TIMEOUT,
  });
});

test('cohort fetch success using maxCohortSize and lastModified', async () => {
  const cohortApiGetCohortSpy = jest.spyOn(SdkCohortApi.prototype, 'getCohort');
  cohortApiGetCohortSpy.mockImplementation(
    async (options) => COHORTS[options.cohortId],
  );

  const cohortFetcher = new CohortFetcher('', '', null, 'someurl', 10);

  const c1 = await cohortFetcher.fetch('c1', 10);
  expect(c1).toBe(COHORTS['c1']);

  expect(cohortApiGetCohortSpy).toHaveBeenCalledWith({
    cohortId: 'c1',
    lastModified: 10,
    libraryName: 'experiment-node-server',
    libraryVersion: PACKAGE_VERSION,
    maxCohortSize: 10,
    timeoutMillis: COHORT_CONFIG_TIMEOUT,
  });
});

test('cohort fetch unchanged returns undefined', async () => {
  const cohortApiGetCohortSpy = jest.spyOn(SdkCohortApi.prototype, 'getCohort');
  cohortApiGetCohortSpy.mockImplementation(async () => {
    return undefined;
  });

  const cohortFetcher = new CohortFetcher('', '', null, 'someurl', 10);

  // Make 3 requests at the same time.
  const c1 = await cohortFetcher.fetch('c1', 20);

  expect(cohortApiGetCohortSpy).toBeCalledTimes(1);
  expect(c1).toBeUndefined();
  expect(cohortApiGetCohortSpy).toHaveBeenCalledWith({
    cohortId: 'c1',
    lastModified: 20,
    libraryName: 'experiment-node-server',
    libraryVersion: PACKAGE_VERSION,
    maxCohortSize: 10,
    timeoutMillis: COHORT_CONFIG_TIMEOUT,
  });
});

test('cohort fetch failed', async () => {
  const cohortApiGetCohortSpy = jest.spyOn(SdkCohortApi.prototype, 'getCohort');
  cohortApiGetCohortSpy.mockImplementation(async () => {
    throw Error();
  });

  const cohortFetcher = new CohortFetcher('', '', null, 'someurl', 10);

  await expect(cohortFetcher.fetch('c1', 10)).rejects.toThrowError();

  expect(cohortApiGetCohortSpy).toHaveBeenCalledWith({
    cohortId: 'c1',
    lastModified: 10,
    libraryName: 'experiment-node-server',
    libraryVersion: PACKAGE_VERSION,
    maxCohortSize: 10,
    timeoutMillis: COHORT_CONFIG_TIMEOUT,
  });
});

test('cohort fetch twice on same cohortId uses same promise and make only one request', async () => {
  const cohortApiGetCohortSpy = jest.spyOn(SdkCohortApi.prototype, 'getCohort');
  cohortApiGetCohortSpy.mockImplementation(async (options) => {
    // Await 2s to allow second fetch call being made.
    await new Promise((resolve) => setTimeout(resolve, 2000));
    // Always return a new object.
    return { ...COHORTS[options.cohortId] };
  });

  const cohortFetcher = new CohortFetcher('', '', null, 'someurl', 10);

  // Make 2 requests at the same time.
  const promise1 = cohortFetcher.fetch('c1', 10);
  const promise2 = cohortFetcher.fetch('c1', 10);

  // Cannot do following assertion because the promise returned by an async func may not be exactly the promise being returned.
  // https://stackoverflow.com/questions/61354565/does-async-tag-wrap-a-javascript-function-with-a-promise
  // expect(promise1 === promise2).toBeTruthy();

  const c1 = await promise1;
  const c1_2 = await promise2;

  // Only made one request.
  expect(cohortApiGetCohortSpy).toBeCalledTimes(1);
  // The references of objects returned by both are the same.
  expect(c1 === c1_2).toBeTruthy();
  // A new object is returned.
  expect(c1 !== COHORTS['c1']).toBeTruthy();
  // Contents are the same.
  expect(c1).toStrictEqual(COHORTS['c1']);
  // Check args.
  expect(cohortApiGetCohortSpy).toHaveBeenCalledWith({
    cohortId: 'c1',
    lastModified: 10,
    libraryName: 'experiment-node-server',
    libraryVersion: PACKAGE_VERSION,
    maxCohortSize: 10,
    timeoutMillis: COHORT_CONFIG_TIMEOUT,
  });
});

test('cohort fetch twice on same cohortId different lastModified makes 2 requests', async () => {
  const cohortApiGetCohortSpy = jest.spyOn(SdkCohortApi.prototype, 'getCohort');
  cohortApiGetCohortSpy.mockImplementation(async (options) => {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    return { ...COHORTS[options.cohortId] };
  });

  const cohortFetcher = new CohortFetcher('', '', null, 'someurl', 10);

  // Make 3 requests at the same time.
  const promise1 = cohortFetcher.fetch('c1', 20);
  const promise2 = cohortFetcher.fetch('c1', 10);
  const promise3 = cohortFetcher.fetch('c2', 10);
  const c1 = await promise1;
  const c1_2 = await promise2;
  const c2 = await promise3;

  expect(cohortApiGetCohortSpy).toBeCalledTimes(3);
  expect(c1 !== c1_2).toBeTruthy();
  expect(c1 !== c2).toBeTruthy();
  expect(c1).toStrictEqual(COHORTS['c1']);
  expect(c1_2).toStrictEqual(COHORTS['c1']);
  expect(c2).toStrictEqual(COHORTS['c2']);
  expect(cohortApiGetCohortSpy).toHaveBeenCalledWith({
    cohortId: 'c1',
    lastModified: 20,
    libraryName: 'experiment-node-server',
    libraryVersion: PACKAGE_VERSION,
    maxCohortSize: 10,
    timeoutMillis: COHORT_CONFIG_TIMEOUT,
  });
  expect(cohortApiGetCohortSpy).toHaveBeenCalledWith({
    cohortId: 'c1',
    lastModified: 10,
    libraryName: 'experiment-node-server',
    libraryVersion: PACKAGE_VERSION,
    maxCohortSize: 10,
    timeoutMillis: COHORT_CONFIG_TIMEOUT,
  });
  expect(cohortApiGetCohortSpy).toHaveBeenCalledWith({
    cohortId: 'c2',
    lastModified: 10,
    libraryName: 'experiment-node-server',
    libraryVersion: PACKAGE_VERSION,
    maxCohortSize: 10,
    timeoutMillis: COHORT_CONFIG_TIMEOUT,
  });
});
