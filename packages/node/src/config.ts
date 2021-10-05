import { FlagConfig } from './types/flag';

/**
 * @category Configuration
 */
export type ExperimentConfig = {
  /**
   * Set to true to log some extra information to the console.
   */
  debug?: boolean;

  /**
   * The server endpoint from which to request variants.
   */
  serverUrl?: string;

  /**
   * The request timeout, in milliseconds, used when fetching variants triggered by calling start() or setUser().
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
};

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

 *
 * @category Configuration
 */
export const Defaults: ExperimentConfig = {
  debug: false,
  serverUrl: 'https://api.lab.amplitude.com',
  fetchTimeoutMillis: 10000,
  fetchRetries: 8,
  fetchRetryBackoffMinMillis: 500,
  fetchRetryBackoffMaxMillis: 10000,
  fetchRetryBackoffScalar: 1.5,
  fetchRetryTimeoutMillis: 10000,
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
   * The server endpoint from which to request variants.
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
};

/**
 Defaults for {@link LocalEvaluationConfig} options.

 | **Option**       | **Default**                       |
 |----------------|---------------------------------|
 | **debug**        | false                           |
 | **serverUrl**    | `"https://api.lab.amplitude.com"` |
 | **flagConfigPollingIntervalMillis**    | `30000` |

 * @category Configuration
 */
export const LocalEvaluationDefaults: LocalEvaluationConfig = {
  debug: false,
  serverUrl: 'https://api.lab.amplitude.com',
  bootstrap: {},
  flagConfigPollingIntervalMillis: 30000,
};
