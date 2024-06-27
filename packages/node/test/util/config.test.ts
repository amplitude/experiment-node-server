import { LocalEvaluationConfig } from 'src/index';
import {
  LocalEvaluationDefaults,
  CohortConfigDefaults,
  EU_SERVER_URLS,
  RemoteEvaluationConfig,
} from 'src/types/config';
import {
  populateLocalConfigDefaults,
  populateRemoteConfigDefaults,
} from 'src/util/config';

test.each([
  [
    {},
    [
      'us',
      LocalEvaluationDefaults.serverUrl,
      LocalEvaluationDefaults.streamServerUrl,
      CohortConfigDefaults.cohortServerUrl,
    ],
  ],
  [
    { zone: 'EU' },
    ['EU', EU_SERVER_URLS.flags, EU_SERVER_URLS.stream, EU_SERVER_URLS.cohort],
  ],
  [
    { url: 'urlurl', stream: 'streamurl', cohort: 'cohorturl' },
    ['us', 'urlurl', 'streamurl', 'cohorturl'],
  ],
  [
    { zone: 'eu', url: 'urlurl', stream: 'streamurl', cohort: 'cohorturl' },
    ['eu', 'urlurl', 'streamurl', 'cohorturl'],
  ],
  [
    { zone: 'eu', url: 'urlurl' },
    ['eu', 'urlurl', EU_SERVER_URLS.stream, EU_SERVER_URLS.cohort],
  ],
])("'%s'", (testcase, expected) => {
  const config: LocalEvaluationConfig = {
    cohortConfig: {
      apiKey: '',
      secretKey: '',
    },
  };
  if ('zone' in testcase) {
    config.serverZone = testcase.zone;
  }
  if ('url' in testcase) {
    config.serverUrl = testcase.url;
  }
  if ('stream' in testcase) {
    config.streamServerUrl = testcase.stream;
  }
  if ('cohort' in testcase) {
    config.cohortConfig.cohortServerUrl = testcase.cohort;
  }
  const newConfig = populateLocalConfigDefaults(config);
  expect(newConfig.serverZone).toBe(expected[0]);
  expect(newConfig.serverUrl).toBe(expected[1]);
  expect(newConfig.streamServerUrl).toBe(expected[2]);
  expect(newConfig.cohortConfig.cohortServerUrl).toBe(expected[3]);
});

test.each([
  [{}, 'us', LocalEvaluationDefaults.serverUrl],
  [{ zone: 'EU' }, 'EU', EU_SERVER_URLS.remote],
  [{ url: 'urlurl' }, 'us', 'urlurl'],
  [{ zone: 'eu', url: 'urlurl' }, 'eu', 'urlurl'],
  [{ zone: 'eu', url: 'urlurl' }, 'eu', 'urlurl'],
])("'%s'", (testcase, expectedZone, expectedUrl) => {
  const config: RemoteEvaluationConfig = {};
  if ('zone' in testcase) {
    config.serverZone = testcase.zone;
  }
  if ('url' in testcase) {
    config.serverUrl = testcase.url;
  }
  const newConfig = populateRemoteConfigDefaults(config);
  expect(newConfig.serverZone).toBe(expectedZone);
  expect(newConfig.serverUrl).toBe(expectedUrl);
});
