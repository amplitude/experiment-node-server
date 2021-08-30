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

  /**
   * Enable local evaluation in the experiment client. Set this to true to
   * poll for rules and use evaluate() to evaluate variants for a user locally.
   *
   * Default: false
   */
  enableLocalEvaluation?: boolean;

  /**
   * The interval in milliseconds to poll the amplitude server for flag config
   * rules updates. These rules stored in memory and used when calling
   * evaluate() to perform local evaluation.
   *
   * This value does nothing unless enableLocalEvaluation is set to true.
   *
   * Default: 30000 (30 seconds)
   */
  rulesPollingInterval?: number;
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
 | **enableLocalEvaluation**    | `false` |
 | **rulesPollingInterval**    | `30000` |

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
  enableLocalEvaluation: false,
  rulesPollingInterval: 30000,
};
