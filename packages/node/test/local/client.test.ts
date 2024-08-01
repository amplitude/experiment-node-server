import path from 'path';

import { EvaluationFlag } from '@amplitude/experiment-core';
import * as dotenv from 'dotenv';
import { Experiment } from 'src/factory';
import { InMemoryFlagConfigCache, LocalEvaluationClient } from 'src/index';
import { USER_GROUP_TYPE } from 'src/types/cohort';
import { LocalEvaluationDefaults } from 'src/types/config';
import { ExperimentUser } from 'src/types/user';
import { sleep } from 'src/util/time';

import { COHORTS, FLAGS, NEW_FLAGS } from './util/mockData';
import { MockHttpClient } from './util/mockHttpClient';

dotenv.config({ path: path.join(__dirname, '../../', '.env') });

const apiKey = 'server-qz35UwzJ5akieoAdIgzM4m9MIiOLXLoz';

const testUser: ExperimentUser = { user_id: 'test_user' };

if (!process.env['API_KEY'] && !process.env['SECRET_KEY']) {
  throw new Error(
    'No env vars found. If running on local, have you created .env file correct environment variables? Checkout README.md',
  );
}

const setupEvaluateTestNormalCases = (client: LocalEvaluationClient) => {
  test('ExperimentClient.evaluate all flags, success', async () => {
    const variants = await client.evaluate(testUser);
    const variant = variants['sdk-local-evaluation-ci-test'];
    expect(variant.key).toEqual('on');
    expect(variant.value).toEqual('on');
    expect(variant.payload).toEqual('payload');
  });

  test('ExperimentClient.evaluate one flag, success', async () => {
    const variants = await client.evaluate(testUser, [
      'sdk-local-evaluation-ci-test',
    ]);
    const variant = variants['sdk-local-evaluation-ci-test'];
    expect(variant.key).toEqual('on');
    expect(variant.value).toEqual('on');
    expect(variant.payload).toEqual('payload');
  });

  test('ExperimentClient.evaluate with dependencies, no flag keys, success', async () => {
    const variants = await client.evaluate({
      user_id: 'user_id',
      device_id: 'device_id',
    });
    const variant = variants['sdk-ci-local-dependencies-test'];
    expect(variant.key).toEqual('control');
    expect(variant.value).toEqual('control');
  });

  test('ExperimentClient.evaluate with dependencies, with flag keys, success', async () => {
    const variants = await client.evaluate(
      {
        user_id: 'user_id',
        device_id: 'device_id',
      },
      ['sdk-ci-local-dependencies-test'],
    );
    const variant = variants['sdk-ci-local-dependencies-test'];
    expect(variant.key).toEqual('control');
    expect(variant.value).toEqual('control');
  });

  test('ExperimentClient.evaluate with dependencies, with unknown flag keys, no variant', async () => {
    const variants = await client.evaluate(
      {
        user_id: 'user_id',
        device_id: 'device_id',
      },
      ['does-not-exist'],
    );
    const variant = variants['sdk-ci-local-dependencies-test'];
    expect(variant).toBeUndefined();
  });

  test('ExperimentClient.evaluate with dependencies, variant held out', async () => {
    const variants = await client.evaluate({
      user_id: 'user_id',
      device_id: 'device_id',
    });
    const variant = variants['sdk-ci-local-dependencies-test-holdout'];
    expect(variant).toBeUndefined();
    expect(
      await client.cache.get('sdk-ci-local-dependencies-test-holdout'),
    ).toBeDefined();
  });

  // Evaluate V2.
  test('ExperimentClient.evaluateV2 all flags, success', async () => {
    const variants = await client.evaluateV2(testUser);
    const variant = variants['sdk-local-evaluation-ci-test'];
    expect(variant.key).toEqual('on');
    expect(variant.value).toEqual('on');
    expect(variant.payload).toEqual('payload');
  });

  test('ExperimentClient.evaluateV2 one flag, success', async () => {
    const variants = await client.evaluateV2(testUser, [
      'sdk-local-evaluation-ci-test',
    ]);
    const variant = variants['sdk-local-evaluation-ci-test'];
    expect(variant.key).toEqual('on');
    expect(variant.value).toEqual('on');
    expect(variant.payload).toEqual('payload');
  });

  test('ExperimentClient.evaluateV2 with dependencies, no flag keys, success', async () => {
    const variants = await client.evaluateV2({
      user_id: 'user_id',
      device_id: 'device_id',
    });
    const variant = variants['sdk-ci-local-dependencies-test'];
    expect(variant.key).toEqual('control');
    expect(variant.value).toEqual('control');
  });

  test('ExperimentClient.evaluateV2 with dependencies, with flag keys, success', async () => {
    const variants = await client.evaluateV2(
      {
        user_id: 'user_id',
        device_id: 'device_id',
      },
      ['sdk-ci-local-dependencies-test'],
    );
    const variant = variants['sdk-ci-local-dependencies-test'];
    expect(variant.key).toEqual('control');
    expect(variant.value).toEqual('control');
  });

  test('ExperimentClient.evaluateV2 with dependencies, with unknown flag keys, no variant', async () => {
    const variants = await client.evaluateV2(
      {
        user_id: 'user_id',
        device_id: 'device_id',
      },
      ['does-not-exist'],
    );
    const variant = variants['sdk-ci-local-dependencies-test'];
    expect(variant).toBeUndefined();
  });

  test('ExperimentClient.evaluateV2 with dependencies, variant held out', async () => {
    const variants = await client.evaluateV2({
      user_id: 'user_id',
      device_id: 'device_id',
    });
    const variant = variants['sdk-ci-local-dependencies-test-holdout'];
    expect(variant.key).toEqual('off');
    expect(variant.value).toBeUndefined();
    expect(
      await client.cache.get('sdk-ci-local-dependencies-test-holdout'),
    ).toBeDefined();
  });
};

const setupEvaluateCohortTestNormalCases = (client: LocalEvaluationClient) => {
  test('ExperimentClient.evaluateV2 with user or group cohort not targeted', async () => {
    const variants = await client.evaluateV2({
      user_id: '2333',
      device_id: 'device_id',
      groups: {
        'org name': ['Amplitude Inc sth sth sth'],
      },
    });
    const userVariant = variants['sdk-local-evaluation-user-cohort-ci-test'];
    expect(userVariant.key).toEqual('off');
    expect(userVariant.value).toBeUndefined();
    expect(
      await client.cache.get('sdk-local-evaluation-user-cohort-ci-test'),
    ).toBeDefined();
    const groupVariant = variants['sdk-local-evaluation-group-cohort-ci-test'];
    expect(groupVariant.key).toEqual('off');
    expect(groupVariant.value).toBeUndefined();
    expect(
      await client.cache.get('sdk-local-evaluation-group-cohort-ci-test'),
    ).toBeDefined();
  });

  test('ExperimentClient.evaluateV2 with user cohort segment targeted', async () => {
    const variants = await client.evaluateV2({
      user_id: '12345',
      device_id: 'device_id',
    });
    const variant = variants['sdk-local-evaluation-user-cohort-ci-test'];
    expect(variant.key).toEqual('on');
    expect(variant.value).toEqual('on');
    expect(
      await client.cache.get('sdk-local-evaluation-user-cohort-ci-test'),
    ).toBeDefined();
  });

  test('ExperimentClient.evaluateV2 with user cohort tester targeted', async () => {
    const variants = await client.evaluateV2({
      user_id: '1',
      device_id: 'device_id',
    });
    const variant = variants['sdk-local-evaluation-user-cohort-ci-test'];
    expect(variant.key).toEqual('on');
    expect(variant.value).toEqual('on');
    expect(
      await client.cache.get('sdk-local-evaluation-user-cohort-ci-test'),
    ).toBeDefined();
  });

  test('ExperimentClient.evaluateV2 with group cohort segment targeted', async () => {
    const variants = await client.evaluateV2({
      user_id: '12345',
      device_id: 'device_id',
      groups: {
        'org id': ['1'],
      },
    });
    const variant = variants['sdk-local-evaluation-group-cohort-ci-test'];
    expect(variant.key).toEqual('on');
    expect(variant.value).toEqual('on');
    expect(
      await client.cache.get('sdk-local-evaluation-group-cohort-ci-test'),
    ).toBeDefined();
  });

  test('ExperimentClient.evaluateV2 with group cohort tester targeted', async () => {
    const variants = await client.evaluateV2({
      user_id: '2333',
      device_id: 'device_id',
      groups: {
        'org name': ['Amplitude Website (Portfolio)'],
      },
    });
    const variant = variants['sdk-local-evaluation-group-cohort-ci-test'];
    expect(variant.key).toEqual('on');
    expect(variant.value).toEqual('on');
    expect(
      await client.cache.get('sdk-local-evaluation-group-cohort-ci-test'),
    ).toBeDefined();
  });
};

const setupEvaluateCohortTestErrorClientCases = (
  client: LocalEvaluationClient,
) => {
  test('ExperimentClient.evaluateV2 with user or group cohort, no error thrown, but unknown behavior', async () => {
    const variants = await client.evaluateV2({
      user_id: '2333',
      device_id: 'device_id',
      groups: {
        'org name': ['Amplitude Inc sth sth sth'],
      },
    });
    const userVariant = variants['sdk-local-evaluation-user-cohort-ci-test'];
    expect(userVariant).toBeDefined();
    expect(
      await client.cache.get('sdk-local-evaluation-user-cohort-ci-test'),
    ).toBeDefined();
    const groupVariant = variants['sdk-local-evaluation-group-cohort-ci-test'];
    expect(groupVariant).toBeDefined();
    expect(
      await client.cache.get('sdk-local-evaluation-group-cohort-ci-test'),
    ).toBeDefined();
  });
};

describe('ExperimentClient end-to-end tests, normal cases', () => {
  describe('Normal cases', () => {
    const client = Experiment.initializeLocal(apiKey, {
      cohortConfig: {
        apiKey: process.env['API_KEY'],
        secretKey: process.env['SECRET_KEY'],
      },
    });

    beforeAll(async () => {
      await client.start();
    });

    afterAll(async () => {
      client.stop();
    });

    setupEvaluateTestNormalCases(client);
    setupEvaluateCohortTestNormalCases(client);
  });

  describe('No cohort config', () => {
    const client = Experiment.initializeLocal(apiKey);

    beforeAll(async () => {
      await client.start();
    });

    afterAll(async () => {
      client.stop();
    });

    setupEvaluateTestNormalCases(client);
    setupEvaluateCohortTestErrorClientCases(client);
  });

  describe('Bad cohort config', () => {
    const client = Experiment.initializeLocal(apiKey, {
      cohortConfig: {
        apiKey: 'bad_api_key',
        secretKey: 'bad_secret_key',
      },
    });

    beforeAll(async () => {
      await client.start();
    });

    afterAll(async () => {
      client.stop();
    });

    setupEvaluateTestNormalCases(client);
    setupEvaluateCohortTestErrorClientCases(client);
  });
});

describe('ExperimentClient integration tests', () => {
  let flagFetchRequestCount;
  let cohortFetchRequestCount;
  let mockHttpClient;

  beforeEach(() => {
    jest.clearAllMocks();

    flagFetchRequestCount = 0;
    cohortFetchRequestCount = 0;
    mockHttpClient = new MockHttpClient(async (params) => {
      const url = new URL(params.requestUrl);
      let body;
      if (url.pathname.startsWith('/sdk/v2/flags')) {
        // Flags.
        flagFetchRequestCount++;
        if (flagFetchRequestCount == 1) {
          body = JSON.stringify(Object.values(FLAGS));
        } else {
          body = JSON.stringify(Object.values(NEW_FLAGS));
        }
      } else if (url.pathname.startsWith('/sdk/v1/cohort')) {
        // Cohorts.
        const cohortId = url.pathname.substring(15);
        if (!(cohortId in COHORTS)) {
          return { status: 404, body: 'Not found' };
        }
        if (url.searchParams.get('maxCohortSize') < COHORTS[cohortId].size) {
          return { status: 413, body: 'Max size exceeded' };
        }
        if (
          url.searchParams.get('lastModified') == COHORTS[cohortId].lastModified
        ) {
          return { status: 204, body: '' };
        }
        const cohort = { ...COHORTS[cohortId] };
        cohort.memberIds = [...cohort.memberIds];
        body = JSON.stringify(cohort);
      }
      return { status: 200, body: body };
    });
  });

  test('ExperimentClient cohort targeting success', async () => {
    const client = new LocalEvaluationClient(
      'apikey',
      {
        cohortConfig: {
          apiKey: 'apiKey',
          secretKey: 'secretKey',
          maxCohortSize: 10,
        },
      },
      null,
      mockHttpClient,
    );
    await client.start();

    let result;
    result = client.evaluateV2({ user_id: 'membera1', device_id: '1' });
    expect(result['flag1'].key).toBe('on');
    expect(result['flag2'].key).toBe('on');
    expect(result['flag3'].key).toBe('var1');
    expect(result['flag4'].key).toBe('var1');

    result = client.evaluateV2({ user_id: 'membera2', device_id: '1' });
    expect(result['flag1'].key).toBe('off');
    expect(result['flag2'].key).toBe('on');
    expect(result['flag3'].key).toBe('var2');
    expect(result['flag4'].key).toBe('var1');

    result = client.evaluateV2({ user_id: 'membera3', device_id: '1' });
    expect(result['flag1'].key).toBe('off');
    expect(result['flag2'].key).toBe('on');
    expect(result['flag3'].key).toBe('var1');
    expect(result['flag4'].key).toBe('var1');

    result = client.evaluateV2({
      user_id: '1',
      device_id: '1',
      groups: { 'org name': ['org name 1'] },
    });
    expect(result['flag1'].key).toBe('off');
    expect(result['flag2'].key).toBe('off');
    expect(result['flag3'].key).toBe('off');
    expect(result['flag4'].key).toBe('var2');

    result = client.evaluateV2({
      user_id: '1',
      device_id: '1',
    });
    expect(result['flag1'].key).toBe('off');
    expect(result['flag2'].key).toBe('off');
    expect(result['flag3'].key).toBe('off');
    expect(result['flag4'].key).toBe('off');

    client.stop();
  });

  test('ExperimentClient cohort maxCohortSize download fail', async () => {
    const client = new LocalEvaluationClient(
      'apikey',
      {
        cohortConfig: {
          apiKey: 'apiKey',
          secretKey: 'secretKey',
          maxCohortSize: 0,
        },
      },
      null,
      mockHttpClient,
    );
    await client.start();

    const result = client.evaluateV2({ user_id: 'membera1', device_id: '1' });
    // Currently cohort failed to download simply means there's no members in cohort as it's not going to be added to evaluation context.
    // This behavior will change.
    expect(result['flag1'].key).toBe('off');
    expect(result['flag2'].key).toBe('off');
    expect(result['flag3'].key).toBe('off');
    expect(result['flag4'].key).toBe('off');

    client.stop();
  });

  test('ExperimentClient cohort download initial failures, but poller would success', async () => {
    jest.setTimeout(70000);
    const client = new LocalEvaluationClient(
      'apikey',
      {
        flagConfigPollingIntervalMillis: 40000,
        cohortConfig: {
          apiKey: 'apiKey',
          secretKey: 'secretKey',
          maxCohortSize: 10,
        },
      },
      null,
      new MockHttpClient(async (params) => {
        const url = new URL(params.requestUrl);
        let body;
        if (url.pathname.startsWith('/sdk/v2/flags')) {
          // Flags.
          flagFetchRequestCount++;
          if (flagFetchRequestCount == 1) {
            body = JSON.stringify(Object.values(FLAGS));
          } else {
            body = JSON.stringify(Object.values(NEW_FLAGS));
          }
        } else if (url.pathname.startsWith('/sdk/v1/cohort')) {
          // Cohorts.
          cohortFetchRequestCount++;
          if (cohortFetchRequestCount <= 3 * 11) {
            // 3 retries per cohort, 11 requests before poller poll.
            // 5 initial requests, 6 requests after flag update.
            throw Error('Timeout');
          }
          const cohortId = url.pathname.substring(15);
          if (!(cohortId in COHORTS)) {
            return { status: 404, body: 'Not found' };
          }
          if (url.searchParams.get('maxCohortSize') < COHORTS[cohortId].size) {
            return { status: 413, body: 'Max size exceeded' };
          }
          if (
            url.searchParams.get('lastModified') ==
            COHORTS[cohortId].lastModified
          ) {
            return { status: 204, body: '' };
          }
          const cohort = { ...COHORTS[cohortId] };
          cohort.memberIds = [...cohort.memberIds];
          body = JSON.stringify(cohort);
        }
        return { status: 200, body: body };
      }),
    );
    await client.start();

    let result = client.evaluateV2({ user_id: 'membera1', device_id: '1' });
    // Currently cohort failed to download simply means there's no members in cohort as it's not going to be added to evaluation context.
    // This behavior will change.
    expect(result['flag1'].key).toBe('off');
    expect(result['flag2'].key).toBe('off');
    expect(result['flag3'].key).toBe('off');
    expect(result['flag4'].key).toBe('off');
    expect(result['flag5']).toBeUndefined();

    await sleep(62000); // Poller polls after 60s.
    // Within this time,
    // Flag poller (flagConfigPollingIntervalMillis = 40000) will poll a new version, NEW_FLAGS which contains flag5.
    // Cohort poller (pollingIntervalMillis = 60000) will poll all cohorts in the flags, which will all success.

    result = client.evaluateV2({ user_id: 'membera1', device_id: '1' });
    // Currently cohort failed to download simply means there's no members in cohort as it's not going to be added to evaluation context.
    // This behavior will change.
    expect(result['flag1'].key).toBe('on');
    expect(result['flag2'].key).toBe('on');
    expect(result['flag3'].key).toBe('var1');
    expect(result['flag4'].key).toBe('var1');
    expect(result['flag5'].key).toBe('off');

    client.stop();
  });
});

describe('ExperimentClient unit tests', () => {
  // Unit tests
  class TestLocalEvaluationClient extends LocalEvaluationClient {
    public enrichUserWithCohorts(
      user: ExperimentUser,
      flags: Record<string, EvaluationFlag>,
    ) {
      super.enrichUserWithCohorts(user, flags);
    }
  }

  test('ExperimentClient.enrichUserWithCohorts', async () => {
    const client = new TestLocalEvaluationClient(
      apiKey,
      LocalEvaluationDefaults,
      new InMemoryFlagConfigCache(),
    );
    client.cohortStorage.put({
      cohortId: 'cohort1',
      groupType: USER_GROUP_TYPE,
      groupTypeId: 0,
      lastComputed: 0,
      lastModified: 0,
      size: 1,
      memberIds: new Set<string>(['userId']),
    });
    client.cohortStorage.put({
      cohortId: 'groupcohort1',
      groupType: 'groupname',
      groupTypeId: 1,
      lastComputed: 0,
      lastModified: 0,
      size: 1,
      memberIds: new Set<string>(['amplitude', 'experiment']),
    });
    const user = {
      user_id: 'userId',
      groups: {
        groupname: ['amplitude'],
      },
    };
    client.enrichUserWithCohorts(user, {
      flag1: {
        key: 'flag1',
        variants: {},
        segments: [
          {
            conditions: [
              [
                {
                  op: 'set contains any',
                  selector: ['context', 'user', 'cohort_ids'],
                  values: ['cohort1'],
                },
              ],
            ],
          },
        ],
      },
      flag2: {
        key: 'flag2',
        variants: {},
        segments: [
          {
            conditions: [
              [
                {
                  op: 'set contains any',
                  selector: ['context', 'groups', 'groupname', 'cohort_ids'],
                  values: ['groupcohort1', 'groupcohortnotinstorage'],
                },
              ],
            ],
          },
        ],
      },
    });
    expect(user).toStrictEqual({
      user_id: 'userId',
      cohort_ids: ['cohort1'],
      groups: {
        groupname: ['amplitude'],
      },
      group_cohort_ids: {
        groupname: {
          amplitude: ['groupcohort1'],
        },
      },
    });
  });
});
