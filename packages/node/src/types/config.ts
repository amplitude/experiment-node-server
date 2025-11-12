import https from 'https';

import { NodeOptions } from '@amplitude/analytics-types';

import { FlagConfig } from './flag';

/**
 * @category Configuration
 */
export type RemoteEvaluationConfig = {
  /**
   * Set to true to log some extra information to the console.
   */
  debug?: boolean;

  /**
   * Instance names support difference singleton isntance configurations for the same api key.
   */
  instanceName?: string;

  /**
   * Select the Amplitude data center to get flags and variants from, `us` or `eu`.
   */
  serverZone?: string;

  /**
   * The server endpoint from which to request variants. For hitting the EU data center, use serverZone.
   * Setting this value will override serverZone defaults.
   */
  serverUrl?: string;

  /**
   * The request socket timeout, in milliseconds.
   */
  fetchTimeoutMillis?: number;

  /**
   * The number of retries to attempt before failing
   */
  fetchRetries?: number;

  /**
   * Retry backoff minimum (starting backoff delay) in milliseconds. The minimum backoff is scaled by
   * `fetchRetryBackoffScalar` after each retry failure.
   */
  fetchRetryBackoffMinMillis?: number;

  /**
   * Retry backoff maximum in milliseconds. If the scaled backoff is greater than the max, the max is
   * used for all subsequent retries.
   */
  fetchRetryBackoffMaxMillis?: number;

  /**
   * Scales the minimum backoff exponentially.
   */
  fetchRetryBackoffScalar?: number;

  /**
   * The request timeout for retrying fetch requests.
   */
  fetchRetryTimeoutMillis?: number;

  /**
   * The agent used to send http requests.
   */
  httpAgent?: https.Agent;
};

/**
 * @deprecated use {@link RemoteEvaluationConfig}
 */
export type ExperimentConfig = RemoteEvaluationConfig;

/**
 Defaults for Experiment Config options

 | **Option**       | **Default**                       |
 |----------------|---------------------------------|
 | **debug**        | false                           |
 | **serverUrl**    | `"https://api.lab.amplitude.com"` |
 | **fetchTimeoutMillis**    | `10000` |
 | **fetchRetries**    | `8` |
 | **fetchRetryBackoffMinMillis**    | `500` |
 | **fetchRetryBackoffMaxMillis**    | `10000` |
 | **fetchRetryBackoffScalar**    | `1.5` |
 | **fetchRetryTimeoutMillis**    | `10000` |
 | **httpAgent** | null |

 *
 * @category Configuration
 */
export const RemoteEvaluationDefaults: RemoteEvaluationConfig = {
  debug: false,
  instanceName: undefined,
  serverZone: 'us',
  serverUrl: 'https://api.lab.amplitude.com',
  fetchTimeoutMillis: 10000,
  fetchRetries: 8,
  fetchRetryBackoffMinMillis: 500,
  fetchRetryBackoffMaxMillis: 10000,
  fetchRetryBackoffScalar: 1.5,
  fetchRetryTimeoutMillis: 10000,
  httpAgent: null,
};

/**
 * @deprecated use {@link RemoteEvaluationDefaults}
 */
export const Defaults: ExperimentConfig = {
  debug: false,
  instanceName: undefined,
  serverZone: 'us',
  serverUrl: 'https://api.lab.amplitude.com',
  fetchTimeoutMillis: 10000,
  fetchRetries: 8,
  fetchRetryBackoffMinMillis: 500,
  fetchRetryBackoffMaxMillis: 10000,
  fetchRetryBackoffScalar: 1.5,
  fetchRetryTimeoutMillis: 10000,
  httpAgent: null,
};

/**
 * Configuration for the {@link LocalEvaluationClient}
 *
 * @category Configuration
 */
export type LocalEvaluationConfig = {
  /**
   * Set to true to log some extra information to the console.
   */
  debug?: boolean;

  /**
   * Instance names support difference singleton isntance configurations for the same api key.
   */
  instanceName?: string;

  /**
   * Select the Amplitude data center to get flags and variants from, `us` or `eu`.
   */
  serverZone?: 'us' | 'eu';

  /**
   * The server endpoint from which to request flags. For hitting the EU data center, use serverZone.
   * Setting this value will override serverZone defaults.
   */
  serverUrl?: string;

  /**
   * Bootstrap the client with a pre-fetched flag configurations.
   *
   * Useful if you are managing the flag configurations separately.
   */
  bootstrap?: Record<string, FlagConfig>;

  /**
   * The interval in milliseconds to poll the amplitude server for flag config
   * updates. These rules stored in memory and used when calling evaluate() to
   * perform local evaluation.
   *
   * Default: 30000 (30 seconds)
   */
  flagConfigPollingIntervalMillis?: number;

  /**
   * The agent used to send http requests.
   */
  httpAgent?: https.Agent;

  /**
   * @deprecated use {@link exposureConfig} instead to track exposure events.
   * Configuration for automatically tracking assignment events after an
   * evaluation.
   */
  assignmentConfig?: AssignmentConfig;

  /**
   * Configuration for automatically tracking exposure events after an
   * evaluation.
   */
  exposureConfig?: ExposureConfig;

  /**
   * To use streaming API or polling. With streaming, flag config updates are
   * received immediately, no polling is necessary. If stream fails for any
   * reason, it will fallback to polling automatically.
   * Default will be false, using poller.
   */
  streamUpdates?: boolean;

  /**
   * The stream server endpoint from which to stream data.
   */
  streamServerUrl?: string;

  /**
   * To use with streaming. The timeout for a single attempt of establishing
   * a valid stream of flag configs.
   * The time starts at making request and ends when received the initial
   * flag configs.
   */
  streamFlagConnTimeoutMillis?: number;

  cohortSyncConfig?: CohortSyncConfig;
};

export type AssignmentConfig = {
  /**
   * The analytics API key and NOT the experiment deployment key
   */
  apiKey: string;
  /**
   * The maximum number of assignments stored in the assignment cache
   *
   * Default: 65536
   */
  cacheCapacity?: number;
} & NodeOptions;

export type ExposureConfig = {
  /**
   * The analytics API key and NOT the experiment deployment key
   */
  apiKey?: string;
  /**
   * The maximum number of exposures stored in the exposure cache
   */
  cacheCapacity?: number;
} & NodeOptions;

export type CohortSyncConfig = {
  apiKey: string;
  secretKey: string;

  /**
   * The cohort server endpoint from which to fetch cohort data. For hitting the EU data center, use serverZone.
   * Setting this value will override serverZone defaults.
   */
  cohortServerUrl?: string;

  /**
   * The max cohort size to be able to download. Any cohort larger than this
   * size will be skipped.
   */
  maxCohortSize?: number;

  /**
   * The interval in milliseconds to poll the amplitude server for cohort
   * updates. These cohorts stored in memory and used when calling evaluate() to
   * perform local evaluation.
   *
   * Default: 60000 (60 seconds)
   * Minimum: 60000
   */
  cohortPollingIntervalMillis?: number;
};

/**
 * @deprecated use {@link ExposureConfigDefaults} with exposure service instead.
 */
export const AssignmentConfigDefaults: Omit<AssignmentConfig, 'apiKey'> = {
  cacheCapacity: 65536,
};

export const ExposureConfigDefaults: ExposureConfig = {
  cacheCapacity: 65536,
};

export const CohortSyncConfigDefaults: Omit<
  CohortSyncConfig,
  'apiKey' | 'secretKey'
> = {
  cohortServerUrl: 'https://cohort-v2.lab.amplitude.com',
  maxCohortSize: 2147483647,
  cohortPollingIntervalMillis: 60000,
};

/**
 Defaults for {@link LocalEvaluationConfig} options.

 | **Option**       | **Default**                       |
 |----------------|---------------------------------|
 | **debug**        | false                           |
 | **serverUrl**    | `"https://api.lab.amplitude.com"` |
 | **flagConfigPollingIntervalMillis**    | `30000` |
 | **httpAgent** | null |

 * @category Configuration
 */
export const LocalEvaluationDefaults: LocalEvaluationConfig = {
  debug: false,
  serverZone: 'us',
  serverUrl: 'https://api.lab.amplitude.com',
  bootstrap: {},
  flagConfigPollingIntervalMillis: 30000,
  httpAgent: null,
  streamUpdates: false,
  streamServerUrl: 'https://stream.lab.amplitude.com',
  streamFlagConnTimeoutMillis: 1500,
  exposureConfig: ExposureConfigDefaults,
};

export const EU_SERVER_URLS = {
  name: 'eu',
  remote: 'https://api.lab.eu.amplitude.com',
  flags: 'https://flag.lab.eu.amplitude.com',
  stream: 'https://stream.lab.eu.amplitude.com',
  cohort: 'https://cohort-v2.lab.eu.amplitude.com',
};
