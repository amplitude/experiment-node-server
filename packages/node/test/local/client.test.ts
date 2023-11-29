import { Experiment } from 'src/factory';
import { ExperimentUser } from 'src/types/user';

const apiKey = 'server-qz35UwzJ5akieoAdIgzM4m9MIiOLXLoz';

const testUser: ExperimentUser = { user_id: 'test_user' };

const client = Experiment.initializeLocal(apiKey, { debug: true });

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
