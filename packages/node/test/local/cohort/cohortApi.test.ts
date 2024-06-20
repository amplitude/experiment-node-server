import { SdkCohortApi } from 'src/local/cohort/cohort-api';
import { WrapperClient } from 'src/transport/http';

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
