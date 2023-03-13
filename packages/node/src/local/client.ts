import evaluation from '@amplitude/evaluation-js';

import { FetchHttpClient } from '../transport/http';
import {
  LocalEvaluationConfig,
  LocalEvaluationDefaults,
} from '../types/config';
import { FlagConfig, FlagConfigCache } from '../types/flag';
import { HttpClient } from '../types/transport';
import { ExperimentUser } from '../types/user';
import { Results, Variants } from '../types/variant';
import { ConsoleLogger } from '../util/logger';
import { Logger } from '../util/logger';

import { InMemoryFlagConfigCache } from './cache';
import { FlagConfigFetcher } from './fetcher';
import { FlagConfigPoller } from './poller';

/**
 * Experiment client for evaluating variants for a user locally.
 * @category Core Usage
 */
export class LocalEvaluationClient {
  private readonly logger: Logger;
  private readonly config: LocalEvaluationConfig;
  private readonly poller: FlagConfigPoller;
  private flags: FlagConfig[];

  /**
   * Directly access the client's flag config cache.
   *
   * Used for directly manipulating the flag configs used for evaluation.
   */
  public readonly cache: FlagConfigCache;

  constructor(
    apiKey: string,
    config: LocalEvaluationConfig,
    flagConfigCache: FlagConfigCache = new InMemoryFlagConfigCache(
      config?.bootstrap,
    ),
    httpClient: HttpClient = new FetchHttpClient(config?.httpAgent),
  ) {
    this.config = { ...LocalEvaluationDefaults, ...config };
    const fetcher = new FlagConfigFetcher(
      apiKey,
      httpClient,
      this.config.serverUrl,
      this.config.debug,
    );
    // We no longer use the flag config cache for accessing variants.
    fetcher.setRawReceiver((flags: string) => {
      this.flags = JSON.parse(flags);
    });
    this.cache = flagConfigCache;
    this.logger = new ConsoleLogger(this.config.debug);
    this.poller = new FlagConfigPoller(
      fetcher,
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
    this.logger.debug(
      '[Experiment] evaluate - user:',
      user,
      'flags:',
      this.flags,
    );
    const results: Results = evaluation.evaluate(this.flags, user);
    const variants: Variants = {};
    const filter = flagKeys && flagKeys.length > 0;
    for (const flagKey in results) {
      if (filter && !flagKeys.includes(flagKey)) {
        continue;
      }
      const flagResult = results[flagKey];
      variants[flagKey] = {
        value: flagResult.value,
        payload: flagResult.payload,
      };
    }
    this.logger.debug('[Experiment] evaluate - variants: ', variants);
    return variants;
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
}
