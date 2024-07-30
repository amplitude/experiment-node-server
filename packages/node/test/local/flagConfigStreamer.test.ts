import assert from 'assert';

import { FlagConfigPoller, InMemoryFlagConfigCache } from 'src/index';
import { SdkCohortApi } from 'src/local/cohort/cohort-api';
import { CohortFetcher } from 'src/local/cohort/fetcher';
import { InMemoryCohortStorage } from 'src/local/cohort/storage';
import { FlagConfigFetcher } from 'src/local/fetcher';
import { FlagConfigStreamer } from 'src/local/streamer';

import { MockHttpClient } from './util/mockHttpClient';
import { getNewClient } from './util/mockStreamEventSource';

const getFlagWithCohort = (
  cohortId,
) => `[{"key":"flag_${cohortId}","segments":[{
      "conditions":[[{"op":"set contains any","selector":["context","user","cohort_ids"],"values":["${cohortId}"]}]],
      "metadata":{"segmentName": "Segment 1"},"variant": "off"
      }],"variants": {}}]`;

let updater;
afterEach(() => {
  updater?.stop();
});

const getTestObjs = ({
  pollingIntervalMillis = 1000,
  streamFlagConnTimeoutMillis = 1000,
  streamFlagTryAttempts = 2,
  streamFlagTryDelayMillis = 1000,
  streamFlagRetryDelayMillis = 15000,
  apiKey = 'client-xxxx',
  serverUrl = 'http://localhostxxxx:00000000',
  cohortFetcherDelayMillis = 100,
  fetcherData = [
    '[{"key": "fetcher-a", "variants": {}, "segments": []}]',
    '[{"key": "fetcher-b", "variants": {}, "segments": []}]',
  ],
  debug = false,
}) => {
  const fetchObj = {
    fetchCalls: 0,
    fetcher: undefined,
    cohortStorage: new InMemoryCohortStorage(),
    cohortFetcher: new CohortFetcher(
      'apikey',
      'secretkey',
      new MockHttpClient(async () => ({ status: 200, body: '' })),
      serverUrl,
      cohortFetcherDelayMillis,
    ),
  };
  let dataI = 0;
  fetchObj.fetcher = new FlagConfigFetcher(
    apiKey,
    new MockHttpClient(async () => {
      fetchObj.fetchCalls++;
      return { status: 200, body: fetcherData[dataI] };
    }),
  );
  const fetcherReturnNext = () => {
    dataI++;
  };
  const cache = new InMemoryFlagConfigCache();
  const mockClient = getNewClient();
  updater = new FlagConfigStreamer(
    apiKey,
    new FlagConfigPoller(
      fetchObj.fetcher,
      cache,
      fetchObj.cohortStorage,
      fetchObj.cohortFetcher,
      pollingIntervalMillis,
      debug,
    ),
    cache,
    mockClient.clientFactory,
    streamFlagConnTimeoutMillis,
    streamFlagTryAttempts,
    streamFlagTryDelayMillis,
    streamFlagRetryDelayMillis,
    serverUrl,
    fetchObj.cohortStorage,
    fetchObj.cohortFetcher,
    debug,
  );
  return {
    fetchObj,
    fetcherReturnNext,
    cache,
    mockClient,
    updater,
  };
};

test('FlagConfigUpdater.connect, success', async () => {
  const { fetchObj, mockClient, updater } = getTestObjs({
    pollingIntervalMillis: 100,
  });
  updater.start();
  await mockClient.client.doOpen({ type: 'open' });
  await mockClient.client.doMsg({ data: '[]' });
  assert(fetchObj.fetchCalls == 0);
  assert(mockClient.numCreated == 1);
  updater.stop();
});

test('FlagConfigUpdater.connect, start success, gets initial flag configs, gets subsequent flag configs', async () => {
  const { fetchObj, cache, mockClient, updater } = getTestObjs({
    pollingIntervalMillis: 100,
  });
  updater.start();
  await mockClient.client.doOpen({ type: 'open' });
  await mockClient.client.doMsg({
    data: '[{"key": "a", "variants": {}, "segments": []}]',
  });
  assert(fetchObj.fetchCalls == 0);
  assert(mockClient.numCreated == 1);
  await new Promise((r) => setTimeout(r, 200));
  assert((await cache.get('a')).key == 'a');

  await mockClient.client.doMsg({
    data: '[{"key": "b", "variants": {}, "segments": []}]',
  });
  await new Promise((r) => setTimeout(r, 200));
  assert((await cache.get('b')).key == 'b');
  assert((await cache.get('a')) == undefined);

  updater.stop();
});

test('FlagConfigUpdater.connect, stream start fail, only 1 attempt, fallback to poller, poller updates flag configs correctly', async () => {
  const { fetchObj, fetcherReturnNext, cache, mockClient, updater } =
    getTestObjs({ pollingIntervalMillis: 100, streamFlagTryAttempts: 1 });
  updater.start();
  await mockClient.client.doErr({ status: 503 }); // Send 503 non fatal to fallback to poller after single attempt.
  await new Promise((r) => setTimeout(r, 200)); // Wait for poller to poll.
  assert(fetchObj.fetchCalls >= 1);
  assert(mockClient.numCreated == 1);
  assert((await cache.get('fetcher-a')).key == 'fetcher-a');

  fetcherReturnNext();
  await new Promise((r) => setTimeout(r, 200)); // Wait for poller to poll.
  assert((await cache.get('fetcher-b')).key == 'fetcher-b');
  assert((await cache.get('fetcher-a')) == undefined);

  updater.stop();
});

test('FlagConfigUpdater.connect, stream start fail, fallback to poller, poller updates flag configs correctly', async () => {
  const { fetchObj, fetcherReturnNext, cache, mockClient, updater } =
    getTestObjs({ pollingIntervalMillis: 100 });
  updater.start();
  await mockClient.client.doErr({ status: 501 }); // Send 501 fatal err to fallback to poller.
  await new Promise((r) => setTimeout(r, 200)); // Wait for poller to poll.
  assert(fetchObj.fetchCalls >= 1);
  assert(mockClient.numCreated == 1);
  assert((await cache.get('fetcher-a')).key == 'fetcher-a');

  fetcherReturnNext();
  await new Promise((r) => setTimeout(r, 200)); // Wait for poller to poll.
  assert((await cache.get('fetcher-b')).key == 'fetcher-b');
  assert((await cache.get('fetcher-a')) == undefined);

  updater.stop();
});

test('FlagConfigUpdater.connect, start success, gets error initial flag configs, fallback to poller', async () => {
  const { fetchObj, mockClient, updater } = getTestObjs({
    pollingIntervalMillis: 100,
  });
  updater.start();
  await mockClient.client.doOpen({ type: 'open' });
  await mockClient.client.doMsg({
    data: 'xxx',
  }); // Initial error flag configs for first try.
  await new Promise((r) => setTimeout(r, 1100)); // Wait try delay.

  await mockClient.client.doOpen({ type: 'open' });
  await mockClient.client.doMsg({
    data: '[{"key: aaa}]',
  }); // Another error flag configs for second try.
  await new Promise((r) => setTimeout(r, 1100)); // Wait try delay.

  // Should fallbacked to poller.
  assert(fetchObj.fetchCalls > 0);
  assert(mockClient.numCreated == 2);

  updater.stop();
});

test('FlagConfigUpdater.connect, start success, gets ok initial flag configs, but gets error flag configs later, fallback to poller', async () => {
  const { fetchObj, mockClient, updater } = getTestObjs({
    pollingIntervalMillis: 100,
  });
  updater.start();
  await mockClient.client.doOpen({ type: 'open' });
  await mockClient.client.doMsg({
    data: '[{"key": "a", "variants": {}, "segments": []}]',
  }); // Initial flag configs are fine.
  await new Promise((r) => setTimeout(r, 200));
  assert(fetchObj.fetchCalls == 0);
  let n = mockClient.numCreated;
  assert(n == 1);

  // Start error ones.
  await mockClient.client.doMsg({
    data: 'hahaha',
  }); // An error flag configs to start retry.
  await new Promise((r) => setTimeout(r, 500));

  await mockClient.client.doOpen({ type: 'open' });
  await mockClient.client.doMsg({
    data: 'xxx',
  }); // Error flag configs for first retry.
  await new Promise((r) => setTimeout(r, 1000)); // Need to yield quite some time to start retry.

  await mockClient.client.doOpen({ type: 'open' });
  await mockClient.client.doMsg({
    data: '[{"key: aaa}]',
  }); // Error flag configs for second retry.
  await new Promise((r) => setTimeout(r, 1000)); // Need to yield quite some time to start retry.

  assert(fetchObj.fetchCalls > 0);
  n = mockClient.numCreated;
  assert(n == 3);

  updater.stop();
});

test('FlagConfigUpdater.connect, open but no initial flag configs', async () => {
  const { fetchObj, mockClient, updater } = getTestObjs({
    pollingIntervalMillis: 100,
  });
  updater.start();
  await mockClient.client.doOpen({ type: 'open' });
  await new Promise((r) => setTimeout(r, 1100));
  await mockClient.client.doOpen({ type: 'open' });
  await new Promise((r) => setTimeout(r, 2000));
  assert(fetchObj.fetchCalls > 0);
  assert(mockClient.numCreated == 2);
  updater.stop();
});

test('FlagConfigUpdater.connect, success and then fails and then reconnects', async () => {
  const { fetchObj, mockClient, updater } = getTestObjs({
    pollingIntervalMillis: 100,
  });
  updater.start();
  await mockClient.client.doOpen({ type: 'open' });
  await mockClient.client.doMsg({ data: '[]' });
  await mockClient.client.doErr({ status: 500 });
  await new Promise((r) => setTimeout(r, 500));
  await mockClient.client.doOpen({ type: 'open' });
  await mockClient.client.doMsg({ data: '[]' });
  assert(fetchObj.fetchCalls == 0);
  assert(mockClient.numCreated == 2);
  updater.stop();
});

test('FlagConfigUpdater.connect, timeout first try, retry success', async () => {
  const { mockClient, updater } = getTestObjs({});
  updater.start();
  await new Promise((r) => setTimeout(r, 2200)); // Wait at least 2 secs, at most 3 secs for first try timeout.
  await mockClient.client.doOpen({ type: 'open' });
  await mockClient.client.doMsg({ data: '[]' });
  assert(mockClient.numCreated == 2);
  updater.stop();
});

test('FlagConfigUpdater.connect, retry timeout, backoff to poll after 2 tries', async () => {
  const { fetchObj, mockClient, updater } = getTestObjs({
    pollingIntervalMillis: 100,
  });
  await updater.start(); // Awaits start(), no data sent.
  assert(fetchObj.fetchCalls >= 1);
  assert(mockClient.numCreated == 2);
  updater.stop();
});

test('FlagConfigUpdater.connect, 501, backoff to poll after 1 try', async () => {
  const { fetchObj, mockClient, updater } = getTestObjs({
    pollingIntervalMillis: 100,
  });
  updater.start();
  await mockClient.client.doErr({ status: 501 }); // Send 501 fatal err.
  await new Promise((r) => setTimeout(r, 200)); // Wait for poller to poll.
  assert(fetchObj.fetchCalls >= 1);
  assert(mockClient.numCreated == 1);
  updater.stop();
});

test('FlagConfigUpdater.connect, 404, backoff to poll after 2 tries', async () => {
  const { fetchObj, mockClient, updater } = getTestObjs({
    pollingIntervalMillis: 100,
  });
  updater.start();
  await mockClient.client.doErr({ status: 404 }); // Send error for first try.
  await new Promise((r) => setTimeout(r, 1100)); // Wait for poller to poll.
  await mockClient.client.doErr({ status: 404 }); // Send error for second try.
  await new Promise((r) => setTimeout(r, 200)); // Wait for poller to poll.
  assert(fetchObj.fetchCalls >= 1);
  assert(mockClient.numCreated == 2);
  updater.stop();
});

test('FlagConfigUpdater.connect, two starts, second does nothing', async () => {
  const { fetchObj, mockClient, updater } = getTestObjs({
    pollingIntervalMillis: 100,
  });
  updater.start();
  updater.start();
  await mockClient.client.doOpen({ type: 'open' });
  await mockClient.client.doMsg({ data: '[]' });
  await new Promise((r) => setTimeout(r, 2500)); // Wait for stream to init success.
  assert(fetchObj.fetchCalls == 0);
  assert(mockClient.numCreated == 1);
  updater.stop();
});

test('FlagConfigUpdater.connect, start and immediately stop does not retry', async () => {
  const { fetchObj, mockClient, updater } = getTestObjs({
    pollingIntervalMillis: 100,
  });
  updater.start();
  updater.stop();
  await new Promise((r) => setTimeout(r, 1000));
  assert(fetchObj.fetchCalls == 0);
  assert(mockClient.numCreated == 1);
});

test('FlagConfigUpdater.connect, start fail, retry and immediately stop, no poller start', async () => {
  const { fetchObj, mockClient, updater } = getTestObjs({
    pollingIntervalMillis: 100,
  });
  updater.start();
  await new Promise((r) => setTimeout(r, 2100)); // Wait for timeout and try delay.
  updater.stop();
  assert(fetchObj.fetchCalls == 0);
  assert(mockClient.numCreated == 2);

  await new Promise((r) => setTimeout(r, 200)); // Wait to check poller start.
  assert(fetchObj.fetchCalls == 0);
});

test('FlagConfigUpdater.connect, test error after connection, poller starts, stream retry success, poller stops', async () => {
  jest.setTimeout(25000);
  const streamFlagRetryDelayMillis = 15000;
  const { fetchObj, mockClient, updater } = getTestObjs({
    pollingIntervalMillis: 200,
    streamFlagRetryDelayMillis,
  });
  // Test error after normal close.
  updater.start();
  await mockClient.client.doOpen({ type: 'open' });
  await mockClient.client.doMsg({ data: '[]' });
  let n = mockClient.numCreated;
  assert(n == 1);
  // Pass errors to stop first stream.
  await mockClient.client.doErr({ status: 500 });
  await new Promise((r) => setTimeout(r, 200)); // Wait for stream to init.
  await mockClient.client.doErr({ status: 500 }); // Pass errors to make first retry fail.
  n = mockClient.numCreated;
  assert(n == 2);
  await new Promise((r) => setTimeout(r, 1200)); // Wait for stream to init.
  await mockClient.client.doErr({ status: 500 }); // Pass error to make second retry fail.
  await new Promise((r) => setTimeout(r, 500)); // Wait for stream to init.
  // No stop() here. The streamRetryTimeout will still be running.
  assert(fetchObj.fetchCalls > 0);
  n = mockClient.numCreated;
  assert(n == 3);
  // Check retry.
  await new Promise((r) => setTimeout(r, streamFlagRetryDelayMillis)); // Wait for retry.
  await mockClient.client.doOpen({ type: 'open' });
  await mockClient.client.doMsg({ data: '[]' });
  n = mockClient.numCreated;
  assert(n == 4);
  // Check poller stop.
  const prevFetchCalls = fetchObj.fetchCalls;
  await new Promise((r) => setTimeout(r, 500)); // Wait to see if poller runs while waiting.
  assert(fetchObj.fetchCalls == prevFetchCalls);
  updater.stop();
});

test('FlagConfigUpdater.connect, test restarts', async () => {
  const { fetchObj, mockClient, updater } = getTestObjs({
    pollingIntervalMillis: 200,
  });
  updater.start();
  await mockClient.client.doOpen({ type: 'open' });
  await mockClient.client.doMsg({ data: '[]' });
  assert(fetchObj.fetchCalls == 0);
  let n = mockClient.numCreated;
  assert(n == 1);
  updater.stop();

  // Test start after normal close.
  updater.start();
  await mockClient.client.doOpen({ type: 'open' });
  await mockClient.client.doMsg({ data: '[]' });
  assert(fetchObj.fetchCalls == 0);
  n = mockClient.numCreated;
  assert(n == 2);
  updater.stop();

  // Test error after normal close.
  updater.start();
  await mockClient.client.doOpen({ type: 'open' });
  await mockClient.client.doMsg({ data: '[]' });
  await mockClient.client.doErr({ status: 500 }); // Send error to stop current stream.
  await new Promise((r) => setTimeout(r, 200)); // Wait for stream to init.
  await mockClient.client.doErr({ status: 500 }); // Send error for first retry.
  await new Promise((r) => setTimeout(r, 1200)); // Wait for stream to timeout and start second try.
  await mockClient.client.doErr({ status: 500 }); // Send error for second retry.
  await new Promise((r) => setTimeout(r, 500)); // Wait for stream to init.
  assert(fetchObj.fetchCalls > 0);
  n = mockClient.numCreated;
  assert(n == 5);
  // No stop() here. The streamRetryTimeout will still be running.

  // Test normal start after error close. Poller should be stopped.
  const prevFetchCalls = fetchObj.fetchCalls;
  updater.start();
  await mockClient.client.doOpen({ type: 'open' });
  await mockClient.client.doMsg({ data: '[]' });
  await new Promise((r) => setTimeout(r, 500)); // Wait for stream to init.
  assert(fetchObj.fetchCalls == prevFetchCalls);
  n = mockClient.numCreated;
  assert(n == 6);
  updater.stop();
});

test('FlagConfigUpdater.connect, start success, keep alive success, no fallback to poller', async () => {
  jest.setTimeout(20000);
  const { fetchObj, mockClient, updater } = getTestObjs({
    pollingIntervalMillis: 200,
  });
  updater.start();
  await mockClient.client.doOpen({ type: 'open' });
  await mockClient.client.doMsg({ data: '[]' });
  assert(fetchObj.fetchCalls == 0);
  let n = mockClient.numCreated;
  assert(n == 1);

  // Test keep alive.
  await new Promise((r) => setTimeout(r, 15000)); // Wait before keep alive timeouts.
  await mockClient.client.doMsg({ data: ' ' });
  assert(fetchObj.fetchCalls == 0);
  n = mockClient.numCreated;
  assert(n == 1);

  await new Promise((r) => setTimeout(r, 3000)); // Wait for original keep alive timeout to reach.
  assert(fetchObj.fetchCalls == 0);
  n = mockClient.numCreated;
  assert(n == 1);

  updater.stop();
});

test('FlagConfigStreamer.connect, start success, keep alive fail, retry success', async () => {
  jest.setTimeout(20000);
  const { fetchObj, mockClient, updater } = getTestObjs({
    pollingIntervalMillis: 200,
  });
  updater.start();
  await mockClient.client.doOpen({ type: 'open' });
  await mockClient.client.doMsg({ data: '[]' });
  assert(fetchObj.fetchCalls == 0);
  let n = mockClient.numCreated;
  assert(n == 1);

  // Test keep alive fail.
  await new Promise((r) => setTimeout(r, 17500)); // Wait for keep alive to fail and enter retry.
  await mockClient.client.doOpen({ type: 'open' });
  await mockClient.client.doMsg({ data: '[]' });
  assert(fetchObj.fetchCalls == 0);
  n = mockClient.numCreated;
  assert(n == 2);

  updater.stop();
});

test('FlagConfigUpdater.connect, start success, keep alive fail, retry fail twice, fallback to poller', async () => {
  jest.setTimeout(20000);
  const { fetchObj, mockClient, updater } = getTestObjs({
    pollingIntervalMillis: 200,
  });
  updater.start();
  await mockClient.client.doOpen({ type: 'open' });
  await mockClient.client.doMsg({ data: '[]' });
  assert(fetchObj.fetchCalls == 0);
  let n = mockClient.numCreated;
  assert(n == 1);

  // Test keep alive fail.
  await new Promise((r) => setTimeout(r, 17500)); // Wait for keep alive to fail and enter retry.
  await mockClient.client.doErr({ status: 500 }); // Send error for first try.
  await new Promise((r) => setTimeout(r, 1200)); // Wait for stream to init.
  await mockClient.client.doErr({ status: 500 }); // Send error for second try.
  await new Promise((r) => setTimeout(r, 500)); // Wait for poller to init.
  assert(fetchObj.fetchCalls > 0);
  n = mockClient.numCreated;
  assert(n == 3);

  updater.stop();
});

test('FlagConfigUpdater.connect, start fail, fallback to poller, retry stream success, stop poller, no more retry stream', async () => {
  jest.setTimeout(10000);
  const { fetchObj, mockClient, updater } = getTestObjs({
    pollingIntervalMillis: 200,
    streamFlagRetryDelayMillis: 2000,
  });
  updater.start();
  await mockClient.client.doErr({ status: 501 }); // Fatal err to fail initial conn.
  await new Promise((r) => setTimeout(r, 500)); // Wait for poller to start.
  assert(fetchObj.fetchCalls > 0);
  let n = mockClient.numCreated;
  assert(n == 1);

  // Check for retry stream start.
  await new Promise((r) => setTimeout(r, 2000)); // Wait for retry.
  n = mockClient.numCreated;
  assert(n == 2);

  // Retry stream success.
  const prevFetchCalls = fetchObj.fetchCalls;
  await mockClient.client.doOpen({ type: 'open' });
  await mockClient.client.doMsg({ data: '[]' });
  assert(fetchObj.fetchCalls == prevFetchCalls);

  // Wait to check poller stopped.
  await new Promise((r) => setTimeout(r, 500));
  assert(fetchObj.fetchCalls == prevFetchCalls);

  // Check there is no more retry stream.
  await new Promise((r) => setTimeout(r, 2000)); // Wait for retry.
  n = mockClient.numCreated;
  assert(n == 2);

  updater.stop();
});

test('FlagConfigUpdater.connect, start fail, fallback to poller, retry stream fail, continue poller, retry stream success, stop poller', async () => {
  jest.setTimeout(10000);
  const { fetchObj, mockClient, updater } = getTestObjs({
    pollingIntervalMillis: 200,
    streamFlagRetryDelayMillis: 2000,
  });
  updater.start();
  await mockClient.client.doErr({ status: 501 }); // Fatal err to fail initial conn.
  await new Promise((r) => setTimeout(r, 500)); // Wait for poller to start.
  assert(fetchObj.fetchCalls > 0);
  let n = mockClient.numCreated;
  assert(n == 1);

  // Wait for retry stream start.
  await new Promise((r) => setTimeout(r, 2000)); // Wait for retry.
  n = mockClient.numCreated;
  assert(n == 2);

  // Retry stream fail.
  let prevFetchCalls = fetchObj.fetchCalls;
  await mockClient.client.doErr({ status: 500 }); // Fatal err to fail stream retry.

  // Wait to check poller continues to poll.
  await new Promise((r) => setTimeout(r, 500));
  assert(fetchObj.fetchCalls > prevFetchCalls);

  // Wait for another retry stream start.
  await new Promise((r) => setTimeout(r, 2000)); // Wait for retry.
  n = mockClient.numCreated;
  assert(n == 3);

  // Retry stream success.
  prevFetchCalls = fetchObj.fetchCalls;
  await mockClient.client.doOpen({ type: 'open' });
  await mockClient.client.doMsg({ data: '[]' });
  assert(fetchObj.fetchCalls == prevFetchCalls);

  // Wait to check poller stopped.
  await new Promise((r) => setTimeout(r, 500));
  assert(fetchObj.fetchCalls == prevFetchCalls);

  updater.stop();
});

test.todo(
  'FlagConfigUpdater.connect, start and immediately stop and immediately start is an unhandled edge case',
);

test('FlagConfigUpdater.connect, flag success, cohort success', async () => {
  const { fetchObj, mockClient, updater, cache } = getTestObjs({
    pollingIntervalMillis: 100,
  });
  // Return cohort with their own cohortId.
  jest
    .spyOn(SdkCohortApi.prototype, 'getCohort')
    .mockImplementation(async (options) => {
      return {
        cohortId: options.cohortId,
        groupType: '',
        groupTypeId: 0,
        lastComputed: 0,
        lastModified: 0,
        size: 0,
        memberIds: new Set<string>([]),
      };
    });
  updater.start();
  await mockClient.client.doOpen({ type: 'open' });
  await mockClient.client.doMsg({
    data: getFlagWithCohort('cohort1'),
  });
  await new Promise((r) => setTimeout(r, 1000)); // Wait for poller to poll.
  expect(fetchObj.fetchCalls).toBe(0);
  expect(mockClient.numCreated).toBe(1);
  expect(await cache.get('flag_cohort1')).toBeDefined();
  updater.stop();
});

test('FlagConfigUpdater.connect, flag success, success, flag update success, cohort fail, wont fallback to poller as flag stream is ok', async () => {
  jest.setTimeout(20000);
  jest
    .spyOn(SdkCohortApi.prototype, 'getCohort')
    .mockImplementation(async (options) => {
      if (options.cohortId != 'cohort1') throw Error();
      return {
        cohortId: options.cohortId,
        groupType: '',
        groupTypeId: 0,
        lastComputed: 0,
        lastModified: 0,
        size: 0,
        memberIds: new Set<string>([]),
      };
    });
  const { fetchObj, mockClient, updater, cache } = getTestObjs({
    pollingIntervalMillis: 100,
    streamFlagTryAttempts: 2,
    streamFlagTryDelayMillis: 1000,
    streamFlagRetryDelayMillis: 100000,
  });

  updater.start();
  await mockClient.client.doOpen({ type: 'open' });
  await mockClient.client.doMsg({
    data: getFlagWithCohort('cohort1'),
  });
  await new Promise((r) => setTimeout(r, 1000)); // Wait for poller to poll.
  expect(fetchObj.fetchCalls).toBe(0); // No poller poll.
  expect(mockClient.numCreated).toBe(1);
  expect(await cache.get('flag_cohort1')).toBeDefined();

  // Return cohort with their own cohortId.
  // Now update the flags with a new cohort that will fail to download.
  await mockClient.client.doMsg({
    data: getFlagWithCohort('cohort2'),
  });
  await new Promise((r) => setTimeout(r, 1000)); // Wait for poller to poll.

  expect(fetchObj.fetchCalls).toBeGreaterThanOrEqual(0); // No poller poll.
  expect(mockClient.numCreated).toBe(1);
  expect(await cache.get('flag_cohort1')).toBeUndefined(); // Old flag removed.
  expect(await cache.get('flag_cohort2')).toBeUndefined(); // Won't add flag to cache if new cohort fails.
  updater.stop();
});

test('FlagConfigUpdater.connect, flag success, cohort fail, retry fail, initialization fails, fallback to poller', async () => {
  jest.setTimeout(20000);
  jest
    .spyOn(SdkCohortApi.prototype, 'getCohort')
    .mockImplementation(async () => {
      throw Error();
    });
  const { fetchObj, mockClient, updater } = getTestObjs({
    pollingIntervalMillis: 100,
    streamFlagTryAttempts: 2,
    streamFlagTryDelayMillis: 1000,
    streamFlagRetryDelayMillis: 100000,
    debug: true,
  });
  // Return cohort with their own cohortId.
  updater.start();
  await mockClient.client.doOpen({ type: 'open' });
  await mockClient.client.doMsg({
    data: getFlagWithCohort('cohort1'),
  });
  await new Promise((resolve) => setTimeout(resolve, 250)); // Wait for cohort download done retries and fails.
  await new Promise((resolve) => setTimeout(resolve, 1050)); // Wait for retry stream.
  // Second try
  await mockClient.client.doOpen({ type: 'open' });
  await mockClient.client.doMsg({
    data: getFlagWithCohort('cohort1'),
  });
  await new Promise((resolve) => setTimeout(resolve, 250)); // Wait for cohort download done retries and fails.

  expect(fetchObj.fetchCalls).toBeGreaterThanOrEqual(1);
  expect(mockClient.numCreated).toBe(2);
  updater.stop();
});

test('FlagConfigUpdater.connect, flag success, cohort fail, initialization fails, fallback to poller, poller fails, streamer start error', async () => {
  jest.setTimeout(10000);
  jest
    .spyOn(SdkCohortApi.prototype, 'getCohort')
    .mockImplementation(async () => {
      throw Error();
    });
  const { fetchObj, mockClient, updater } = getTestObjs({
    pollingIntervalMillis: 30000,
    streamFlagTryAttempts: 1,
    streamFlagTryDelayMillis: 1000,
    streamFlagRetryDelayMillis: 100000,
    fetcherData: [
      getFlagWithCohort('cohort1'),
      getFlagWithCohort('cohort1'),
      getFlagWithCohort('cohort1'),
      getFlagWithCohort('cohort1'),
      getFlagWithCohort('cohort1'),
    ],
  });
  // Return cohort with their own cohortId.
  const startPromise = updater.start();
  await mockClient.client.doOpen({ type: 'open' });
  await mockClient.client.doMsg({
    data: getFlagWithCohort('cohort1'),
  });
  // Stream failed, poller should fail as well given the flags and cohort mock.
  expect(fetchObj.fetchCalls).toBeGreaterThanOrEqual(1);
  expect(mockClient.numCreated).toBe(1);
  // Test should exit cleanly as updater.start() failure should stop the streamer.
  try {
    await startPromise;
    fail();
    // eslint-disable-next-line no-empty
  } catch {}
});
