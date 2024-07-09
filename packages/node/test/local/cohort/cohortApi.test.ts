import { SdkCohortApi } from 'src/local/cohort/cohort-api';
import { WrapperClient } from 'src/transport/http';

import { version as PACKAGE_VERSION } from '../../../gen/version';
import { MockHttpClient } from '../util/mockHttpClient';

const SAMPLE_PARAMS = {
  libraryName: 'lib',
  libraryVersion: 'ver',
  cohortId: 'cohortId',
  maxCohortSize: 10,
  lastModified: 100,
};

test('getCohort no lastModified', async () => {
  const mockHttpClient = new MockHttpClient(async (params) => {
    expect(params.requestUrl).toBe(
      'https://example.com/cohortapi/sdk/v1/cohort/cohortId?maxCohortSize=10',
    );
    expect(params.headers).toStrictEqual({
      Authorization: 'Basic apikeyapikey',
      'X-Amp-Exp-Library': 'lib/ver',
    });
    return { status: 200, body: '{}' };
  });
  const api = new SdkCohortApi(
    'apikeyapikey',
    'https://example.com/cohortapi',
    new WrapperClient(mockHttpClient),
  );
  await api.getCohort({
    libraryName: 'lib',
    libraryVersion: 'ver',
    cohortId: 'cohortId',
    maxCohortSize: 10,
    lastModified: undefined,
  });
});

test('getCohort with lastModified', async () => {
  const mockHttpClient = new MockHttpClient(async (params) => {
    expect(params.requestUrl).toBe(
      'https://example.com/cohortapi/sdk/v1/cohort/cohortId?maxCohortSize=10&lastModified=100',
    );
    expect(params.headers).toStrictEqual({
      Authorization: 'Basic apikeyapikey',
      'X-Amp-Exp-Library': 'lib/ver',
    });
    return { status: 200, body: '{}' };
  });
  const api = new SdkCohortApi(
    'apikeyapikey',
    'https://example.com/cohortapi',
    new WrapperClient(mockHttpClient),
  );
  await api.getCohort({
    libraryName: 'lib',
    libraryVersion: 'ver',
    cohortId: 'cohortId',
    maxCohortSize: 10,
    lastModified: 100,
  });
});

test('getCohort with 204', async () => {
  const mockHttpClient = new MockHttpClient(async () => {
    return { status: 204, body: '' };
  });
  const api = new SdkCohortApi('', '', new WrapperClient(mockHttpClient));
  const cohort = await api.getCohort(SAMPLE_PARAMS);
  expect(cohort).toBeUndefined();
});

test('getCohort with 413', async () => {
  const mockHttpClient = new MockHttpClient(async () => {
    return { status: 413, body: '' };
  });
  const api = new SdkCohortApi('', '', new WrapperClient(mockHttpClient));
  await expect(api.getCohort(SAMPLE_PARAMS)).rejects.toThrow();
});

test('getCohort with other status code', async () => {
  const mockHttpClient = new MockHttpClient(async () => {
    return { status: 500, body: '' };
  });
  const api = new SdkCohortApi('', '', new WrapperClient(mockHttpClient));
  await expect(api.getCohort(SAMPLE_PARAMS)).rejects.toThrow();
});

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
const encodedKey = Buffer.from(`${apiKey}:${secretKey}`).toString('base64');
const expectedHeaders = {
  Authorization: `Basic ${encodedKey}`,
  'X-Amp-Exp-Library': `experiment-node-server/${PACKAGE_VERSION}`,
};

test('getCohort success', async () => {
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
  const api = new SdkCohortApi(
    encodedKey,
    serverUrl,
    new WrapperClient(httpClient),
  );
  const cohort = await api.getCohort({
    cohortId,
    maxCohortSize,
    libraryName: 'experiment-node-server',
    libraryVersion: PACKAGE_VERSION,
  });
  expect(cohort).toStrictEqual(C_A);
});

test('getCohort 413', async () => {
  const maxCohortSize = 1;
  const httpClient = new MockHttpClient(async (params) => {
    expect(params.requestUrl).toBe(
      `${serverUrl}/sdk/v1/cohort/${cohortId}?maxCohortSize=${maxCohortSize}`,
    );
    expect(params.headers).toStrictEqual(expectedHeaders);
    return { status: 413, body: '' };
  });
  const api = new SdkCohortApi(
    encodedKey,
    serverUrl,
    new WrapperClient(httpClient),
  );
  await expect(
    api.getCohort({
      cohortId,
      maxCohortSize,
      libraryName: 'experiment-node-server',
      libraryVersion: PACKAGE_VERSION,
    }),
  ).rejects.toThrow();
});

test('getCohort no modification 204', async () => {
  const maxCohortSize = 10;
  const lastModified = 10;
  const httpClient = new MockHttpClient(async (params) => {
    expect(params.requestUrl).toBe(
      `${serverUrl}/sdk/v1/cohort/${cohortId}?maxCohortSize=${maxCohortSize}&lastModified=${lastModified}`,
    );
    expect(params.headers).toStrictEqual(expectedHeaders);
    return { status: 204, body: '' };
  });
  const api = new SdkCohortApi(
    encodedKey,
    serverUrl,
    new WrapperClient(httpClient),
  );
  expect(
    await api.getCohort({
      cohortId,
      maxCohortSize,
      lastModified,
      libraryName: 'experiment-node-server',
      libraryVersion: PACKAGE_VERSION,
    }),
  ).toBeUndefined();
});

test('getCohort no modification but still return cohort due to cache miss', async () => {
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
  const api = new SdkCohortApi(
    encodedKey,
    serverUrl,
    new WrapperClient(httpClient),
  );
  expect(
    await api.getCohort({
      cohortId,
      maxCohortSize,
      lastModified,
      libraryName: 'experiment-node-server',
      libraryVersion: PACKAGE_VERSION,
    }),
  ).toStrictEqual(C_A);
});

test('getCohort other errors', async () => {
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
  const api = new SdkCohortApi(
    encodedKey,
    serverUrl,
    new WrapperClient(httpClient),
  );
  await expect(
    api.getCohort({
      cohortId,
      maxCohortSize,
      lastModified,
      libraryName: 'experiment-node-server',
      libraryVersion: PACKAGE_VERSION,
    }),
  ).rejects.toThrow();
});
