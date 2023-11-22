import * as amplitude from '@amplitude/analytics-node';
import {
  EvaluationEngine,
  EvaluationFlag,
  topologicalSort,
} from '@amplitude/experiment-core';

import { Assignment, AssignmentService } from '../assignment/assignment';
import { InMemoryAssignmentFilter } from '../assignment/assignment-filter';
import { AmplitudeAssignmentService } from '../assignment/assignment-service';
import { FetchHttpClient } from '../transport/http';
import {
  AssignmentConfig,
  AssignmentConfigDefaults,
  LocalEvaluationConfig,
  LocalEvaluationDefaults,
} from '../types/config';
import { FlagConfigCache } from '../types/flag';
import { HttpClient } from '../types/transport';
import { ExperimentUser } from '../types/user';
import { Variant, Variants } from '../types/variant';
import { ConsoleLogger } from '../util/logger';
import { Logger } from '../util/logger';
import { convertUserToEvaluationContext } from '../util/user';
import { filterDefaultVariants } from '../util/variant';

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
  private readonly assignmentService: AssignmentService;
  private readonly evaluation: EvaluationEngine;

  /**
   * Directly access the client's flag config cache.
   *
   * Used for directly manipulating the flag configs used for evaluation.
   */
  public readonly cache: InMemoryFlagConfigCache;

  constructor(
    apiKey: string,
    config: LocalEvaluationConfig,
    flagConfigCache?: FlagConfigCache,
    httpClient: HttpClient = new FetchHttpClient(config?.httpAgent),
  ) {
    this.config = { ...LocalEvaluationDefaults, ...config };
    const fetcher = new FlagConfigFetcher(
      apiKey,
      httpClient,
      this.config.serverUrl,
      this.config.debug,
    );
    this.cache = new InMemoryFlagConfigCache(
      flagConfigCache,
      this.config.bootstrap,
    );
    this.logger = new ConsoleLogger(this.config.debug);
    this.poller = new FlagConfigPoller(
      fetcher,
      this.cache,
      this.config.flagConfigPollingIntervalMillis,
      this.config.debug,
    );
    if (this.config.assignmentConfig) {
      this.config.assignmentConfig = {
        ...AssignmentConfigDefaults,
        ...this.config.assignmentConfig,
      };
      this.assignmentService = this.createAssignmentService(
        this.config.assignmentConfig,
      );
    }
    this.evaluation = new EvaluationEngine();
  }

  private createAssignmentService(
    assignmentConfig: AssignmentConfig,
  ): AssignmentService {
    const instance = amplitude.createInstance();
    const { apiKey, cacheCapacity, ...ampConfig } = assignmentConfig;
    instance.init(apiKey, ampConfig);
    return new AmplitudeAssignmentService(
      instance,
      new InMemoryAssignmentFilter(cacheCapacity),
    );
  }

  /**
   * Locally evaluate varints for a user.
   *
   * This function will only evaluate flags for the keys specified in the
   * {@link flagKeys} argument. If {@link flagKeys} is missing, all flags in the
   * {@link FlagConfigCache} will be evaluated.
   *
   * Unlike {@link evaluate}, this function returns a default variant object
   * if the flag or experiment was evaluated, but the user was not assigned a
   * variant (i.e. 'off').
   *
   * @param user The user to evaluate
   * @param flagKeys The flags to evaluate with the user. If empty, all flags
   * from the flag cache are evaluated.
   * @returns The evaluated variants
   */
  public evaluateV2(
    user: ExperimentUser,
    flagKeys?: string[],
  ): Record<string, Variant> {
    const flags = this.cache.getAllCached() as Record<string, EvaluationFlag>;
    this.logger.debug('[Experiment] evaluate - user:', user, 'flags:', flags);
    const context = convertUserToEvaluationContext(user);
    const sortedFlags = topologicalSort(flags, flagKeys);
    const results = this.evaluation.evaluate(context, sortedFlags);
    void this.assignmentService?.track(new Assignment(user, results));
    this.logger.debug('[Experiment] evaluate - variants: ', results);
    return results as Record<string, Variant>;
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
   * @deprecated use evaluateV2 instead
   */
  public async evaluate(
    user: ExperimentUser,
    flagKeys?: string[],
  ): Promise<Variants> {
    const results = this.evaluateV2(user, flagKeys);
    return filterDefaultVariants(results);
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
