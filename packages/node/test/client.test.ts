import { ExperimentClient } from 'src/client';
import { ExperimentUser } from 'src/types/user';

const API_KEY = 'server-qz35UwzJ5akieoAdIgzM4m9MIiOLXLoz';

const testUser: ExperimentUser = { user_id: 'test_user' };

let client: ExperimentClient;

afterEach(() => {
  client.close();
});

test('ExperimentClient.fetch, success', async () => {
  client = new ExperimentClient(API_KEY, {});
  const variants = await client.fetch(testUser);
  const variant = variants['sdk-ci-test'];
  expect(variant).toEqual({ value: 'on', payload: 'payload' });
});

test('ExperimentClient.fetch, no retries, timeout failure', async () => {
  client = new ExperimentClient(API_KEY, {
    fetchRetries: 0,
    fetchTimeoutMillis: 1,
  });
  const variants = await client.fetch(testUser);
  expect(variants).toEqual({});
});

test('ExperimentClient.fetch, no retries, timeout failure', async () => {
  client = new ExperimentClient(API_KEY, {
    fetchTimeoutMillis: 1,
  });
  const variants = await client.fetch(testUser);
  const variant = variants['sdk-ci-test'];
  expect(variant).toEqual({ value: 'on', payload: 'payload' });
});

test('ExperimentClient.evaluate, success', async () => {
  client = new ExperimentClient(API_KEY, {
    debug: true,
    enableLocalEvaluation: true,
  });
  const variants = await client.evaluate(testUser);
  const variant = variants['sdk-ci-test'];
  expect(variant).toEqual({ value: 'on', payload: 'payload' });
});
