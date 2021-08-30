import evaluation from '@amplitude/evaluation-interop';

import { version as PACKAGE_VERSION } from '../gen/version';

import { ExperimentConfig, Defaults } from './config';
import { FetchHttpClient } from './transport/http';
import { EvaluationResult } from './types/evaluation';
import { HttpClient } from './types/transport';
import { ExperimentUser } from './types/user';
import { Variant, Variants } from './types/variant';
import { performance } from './util/performance';
import { sleep } from './util/time';

/**
 * Main client for fetching variant data.
 * @category Core Usage
 */
export class ExperimentClient {
  private readonly apiKey: string;
  private readonly httpClient: HttpClient;
  private readonly config: ExperimentConfig;

  private rules: string;
  private rulesPoller: NodeJS.Timeout;

  /**
   * Creates a new ExperimentClient instance.
   *
   * @param apiKey The environment API Key
   * @param config See {@link ExperimentConfig} for config options
   */
  public constructor(apiKey: string, config: ExperimentConfig) {
    this.apiKey = apiKey;
    this.config = { ...Defaults, ...config };
    this.httpClient = FetchHttpClient;
    if (this.config.enableLocalEvaluation) {
      this.startRulesPoller();
    }
  }

  /**
   * Fetch all variants for a user.
   *
   * This method will automatically retry if configured (default).
   *
   * @param user The {@link ExperimentUser} context
   * @return The {@link Variants} for the user on success, empty
   * {@link Variants} on error.
   */
  public async fetch(user: ExperimentUser): Promise<Variants> {
    if (!this.apiKey) {
      throw Error('Experiment API key is empty');
    }
    try {
      return await this.fetchInternal(user);
    } catch (e) {
      console.error('[Experiment] Failed to fetch variants: ', e);
      return {};
    }
  }

  /**
   * Evaluate variants for a user locally.
   *
   * The enableLocalEvaluation config option must be set to true when
   * initializing the ExperimentClient.
   *
   * @param user The user to evaluate
   * @returns The evaluated variants
   */
  public async evaluate(user: ExperimentUser): Promise<Variants> {
    if (!this.config.enableLocalEvaluation) {
      throw Error('enableLocalEvaluation config option must be set to true');
    }
    const rules = await this.getRules();
    const resultsString = evaluation.evaluate(rules, JSON.stringify(user));
    const results: EvaluationResult = JSON.parse(resultsString);
    const variants: Variants = {};
    Object.keys(results).forEach((key) => {
      variants[key] = {
        value: results[key].variant.key,
        payload: results[key].variant.payload,
      };
    });
    return variants;
  }

  ////////////////////
  // Fetch Internal //
  ////////////////////

  private async fetchInternal(user: ExperimentUser): Promise<Variants> {
    if (!this.apiKey) {
      throw Error('Experiment API key is empty');
    }
    this.debug('[Experiment] Fetching variants for user: ', user);
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

  private async doFetch(
    user: ExperimentUser,
    timeoutMillis: number,
  ): Promise<Variants> {
    const start = performance.now();
    const userContext = this.addContext(user || {});
    const endpoint = `${this.config.serverUrl}/sdk/vardata`;
    const headers = {
      Authorization: `Api-Key ${this.apiKey}`,
    };
    const body = JSON.stringify(user);
    // CDN can only cache requests where the body is < 8KB
    if (body.length > 8000) {
      console.warn(
        `[Experiment] encoded user object length ${body.length} cannot be cached by CDN; must be < 8KB`,
      );
    }
    this.debug('[Experiment] Fetch variants for user: ', userContext);
    const response = await this.httpClient.request(
      endpoint,
      'POST',
      headers,
      body,
      timeoutMillis,
    );
    if (response.status !== 200) {
      throw Error(
        `fetch - received error response: ${response.status}: ${response.body}`,
      );
    }
    const elapsed = (performance.now() - start).toFixed(3);
    this.debug(`[Experiment] Fetch complete in ${elapsed} ms`);
    const json = JSON.parse(response.body);
    const variants = this.parseJsonVariants(json);
    this.debug('[Experiment] Fetched variants: ', variants);
    return variants;
  }

  private async retryFetch(user: ExperimentUser): Promise<Variants> {
    if (this.config.fetchRetries == 0) {
      return {};
    }
    this.debug('[Experiment] Retrying fetch');
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

  private async parseJsonVariants(json: string): Promise<Variants> {
    const variants: Variants = {};
    for (const key of Object.keys(json)) {
      let value: string;
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
      library: `experiment-node-server/${PACKAGE_VERSION}`,
      ...user,
    };
  }

  ///////////////////////
  // Evaluate Internal //
  ///////////////////////

  private async getRules(): Promise<string> {
    if (!this.rules) {
      this.rules = await this.doRules();
    }
    return this.rules;
  }

  private async doRules(): Promise<string> {
    const endpoint = `${this.config.serverUrl}/sdk/rules?d=fdsa`;
    const headers = {
      Authorization: `Api-Key ${this.apiKey}`,
    };
    this.debug('[Experiment] Get rules');
    const response = await this.httpClient.request(
      endpoint,
      'GET',
      headers,
      null,
      10000,
    );
    if (response.status !== 200) {
      throw Error(
        `rules - received error response: ${response.status}: ${response.body}`,
      );
    }
    this.debug(`[Experiment] Got rules: ${response.body}`);
    return response.body;
  }

  private startRulesPoller() {
    this.doRules().then((rules) => {
      this.rules = rules;
    });
    this.rulesPoller = setInterval(async () => {
      this.rules = await this.doRules();
    }, this.config.rulesPollingInterval);
  }

  private stopRulesPoller() {
    if (this.rulesPoller) {
      clearTimeout(this.rulesPoller);
      this.rulesPoller = undefined;
    }
  }

  ///////////////
  // Utilities //
  ///////////////

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private debug(message?: any, ...optionalParams: any[]): void {
    if (this.config.debug) {
      console.debug(message, ...optionalParams);
    }
  }
}