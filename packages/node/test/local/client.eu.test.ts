import path from 'path';

import * as dotenv from 'dotenv';
import { Experiment } from 'src/factory';

dotenv.config({ path: path.join(__dirname, '../../', '.env') });

if (!process.env['EU_API_KEY'] && !process.env['EU_SECRET_KEY']) {
  throw new Error(
    'No env vars found. If running on local, have you created .env file correct environment variables? Checkout README.md',
  );
}

// Simple EU test for connectivity.
const apiKey = 'server-Qlp7XiSu6JtP2S3JzA95PnP27duZgQCF';

const client = Experiment.initializeLocal(apiKey, {
  serverZone: 'eu',
  cohortSyncConfig: {
    apiKey: process.env['EU_API_KEY'],
    secretKey: process.env['EU_SECRET_KEY'],
  },
});

beforeAll(async () => {
  await client.start();
});

afterAll(async () => {
  client.stop();
});

test('ExperimentClient.evaluate all flags, success', async () => {
  const variants = await client.evaluate({
    user_id: 'test_user',
  });
  const variant = variants['sdk-local-evaluation-userid'];
  expect(variant.key).toEqual('on');
  expect(variant.value).toEqual('on');
});

// Evaluate V2

test('ExperimentClient.evaluateV2 all flags, success', async () => {
  const variants = await client.evaluateV2({
    user_id: 'test_user',
  });
  const variant = variants['sdk-local-evaluation-userid'];
  expect(variant.key).toEqual('on');
  expect(variant.value).toEqual('on');
});

test('ExperimentClient.evaluateV2 cohort, targeted', async () => {
  const variants = await client.evaluateV2({
    device_id: '0',
    user_id: '1',
  });
  const variant = variants['sdk-local-evaluation-user-cohort'];
  expect(variant.key).toEqual('on');
  expect(variant.value).toEqual('on');
});

test('ExperimentClient.evaluateV2 cohort, not targeted', async () => {
  const variants = await client.evaluateV2({
    user_id: '666',
  });
  const variant = variants['sdk-local-evaluation-user-cohort'];
  expect(variant.key).toEqual('off');
  expect(variant.value).toBeUndefined();
});
