import { sleep } from './time';

type BackoffPolicy = {
  attempts: number;
  min: number;
  max: number;
  scalar: number;
};

async function doWithBackoff<Result>(
  action: () => Promise<Result>,
  backoffPolicy: BackoffPolicy,
): Promise<Result> {
  let delay = backoffPolicy.min;
  for (let i = 0; i < backoffPolicy.attempts; i++) {
    try {
      return await action();
    } catch (e) {
      await sleep(delay);
      delay = Math.min(delay * backoffPolicy.scalar, backoffPolicy.max);
    }
  }
}

async function doWithBackoffFailLoudly<Result>(
  action: () => Promise<Result>,
  backoffPolicy: BackoffPolicy,
): Promise<Result> {
  let delay = backoffPolicy.min;
  for (let i = 0; i < backoffPolicy.attempts; i++) {
    try {
      return await action();
    } catch (e) {
      if (i === backoffPolicy.attempts - 1) {
        throw e;
      }
      await sleep(delay);
      delay = Math.min(delay * backoffPolicy.scalar, backoffPolicy.max);
    }
  }
}

export { doWithBackoff, doWithBackoffFailLoudly, BackoffPolicy };
