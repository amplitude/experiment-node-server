/**
 * @category Configuration
 */
export type SkylabConfig = {
  /**
   * Set to true to log some extra information to the console.
   */
  debug?: boolean;

  /**
   * The instance name for the SkylabClient. Instance names are case _sensitive_.
   */
  instanceName?: string;

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
 Defaults for Skylab Config options

 | **Option**       | **Default**                       |
 |----------------|---------------------------------|
 | **debug**        | false                           |
 | **instanceName** | `"$default_instance"`             |
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
export const Defaults: SkylabConfig = {
  debug: false,
  instanceName: '$default_instance',
  serverUrl: 'https://api.lab.amplitude.com',
  fetchTimeoutMillis: 10000,
  fetchRetries: 8,
  fetchRetryBackoffMinMillis: 500,
  fetchRetryBackoffMaxMillis: 10000,
  fetchRetryBackoffScalar: 1.5,
  fetchRetryTimeoutMillis: 10000,
};
