import evaluation from '@amplitude/evaluation-interop';

import { LocalEvaluationConfig, LocalEvaluationDefaults } from './config';
import { FetchHttpClient } from './transport/http';
import { FlagConfig, FlagConfigCache } from './types/cache';
import { EvaluationResult } from './types/evaluation';
import { HttpClient } from './types/transport';
import { doWithBackoff, BackoffPolicy } from './util/backoff';

import { ExperimentUser, Variants } from '.';

const FLAG_CONFIG_TIMEOUT = 5000;
const BACKOFF_POLICY: BackoffPolicy = {
  attempts: 5,
  min: 1,
  max: 1,
  scalar: 1,
};

/**
 * Experiment client for evaluating variants for a user locally.
 * @category Core Usage
 */
export class LocalEvaluationClient {
  private readonly apiKey: string;
  private readonly httpClient: HttpClient;
  private readonly config: LocalEvaluationConfig;
  private readonly flagConfigCache: FlagConfigCache;

  private flagConfigPoller: NodeJS.Timeout;
  private flagConfigPromise: Promise<void>;

  /**
   * Construct a local evaluation client.
   *
   * Call {@link start} to fetch the flag configs and begin polling for updates,
   * and {@link evaluate} to evaluate a user for a set of flags.
   *
   * @param apiKey The environment's api key.
   * @param config The {@link LocalEvaluationConfig}.
   * @param flagConfigCache The cache used to access flag configs to evaluate.
   */
  public constructor(
    apiKey: string,
    config: LocalEvaluationConfig,
    flagConfigCache: FlagConfigCache,
  ) {
    this.apiKey = apiKey;
    this.config = { ...LocalEvaluationDefaults, ...config };
    this.httpClient = FetchHttpClient;
    this.flagConfigCache = flagConfigCache;
  }

  /**
   * Locally evaluates flag variants for a user.
   *
   * This function will only evaluate flags for the keys specified in the
   * {@link flags} argument. If the {@link flags} argument is missing, all flags
   * in the {@link FlagConfigCache} will be evaluated.
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
   * Fetch initial flag configurations and start polling for updates.
   *
   * You must call this function to begin polling for flag config updates.
   * The promise returned by this function is resolved when the initial call
   * to fetch the flag configuration completes.
   *
   * Calling this function while the poller is already running will stop and
   * restart the poller.
   */
  public async start(): Promise<void> {
    this.stop();
    this.debug('[Experiment] poller - start');
    this.flagConfigPoller = setInterval(async () => {
      await this.updateFlagConfigs();
    }, this.config.flagConfigPollingIntervalMillis);
    if (!this.flagConfigPromise) {
      this.debug('[Experiment] fetch initial flag configs');
      this.flagConfigPromise = doWithBackoff<void>(async () => {
        await this.updateFlagConfigs();
      }, BACKOFF_POLICY);
      await this.flagConfigPromise;
    }
  }

  /**
   * Stop polling for flag configurations.
   *
   * Calling this function while the poller is not running will do nothing.
   */
  public stop(): void {
    if (this.flagConfigPoller) {
      this.debug('[Experiment] poller - stop');
      clearTimeout(this.flagConfigPoller);
      this.flagConfigPoller = undefined;
    }
  }

  private async fetchFlagConfigs(): Promise<Record<string, FlagConfig>> {
    const endpoint = `${this.config.serverUrl}/sdk/rules?d=fdsa`;
    const headers = {
      Authorization: `Api-Key ${this.apiKey}`,
    };
    const body = null;
    this.debug('[Experiment] Get flag configs');
    const response = await this.httpClient.request(
      endpoint,
      'GET',
      headers,
      body,
      FLAG_CONFIG_TIMEOUT,
    );
    if (response.status !== 200) {
      throw Error(
        `flagConfigs - received error response: ${response.status}: ${response.body}`,
      );
    }
    this.debug(`[Experiment] Got flag configs: ${response.body}`);
    return this.parseFlagConfigs(response.body);
  }

  private async getFlagConfigs(flagKeys?: string[]): Promise<FlagConfig[]> {
    if (this.flagConfigPromise) {
      this.debug('[Experiment] waiting for flag configs');
      await this.flagConfigPromise;
    }
    return Object.values(await this.flagConfigCache.get(flagKeys));
  }

  private async updateFlagConfigs(): Promise<void> {
    const flagConfigs = await this.fetchFlagConfigs();
    this.flagConfigCache.clear();
    this.flagConfigCache.put(flagConfigs);
    this.debug('[Experiment] updating flag configs');
  }

  private parseFlagConfigs(flagConfigs: string): Record<string, FlagConfig> {
    const flagConfigsArray = JSON.parse(flagConfigs);
    const flagConfigsRecord: Record<string, FlagConfig> = {};
    for (let i = 0; i < flagConfigsArray.length; i++) {
      const flagConfig = flagConfigsArray[i];
      flagConfigsRecord[flagConfig.flagKey] = flagConfig;
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
