import { FetchError } from '@amplitude/experiment-core';
import { RemoteEvaluationClient } from 'src/remote/client';
import { ExperimentUser } from 'src/types/user';

const API_KEY = 'server-qz35UwzJ5akieoAdIgzM4m9MIiOLXLoz';

const testUser: ExperimentUser = { user_id: 'test_user' };

describe('ExperimentClient.fetch', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
    jest.restoreAllMocks();
  });

  test('ExperimentClient.fetch, success', async () => {
    const client = new RemoteEvaluationClient(API_KEY, {});
    const variants = await client.fetch(testUser);
    const variant = variants['sdk-ci-test'];
    delete variant.metadata;
    expect(variant).toEqual({ key: 'on', value: 'on', payload: 'payload' });
  });

  test('ExperimentClient.fetch, no retries, timeout failure', async () => {
    const client = new RemoteEvaluationClient(API_KEY, {
      fetchRetries: 0,
      fetchTimeoutMillis: 0,
    });
    const variants = await client.fetch(testUser);
    expect(variants).toEqual({});
  });

  test('ExperimentClient.fetch, no retries, timeout failure, retry success', async () => {
    const client = new RemoteEvaluationClient(API_KEY, {
      fetchRetries: 1,
      fetchTimeoutMillis: 0,
    });
    const variants = await client.fetch(testUser);
    const variant = variants['sdk-ci-test'];
    delete variant.metadata;
    expect(variant).toEqual({ key: 'on', value: 'on', payload: 'payload' });
  });

  test('ExperimentClient.fetch, retry once, timeout first then succeed with 0 backoff', async () => {
    const client = new RemoteEvaluationClient(API_KEY, {
      fetchTimeoutMillis: 0,
      fetchRetries: 1,
      fetchRetryBackoffMinMillis: 0,
      fetchRetryTimeoutMillis: 10_000,
    });
    const variants = await client.fetch(testUser);
    const variant = variants['sdk-ci-test'];
    delete variant.metadata;
    expect(variant).toEqual({ key: 'on', value: 'on', payload: 'payload' });
  });

  test('ExperimentClient.fetch, v1 off returns undefined', async () => {
    const client = new RemoteEvaluationClient(API_KEY, {});
    const variant = (await client.fetch({}))['sdk-ci-test'];
    expect(variant).toBeUndefined();
  });

  test('ExperimentClient.fetch, v2 off returns default variant', async () => {
    const client = new RemoteEvaluationClient(API_KEY, {});
    const variant = (await client.fetchV2({}))['sdk-ci-test'];
    expect(variant.key).toEqual('off');
    expect(variant.value).toBeUndefined();
    expect(variant.metadata.default).toEqual(true);
  });

  test('ExperimentClient.fetch, v2 tracksAssignment and tracksExposure', async () => {
    const client = new RemoteEvaluationClient(API_KEY, {});
    const getVariantsSpy = jest.spyOn(
      (client as any).evaluationApi,
      'getVariants',
    );
    const variants = await client.fetchV2(testUser, {
      tracksAssignment: true,
      tracksExposure: true,
    });
    expect(getVariantsSpy).toHaveBeenCalledWith(
      expect.objectContaining(testUser),
      expect.objectContaining({
        trackingOption: 'track',
        exposureTrackingOption: 'track',
      }),
    );
  });
});

describe('ExperimentClient.fetch, retry with different response codes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  test.each([
    [300, 'Fetch Exception 300', 1],
    [400, 'Fetch Exception 400', 0],
    [429, 'Fetch Exception 429', 1],
    [500, 'Fetch Exception 500', 1],
    [0, 'Other Exception', 1],
  ])(
    'responseCode=%p, errorMessage=%p, retryCalled=%p',
    async (responseCode, errorMessage, retryCalled) => {
      const client = new RemoteEvaluationClient(API_KEY, { fetchRetries: 1 });

      jest
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .spyOn(RemoteEvaluationClient.prototype as any, 'doFetch')
        .mockImplementation(async () => {
          return new Promise<RemoteEvaluationClient>((_resolve, reject) => {
            if (responseCode === 0) {
              reject(new Error(errorMessage));
            } else {
              reject(new FetchError(responseCode, errorMessage));
            }
          });
        });
      const retryMock = jest.spyOn(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        RemoteEvaluationClient.prototype as any,
        'retryFetch',
      );
      try {
        await client.fetch({ user_id: 'test_user' });
      } catch (e) {
        // catch error
      }
      expect(retryMock).toHaveBeenCalledTimes(retryCalled);
    },
  );
});
