import { Executor, Mutex, Semaphore } from 'src/util/threading';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function mutexSleepFunc(lock, ms, acc) {
  return async () => {
    const unlock = await lock.lock();
    acc.runs++;
    await sleep(ms);
    unlock();
  };
}

function semaphoreSleepFunc(semaphore, ms, acc) {
  return async () => {
    const unlock = await semaphore.get();
    acc.runs++;
    await sleep(ms);
    unlock();
  };
}

function executorSleepFunc(ms, acc) {
  return async () => {
    acc.runs++;
    await sleep(ms);
  };
}

test('Mutex test locks', async () => {
  const acc = { runs: 0 };
  const mutex = new Mutex();
  mutexSleepFunc(mutex, 100, acc)();
  mutexSleepFunc(mutex, 100, acc)();
  mutexSleepFunc(mutex, 100, acc)();
  mutexSleepFunc(mutex, 100, acc)();
  mutexSleepFunc(mutex, 100, acc)();
  await sleep(10);
  expect(acc.runs).toBe(1);
  await sleep(20);
  expect(acc.runs).toBe(1);
  await sleep(100);
  expect(acc.runs).toBe(2);
  await sleep(100);
  expect(acc.runs).toBe(3);
  await sleep(100);
  expect(acc.runs).toBe(4);
  await sleep(100);
  expect(acc.runs).toBe(5);
});

test('Semaphore test locks', async () => {
  const acc = { runs: 0 };
  const semaphore = new Semaphore(3);
  semaphoreSleepFunc(semaphore, 100, acc)();
  semaphoreSleepFunc(semaphore, 100, acc)();
  semaphoreSleepFunc(semaphore, 100, acc)();
  semaphoreSleepFunc(semaphore, 100, acc)();
  semaphoreSleepFunc(semaphore, 100, acc)();
  await sleep(10);
  expect(acc.runs).toBe(3);
  await sleep(40);
  expect(acc.runs).toBe(3);
  await sleep(100);
  expect(acc.runs).toBe(5);
});

test('Semaphore test fifo', async () => {
  const acc = { runs: 0 };
  const semaphore = new Semaphore(3);
  semaphoreSleepFunc(semaphore, 100, acc)();
  semaphoreSleepFunc(semaphore, 300, acc)();
  semaphoreSleepFunc(semaphore, 500, acc)();
  semaphoreSleepFunc(semaphore, 200, acc)();
  semaphoreSleepFunc(semaphore, 400, acc)();
  semaphoreSleepFunc(semaphore, 0, acc)();
  await sleep(10);
  expect(acc.runs).toBe(3);
  await sleep(40);
  expect(acc.runs).toBe(3);
  await sleep(100);
  expect(acc.runs).toBe(4);
  await sleep(100);
  expect(acc.runs).toBe(4);
  await sleep(100);
  expect(acc.runs).toBe(6);
  await sleep(200);
  expect(acc.runs).toBe(6);
  semaphoreSleepFunc(semaphore, 100, acc)();
  await sleep(10);
  expect(acc.runs).toBe(7);
});

test('Executor test', async () => {
  const acc = { runs: 0 };
  const executor = new Executor(3);

  executor.run(executorSleepFunc(100, acc));
  executor.run(executorSleepFunc(300, acc));
  executor.run(executorSleepFunc(500, acc));
  executor.run(executorSleepFunc(200, acc));
  executor.run(executorSleepFunc(400, acc));
  executor.run(executorSleepFunc(0, acc));
  await sleep(10);
  expect(acc.runs).toBe(3);
  await sleep(40);
  expect(acc.runs).toBe(3);
  await sleep(100);
  expect(acc.runs).toBe(4);
  await sleep(100);
  expect(acc.runs).toBe(4);
  await sleep(100);
  expect(acc.runs).toBe(6);
  await sleep(200);
  expect(acc.runs).toBe(6);
  executor.run(executorSleepFunc(100, acc));
  await sleep(10);
  expect(acc.runs).toBe(7);
});
