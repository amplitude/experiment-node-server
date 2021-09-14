import { sleep } from './time';

type Backoff = {
  attempts: number;
  min: number;
  max: number;
  scalar: number;
};

async function backoff<Result>(
  action: () => Promise<Result>,
  backoff: Backoff,
): Promise<Result> {
  let delay = backoff.min;
  for (let i = 0; i < backoff.attempts; i++) {
    try {
      return await action();
    } catch (e) {
      await sleep(delay);
      delay = Math.min(delay * backoff.scalar, backoff.max);
    }
  }
}

export { backoff, Backoff };
