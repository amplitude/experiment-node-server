import {
  EvaluationApi,
  FetchError,
  SdkEvaluationApi,
} from '@amplitude/experiment-core';

import { version as PACKAGE_VERSION } from '../../gen/version';
import { FetchHttpClient, WrapperClient } from '../transport/http';
import {
  ExperimentConfig,
  RemoteEvaluationDefaults,
  RemoteEvaluationConfig,
} from '../types/config';
import { FetchOptions } from '../types/fetch';
import { ExperimentUser } from '../types/user';
import { Variant, Variants } from '../types/variant';
import { sleep } from '../util/time';
import {
  evaluationVariantsToVariants,
  filterDefaultVariants,
} from '../util/variant';

/**
 * Experiment client for fetching variants for a user remotely.
 * @category Core Usage
 */
export class RemoteEvaluationClient {
  private readonly apiKey: string;
  private readonly config: RemoteEvaluationConfig;
  private readonly evaluationApi: EvaluationApi;

  /**
   * Creates a new RemoteEvaluationClient instance.
   *
   * @param apiKey The environment API Key
   * @param config See {@link ExperimentConfig} for config options
   */
  public constructor(apiKey: string, config: RemoteEvaluationConfig) {
    this.apiKey = apiKey;
    this.config = { ...RemoteEvaluationDefaults, ...config };
    this.evaluationApi = new SdkEvaluationApi(
      apiKey,
      this.config.serverUrl,
      new WrapperClient(new FetchHttpClient(this.config?.httpAgent)),
    );
  }

  /**
   * Fetch remote evaluated variants for a user. This function can
   * automatically retry the request on failure (if configured), and will
   * throw the original error if all retries fail.
   *
   * Unlike {@link fetch}, this function returns a default variant object
   * if the flag or experiment was evaluated, but the user was not assigned a
   * variant (i.e. 'off').
   *
   * @param user The user to fetch variants for.
   * @param options Options to configure the fetch request.
   */
  public async fetchV2(
    user: ExperimentUser,
    options?: FetchOptions,
  ): Promise<Record<string, Variant>> {
    if (!this.apiKey) {
      throw Error('Experiment API key is empty');
    }
    this.debug('[Experiment] Fetching variants for user: ', user);
    try {
      return await this.doFetch(user, this.config.fetchTimeoutMillis, options);
    } catch (e) {
      if (!this.shouldRetryFetch(e)) {
        throw e;
      }
      try {
        return await this.retryFetch(user, options);
      } catch (e) {
        console.error(e);
      }
    }
  }

  /**
   * Fetch all variants for a user.
   *
   * This method will automatically retry if configured (default).
   *
   * @param user The {@link ExperimentUser} context
   * @param options The {@link FetchOptions} for this specific fetch request.
   * @return The {@link Variants} for the user on success, empty
   * {@link Variants} on error.
   * @deprecated use fetchV2 instead
   */
  public async fetch(
    user: ExperimentUser,
    options?: FetchOptions,
  ): Promise<Variants> {
    try {
      const results = await this.fetchV2(user, options);
      return filterDefaultVariants(results);
    } catch (e) {
      console.error('[Experiment] Failed to fetch variants: ', e);
      return {};
    }
  }

  private async doFetch(
    user: ExperimentUser,
    timeoutMillis: number,
    options?: FetchOptions,
  ): Promise<Record<string, Variant>> {
    const userContext = this.addContext(user || {});
    const results = await this.evaluationApi.getVariants(userContext, {
      flagKeys: options?.flagKeys,
      timeoutMillis: timeoutMillis,
    });
    this.debug('[Experiment] Fetched variants: ', results);
    return evaluationVariantsToVariants(results);
  }

  private async retryFetch(
    user: ExperimentUser,
    options?: FetchOptions,
  ): Promise<Record<string, Variant>> {
    if (this.config.fetchRetries == 0) {
      return {};
    }
    this.debug('[Experiment] Retrying fetch');
    let err: Error = null;
    let delayMillis = this.config.fetchRetryBackoffMinMillis;
    for (let i = 0; i < this.config.fetchRetries; i++) {
      await sleep(delayMillis);
      try {
        return await this.doFetch(
          user,
          this.config.fetchRetryTimeoutMillis,
          options,
        );
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

  private addContext(user: ExperimentUser): ExperimentUser {
    return {
      library: `experiment-node-server/${PACKAGE_VERSION}`,
      ...user,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private debug(message?: any, ...optionalParams: any[]): void {
    if (this.config.debug) {
      console.debug(message, ...optionalParams);
    }
  }

  private shouldRetryFetch(e: Error): boolean {
    if (e instanceof FetchError) {
      return e.statusCode < 400 || e.statusCode >= 500 || e.statusCode === 429;
    }
    return true;
  }
}

/**
 * @deprecated use {@link RemoteEvaluationClient}.
 */
export class ExperimentClient extends RemoteEvaluationClient {
  constructor(apiKey: string, config: ExperimentConfig) {
    super(apiKey, config);
  }
}
