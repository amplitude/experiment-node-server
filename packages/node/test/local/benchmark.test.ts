import { Experiment } from 'src/factory';
import { ExperimentUser } from 'src/types/user';

import { measure } from './util/performance';

const apiKey = 'server-5G5HQL3jUIPXWaJBTgAvDFHy277srxSg';

const client = Experiment.initializeLocal(apiKey);

beforeAll(async () => {
  await client.start();
});

afterAll(() => {
  client.stop();
});

/*
 * These tests are very conservative since GitHub actions can run very slowly
 * with respect to CPU
 */

test('ExperimentClient.evaluate benchmark, 1 flag < 10ms', async () => {
  const user = randomExperimentUser();
  const flag = randomBenchmarkFlag();
  const duration = await measure(async () => {
    await client.evaluate(user, [flag]);
  });
  // eslint-disable-next-line no-console
  console.log('1 flag: ', duration, 'ms');
  expect(duration).toBeLessThan(10);
});

test('ExperimentClient.evaluate benchmark, 10 flags < 10ms', async () => {
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
  expect(total).toBeLessThan(10);
});

test('ExperimentClient.evaluate benchmark, 100 flags < 100ms', async () => {
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
  expect(total).toBeLessThan(100);
});

test('ExperimentClient.evaluate benchmark, 1000 flags < 1000ms', async () => {
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
  expect(total).toBeLessThan(1000);
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
