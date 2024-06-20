import { EvaluationFlag } from '@amplitude/experiment-core';
import { Experiment } from 'src/factory';
import { InMemoryFlagConfigCache, LocalEvaluationClient } from 'src/index';
import { USER_GROUP_TYPE } from 'src/types/cohort';
import {
  AssignmentConfigDefaults,
  LocalEvaluationDefaults,
} from 'src/types/config';
import { ExperimentUser } from 'src/types/user';

const apiKey = 'server-qz35UwzJ5akieoAdIgzM4m9MIiOLXLoz';

const testUser: ExperimentUser = { user_id: 'test_user' };

const client = Experiment.initializeLocal(apiKey);

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
