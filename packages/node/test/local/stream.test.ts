/* eslint-disable no-empty */
import path from 'path';

import { EvaluationFlag, SdkFlagApi } from '@amplitude/experiment-core';
import * as dotenv from 'dotenv';
import EventSource from 'eventsource';
import { SdkStreamFlagApi } from 'src/local/stream-flag-api';
import { FetchHttpClient, WrapperClient } from 'src/transport/http';
import { StreamErrorEvent } from 'src/transport/stream';
import { LocalEvaluationDefaults } from 'src/types/config';
import { sleep } from 'src/util/time';

dotenv.config({
  path: path.join(
    __dirname,
    '../../',
    process.env['ENVIRONMENT'] ? '.env.' + process.env['ENVIRONMENT'] : '.env',
  ),
});

if (!process.env['MANAGEMENT_API_KEY']) {
  throw new Error(
    'No env vars found. If running on local, have you created .env file correct environment variables? Checkout README.md',
  );
}

const SERVER_URL =
  process.env['SERVER_URL'] || LocalEvaluationDefaults.serverUrl;
const STREAM_SERVER_URL =
  process.env['STREAM_SERVER_URL'] || LocalEvaluationDefaults.streamServerUrl;
const MANAGEMENT_API_SERVER_URL =
  process.env['MANAGEMENT_API_SERVER_URL'] ||
  'https://experiment.amplitude.com';
const DEPLOYMENT_KEY =
  process.env['DEPLOYMENT_KEY'] || 'server-qz35UwzJ5akieoAdIgzM4m9MIiOLXLoz';
const MANAGEMENT_API_KEY = process.env['MANAGEMENT_API_KEY'];
const FLAG_KEY = 'sdk-ci-stream-flag-test';

const LIBRARY = {
  libraryName: 'experiment-node-server',
  libraryVersion: '0.0.0',
};

// Test stream is successfully connected and data is valid.
// The main purpose is to test and ensure the SDK stream interface works with stream server.
// This test may be flaky if multiple edits to the flag happens simultaneously,
// i.e. multiple invocation of this test is run at the same time.
// If two edits are made in a very very very short period (few seconds), the first edit may not be streamed.
test('SDK stream is compatible with stream server (flaky possible, see comments)', async () => {
  const api = new SdkStreamFlagApi(
    DEPLOYMENT_KEY,
    STREAM_SERVER_URL,
    (url, params) => new EventSource(url, params),
    5000, // A bit more generous timeout than the default.
    5000,
    1,
    1000000, // Very long retry delay.
  );

  const streamFlags = [];
  let streamError = undefined;
  const connectedPromise = new Promise<void>((resolve, reject) => {
    api.onUpdate = (flags: Record<string, EvaluationFlag>) => {
      streamFlags.push(flags);
      resolve();
    };
    api.onError = (err: StreamErrorEvent) => {
      streamError = err;
      reject(err);
    };
    api.connect(LIBRARY).then(resolve).catch(reject);
  });

  await connectedPromise;

  // Get flags from the fetch api to compare.
  const httpClient = new FetchHttpClient(null);
  const fetchApi = new SdkFlagApi(
    DEPLOYMENT_KEY,
    SERVER_URL,
    new WrapperClient(httpClient),
  );
  const fetchFlags = await fetchApi.getFlags(LIBRARY);

  // At least one flag streamed should be the same as the one fetched.
  // There can be other updates after stream establishment and before fetch.
  await sleep(5000); // Assume there's an update right before fetch but after stream, wait for stream to receive that data.
  expect(
    streamFlags.filter(
      (f) =>
        f[FLAG_KEY]['metadata']['flagVersion'] ===
        fetchFlags[FLAG_KEY]['metadata']['flagVersion'],
    )[0],
  ).toStrictEqual(fetchFlags);

  // Test that stream is kept alive.
  await sleep(20000);
  expect(streamError).toBeUndefined();

  // Test changes to flags are reflected in stream.
  let flagVersion: number = fetchFlags[FLAG_KEY]['metadata'][
    'flagVersion'
  ] as number;

  // Get flag id using management-api.
  const getFlagIdRequest = await httpClient.request(
    `${MANAGEMENT_API_SERVER_URL}/api/1/flags?key=${FLAG_KEY}`,
    'GET',
    {
      Authorization: 'Bearer ' + MANAGEMENT_API_KEY,
      'Content-Type': 'application/json',
      Accept: '*/*',
    },
    '',
  );
  expect(getFlagIdRequest.status).toBe(200);
  const flagId = JSON.parse(getFlagIdRequest.body)['flags'][0]['id'];

  // The the most updated flag version we have, while emptying the array.
  let f;
  while ((f = streamFlags.pop())) {
    flagVersion = Math.max(flagVersion, f[FLAG_KEY]['metadata']['flagVersion']);
  }

  // Call management api to edit deployment. Then wait for stream to update.
  const randNumber = Math.random();
  const modifyFlagReq = await httpClient.request(
    `${MANAGEMENT_API_SERVER_URL}/api/1/flags/${flagId}/variants/on`,
    'PATCH',
    {
      Authorization: 'Bearer ' + MANAGEMENT_API_KEY,
      'Content-Type': 'application/json',
      Accept: '*/*',
    },
    `{"payload": ${randNumber}}`,
    10000,
  );
  expect(modifyFlagReq.status).toBe(200);
  await sleep(5000); // 5s is generous enough for update to stream.

  // Check that at least one of the updates happened during this time have the random number we generated.
  // This means that the stream is working and we are getting updates.
  expect(
    streamFlags.filter(
      (f) => f[FLAG_KEY]['variants']['on']['payload'] === randNumber,
    )[0][FLAG_KEY]['metadata']['flagVersion'],
  ).toBeGreaterThan(flagVersion);

  api.close();
}, 60000);
