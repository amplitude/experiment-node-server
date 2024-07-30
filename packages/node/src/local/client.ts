import * as amplitude from '@amplitude/analytics-node';
import {
  EvaluationEngine,
  EvaluationFlag,
  topologicalSort,
} from '@amplitude/experiment-core';
import EventSource from 'eventsource';

import { Assignment, AssignmentService } from '../assignment/assignment';
import { InMemoryAssignmentFilter } from '../assignment/assignment-filter';
import { AmplitudeAssignmentService } from '../assignment/assignment-service';
import { FetchHttpClient } from '../transport/http';
import { StreamEventSourceFactory } from '../transport/stream';
import { USER_GROUP_TYPE } from '../types/cohort';
import {
  AssignmentConfig,
  AssignmentConfigDefaults,
  LocalEvaluationConfig,
} from '../types/config';
import { FlagConfigCache } from '../types/flag';
import { HttpClient } from '../types/transport';
import { ExperimentUser } from '../types/user';
import { Variant, Variants } from '../types/variant';
import { CohortUtils } from '../util/cohort';
import { populateLocalConfigDefaults } from '../util/config';
import { ConsoleLogger } from '../util/logger';
import { Logger } from '../util/logger';
import { convertUserToEvaluationContext } from '../util/user';
import {
  evaluationVariantsToVariants,
  filterDefaultVariants,
} from '../util/variant';

import { InMemoryFlagConfigCache } from './cache';
import { CohortFetcher } from './cohort/fetcher';
import { CohortPoller } from './cohort/poller';
import { InMemoryCohortStorage } from './cohort/storage';
import { CohortUpdater } from './cohort/updater';
import { FlagConfigFetcher } from './fetcher';
import { FlagConfigPoller } from './poller';
import { FlagConfigStreamer } from './streamer';
import { FlagConfigUpdater } from './updater';

const STREAM_RETRY_DELAY_MILLIS = 15000; // The base delay to retry stream after fallback to poller.
const STREAM_RETRY_JITTER_MAX_MILLIS = 2000; // The jitter to add to delay after fallbacked to poller.
const STREAM_ATTEMPTS = 1; // Number of attempts before fallback to poller.
const STREAM_TRY_DELAY_MILLIS = 1000; // The delay between attempts.

/**
 * Experiment client for evaluating variants for a user locally.
 * @category Core Usage
 */
export class LocalEvaluationClient {
  private readonly logger: Logger;
  protected readonly config: LocalEvaluationConfig;
  private readonly updater: FlagConfigUpdater;
  private readonly assignmentService: AssignmentService;
  private readonly evaluation: EvaluationEngine;
  private readonly cohortUpdater?: CohortUpdater;

  /**
   * Directly access the client's flag config cache.
   *
   * Used for directly manipulating the flag configs used for evaluation.
   */
  public readonly cache: InMemoryFlagConfigCache;
  public readonly cohortStorage: InMemoryCohortStorage;

  constructor(
    apiKey: string,
    config?: LocalEvaluationConfig,
    flagConfigCache?: FlagConfigCache,
    httpClient: HttpClient = new FetchHttpClient(config?.httpAgent),
    streamEventSourceFactory: StreamEventSourceFactory = (url, params) =>
      new EventSource(url, params),
  ) {
    this.config = populateLocalConfigDefaults(config);
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

    this.cohortStorage = new InMemoryCohortStorage();
    let cohortFetcher = undefined;
    if (this.config.cohortConfig) {
      cohortFetcher = new CohortFetcher(
        this.config.cohortConfig.apiKey,
        this.config.cohortConfig.secretKey,
        httpClient,
        this.config.cohortConfig?.cohortServerUrl,
        this.config.cohortConfig?.maxCohortSize,
        this.config.debug,
      );
      this.cohortUpdater = new CohortPoller(
        cohortFetcher,
        this.cohortStorage,
        60000,
        this.config.debug,
      );
    }

    const flagsPoller = new FlagConfigPoller(
      fetcher,
      this.cache,
      this.cohortStorage,
      cohortFetcher,
      this.config.flagConfigPollingIntervalMillis,
      this.config.debug,
    );
    this.updater = this.config.streamUpdates
      ? new FlagConfigStreamer(
          apiKey,
          flagsPoller,
          this.cache,
          streamEventSourceFactory,
          this.config.streamFlagConnTimeoutMillis,
          STREAM_ATTEMPTS,
          STREAM_TRY_DELAY_MILLIS,
          STREAM_RETRY_DELAY_MILLIS +
            Math.floor(Math.random() * STREAM_RETRY_JITTER_MAX_MILLIS),
          this.config.streamServerUrl,
          this.cohortStorage,
          cohortFetcher,
          this.config.debug,
        )
      : flagsPoller;

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
    this.enrichUserWithCohorts(user, flags);
    this.logger.debug('[Experiment] evaluate - user:', user, 'flags:', flags);
    const context = convertUserToEvaluationContext(user);
    const sortedFlags = topologicalSort(flags, flagKeys);
    const results = this.evaluation.evaluate(context, sortedFlags);
    void this.assignmentService?.track(new Assignment(user, results));
    this.logger.debug('[Experiment] evaluate - variants: ', results);
    return evaluationVariantsToVariants(results);
  }

  protected enrichUserWithCohorts(
    user: ExperimentUser,
    flags: Record<string, EvaluationFlag>,
  ): void {
    const cohortIdsByGroup = CohortUtils.extractCohortIdsByGroup(flags);

    // Enrich cohorts with user group type.
    const userCohortIds = cohortIdsByGroup[USER_GROUP_TYPE];
    if (user.user_id && userCohortIds && userCohortIds.size != 0) {
      user.cohort_ids = Array.from(
        this.cohortStorage.getCohortsForUser(user.user_id, userCohortIds),
      );
    }

    // Enrich other group types for this user.
    if (user.groups) {
      for (const groupType in user.groups) {
        const groupNames = user.groups[groupType];
        if (groupNames.length == 0) {
          continue;
        }
        const groupName = groupNames[0];

        const cohortIds = cohortIdsByGroup[groupType];
        if (!cohortIds || cohortIds.size == 0) {
          continue;
        }

        if (!user.group_cohort_ids) {
          user.group_cohort_ids = {};
        }
        if (!(groupType in user.group_cohort_ids)) {
          user.group_cohort_ids[groupType] = {};
        }
        user.group_cohort_ids[groupType][groupName] = Array.from(
          this.cohortStorage.getCohortsForGroup(
            groupType,
            groupName,
            cohortIds,
          ),
        );
      }
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
    await this.updater.start();
    await this.cohortUpdater?.start();
  }

  /**
   * Stop polling for flag configurations.
   *
   * Calling this function while the poller is not running will do nothing.
   */
  public stop(): void {
    this.updater.stop();
    this.cohortUpdater?.stop();
  }
}
