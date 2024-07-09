import { WrapperClient } from 'src/transport/http';
import { Cohort } from 'src/types/cohort';
import { CohortConfigDefaults } from 'src/types/config';
import { HttpClient } from 'src/types/transport';
import { BackoffPolicy, doWithBackoffFailLoudly } from 'src/util/backoff';
import { ConsoleLogger, Logger } from 'src/util/logger';
import { Mutex, Executor } from 'src/util/threading';

import { version as PACKAGE_VERSION } from '../../../gen/version';

import { SdkCohortApi } from './cohort-api';

export const COHORT_CONFIG_TIMEOUT = 20000;

const BACKOFF_POLICY: BackoffPolicy = {
  attempts: 3,
  min: 1000,
  max: 1000,
  scalar: 1,
};

export class CohortFetcher {
  private readonly logger: Logger;

  readonly cohortApi: SdkCohortApi;
  readonly maxCohortSize: number;

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
    this.logger = new ConsoleLogger(debug);
  }

  async fetch(
    cohortId: string,
    lastModified?: number,
  ): Promise<Cohort | undefined> {
    // This block may have async and awaits. No guarantee that executions are not interleaved.
    const unlock = await this.mutex.lock();

    if (!this.inProgressCohorts[cohortId]) {
      this.inProgressCohorts[cohortId] = this.executor.run(async () => {
        this.logger.debug('Start downloading', cohortId);
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
        this.logger.debug('Stop downloading', cohortId, cohort['cohortId']);
        return cohort;
      });
    }

    const cohortPromise = this.inProgressCohorts[cohortId];
    unlock();
    return cohortPromise;
  }
}
