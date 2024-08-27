export class Mutex {
  _locking;

  constructor() {
    this._locking = Promise.resolve();
  }

  lock(): Promise<() => void> {
    let unlockNext;
    const willLock = new Promise((resolve) => (unlockNext = resolve));
    const willUnlock = this._locking.then(() => unlockNext);
    this._locking = this._locking.then(() => willLock);
    return willUnlock;
  }
}

export class Semaphore {
  public readonly limit: number;
  private queue: {
    willResolve: (v: unknown) => void;
  }[] = [];
  private running = 0;

  constructor(limit: number) {
    this.limit = limit;
  }

  get(): Promise<() => void> {
    let willResolve;
    const promise = new Promise<() => void>((resolve) => {
      willResolve = resolve;
    });

    this.queue.push({ willResolve });

    this.tryRunNext();

    return promise;
  }

  private tryRunNext(): void {
    if (this.running >= this.limit || this.queue.length == 0) {
      return;
    }

    this.running++;
    const { willResolve } = this.queue.shift();

    willResolve(() => {
      this.running--;
      this.tryRunNext();
    });
  }
}

export class Executor {
  private readonly semaphore: Semaphore;

  constructor(limit: number) {
    this.semaphore = new Semaphore(limit);
  }

  async run<T>(task: () => Promise<T>): Promise<T> {
    const unlock = await this.semaphore.get();
    try {
      return await task();
    } finally {
      unlock();
    }
  }
}
