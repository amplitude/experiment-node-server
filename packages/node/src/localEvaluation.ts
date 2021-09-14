import evaluation from '@amplitude/evaluation-interop';

import { LocalEvaluationConfig, LocalEvaluationDefaults } from './config';
import { FetchHttpClient } from './transport/http';
import { FlagCache } from './types/cache';
import { EvaluationResult } from './types/evaluation';
import { HttpClient } from './types/transport';
import { doWithBackoff, BackoffPolicy } from './util/backoff';

import { ExperimentUser, Variants } from '.';

/**
 * Experiment client for evaluating variants for a user locally.
 * @category Core Usage
 */
export class LocalEvaluationClient {
  private readonly apiKey: string;
  private readonly httpClient: HttpClient;
  private readonly config: LocalEvaluationConfig;
  private readonly flagCache: FlagCache;

  private flagConfigPoller: NodeJS.Timeout;
  private flagConfigPromise: Promise<void>;

  public constructor(
    apiKey: string,
    config: LocalEvaluationConfig,
    flagCache: FlagCache,
  ) {
    this.apiKey = apiKey;
    this.config = { ...LocalEvaluationDefaults, ...config };
    this.httpClient = FetchHttpClient;
    this.flagCache = flagCache;
  }

  /**
   * Locally evaluates flag variants for a user. This function will only
   * evaluated flags for the keys specified in the {@link flags} argument. If
   * the {@link flags} argument is missing, all flags in the cache will be
   * evaluated.
   *
   * Flag configs are accessed via the {@link FlagCache} passed in the
   * constructor. If the {@link start()} function was used, this function will
   * wait for the initial flags to be loaded before evaluating the user.
   *
   * @param user The user to evaluate
   * @param flags The flags to evaluate with the user. If empty, all flags from
   * the flag cache are evaluated.
   * @returns The evaluated variants
   */
  public async evaluate(
    user: ExperimentUser,
    flags?: string[],
  ): Promise<Variants> {
    // Evaluate the flag configs and user.
    const flagConfigs = await this.getFlagConfigs(flags);
    this.debug('[Experiment] evaluate - user:', user, 'flags:', flags);
    const resultsString = evaluation.evaluate(
      JSON.stringify(flagConfigs),
      JSON.stringify(user),
    );
    this.debug('[Experiment] evaluate - result:', resultsString);
    // Parse variant results
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

  /**
   * Start polling for flag configurations.
   *
   * You must call this function to begin polling for flag config updates.
   * The promise returned by this function is resolved when the initial call
   * to fetch the flag configuration completes.
   *
   * Calling this function while the poller is already running will stop and
   * restart the poller.
   *
   * @throws if fetching flag configs fails.
   */
  public async start(): Promise<void> {
    this.stop();
    this.flagConfigPoller = setInterval(async () => {
      await this.updateFlagConfigs();
    }, this.config.flagConfigPollingInterval);
    if (this.flagConfigPromise) {
      this.flagConfigPromise = this.updateFlagConfigs({
        attempts: 5,
        min: 1,
        max: 1,
        scalar: 1,
      });
      await this.flagConfigPromise;
    }
  }

  /**
   * Stop polling for flag configurations.
   *
   * calling this function while the poller is not running will do nothing.
   */
  public stop(): void {
    if (this.flagConfigPoller) {
      clearTimeout(this.flagConfigPoller);
      this.flagConfigPoller = undefined;
    }
  }

  private async getFlagConfigs(flagKeys?: string[]): Promise<string[]> {
    if (this.flagConfigPromise) {
      await this.flagConfigPromise;
    }
    return Object.values(this.flagCache.get(flagKeys));
  }

  private async updateFlagConfigs(
    backoffPolicy?: BackoffPolicy,
  ): Promise<void> {
    return await doWithBackoff<void>(async () => {
      const flagConfigs = await this.fetchFlagConfigs();
      this.flagCache.clear();
      this.flagCache.put(flagConfigs);
    }, backoffPolicy);
  }

  private async fetchFlagConfigs(): Promise<Record<string, string>> {
    const flagConfigs = await this.doFlagConfigs();
    return this.parseFlagConfigs(flagConfigs);
  }

  private async doFlagConfigs(): Promise<string> {
    const endpoint = `${this.config.serverUrl}/sdk/rules?d=fdsa`;
    const headers = {
      Authorization: `Api-Key ${this.apiKey}`,
    };
    this.debug('[Experiment] Get flag configs');
    const response = await this.httpClient.request(
      endpoint,
      'GET',
      headers,
      null,
      5000,
    );
    if (response.status !== 200) {
      throw Error(
        `flagConfigs - received error response: ${response.status}: ${response.body}`,
      );
    }
    this.debug(`[Experiment] Got flag configs: ${response.body}`);
    return response.body;
  }

  private parseFlagConfigs(flagConfigs: string): Record<string, string> {
    const flagConfigsArray = JSON.parse(flagConfigs);
    const flagConfigsRecord: Record<string, string> = {};
    for (let i = 0; i < flagConfigsArray.length; i++) {
      const rule = flagConfigsArray[i];
      flagConfigsRecord[rule.flagKey] = rule;
    }
    return flagConfigsRecord;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private debug(message?: any, ...optionalParams: any[]): void {
    if (this.config.debug) {
      console.debug(message, ...optionalParams);
    }
  }
}
