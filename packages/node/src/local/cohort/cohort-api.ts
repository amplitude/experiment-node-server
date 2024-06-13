import { HttpClient } from '@amplitude/experiment-core';
import { Cohort } from 'src/types/cohort';

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
export class SdkCohortApi implements CohortApi {
  private readonly key;
  private readonly serverUrl;
  private readonly httpClient;

  constructor(key: string, serverUrl: string, httpClient: HttpClient) {
    this.key = key;
    this.serverUrl = serverUrl;
    this.httpClient = httpClient;
  }

  public async getCohort(
    options?: GetCohortOptions,
  ): Promise<Cohort | undefined> {
    const headers: Record<string, string> = {
      Authorization: `Basic ${this.key}`,
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
      throw Error(`Cohort error response: size > ${options.maxCohortSize}`);
    } else {
      throw Error(`Cohort error resposne: status=${response.status}`);
    }
  }
}
