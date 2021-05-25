import { version as PACKAGE_VERSION } from '../gen/version';

import { ExperimentConfig, Defaults } from './config';
import { FetchHttpClient } from './transport/http';
import { HttpClient } from './types/transport';
import { ExperimentUser } from './types/user';
import { Variant, Variants } from './types/variant';
import { urlSafeBase64Encode } from './util/encode';
import { performance } from './util/performance';
import { sleep } from './util/time';

/**
 * Main client for fetching variant data.
 * @category Core Usage
 */
export class ExperimentClient {
  protected readonly apiKey: string;
  protected readonly httpClient: HttpClient;

  protected serverUrl: string;
  protected config: ExperimentConfig;
  protected user: ExperimentUser;
  protected debug: boolean;

  /**
   * Creates a new ExperimentClient instance.
   * In most cases, a ExperimentClient should be initialized and accessed using
   * the factory functions {@link experimentInit} and {@link experimentInstance}
   * @param apiKey The environment API Key
   * @param config See {@link ExperimentConfig} for config options
   */
  public constructor(apiKey: string, config: ExperimentConfig) {
    this.apiKey = apiKey;
    this.config = { ...Defaults, ...config };
    this.httpClient = FetchHttpClient;
    this.debug = this.config?.debug;
  }

  protected async fetchAll(user: ExperimentUser): Promise<Variants> {
    if (!this.apiKey) {
      throw Error('Experiment API key is empty');
    }
    if (this.debug) {
      console.debug('[Experiment] Fetching variants for user: ', user);
    }
    try {
      return await this.doFetch(user, this.config.fetchTimeoutMillis);
    } catch (e) {
      console.error('[Experiment] Fetch failed: ', e);
      try {
        return await this.retryFetch(user);
      } catch (e) {
        console.error(e);
      }
      throw e;
    }
  }

  protected async doFetch(
    user: ExperimentUser,
    timeoutMillis: number,
  ): Promise<Variants> {
    const start = performance.now();
    const userContext = this.addContext(user || {});
    const encodedContext = urlSafeBase64Encode(JSON.stringify(userContext));
    const endpoint = `${this.config.serverUrl}/sdk/vardata/${encodedContext}`;
    const headers = {
      Authorization: `Api-Key ${this.apiKey}`,
    };
    const response = await this.httpClient.request(
      endpoint,
      'GET',
      headers,
      null,
      timeoutMillis,
    );
    if (response.status !== 200) {
      throw Error(
        `Received error response: ${response.status}: ${response.body}`,
      );
    }
    const elapsed = (performance.now() - start).toFixed(3);
    if (this.debug) {
      console.debug(`[Experiment] Fetch complete in ${elapsed} ms`);
    }
    const json = JSON.parse(response.body);
    const variants = this.parseJsonVariants(json);
    if (this.debug) {
      console.debug(`[Experiment] Fetched variants: ${variants}`);
    }
    return variants;
  }

  protected async retryFetch(user: ExperimentUser): Promise<Variants> {
    if (this.config.fetchRetries == 0) {
      return {};
    }
    if (this.debug) {
      console.debug('[Experiment] Retrying fetch');
    }
    let err: Error = null;
    let delayMillis = this.config.fetchRetryBackoffMinMillis;
    for (let i = 0; i < this.config.fetchRetries; i++) {
      await sleep(delayMillis);
      try {
        return await this.doFetch(user, this.config.fetchRetryTimeoutMillis);
      } catch (e) {
        console.error('[Experiment] Retry falied: ', e);
        err = e;
      }
      delayMillis = Math.min(
        delayMillis * this.config.fetchRetryBackoffScalar,
        this.config.fetchRetryBackoffMaxMillis,
      );
    }
    throw err;
  }

  protected async parseJsonVariants(json: string): Promise<Variants> {
    const variants: Variants = {};
    for (const key of Object.keys(json)) {
      let value;
      if ('value' in json[key]) {
        value = json[key].value;
      } else if ('key' in json[key]) {
        // value was previously under the "key" field
        value = json[key].key;
      }
      const variant: Variant = {
        value,
        payload: json[key].payload,
      };
      variants[key] = variant;
    }
    return variants;
  }

  private addContext(user: ExperimentUser): ExperimentUser {
    return {
      library: `experiment-js-server/${PACKAGE_VERSION}`,
      ...user,
    };
  }

  /**
   * Returns all variants for the user
   * @param user The {@link ExperimentUser} context
   */
  public async getVariants(user: ExperimentUser): Promise<Variants> {
    if (!this.apiKey) {
      throw Error('Experiment API key is empty');
    }
    try {
      return await this.fetchAll(user);
    } catch (e) {
      console.error('[Experiment] Failed to fetch variants: ', e);
      return {};
    }
  }
}
