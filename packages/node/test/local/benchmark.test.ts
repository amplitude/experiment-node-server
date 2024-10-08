import path from 'path';

import * as dotenv from 'dotenv';
import { Experiment } from 'src/factory';
import { ExperimentUser } from 'src/types/user';

import { measure } from './util/performance';

const apiKey = 'server-Ed2doNl5YOblB5lRavQ9toj02arvHpMj';

dotenv.config({ path: path.join(__dirname, '../../', '.env') });

if (!process.env['API_KEY'] && !process.env['SECRET_KEY']) {
  throw new Error(
    'No env vars found. If running on local, have you created .env file correct environment variables? Checkout README.md',
  );
}

const cohortSyncConfig = {
  apiKey: process.env['API_KEY'],
  secretKey: process.env['SECRET_KEY'],
};

const client = Experiment.initializeLocal(apiKey, {
  debug: false,
  cohortSyncConfig: cohortSyncConfig,
});

beforeAll(async () => {
  await client.start();
  await client.evaluate({ user_id: 'u', device_id: 'd' });
});

afterAll(() => {
  client.stop();
});

/*
 * These tests are very conservative since GitHub actions can run very slowly
 * with respect to CPU
 */

test('ExperimentClient.evaluate benchmark, 1 flag < 20ms', async () => {
  const user = randomExperimentUser();
  const flag = randomBenchmarkFlag();
  const duration = await measure(async () => {
    await client.evaluate(user, [flag]);
  });
  // eslint-disable-next-line no-console
  console.log('1 flag: ', duration, 'ms');
  expect(duration).toBeLessThan(20);
});

test('ExperimentClient.evaluate benchmark, 10 flags < 20ms', async () => {
  let total = 0;
  for (let i = 0; i < 10; i++) {
    const user = randomExperimentUser();
    const flag = randomBenchmarkFlag();
    const duration = await measure(async () => {
      await client.evaluate(user, [flag]);
    });
    total += duration;
  }
  // eslint-disable-next-line no-console
  console.log('10 flag: ', total, 'ms');
  expect(total).toBeLessThan(20);
});

test('ExperimentClient.evaluate benchmark, 100 flags < 200ms', async () => {
  let total = 0;
  for (let i = 0; i < 100; i++) {
    const user = randomExperimentUser();
    const flag = randomBenchmarkFlag();
    const duration = await measure(async () => {
      await client.evaluate(user, [flag]);
    });
    total += duration;
  }
  // eslint-disable-next-line no-console
  console.log('100 flag: ', total, 'ms');
  expect(total).toBeLessThan(200);
});

test('ExperimentClient.evaluate benchmark, 1000 flags < 2000ms', async () => {
  let total = 0;
  for (let i = 0; i < 1000; i++) {
    const user = randomExperimentUser();
    const flag = randomBenchmarkFlag();
    const duration = await measure(async () => {
      await client.evaluate(user, [flag]);
    });
    total += duration;
  }
  // eslint-disable-next-line no-console
  console.log('1000 flag: ', total, 'ms');
  expect(total).toBeLessThan(2000);
});

// Utilities

const randomBenchmarkFlag = (): string => {
  const n = Math.floor(Math.random() * 3) + 1;
  return `local-evaluation-benchmark-${n}`;
};

const randomExperimentUser = (): ExperimentUser => {
  const n = 15;
  const user: ExperimentUser = {
    user_id: randomString(n),
  };
  if (randomBoolean()) {
    user['device_id'] = randomString(n);
  }
  if (randomBoolean()) {
    user['platform'] = randomString(n);
  }
  if (randomBoolean()) {
    user['version'] = randomString(n);
  }
  if (randomBoolean()) {
    user['os'] = randomString(n);
  }
  if (randomBoolean()) {
    user['device_manufacturer'] = randomString(n);
  }
  if (randomBoolean()) {
    user['device_model'] = randomString(n);
  }
  if (randomBoolean()) {
    user['device_brand'] = randomString(n);
  }
  if (randomBoolean()) {
    user['user_properties'] = {
      test: 'test',
    };
  }
  return user;
};

const randomBoolean = (): boolean => {
  return Math.random() > 0.5;
};

const randomString = (length: number): string => {
  let result = '';
  const characters =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};
