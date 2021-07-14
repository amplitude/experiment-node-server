import { ExperimentClient } from 'src/client';
import { ExperimentUser } from 'src/types/user';

const API_KEY = 'client-DvWljIjiiuqLbyjqdvBaLFfEBrAvGuA3';

const testUser: ExperimentUser = { user_id: 'test_user' };

const testClient: ExperimentClient = new ExperimentClient(API_KEY, {});

const testTimeoutNoRetriesClient = new ExperimentClient(API_KEY, {
  fetchRetries: 0,
  fetchTimeoutMillis: 1,
});

const testTimeoutRetrySuccessClient = new ExperimentClient(API_KEY, {
  fetchTimeoutMillis: 1,
});

test('ExperimentClient.fetch, success', async () => {
  const variants = await testClient.fetch(testUser);
  const variant = variants['sdk-ci-test'];
  expect(variant).toEqual({ value: 'on', payload: 'payload' });
});

test('ExperimentClient.fetch, no retries, timeout failure', async () => {
  const variants = await testTimeoutNoRetriesClient.fetch(testUser);
  expect(variants).toEqual({});
});

test('ExperimentClient.fetch, no retries, timeout failure', async () => {
  const variants = await testTimeoutRetrySuccessClient.fetch(testUser);
  const variant = variants['sdk-ci-test'];
  expect(variant).toEqual({ value: 'on', payload: 'payload' });
});
