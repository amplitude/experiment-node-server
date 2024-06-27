import path from 'path';

import { EvaluationFlag } from '@amplitude/experiment-core';
import * as dotenv from 'dotenv';
import { Experiment } from 'src/factory';
import { InMemoryFlagConfigCache, LocalEvaluationClient } from 'src/index';
import { USER_GROUP_TYPE } from 'src/types/cohort';
import {
  CohortConfigDefaults,
  EU_SERVER_URLS,
  LocalEvaluationDefaults,
} from 'src/types/config';
import { ExperimentUser } from 'src/types/user';

dotenv.config({ path: path.join(__dirname, '../../', '.env') });

const apiKey = 'server-qz35UwzJ5akieoAdIgzM4m9MIiOLXLoz';

const testUser: ExperimentUser = { user_id: 'test_user' };

if (!process.env['API_KEY'] && !process.env['SECRET_KEY']) {
  throw new Error(
    'No env vars found. If running on local, have you created .env file correct environment variables? Checkout README.md',
  );
}

const cohortConfig = {
  apiKey: process.env['API_KEY'],
  secretKey: process.env['SECRET_KEY'],
};
const client = Experiment.initializeLocal(apiKey, {
  cohortConfig: cohortConfig,
});

beforeAll(async () => {
  await client.start();
});

afterAll(async () => {
  client.stop();
});

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

// Evaluate V2

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

// Unit tests
class TestLocalEvaluationClient extends LocalEvaluationClient {
  public getConfig() {
    return this.config;
  }
  public enrichUserWithCohorts(
    user: ExperimentUser,
    flags: Record<string, EvaluationFlag>,
  ) {
    super.enrichUserWithCohorts(user, flags);
  }
}

test('LocalEvaluationClient config, default to US server urls', async () => {
  const client = new TestLocalEvaluationClient(apiKey, {
    cohortConfig: { apiKey: '', secretKey: '' },
  });
  expect(client.getConfig().serverZone).toBe('us');
  expect(client.getConfig().serverUrl).toBe(LocalEvaluationDefaults.serverUrl);
  expect(client.getConfig().streamServerUrl).toBe(
    LocalEvaluationDefaults.streamServerUrl,
  );
  expect(client.getConfig().cohortConfig.cohortServerUrl).toBe(
    CohortConfigDefaults.cohortServerUrl,
  );
});
test('LocalEvaluationClient config, EU server zone sets to EU server urls', async () => {
  const client = new TestLocalEvaluationClient(apiKey, {
    serverZone: 'EU',
    cohortConfig: { apiKey: '', secretKey: '' },
  });
  expect(client.getConfig().serverZone).toBe('EU');
  expect(client.getConfig().serverUrl).toBe(EU_SERVER_URLS.flags);
  expect(client.getConfig().streamServerUrl).toBe(EU_SERVER_URLS.stream);
  expect(client.getConfig().cohortConfig.cohortServerUrl).toBe(
    EU_SERVER_URLS.cohort,
  );
});
test('LocalEvaluationClient config, US server zone but serverUrl overrides', async () => {
  const client = new TestLocalEvaluationClient(apiKey, {
    serverUrl: 'urlurl',
    streamServerUrl: 'streamurl',
    cohortConfig: { apiKey: '', secretKey: '', cohortServerUrl: 'cohorturl' },
  });
  expect(client.getConfig().serverZone).toBe('us');
  expect(client.getConfig().serverUrl).toBe('urlurl');
  expect(client.getConfig().streamServerUrl).toBe('streamurl');
  expect(client.getConfig().cohortConfig.cohortServerUrl).toBe('cohorturl');
});
test('LocalEvaluationClient config, EU server zone but serverUrl overrides', async () => {
  const client = new TestLocalEvaluationClient(apiKey, {
    serverZone: 'eu',
    serverUrl: 'urlurl',
    streamServerUrl: 'streamurl',
    cohortConfig: { apiKey: '', secretKey: '', cohortServerUrl: 'cohorturl' },
  });
  expect(client.getConfig().serverZone).toBe('eu');
  expect(client.getConfig().serverUrl).toBe('urlurl');
  expect(client.getConfig().streamServerUrl).toBe('streamurl');
  expect(client.getConfig().cohortConfig.cohortServerUrl).toBe('cohorturl');
});
test('LocalEvaluationClient config, EU server zone but partial serverUrl overrides', async () => {
  const client = new TestLocalEvaluationClient(apiKey, {
    serverZone: 'eu',
    serverUrl: 'urlurl',
    cohortConfig: { apiKey: '', secretKey: '' },
  });
  expect(client.getConfig().serverZone).toBe('eu');
  expect(client.getConfig().serverUrl).toBe('urlurl');
  expect(client.getConfig().streamServerUrl).toBe(EU_SERVER_URLS.stream);
  expect(client.getConfig().cohortConfig.cohortServerUrl).toBe(
    EU_SERVER_URLS.cohort,
  );
});

test('ExperimentClient.enrichUserWithCohorts', async () => {
  const client = new TestLocalEvaluationClient(
    apiKey,
    LocalEvaluationDefaults,
    new InMemoryFlagConfigCache(),
  );
  client.cohortStorage.replaceAll({
    cohort1: {
      cohortId: 'cohort1',
      groupType: USER_GROUP_TYPE,
      groupTypeId: 0,
      lastComputed: 0,
      lastModified: 0,
      size: 1,
      memberIds: new Set<string>(['userId']),
    },
    groupcohort1: {
      cohortId: 'groupcohort1',
      groupType: 'groupname',
      groupTypeId: 1,
      lastComputed: 0,
      lastModified: 0,
      size: 1,
      memberIds: new Set<string>(['amplitude', 'experiment']),
    },
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
