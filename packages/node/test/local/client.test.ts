import { Experiment } from 'src/factory';
import { LocalEvaluationClient } from 'src/local/client';
import { ExperimentUser } from 'src/types/user';
import { sleep } from 'src/util/time';

const apiKey = 'server-qz35UwzJ5akieoAdIgzM4m9MIiOLXLoz';

const testUser: ExperimentUser = { user_id: 'test_user' };

const client = Experiment.initializeLocal(apiKey, { debug: false });

beforeAll(async () => {
  await client.start();
});

afterAll(async () => {
  client.stop();
});

test('ExperimentClient.evaluate all flags, success', async () => {
  const variants = await client.evaluate(testUser);
  const variant = variants['sdk-local-evaluation-ci-test'];
  expect(variant).toEqual({ value: 'on', payload: 'payload' });
});

test('ExperimentClient.evaluate one flag, success', async () => {
  const variants = await client.evaluate(testUser, [
    'sdk-local-evaluation-ci-test',
  ]);
  const variant = variants['sdk-local-evaluation-ci-test'];
  expect(variant).toEqual({ value: 'on', payload: 'payload' });
});

test('ExperimentClient.evaluate with dependencies, no flag keys, success', async () => {
  const variants = await client.evaluate({
    user_id: 'user_id',
    device_id: 'device_id',
  });
  const variant = variants['sdk-ci-local-dependencies-test'];
  expect(variant).toEqual({ value: 'control', payload: null });
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
  expect(variant).toEqual({ value: 'control', payload: null });
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
    client.cache.get('sdk-ci-local-dependencies-test-holdout'),
  ).toBeDefined();
});

test('ExperimentClient.evaluate with assignmentConfiguration', async () => {
  const client = new LocalEvaluationClient(apiKey, {
    assignmentConfiguration: {
      apiKey: 'a6dd847b9d2f03c816d4f3f8458cdc1d',
    },
  });
  await client.start();
  await client.evaluate({ user_id: 'tim.yiu@amplitude.com' });
  await sleep(4000);
});

test('ExperimentClient.evaluate without assignmentConfiguration', async () => {
  const client = new LocalEvaluationClient(apiKey, {});
  await client.start();
  await client.evaluate({ user_id: 'tim.yiu@amplitude.com' });
  await sleep(4000);
});
