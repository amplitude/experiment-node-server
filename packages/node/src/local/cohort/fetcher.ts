import { WrapperClient } from 'src/transport/http';
import { Cohort } from 'src/types/cohort';
import { LocalEvaluationDefaults } from 'src/types/config';
import { HttpClient } from 'src/types/transport';

import { version as PACKAGE_VERSION } from '../../../gen/version';

import { SdkCohortApi } from './cohort-api';

const COHORT_CONFIG_TIMEOUT = 5000;

export class CohortFetcher {
  readonly cohortApi: SdkCohortApi;
  readonly debug: boolean;

  constructor(
    apiKey: string,
    secretKey: string,
    httpClient: HttpClient,
    serverUrl = LocalEvaluationDefaults.serverUrl,
    debug = false,
  ) {
    const key = apiKey + ':' + secretKey;
    this.cohortApi = new SdkCohortApi(
      key,
      serverUrl,
      new WrapperClient(httpClient),
    );
    this.debug = debug;
  }

  async fetch(
    cohortId: string,
    maxCohortSize: number,
    lastModified?: number,
  ): Promise<Cohort | undefined> {
    return this.cohortApi.getCohort({
      libraryName: 'experiment-node-server',
      libraryVersion: PACKAGE_VERSION,
      cohortId: cohortId,
      maxCohortSize: maxCohortSize,
      lastModified: lastModified,
      timeoutMillis: COHORT_CONFIG_TIMEOUT,
    });
  }
}