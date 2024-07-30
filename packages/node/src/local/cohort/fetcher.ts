import { version as PACKAGE_VERSION } from '../../../gen/version';
import { WrapperClient } from '../../transport/http';
import { Cohort } from '../../types/cohort';
import { CohortConfigDefaults } from '../../types/config';
import { HttpClient } from '../../types/transport';
import { ConsoleLogger, Logger } from '../../util/logger';
import { Mutex, Executor } from '../../util/threading';
import { sleep } from '../../util/time';

import { CohortMaxSizeExceededError, SdkCohortApi } from './cohort-api';

export const COHORT_CONFIG_TIMEOUT = 20000;

const ATTEMPTS = 3;

export class CohortFetcher {
  private readonly logger: Logger;

  readonly cohortApi: SdkCohortApi;
  readonly maxCohortSize: number;
  readonly cohortRequestDelayMillis: number;

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
    cohortRequestDelayMillis = 100,
    debug = false,
  ) {
    this.cohortApi = new SdkCohortApi(
      Buffer.from(apiKey + ':' + secretKey).toString('base64'),
      serverUrl,
      new WrapperClient(httpClient),
    );
    this.maxCohortSize = maxCohortSize;
    this.cohortRequestDelayMillis = cohortRequestDelayMillis;
    this.logger = new ConsoleLogger(debug);
  }

  static getKey(cohortId: string, lastModified?: number): string {
    return `${cohortId}_${lastModified ? lastModified : ''}`;
  }

  async fetch(
    cohortId: string,
    lastModified?: number,
  ): Promise<Cohort | undefined> {
    // This block may have async and awaits. No guarantee that executions are not interleaved.
    const unlock = await this.mutex.lock();
    const key = CohortFetcher.getKey(cohortId, lastModified);

    if (!this.inProgressCohorts[key]) {
      this.inProgressCohorts[key] = this.executor.run(async () => {
        this.logger.debug('Start downloading', cohortId);
        for (let i = 0; i < ATTEMPTS; i++) {
          try {
            const cohort = await this.cohortApi.getCohort({
              libraryName: 'experiment-node-server',
              libraryVersion: PACKAGE_VERSION,
              cohortId: cohortId,
              maxCohortSize: this.maxCohortSize,
              lastModified: lastModified,
              timeoutMillis: COHORT_CONFIG_TIMEOUT,
            });
            // Do unlock before return.
            const unlock = await this.mutex.lock();
            delete this.inProgressCohorts[key];
            unlock();
            this.logger.debug('Stop downloading', cohortId);
            return cohort;
          } catch (e) {
            if (i === ATTEMPTS - 1 || e instanceof CohortMaxSizeExceededError) {
              const unlock = await this.mutex.lock();
              delete this.inProgressCohorts[key];
              unlock();
              throw e;
            }
            await sleep(this.cohortRequestDelayMillis);
          }
        }
      });
    }

    const cohortPromise: Promise<Cohort | undefined> =
      this.inProgressCohorts[key];
    unlock();
    return cohortPromise;
  }
}
