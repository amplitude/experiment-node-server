import { LocalEvaluationConfig, LocalEvaluationDefaults } from '../config';
import { ConsoleLogger } from '../logger/console';
import { FetchHttpClient } from '../transport/http';
import { FlagConfig, FlagConfigCache } from '../types/flag';
import { HttpClient } from '../types/transport';
import { ExperimentUser } from '../types/user';
import { Variants } from '../types/variant';
import { Logger } from '../util/logger';

import { InMemoryFlagConfigCache } from './cache';
import { FlagConfigEvaluator } from './evaluator';
import { FlagConfigFetcher } from './fetcher';
import { FlagConfigPoller } from './poller';

/**
 * Experiment client for evaluating variants for a user locally.
 * @category Core Usage
 */
export class LocalEvaluationClient {
  private readonly logger: Logger;
  private readonly config: LocalEvaluationConfig;
  private readonly client: FlagConfigFetcher;
  private readonly evaluator: FlagConfigEvaluator;
  private readonly poller: FlagConfigPoller;

  /**
   * Directly access the client's flag config cache.
   *
   * Used for directly manipulating the flag configs used for evaluation.
   */
  public readonly cache: FlagConfigCache;

  public constructor(
    apiKey: string,
    config: LocalEvaluationConfig,
    flagConfigCache: FlagConfigCache = new InMemoryFlagConfigCache(
      config.bootstrap,
    ),
    httpClient: HttpClient = FetchHttpClient,
  ) {
    this.config = { ...LocalEvaluationDefaults, ...config };
    this.client = new FlagConfigFetcher(
      apiKey,
      httpClient,
      this.config.serverUrl,
      this.config.debug,
    );
    this.cache = flagConfigCache;
    this.logger = new ConsoleLogger(this.config.debug);
    this.evaluator = new FlagConfigEvaluator(this.config.debug);
    this.poller = new FlagConfigPoller(
      this.client,
      this.cache,
      this.config.flagConfigPollingIntervalMillis,
      this.config.debug,
    );
  }

  /**
   * Locally evaluates flag variants for a user.
   *
   * This function will only evaluate flags for the keys specified in the
   * {@link flagKeys} argument. If {@link flagKeys} is missing, all flags in the
   * {@link FlagConfigCache} will be evaluated.
   *
   * @param user The user to evaluate
   * @param flagKeys The flags to evaluate with the user. If empty, all flags
   * from the flag cache are evaluated.
   * @returns The evaluated variants
   */
  public async evaluate(
    user: ExperimentUser,
    flagKeys?: string[],
  ): Promise<Variants> {
    const flagConfigs = await this.getFlagConfigs(flagKeys);
    return this.evaluator.evaluate(user, flagConfigs);
  }

  /**
   * Fetch initial flag configurations and start polling for updates.
   *
   * You must call this function to begin polling for flag config updates.
   * The promise returned by this function is resolved when the initial call
   * to fetch the flag configuration completes.
   *
   * Calling this function while the poller is already running does nothing.
   */
  public async start(): Promise<void> {
    return await this.poller.start();
  }

  /**
   * Stop polling for flag configurations.
   *
   * Calling this function while the poller is not running will do nothing.
   */
  public stop(): void {
    return this.poller.stop();
  }

  private async getFlagConfigs(flagKeys?: string[]): Promise<FlagConfig[]> {
    if (!flagKeys) {
      return Object.values(await this.cache.getAll());
    }
    const result: FlagConfig[] = [];
    for (const key in flagKeys) {
      const flagConfig = await this.cache.get(key);
      if (flagConfig) {
        result.push(flagConfig);
      }
    }
    return result;
  }
}