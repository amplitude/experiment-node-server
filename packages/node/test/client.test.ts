import { ExperimentClient } from 'src/client';
import { ExperimentUser } from 'src/types/user';

const API_KEY = 'server-qz35UwzJ5akieoAdIgzM4m9MIiOLXLoz';

const testUser: ExperimentUser = { user_id: 'test_user' };

test('ExperimentClient.fetch, success', async () => {
  const client = new ExperimentClient(API_KEY, {});
  const variants = await client.fetch(testUser);
  const variant = variants['sdk-ci-test'];
  expect(variant).toEqual({ value: 'on', payload: 'payload' });
});

test('ExperimentClient.fetch, no retries, timeout failure', async () => {
  const client = new ExperimentClient(API_KEY, {
    fetchRetries: 0,
    fetchTimeoutMillis: 1,
  });
  const variants = await client.fetch(testUser);
  expect(variants).toEqual({});
});

test('ExperimentClient.fetch, no retries, timeout failure, retry success', async () => {
  const client = new ExperimentClient(API_KEY, {
    fetchRetries: 1,
    fetchTimeoutMillis: 1,
  });
  const variants = await client.fetch(testUser);
  const variant = variants['sdk-ci-test'];
  expect(variant).toEqual({ value: 'on', payload: 'payload' });
});

test('ExperimentClient.fetch, retry once, timeout first then succeed with 0 backoff', async () => {
  const client = new ExperimentClient(API_KEY, {
    fetchTimeoutMillis: 1,
    fetchRetries: 1,
    fetchRetryBackoffMinMillis: 0,
    fetchRetryTimeoutMillis: 10_000,
  });
  const variants = await client.fetch(testUser);
  const variant = variants['sdk-ci-test'];
  expect(variant).toEqual({ value: 'on', payload: 'payload' });
});
