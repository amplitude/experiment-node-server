import * as amplitude from '@amplitude/analytics-node';
import evaluation from '@amplitude/evaluation-js';
import { Assignment, AssignmentService } from 'src/assignment/assignment';
import {
  DEFAULT_FILTER_CAPACITY,
  LRUAssignmentFilter,
} from 'src/assignment/assignment-filter';
import { AmplitudeAssignmentService } from 'src/assignment/assignment-service';

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
  private readonly assignmentService: AssignmentService;

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

    if (config.assignmentConfiguration) {
      const instance = amplitude.createInstance();
      instance.init(
        config.assignmentConfiguration.apiKey,
        config.assignmentConfiguration,
      );
      const filterCapacity = config?.assignmentConfiguration?.filterCapacity
        ? config?.assignmentConfiguration?.filterCapacity
        : DEFAULT_FILTER_CAPACITY;
      this.assignmentService = new AmplitudeAssignmentService(
        instance,
        new LRUAssignmentFilter(filterCapacity), // TODO add filter
      );
    }
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
    void this.assignmentService?.track(new Assignment(user, results));
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
