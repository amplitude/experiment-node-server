import { CohortFetcher } from 'src/local/cohort/fetcher';

import { version as PACKAGE_VERSION } from '../../../gen/version';
import { MockHttpClient } from '../util/mockHttpClient';

const C_A = {
  cohortId: 'c_a',
  groupType: 'a',
  groupTypeId: 0,
  lastComputed: 0,
  lastModified: 0,
  size: 2,
  memberIds: new Set<string>(['membera1', 'membera2']), // memberIds needs to convert to array before json stringify.
};

const cohortId = '1';
const apiKey = 'apple';
const secretKey = 'banana';
const serverUrl = 'https://example.com/cohortapi';
const encodedKey = `Basic ${Buffer.from(`${apiKey}:${secretKey}`).toString(
  'base64',
)}`;
const expectedHeaders = {
  Authorization: encodedKey,
  'X-Amp-Exp-Library': `experiment-node-server/${PACKAGE_VERSION}`,
};

test('cohort fetcher success', async () => {
  const maxCohortSize = 10;
  const httpClient = new MockHttpClient(async (params) => {
    expect(params.requestUrl).toBe(
      `${serverUrl}/sdk/v1/cohort/${cohortId}?maxCohortSize=${maxCohortSize}`,
    );
    expect(params.headers).toStrictEqual(expectedHeaders);
    return {
      status: 200,
      body: JSON.stringify({ ...C_A, memberIds: Array.from(C_A.memberIds) }),
    };
  });
  const fetcher = new CohortFetcher(
    apiKey,
    secretKey,
    httpClient,
    serverUrl,
    false,
  );
  const cohort = await fetcher.fetch(cohortId, maxCohortSize);
  expect(cohort).toStrictEqual(C_A);
});

test('cohort fetcher 413', async () => {
  const maxCohortSize = 1;
  const httpClient = new MockHttpClient(async (params) => {
    expect(params.requestUrl).toBe(
      `${serverUrl}/sdk/v1/cohort/${cohortId}?maxCohortSize=${maxCohortSize}`,
    );
    expect(params.headers).toStrictEqual(expectedHeaders);
    return { status: 413, body: '' };
  });
  const fetcher = new CohortFetcher(
    apiKey,
    secretKey,
    httpClient,
    serverUrl,
    false,
  );
  await expect(fetcher.fetch(cohortId, maxCohortSize)).rejects.toThrow();
});

test('cohort fetcher no modification 204', async () => {
  const maxCohortSize = 10;
  const lastModified = 10;
  const httpClient = new MockHttpClient(async (params) => {
    expect(params.requestUrl).toBe(
      `${serverUrl}/sdk/v1/cohort/${cohortId}?maxCohortSize=${maxCohortSize}&lastModified=${lastModified}`,
    );
    expect(params.headers).toStrictEqual(expectedHeaders);
    return { status: 204, body: '' };
  });
  const fetcher = new CohortFetcher(
    apiKey,
    secretKey,
    httpClient,
    serverUrl,
    false,
  );
  expect(
    await fetcher.fetch(cohortId, maxCohortSize, lastModified),
  ).toBeUndefined();
});

test('cohort fetcher no modification but still return cohort due to cache miss', async () => {
  const maxCohortSize = 10;
  const lastModified = 10;
  const httpClient = new MockHttpClient(async (params) => {
    expect(params.requestUrl).toBe(
      `${serverUrl}/sdk/v1/cohort/${cohortId}?maxCohortSize=${maxCohortSize}&lastModified=${lastModified}`,
    );
    expect(params.headers).toStrictEqual(expectedHeaders);
    return {
      status: 200,
      body: JSON.stringify({ ...C_A, memberIds: Array.from(C_A.memberIds) }),
    };
  });
  const fetcher = new CohortFetcher(
    apiKey,
    secretKey,
    httpClient,
    serverUrl,
    false,
  );
  expect(
    await fetcher.fetch(cohortId, maxCohortSize, lastModified),
  ).toStrictEqual(C_A);
});

test('cohort fetcher other errors', async () => {
  const maxCohortSize = 10;
  const lastModified = 10;
  const httpClient = new MockHttpClient(async (params) => {
    expect(params.requestUrl).toBe(
      `${serverUrl}/sdk/v1/cohort/${cohortId}?maxCohortSize=${maxCohortSize}&lastModified=${lastModified}`,
    );
    expect(params.headers).toStrictEqual(expectedHeaders);
    return {
      status: 500,
      body: JSON.stringify({ ...C_A, memberIds: Array.from(C_A.memberIds) }),
    };
  });
  const fetcher = new CohortFetcher(
    apiKey,
    secretKey,
    httpClient,
    serverUrl,
    false,
  );
  await expect(
    fetcher.fetch(cohortId, maxCohortSize, lastModified),
  ).rejects.toThrow();
});
