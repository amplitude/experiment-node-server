import { HttpClient } from '@amplitude/experiment-core';

import { Cohort } from '../../types/cohort';

export type GetCohortOptions = {
  libraryName: string;
  libraryVersion: string;
  cohortId: string;
  maxCohortSize: number;
  lastModified?: number;
  timeoutMillis?: number;
};

export interface CohortApi {
  /**
   * Calls /sdk/v1/cohort/<cohortId> with query params maxCohortSize and lastModified if specified.
   * Returns a promise that
   *    resolves to a
   *        Cohort if the cohort downloads successfully or
   *        undefined if cohort has no change since lastModified timestamp and
   *    throws an error if download failed.
   * @param options
   */
  getCohort(options?: GetCohortOptions): Promise<Cohort>;
}

export class CohortClientRequestError extends Error {} // 4xx errors except 429
export class CohortMaxSizeExceededError extends CohortClientRequestError {} // 413 error
export class CohortDownloadError extends Error {} // All other errors

export class SdkCohortApi implements CohortApi {
  private readonly cohortApiKey;
  private readonly serverUrl;
  private readonly httpClient;

  constructor(cohortApiKey: string, serverUrl: string, httpClient: HttpClient) {
    this.cohortApiKey = cohortApiKey;
    this.serverUrl = serverUrl;
    this.httpClient = httpClient;
  }

  public async getCohort(
    options?: GetCohortOptions,
  ): Promise<Cohort | undefined> {
    const headers: Record<string, string> = {
      Authorization: `Basic ${this.cohortApiKey}`,
    };
    if (options?.libraryName && options?.libraryVersion) {
      headers[
        'X-Amp-Exp-Library'
      ] = `${options.libraryName}/${options.libraryVersion}`;
    }

    const reqUrl = `${this.serverUrl}/sdk/v1/cohort/${
      options.cohortId
    }?maxCohortSize=${options.maxCohortSize}${
      options.lastModified ? `&lastModified=${options.lastModified}` : ''
    }`;
    const response = await this.httpClient.request({
      requestUrl: reqUrl,
      method: 'GET',
      headers: headers,
      timeoutMillis: options?.timeoutMillis,
    });

    // Check status code.
    // 200: download success.
    // 204: no change.
    // 413: cohort larger than maxCohortSize
    if (response.status == 200) {
      const cohort: Cohort = JSON.parse(response.body) as Cohort;
      if (Array.isArray(cohort.memberIds)) {
        cohort.memberIds = new Set<string>(cohort.memberIds);
      }
      return cohort;
    } else if (response.status == 204) {
      return undefined;
    } else if (response.status == 413) {
      throw new CohortMaxSizeExceededError(
        `Cohort size > ${options.maxCohortSize}`,
      );
    } else if (
      400 <= response.status &&
      response.status < 500 &&
      response.status != 429
    ) {
      // Any 4xx other than 429.
      throw new CohortClientRequestError(
        `Cohort client error response status ${response.status}, body ${response.body}`,
      );
    } else {
      throw new CohortDownloadError(
        `Cohort error response status ${response.status}, body ${response.body}`,
      );
    }
  }
}
