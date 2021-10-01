import { FlagConfigFetcher } from 'src/local/fetcher';

import { MockHttpClient } from './util/MockHttpClient';

const apiKey = 'server-qz35UwzJ5akieoAdIgzM4m9MIiOLXLoz';

test('FlagConfigFetcher.fetch, success', async () => {
  const fetcher = new FlagConfigFetcher(
    apiKey,
    new MockHttpClient(async () => {
      return { status: 200, body: '{}' };
    }),
  );
  try {
    await fetcher.fetch();
    // Pass
  } catch (e) {
    fail(e);
  }
});

test('FlagConfigFetcher.fetch, failure', async () => {
  const fetcher = new FlagConfigFetcher(
    apiKey,
    new MockHttpClient(async () => {
      return { status: 500, body: undefined };
    }),
  );
  try {
    await fetcher.fetch();
    fail('unexpected success');
  } catch (e) {
    // Pass
  }
});
