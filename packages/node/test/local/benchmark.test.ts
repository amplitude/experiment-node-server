// import fs from 'fs';

import { Experiment } from 'src/factory';
import { ExperimentUser } from 'src/types/user';
import { measure } from 'src/util/performance';

const apiKey = 'server-5G5HQL3jUIPXWaJBTgAvDFHy277srxSg';

const client = Experiment.initializeLocal(apiKey);

/**
 * We need to perform evaluation prior to each benchmarking test to ensure that
 * the JIT compiler has already compiled the evaluation code. Otherwise the
 * first evaluation generally takes 20-30ms.
 */
beforeAll(async () => {
  await client.start();
  await client.evaluate(randomExperimentUser());
});

afterAll(() => {
  client.stop();
});

test('ExperimentClient.evaluate benchmark, 1 flag < 50ms', async () => {
  const user = randomExperimentUser();
  const flag = randomBenchmarkFlag();
  const duration = await measure(async () => {
    await client.evaluate(user, [flag]);
  });
  expect(duration).toBeLessThan(50);
});

test('ExperimentClient.evaluate benchmark, 10 flags < 50ms', async () => {
  let total = 0;
  for (let i = 0; i < 10; i++) {
    const user = randomExperimentUser();
    const flag = randomBenchmarkFlag();
    const duration = await measure(async () => {
      await client.evaluate(user, [flag]);
    });
    total += duration;
  }
  expect(total).toBeLessThan(50);
});

test('ExperimentClient.evaluate benchmark, 100 flags < 50ms', async () => {
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
  console.log('total: ', total);
  expect(total).toBeLessThan(50);
});

test('ExperimentClient.evaluate benchmark, 1000 flags < 100ms', async () => {
  let total = 0;
  for (let i = 0; i < 1000; i++) {
    const user = randomExperimentUser();
    const flag = randomBenchmarkFlag();
    const duration = await measure(async () => {
      await client.evaluate(user, [flag]);
    });
    total += duration;
  }
  expect(total).toBeLessThan(100);
});

// Data generation for charts

// test('data - evaluation duration by iteration', async () => {
//   let data = '';
//   const iterations = 10000;
//   for (let i = 0; i < iterations; i++) {
//     const user = randomExperimentUser();
//     const flag = randomBenchmarkFlag();
//     const duration = await measure(async () => {
//       await client.evaluate(user, [flag]);
//     });
//     data += `${duration.toFixed(3)},`;
//   }
//   // eslint-disable-next-line no-console
//   data = data.replace(/.$/, '\n');
//   fs.writeFileSync(
//     `/Users/brian.giori/dev/charts/data/eval-dur-iteration-${iterations}.csv`,
//     data,
//     { flag: 'a+' },
//   );
// });

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
