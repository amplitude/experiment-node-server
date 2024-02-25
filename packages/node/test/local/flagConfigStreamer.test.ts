/* eslint-disable @typescript-eslint/no-non-null-assertion */
import assert from 'assert';

import { InMemoryFlagConfigCache } from 'src/index';
import { FlagConfigFetcher } from 'src/local/fetcher';
import { FlagConfigStreamer } from 'src/local/streamer';

import { MockHttpClient } from './util/mockHttpClient';
import { getNewClient } from './util/mockStreamEventSource';

const apiKey = 'client-xxxx';
const serverUrl = 'http://localhostxxxx:799999999';
const streamConnTimeoutMillis = 1000;
const streamFlagConnTimeoutMillis = 1000;
const streamFlagTryAttempts = 2;
const streamFlagTryDelayMillis = 1000;
const retryStreamFlagDelayMillis = 15000;

// Following values may not be used in all tests.
const pollingIntervalMillis = 1000;
const fetcher = new FlagConfigFetcher(
  apiKey,
  new MockHttpClient(async () => {
    return { status: 500, body: undefined };
  }),
);
const cache = new InMemoryFlagConfigCache();

test('FlagConfigUpdater.connect, success', async () => {
  const mockClient = getNewClient();
  let fetchCalls = 0;
  const mockFetcher = new FlagConfigFetcher(
    apiKey,
    new MockHttpClient(async () => {
      fetchCalls++;
      return { status: 200, body: '[]' };
    }),
  );
  const updater = new FlagConfigStreamer(
    apiKey,
    mockFetcher,
    cache,
    mockClient.clientClass,
    100,
    streamConnTimeoutMillis,
    streamFlagConnTimeoutMillis,
    streamFlagTryAttempts,
    streamFlagTryDelayMillis,
    retryStreamFlagDelayMillis,
    serverUrl,
    false,
  );
  try {
    updater.start();
    await mockClient.client!.doOpen({ type: 'open' });
    await mockClient.client!.doMsg({ data: '[]' });
    assert(fetchCalls == 0);
    assert(mockClient.numCreated == 1);
    await updater.stop();
    // Pass
  } catch (e) {
    updater.stop();
    fail(e);
  }
});

test('FlagConfigUpdater.connect, start success, gets initial flag configs, gets subsequent flag configs', async () => {
  const mockClient = getNewClient();
  let fetchCalls = 0;
  const mockFetcher = new FlagConfigFetcher(
    apiKey,
    new MockHttpClient(async () => {
      fetchCalls++;
      return { status: 200, body: '[]' };
    }),
  );
  const cache = new InMemoryFlagConfigCache();
  const updater = new FlagConfigStreamer(
    apiKey,
    mockFetcher,
    cache,
    mockClient.clientClass,
    100,
    streamConnTimeoutMillis,
    streamFlagConnTimeoutMillis,
    streamFlagTryAttempts,
    streamFlagTryDelayMillis,
    retryStreamFlagDelayMillis,
    serverUrl,
    false,
  );
  try {
    updater.start();
    await mockClient.client!.doOpen({ type: 'open' });
    await mockClient.client!.doMsg({
      data: '[{"key": "a", "variants": {}, "segments": []}]',
    });
    assert(fetchCalls == 0);
    assert(mockClient.numCreated == 1);
    await new Promise((r) => setTimeout(r, 200));
    assert((await cache.get('a')).key == 'a');

    await mockClient.client!.doMsg({
      data: '[{"key": "b", "variants": {}, "segments": []}]',
    });
    await new Promise((r) => setTimeout(r, 200));
    assert((await cache.get('b')).key == 'b');
    assert((await cache.get('a')) == undefined);

    await updater.stop();
    // Pass
  } catch (e) {
    updater.stop();
    fail(e);
  }
});

test('FlagConfigUpdater.connect, stream start fail, fallback to poller, poller updates flag configs correctly', async () => {
  const mockClient = getNewClient();
  let fetchCalls = 0;
  let dataI = 0;
  const data = [
    '[{"key": "a", "variants": {}, "segments": []}]',
    '[{"key": "b", "variants": {}, "segments": []}]',
  ];
  const mockFetcher = new FlagConfigFetcher(
    apiKey,
    new MockHttpClient(async () => {
      fetchCalls++;
      return { status: 200, body: data[dataI] };
    }),
  );
  const cache = new InMemoryFlagConfigCache();
  const updater = new FlagConfigStreamer(
    apiKey,
    mockFetcher,
    cache,
    mockClient.clientClass,
    100,
    streamConnTimeoutMillis,
    streamFlagConnTimeoutMillis,
    streamFlagTryAttempts,
    streamFlagTryDelayMillis,
    retryStreamFlagDelayMillis,
    serverUrl,
    false,
  );
  try {
    updater.start();
    await mockClient.client!.doErr({ status: 501 }); // Send 501 fatal err to fallback to poller.
    await new Promise((r) => setTimeout(r, 200)); // Wait for poller to poll.
    assert(fetchCalls >= 1);
    assert(mockClient.numCreated == 1);
    assert((await cache.get('a')).key == 'a');

    dataI++;
    await new Promise((r) => setTimeout(r, 200)); // Wait for poller to poll.
    assert((await cache.get('b')).key == 'b');
    assert((await cache.get('a')) == undefined);

    await updater.stop();
    // Pass
  } catch (e) {
    updater.stop();
    fail(e);
  }
});

test('FlagConfigUpdater.connect, start success, gets error initial flag configs, fallback to poller', async () => {
  const mockClient = getNewClient();
  let fetchCalls = 0;
  const mockFetcher = new FlagConfigFetcher(
    apiKey,
    new MockHttpClient(async () => {
      fetchCalls++;
      return { status: 200, body: '[]' };
    }),
  );
  const updater = new FlagConfigStreamer(
    apiKey,
    mockFetcher,
    cache,
    mockClient.clientClass,
    100,
    streamConnTimeoutMillis,
    streamFlagConnTimeoutMillis,
    streamFlagTryAttempts,
    streamFlagTryDelayMillis,
    retryStreamFlagDelayMillis,
    serverUrl,
    false,
  );
  try {
    updater.start();
    await mockClient.client!.doOpen({ type: 'open' });
    await mockClient.client!.doMsg({
      data: 'xxx',
    }); // Initial error flag configs for first try.
    await new Promise((r) => setTimeout(r, 1000)); // Need to yield quite some time to start retry.

    await mockClient.client!.doOpen({ type: 'open' });
    await mockClient.client!.doMsg({
      data: '[{"key: aaa}]',
    }); // Another error flag configs for second try.
    await new Promise((r) => setTimeout(r, 1000)); // Need to yield quite some time to start retry.

    // Should fallbacked to poller.
    assert(fetchCalls > 0);
    assert(mockClient.numCreated == 2);

    await updater.stop();
    // Pass
  } catch (e) {
    updater.stop();
    fail(e);
  }
});

test('FlagConfigUpdater.connect, start success, gets ok initial flag configs, but gets error flag configs later, fallback to poller', async () => {
  const mockClient = getNewClient();
  let fetchCalls = 0;
  const mockFetcher = new FlagConfigFetcher(
    apiKey,
    new MockHttpClient(async () => {
      fetchCalls++;
      return { status: 200, body: '[]' };
    }),
  );
  const cache = new InMemoryFlagConfigCache();
  const updater = new FlagConfigStreamer(
    apiKey,
    mockFetcher,
    cache,
    mockClient.clientClass,
    100,
    streamConnTimeoutMillis,
    streamFlagConnTimeoutMillis,
    streamFlagTryAttempts,
    streamFlagTryDelayMillis,
    retryStreamFlagDelayMillis,
    serverUrl,
    false,
  );
  try {
    updater.start();
    await mockClient.client!.doOpen({ type: 'open' });
    await mockClient.client!.doMsg({
      data: '[{"key": "a", "variants": {}, "segments": []}]',
    }); // Initial flag configs are fine.
    await new Promise((r) => setTimeout(r, 200));
    assert(fetchCalls == 0);
    let n = mockClient.numCreated;
    assert(n == 1);

    // Start error ones.
    await mockClient.client!.doMsg({
      data: 'hahaha',
    }); // An error flag configs to start retry.
    await new Promise((r) => setTimeout(r, 500));

    await mockClient.client!.doOpen({ type: 'open' });
    await mockClient.client!.doMsg({
      data: 'xxx',
    }); // Error flag configs for first retry.
    await new Promise((r) => setTimeout(r, 1000)); // Need to yield quite some time to start retry.

    await mockClient.client!.doOpen({ type: 'open' });
    await mockClient.client!.doMsg({
      data: '[{"key: aaa}]',
    }); // Error flag configs for second retry.
    await new Promise((r) => setTimeout(r, 1000)); // Need to yield quite some time to start retry.

    assert(fetchCalls > 0);
    n = mockClient.numCreated;
    assert(n == 3);

    await updater.stop();
    // Pass
  } catch (e) {
    updater.stop();
    fail(e);
  }
});

test('FlagConfigUpdater.connect, open but no initial flag configs', async () => {
  const mockClient = getNewClient();
  let fetchCalls = 0;
  const mockFetcher = new FlagConfigFetcher(
    apiKey,
    new MockHttpClient(async () => {
      fetchCalls++;
      return { status: 200, body: '[]' };
    }),
  );
  const updater = new FlagConfigStreamer(
    apiKey,
    mockFetcher,
    cache,
    mockClient.clientClass,
    100,
    streamConnTimeoutMillis,
    streamFlagConnTimeoutMillis,
    streamFlagTryAttempts,
    streamFlagTryDelayMillis,
    retryStreamFlagDelayMillis,
    serverUrl,
    false,
  );
  try {
    updater.start();
    await mockClient.client!.doOpen({ type: 'open' });
    await new Promise((r) => setTimeout(r, 1100));
    await mockClient.client!.doOpen({ type: 'open' });
    await new Promise((r) => setTimeout(r, 2000));
    assert(fetchCalls > 0);
    assert(mockClient.numCreated == 2);
    await updater.stop();
    // Pass
  } catch (e) {
    updater.stop();
    fail(e);
  }
});

test('FlagConfigUpdater.connect, success and then fails and then reconnects', async () => {
  const mockClient = getNewClient();
  let fetchCalls = 0;
  const mockFetcher = new FlagConfigFetcher(
    apiKey,
    new MockHttpClient(async () => {
      fetchCalls++;
      return { status: 200, body: '[]' };
    }),
  );
  const updater = new FlagConfigStreamer(
    apiKey,
    mockFetcher,
    cache,
    mockClient.clientClass,
    100,
    streamConnTimeoutMillis,
    streamFlagConnTimeoutMillis,
    streamFlagTryAttempts,
    streamFlagTryDelayMillis,
    retryStreamFlagDelayMillis,
    serverUrl,
    false,
  );
  try {
    updater.start();
    await mockClient.client!.doOpen({ type: 'open' });
    await mockClient.client!.doMsg({ data: '[]' });
    await mockClient.client!.doErr({ status: 500 });
    await new Promise((r) => setTimeout(r, 500));
    await mockClient.client!.doOpen({ type: 'open' });
    await mockClient.client!.doMsg({ data: '[]' });
    assert(fetchCalls == 0);
    assert(mockClient.numCreated == 2);
    await updater.stop();
    // Pass
  } catch (e) {
    updater.stop();
    fail(e);
  }
});

test('FlagConfigUpdater.connect, timeout first try, retry success', async () => {
  const mockClient = getNewClient();
  const updater = new FlagConfigStreamer(
    apiKey,
    fetcher,
    cache,
    mockClient.clientClass,
    pollingIntervalMillis,
    streamConnTimeoutMillis,
    streamFlagConnTimeoutMillis,
    streamFlagTryAttempts,
    streamFlagTryDelayMillis,
    retryStreamFlagDelayMillis,
    serverUrl,
    false,
  );
  try {
    updater.start();
    await new Promise((r) => setTimeout(r, 2200)); // Wait at least 2 secs, at most 3 secs for first try timeout.
    await mockClient.client!.doOpen({ type: 'open' });
    await mockClient.client!.doMsg({ data: '[]' });
    assert(mockClient.numCreated == 2);
    await updater.stop();
    // Pass
  } catch (e) {
    updater.stop();
    fail(e);
  }
});

test('FlagConfigUpdater.connect, retry timeout, backoff to poll after 2 tries', async () => {
  const mockClient = getNewClient();
  let fetchCalls = 0;
  const mockFetcher = new FlagConfigFetcher(
    apiKey,
    new MockHttpClient(async () => {
      fetchCalls++;
      return { status: 200, body: '[]' };
    }),
  );
  const updater = new FlagConfigStreamer(
    apiKey,
    mockFetcher,
    cache,
    mockClient.clientClass,
    100, // poller fetch every 100ms.
    streamConnTimeoutMillis,
    streamFlagConnTimeoutMillis,
    streamFlagTryAttempts,
    streamFlagTryDelayMillis,
    retryStreamFlagDelayMillis,
    serverUrl,
    false,
  );
  try {
    await updater.start(); // Awaits start(), no data sent.
    assert(fetchCalls >= 1);
    assert(mockClient.numCreated == 2);
    await updater.stop();
    // Pass
  } catch (e) {
    updater.stop();
    fail(e);
  }
});

test('FlagConfigUpdater.connect, 501, backoff to poll after 1 try', async () => {
  const mockClient = getNewClient();
  let fetchCalls = 0;
  const mockFetcher = new FlagConfigFetcher(
    apiKey,
    new MockHttpClient(async () => {
      fetchCalls++;
      return { status: 200, body: '[]' };
    }),
  );
  const updater = new FlagConfigStreamer(
    apiKey,
    mockFetcher,
    cache,
    mockClient.clientClass,
    100, // poller fetch every 100ms.
    streamConnTimeoutMillis,
    streamFlagConnTimeoutMillis,
    streamFlagTryAttempts,
    streamFlagTryDelayMillis,
    retryStreamFlagDelayMillis,
    serverUrl,
    false,
  );
  try {
    updater.start();
    await mockClient.client!.doErr({ status: 501 }); // Send 501 fatal err.
    await new Promise((r) => setTimeout(r, 200)); // Wait for poller to poll.
    assert(fetchCalls >= 1);
    assert(mockClient.numCreated == 1);
    await updater.stop();
    // Pass
  } catch (e) {
    updater.stop();
    fail(e);
  }
});

test('FlagConfigUpdater.connect, 404, backoff to poll after 2 tries', async () => {
  const mockClient = getNewClient();
  let fetchCalls = 0;
  const mockFetcher = new FlagConfigFetcher(
    apiKey,
    new MockHttpClient(async () => {
      fetchCalls++;
      return { status: 200, body: '[]' };
    }),
  );
  const updater = new FlagConfigStreamer(
    apiKey,
    mockFetcher,
    cache,
    mockClient.clientClass,
    100, // poller fetch every 100ms.
    streamConnTimeoutMillis,
    streamFlagConnTimeoutMillis,
    streamFlagTryAttempts,
    streamFlagTryDelayMillis,
    retryStreamFlagDelayMillis,
    serverUrl,
    false,
  );
  try {
    updater.start();
    await mockClient.client!.doErr({ status: 404 }); // Send error for first try.
    await new Promise((r) => setTimeout(r, 1100)); // Wait for poller to poll.
    await mockClient.client!.doErr({ status: 404 }); // Send error for second try.
    await new Promise((r) => setTimeout(r, 200)); // Wait for poller to poll.
    assert(fetchCalls >= 1);
    assert(mockClient.numCreated == 2);
    await updater.stop();
    // Pass
  } catch (e) {
    updater.stop();
    fail(e);
  }
});

test('FlagConfigUpdater.connect, two starts, second does nothing', async () => {
  const mockClient = getNewClient();
  let fetchCalls = 0;
  const mockFetcher = new FlagConfigFetcher(
    apiKey,
    new MockHttpClient(async () => {
      fetchCalls++;
      return { status: 200, body: '[]' };
    }),
  );
  const updater = new FlagConfigStreamer(
    apiKey,
    mockFetcher,
    cache,
    mockClient.clientClass,
    100, // poller fetch every 100ms.
    streamConnTimeoutMillis,
    streamFlagConnTimeoutMillis,
    streamFlagTryAttempts,
    streamFlagTryDelayMillis,
    retryStreamFlagDelayMillis,
    serverUrl,
    false,
  );
  try {
    updater.start();
    updater.start();
    await mockClient.client!.doOpen({ type: 'open' });
    await mockClient.client!.doMsg({ data: '[]' });
    await new Promise((r) => setTimeout(r, 2500)); // Wait for stream to init success.
    assert(fetchCalls == 0);
    assert(mockClient.numCreated == 1);
    await updater.stop();
    // Pass
  } catch (e) {
    updater.stop();
    fail(e);
  }
});

test('FlagConfigUpdater.connect, start and immediately stop does not retry', async () => {
  const mockClient = getNewClient();
  let fetchCalls = 0;
  const mockFetcher = new FlagConfigFetcher(
    apiKey,
    new MockHttpClient(async () => {
      fetchCalls++;
      return { status: 200, body: '[]' };
    }),
  );
  const updater = new FlagConfigStreamer(
    apiKey,
    mockFetcher,
    cache,
    mockClient.clientClass,
    100, // poller fetch every 100ms.
    streamConnTimeoutMillis,
    streamFlagConnTimeoutMillis,
    streamFlagTryAttempts,
    streamFlagTryDelayMillis,
    retryStreamFlagDelayMillis,
    serverUrl,
    false,
  );
  try {
    updater.start();
    updater.stop();
    await new Promise((r) => setTimeout(r, 1000));
    assert(fetchCalls == 0);
    assert(mockClient.numCreated == 1);
    // Pass
  } catch (e) {
    updater.stop();
    fail(e);
  }
});

test('FlagConfigUpdater.connect, test error after connection, poller starts, stream retry success, poller stops', async () => {
  jest.setTimeout(25000);
  const mockClient = getNewClient();
  let fetchCalls = 0;
  const mockFetcher = new FlagConfigFetcher(
    apiKey,
    new MockHttpClient(async () => {
      fetchCalls++;
      return { status: 200, body: '[]' };
    }),
  );
  const updater = new FlagConfigStreamer(
    apiKey,
    mockFetcher,
    cache,
    mockClient.clientClass,
    200, // poller fetch every 100ms.
    streamConnTimeoutMillis,
    streamFlagConnTimeoutMillis,
    streamFlagTryAttempts,
    streamFlagTryDelayMillis,
    retryStreamFlagDelayMillis,
    serverUrl,
    false,
  );
  try {
    // Test error after normal close.
    updater.start();
    await mockClient.client!.doOpen({ type: 'open' });
    await mockClient.client!.doMsg({ data: '[]' });
    let n = mockClient.numCreated;
    assert(n == 1);
    // Pass errors to stop first stream.
    await mockClient.client!.doErr({ status: 500 });
    await new Promise((r) => setTimeout(r, 200)); // Wait for stream to init.
    await mockClient.client!.doErr({ status: 500 }); // Pass errors to make first retry fail.
    n = mockClient.numCreated;
    assert(n == 2);
    await new Promise((r) => setTimeout(r, 1200)); // Wait for stream to init.
    await mockClient.client!.doErr({ status: 500 }); // Pass error to make second retry fail.
    await new Promise((r) => setTimeout(r, 500)); // Wait for stream to init.
    // No stop() here. The streamRetryTimeout will still be running.
    assert(fetchCalls > 0);
    n = mockClient.numCreated;
    assert(n == 3);
    // Check retry.
    await new Promise((r) => setTimeout(r, retryStreamFlagDelayMillis)); // Wait for retry.
    await mockClient.client!.doOpen({ type: 'open' });
    await mockClient.client!.doMsg({ data: '[]' });
    n = mockClient.numCreated;
    assert(n == 4);
    // Check poller stop.
    const prevFetchCalls = fetchCalls;
    await new Promise((r) => setTimeout(r, 500)); // Wait to see if poller runs while waiting.
    assert(fetchCalls == prevFetchCalls);
    await updater.stop();
    // Pass
  } catch (e) {
    updater.stop();
    fail(e);
  }
});

test('FlagConfigUpdater.connect, test restarts', async () => {
  const mockClient = getNewClient();
  let fetchCalls = 0;
  const mockFetcher = new FlagConfigFetcher(
    apiKey,
    new MockHttpClient(async () => {
      fetchCalls++;
      return { status: 200, body: '[]' };
    }),
  );
  const updater = new FlagConfigStreamer(
    apiKey,
    mockFetcher,
    cache,
    mockClient.clientClass,
    200, // poller fetch every 100ms.
    streamConnTimeoutMillis,
    streamFlagConnTimeoutMillis,
    streamFlagTryAttempts,
    streamFlagTryDelayMillis,
    retryStreamFlagDelayMillis,
    serverUrl,
    false,
  );
  try {
    updater.start();
    await mockClient.client!.doOpen({ type: 'open' });
    await mockClient.client!.doMsg({ data: '[]' });
    assert(fetchCalls == 0);
    let n = mockClient.numCreated;
    assert(n == 1);
    await updater.stop();

    // Test start after normal close.
    updater.start();
    await mockClient.client!.doOpen({ type: 'open' });
    await mockClient.client!.doMsg({ data: '[]' });
    assert(fetchCalls == 0);
    n = mockClient.numCreated;
    assert(n == 2);
    await updater.stop();

    // Test error after normal close.
    updater.start();
    await mockClient.client!.doOpen({ type: 'open' });
    await mockClient.client!.doMsg({ data: '[]' });
    await mockClient.client!.doErr({ status: 500 }); // Send error to stop current stream.
    await new Promise((r) => setTimeout(r, 200)); // Wait for stream to init.
    await mockClient.client!.doErr({ status: 500 }); // Send error for first retry.
    await new Promise((r) => setTimeout(r, 1200)); // Wait for stream to timeout and start second try.
    await mockClient.client!.doErr({ status: 500 }); // Send error for second retry.
    await new Promise((r) => setTimeout(r, 500)); // Wait for stream to init.
    assert(fetchCalls > 0);
    n = mockClient.numCreated;
    assert(n == 5);
    // No stop() here. The streamRetryTimeout will still be running.

    // Test normal start after error close. Poller should be stopped.
    const prevFetchCalls = fetchCalls;
    updater.start();
    await mockClient.client!.doOpen({ type: 'open' });
    await mockClient.client!.doMsg({ data: '[]' });
    await new Promise((r) => setTimeout(r, 500)); // Wait for stream to init.
    assert(fetchCalls == prevFetchCalls);
    n = mockClient.numCreated;
    assert(n == 6);
    await updater.stop();
    // Pass
  } catch (e) {
    updater.stop();
    fail(e);
  }
});

test('FlagConfigUpdater.connect, start success, keep alive success, no fallback to poller', async () => {
  jest.setTimeout(20000);
  const mockClient = getNewClient();
  let fetchCalls = 0;
  const mockFetcher = new FlagConfigFetcher(
    apiKey,
    new MockHttpClient(async () => {
      fetchCalls++;
      return { status: 200, body: '[]' };
    }),
  );
  const updater = new FlagConfigStreamer(
    apiKey,
    mockFetcher,
    cache,
    mockClient.clientClass,
    200, // poller fetch every 100ms.
    streamConnTimeoutMillis,
    streamFlagConnTimeoutMillis,
    streamFlagTryAttempts,
    streamFlagTryDelayMillis,
    retryStreamFlagDelayMillis,
    serverUrl,
    false,
  );
  try {
    updater.start();
    await mockClient.client!.doOpen({ type: 'open' });
    await mockClient.client!.doMsg({ data: '[]' });
    assert(fetchCalls == 0);
    let n = mockClient.numCreated;
    assert(n == 1);

    // Test keep alive.
    await new Promise((r) => setTimeout(r, 15000)); // Wait before keep alive timeouts.
    await mockClient.client!.doMsg({ data: ' ' });
    assert(fetchCalls == 0);
    n = mockClient.numCreated;
    assert(n == 1);

    await new Promise((r) => setTimeout(r, 3000)); // Wait for original keep alive timeout to reach.
    assert(fetchCalls == 0);
    n = mockClient.numCreated;
    assert(n == 1);

    await updater.stop();
    // Pass
  } catch (e) {
    updater.stop();
    fail(e);
  }
});

test('FlagConfigStreamer.connect, start success, keep alive fail, retry success', async () => {
  jest.setTimeout(20000);
  const mockClient = getNewClient();
  let fetchCalls = 0;
  const mockFetcher = new FlagConfigFetcher(
    apiKey,
    new MockHttpClient(async () => {
      fetchCalls++;
      return { status: 200, body: '[]' };
    }),
  );
  const updater = new FlagConfigStreamer(
    apiKey,
    mockFetcher,
    cache,
    mockClient.clientClass,
    200, // poller fetch every 100ms.
    streamConnTimeoutMillis,
    streamFlagConnTimeoutMillis,
    streamFlagTryAttempts,
    streamFlagTryDelayMillis,
    retryStreamFlagDelayMillis,
    serverUrl,
    false,
  );
  try {
    updater.start();
    await mockClient.client!.doOpen({ type: 'open' });
    await mockClient.client!.doMsg({ data: '[]' });
    assert(fetchCalls == 0);
    let n = mockClient.numCreated;
    assert(n == 1);

    // Test keep alive fail.
    await new Promise((r) => setTimeout(r, 17500)); // Wait for keep alive to fail and enter retry.
    await mockClient.client!.doOpen({ type: 'open' });
    await mockClient.client!.doMsg({ data: '[]' });
    assert(fetchCalls == 0);
    n = mockClient.numCreated;
    assert(n == 2);

    await updater.stop();
    // Pass
  } catch (e) {
    updater.stop();
    fail(e);
  }
});

test('FlagConfigUpdater.connect, start success, keep alive fail, retry fail twice, fallback to poller', async () => {
  jest.setTimeout(20000);
  const mockClient = getNewClient();
  let fetchCalls = 0;
  const mockFetcher = new FlagConfigFetcher(
    apiKey,
    new MockHttpClient(async () => {
      fetchCalls++;
      return { status: 200, body: '[]' };
    }),
  );
  const updater = new FlagConfigStreamer(
    apiKey,
    mockFetcher,
    cache,
    mockClient.clientClass,
    200, // poller fetch every 100ms.
    streamConnTimeoutMillis,
    streamFlagConnTimeoutMillis,
    streamFlagTryAttempts,
    streamFlagTryDelayMillis,
    retryStreamFlagDelayMillis,
    serverUrl,
    false,
  );
  try {
    updater.start();
    await mockClient.client!.doOpen({ type: 'open' });
    await mockClient.client!.doMsg({ data: '[]' });
    assert(fetchCalls == 0);
    let n = mockClient.numCreated;
    assert(n == 1);

    // Test keep alive fail.
    await new Promise((r) => setTimeout(r, 17500)); // Wait for keep alive to fail and enter retry.
    await mockClient.client!.doErr({ status: 500 }); // Send error for first try.
    await new Promise((r) => setTimeout(r, 1200)); // Wait for stream to init.
    await mockClient.client!.doErr({ status: 500 }); // Send error for second try.
    await new Promise((r) => setTimeout(r, 500)); // Wait for poller to init.
    assert(fetchCalls > 0);
    n = mockClient.numCreated;
    assert(n == 3);

    await updater.stop();
    // Pass
  } catch (e) {
    updater.stop();
    fail(e);
  }
});

test.todo(
  'FlagConfigUpdater.connect, start and immediately stop and immediately start is an unhandled edge case',
);
