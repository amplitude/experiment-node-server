import { WrapperClient } from 'src/transport/http';
import { Cohort } from 'src/types/cohort';
import { CohortConfigDefaults } from 'src/types/config';
import { HttpClient } from 'src/types/transport';
import { BackoffPolicy, doWithBackoffFailLoudly } from 'src/util/backoff';
import { Mutex, Executor } from 'src/util/mutex';

import { version as PACKAGE_VERSION } from '../../../gen/version';

import { SdkCohortApi } from './cohort-api';

const COHORT_CONFIG_TIMEOUT = 20000;

const BACKOFF_POLICY: BackoffPolicy = {
  attempts: 3,
  min: 1000,
  max: 1000,
  scalar: 1,
};

export class CohortFetcher {
  readonly cohortApi: SdkCohortApi;
  readonly maxCohortSize: number;
  readonly debug: boolean;

  private readonly inProgressCohorts: Record<
    string,
    Promise<Cohort | undefined>
  > = {};
  private readonly mutex: Mutex = new Mutex();
  private readonly executor: Executor = new Executor(4);

  constructor(
    apiKey: string,
    secretKey: string,
    httpClient: HttpClient,
    serverUrl = CohortConfigDefaults.cohortServerUrl,
    maxCohortSize = CohortConfigDefaults.maxCohortSize,
    debug = false,
  ) {
    this.cohortApi = new SdkCohortApi(
      Buffer.from(apiKey + ':' + secretKey).toString('base64'),
      serverUrl,
      new WrapperClient(httpClient),
    );
    this.maxCohortSize = maxCohortSize;
    this.debug = debug;
  }

  async fetch(
    cohortId: string,
    lastModified?: number,
  ): Promise<Cohort | undefined> {
    // This block may have async and awaits. No guarantee that executions are not interleaved.
    // TODO: Add download concurrency limit.
    const unlock = await this.mutex.lock();

    if (!this.inProgressCohorts[cohortId]) {
      this.inProgressCohorts[cohortId] = this.executor.run(async () => {
        console.log('Start downloading', cohortId);
        const cohort = await doWithBackoffFailLoudly<Cohort>(
          async () =>
            this.cohortApi.getCohort({
              libraryName: 'experiment-node-server',
              libraryVersion: PACKAGE_VERSION,
              cohortId: cohortId,
              maxCohortSize: this.maxCohortSize,
              lastModified: lastModified,
              timeoutMillis: COHORT_CONFIG_TIMEOUT,
            }),
          BACKOFF_POLICY,
        )
          .then(async (cohort) => {
            const unlock = await this.mutex.lock();
            delete this.inProgressCohorts[cohortId];
            unlock();
            return cohort;
          })
          .catch(async (err) => {
            const unlock = await this.mutex.lock();
            delete this.inProgressCohorts[cohortId];
            unlock();
            throw err;
          });
        console.log('Stop downloading', cohortId, cohort['cohortId']);
        return cohort;
      });
    }

    unlock();
    return this.inProgressCohorts[cohortId];
  }

  // queueMutex = new Mutex();
  // queue = [];
  // running = 0;

  // private startNextTask() {
  //   const unlock = this.queueMutex.lock();
  //   if (this.running >= 10) {
  //     unlock();
  //     return;
  //   }

  //   const nextTask = this.queue[0];
  //   delete this.queue[0];

  //   this.running++;
  //   new Promise((resolve, reject) => {
  //     nextTask()
  //       .then((v) => {
  //         const unlock = this.queueMutex.lock();
  //         this.running--;
  //         unlock();
  //         this.startNextTask();
  //         return v;
  //       })
  //       .catch((err) => {
  //         const unlock = this.queueMutex.lock();
  //         this.running--;
  //         unlock();
  //         this.startNextTask();
  //         throw err;
  //       });
  //   });

  //   unlock();
  // }

  // private queueTask<T>(task: () => Promise<T>): Promise<T> {
  //   const unlock = this.queueMutex.lock();
  //   this.queue.push(task);
  //   unlock();
  //   this.startNextTask();
  // }
}
