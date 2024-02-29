import assert from 'assert';

import { InMemoryFlagConfigCache } from 'src/index';
import { FlagConfigFetcher } from 'src/local/fetcher';
import { FlagConfigStreamer } from 'src/local/streamer';

import { MockHttpClient } from './util/mockHttpClient';
import { getNewClient } from './util/mockStreamEventSource';

const getTestObjs = ({
  pollingIntervalMillis = 1000,
  streamConnTimeoutMillis = 1000,
  streamFlagConnTimeoutMillis = 1000,
  streamFlagTryAttempts = 2,
  streamFlagTryDelayMillis = 1000,
  retryStreamFlagDelayMillis = 15000,
  apiKey = 'client-xxxx',
  serverUrl = 'http://localhostxxxx:00000000',
  debug = false,
}) => {
  const fetchObj = { fetchCalls: 0, fetcher: undefined };
  let dataI = 0;
  const data = [
    '[{"key": "fetcher-a", "variants": {}, "segments": []}]',
    '[{"key": "fetcher-b", "variants": {}, "segments": []}]',
  ];
  fetchObj.fetcher = new FlagConfigFetcher(
    apiKey,
    new MockHttpClient(async () => {
      fetchObj.fetchCalls++;
      return { status: 200, body: data[dataI] };
    }),
  );
  const fetcherReturnNext = () => {
    dataI++;
  };
  const cache = new InMemoryFlagConfigCache();
  const mockClient = getNewClient();
  const updater = new FlagConfigStreamer(
    apiKey,
    fetchObj.fetcher,
    cache,
    mockClient.clientFactory,
    pollingIntervalMillis,
    streamConnTimeoutMillis,
    streamFlagConnTimeoutMillis,
    streamFlagTryAttempts,
    streamFlagTryDelayMillis,
    retryStreamFlagDelayMillis,
    serverUrl,
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
  try {
    updater.start();
    await mockClient.client.doOpen({ type: 'open' });
    await mockClient.client.doMsg({ data: '[]' });
    assert(fetchObj.fetchCalls == 0);
    assert(mockClient.numCreated == 1);
    updater.stop();
  } catch (e) {
    updater.stop();
    fail(e);
  }
});

test('FlagConfigUpdater.connect, start success, gets initial flag configs, gets subsequent flag configs', async () => {
  const { fetchObj, cache, mockClient, updater } = getTestObjs({
    pollingIntervalMillis: 100,
  });
  try {
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
  } catch (e) {
    updater.stop();
    fail(e);
  }
});

test('FlagConfigUpdater.connect, stream start fail, fallback to poller, poller updates flag configs correctly', async () => {
  const { fetchObj, fetcherReturnNext, cache, mockClient, updater } =
    getTestObjs({ pollingIntervalMillis: 100 });
  try {
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
  } catch (e) {
    updater.stop();
    fail(e);
  }
});

test('FlagConfigUpdater.connect, start success, gets error initial flag configs, fallback to poller', async () => {
  const { fetchObj, mockClient, updater } = getTestObjs({
    pollingIntervalMillis: 100,
  });
  try {
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
  } catch (e) {
    updater.stop();
    fail(e);
  }
});

test('FlagConfigUpdater.connect, start success, gets ok initial flag configs, but gets error flag configs later, fallback to poller', async () => {
  const { fetchObj, mockClient, updater } = getTestObjs({
    pollingIntervalMillis: 100,
  });
  try {
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
  } catch (e) {
    updater.stop();
    fail(e);
  }
});

test('FlagConfigUpdater.connect, open but no initial flag configs', async () => {
  const { fetchObj, mockClient, updater } = getTestObjs({
    pollingIntervalMillis: 100,
  });
  try {
    updater.start();
    await mockClient.client.doOpen({ type: 'open' });
    await new Promise((r) => setTimeout(r, 1100));
    await mockClient.client.doOpen({ type: 'open' });
    await new Promise((r) => setTimeout(r, 2000));
    assert(fetchObj.fetchCalls > 0);
    assert(mockClient.numCreated == 2);
    updater.stop();
  } catch (e) {
    updater.stop();
    fail(e);
  }
});

test('FlagConfigUpdater.connect, success and then fails and then reconnects', async () => {
  const { fetchObj, mockClient, updater } = getTestObjs({
    pollingIntervalMillis: 100,
  });
  try {
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
  } catch (e) {
    updater.stop();
    fail(e);
  }
});

test('FlagConfigUpdater.connect, timeout first try, retry success', async () => {
  const { mockClient, updater } = getTestObjs({});
  try {
    updater.start();
    await new Promise((r) => setTimeout(r, 2200)); // Wait at least 2 secs, at most 3 secs for first try timeout.
    await mockClient.client.doOpen({ type: 'open' });
    await mockClient.client.doMsg({ data: '[]' });
    assert(mockClient.numCreated == 2);
    updater.stop();
  } catch (e) {
    updater.stop();
    fail(e);
  }
});

test('FlagConfigUpdater.connect, retry timeout, backoff to poll after 2 tries', async () => {
  const { fetchObj, mockClient, updater } = getTestObjs({
    pollingIntervalMillis: 100,
  });
  try {
    await updater.start(); // Awaits start(), no data sent.
    assert(fetchObj.fetchCalls >= 1);
    assert(mockClient.numCreated == 2);
    updater.stop();
  } catch (e) {
    updater.stop();
    fail(e);
  }
});

test('FlagConfigUpdater.connect, 501, backoff to poll after 1 try', async () => {
  const { fetchObj, mockClient, updater } = getTestObjs({
    pollingIntervalMillis: 100,
  });
  try {
    updater.start();
    await mockClient.client.doErr({ status: 501 }); // Send 501 fatal err.
    await new Promise((r) => setTimeout(r, 200)); // Wait for poller to poll.
    assert(fetchObj.fetchCalls >= 1);
    assert(mockClient.numCreated == 1);
    updater.stop();
  } catch (e) {
    updater.stop();
    fail(e);
  }
});

test('FlagConfigUpdater.connect, 404, backoff to poll after 2 tries', async () => {
  const { fetchObj, mockClient, updater } = getTestObjs({
    pollingIntervalMillis: 100,
  });
  try {
    updater.start();
    await mockClient.client.doErr({ status: 404 }); // Send error for first try.
    await new Promise((r) => setTimeout(r, 1100)); // Wait for poller to poll.
    await mockClient.client.doErr({ status: 404 }); // Send error for second try.
    await new Promise((r) => setTimeout(r, 200)); // Wait for poller to poll.
    assert(fetchObj.fetchCalls >= 1);
    assert(mockClient.numCreated == 2);
    updater.stop();
  } catch (e) {
    updater.stop();
    fail(e);
  }
});

test('FlagConfigUpdater.connect, two starts, second does nothing', async () => {
  const { fetchObj, mockClient, updater } = getTestObjs({
    pollingIntervalMillis: 100,
  });
  try {
    updater.start();
    updater.start();
    await mockClient.client.doOpen({ type: 'open' });
    await mockClient.client.doMsg({ data: '[]' });
    await new Promise((r) => setTimeout(r, 2500)); // Wait for stream to init success.
    assert(fetchObj.fetchCalls == 0);
    assert(mockClient.numCreated == 1);
    updater.stop();
  } catch (e) {
    updater.stop();
    fail(e);
  }
});

test('FlagConfigUpdater.connect, start and immediately stop does not retry', async () => {
  const { fetchObj, mockClient, updater } = getTestObjs({
    pollingIntervalMillis: 100,
  });
  try {
    updater.start();
    updater.stop();
    await new Promise((r) => setTimeout(r, 1000));
    assert(fetchObj.fetchCalls == 0);
    assert(mockClient.numCreated == 1);
  } catch (e) {
    updater.stop();
    fail(e);
  }
});

test('FlagConfigUpdater.connect, start fail, retry and immediately stop, no poller start', async () => {
  const { fetchObj, mockClient, updater } = getTestObjs({
    pollingIntervalMillis: 100,
  });
  try {
    updater.start();
    await new Promise((r) => setTimeout(r, 2100)); // Wait for timeout and try delay.
    updater.stop();
    assert(fetchObj.fetchCalls == 0);
    assert(mockClient.numCreated == 2);

    await new Promise((r) => setTimeout(r, 200)); // Wait to check poller start.
    assert(fetchObj.fetchCalls == 0);
  } catch (e) {
    updater.stop();
    fail(e);
  }
});

test('FlagConfigUpdater.connect, test error after connection, poller starts, stream retry success, poller stops', async () => {
  jest.setTimeout(25000);
  const retryStreamFlagDelayMillis = 15000;
  const { fetchObj, mockClient, updater } = getTestObjs({
    pollingIntervalMillis: 200,
    retryStreamFlagDelayMillis,
  });
  try {
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
    await new Promise((r) => setTimeout(r, retryStreamFlagDelayMillis)); // Wait for retry.
    await mockClient.client.doOpen({ type: 'open' });
    await mockClient.client.doMsg({ data: '[]' });
    n = mockClient.numCreated;
    assert(n == 4);
    // Check poller stop.
    const prevFetchCalls = fetchObj.fetchCalls;
    await new Promise((r) => setTimeout(r, 500)); // Wait to see if poller runs while waiting.
    assert(fetchObj.fetchCalls == prevFetchCalls);
    updater.stop();
  } catch (e) {
    updater.stop();
    fail(e);
  }
});

test('FlagConfigUpdater.connect, test restarts', async () => {
  const { fetchObj, mockClient, updater } = getTestObjs({
    pollingIntervalMillis: 200,
  });
  try {
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
  } catch (e) {
    updater.stop();
    fail(e);
  }
});

test('FlagConfigUpdater.connect, start success, keep alive success, no fallback to poller', async () => {
  jest.setTimeout(20000);
  const { fetchObj, mockClient, updater } = getTestObjs({
    pollingIntervalMillis: 200,
  });
  try {
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
  } catch (e) {
    updater.stop();
    fail(e);
  }
});

test('FlagConfigStreamer.connect, start success, keep alive fail, retry success', async () => {
  jest.setTimeout(20000);
  const { fetchObj, mockClient, updater } = getTestObjs({
    pollingIntervalMillis: 200,
  });
  try {
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
  } catch (e) {
    updater.stop();
    fail(e);
  }
});

test('FlagConfigUpdater.connect, start success, keep alive fail, retry fail twice, fallback to poller', async () => {
  jest.setTimeout(20000);
  const { fetchObj, mockClient, updater } = getTestObjs({
    pollingIntervalMillis: 200,
  });
  try {
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
  } catch (e) {
    updater.stop();
    fail(e);
  }
});

test('FlagConfigUpdater.connect, start fail, fallback to poller, retry stream success, stop poller, no more retry stream', async () => {
  jest.setTimeout(10000);
  const { fetchObj, mockClient, updater } = getTestObjs({
    pollingIntervalMillis: 200,
    retryStreamFlagDelayMillis: 2000,
  });
  try {
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
  } catch (e) {
    updater.stop();
    fail(e);
  }
});

test('FlagConfigUpdater.connect, start fail, fallback to poller, retry stream fail, continue poller, retry stream success, stop poller', async () => {
  jest.setTimeout(10000);
  const { fetchObj, mockClient, updater } = getTestObjs({
    pollingIntervalMillis: 200,
    retryStreamFlagDelayMillis: 2000,
  });
  try {
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
  } catch (e) {
    updater.stop();
    fail(e);
  }
});

test.todo(
  'FlagConfigUpdater.connect, start and immediately stop and immediately start is an unhandled edge case',
);
