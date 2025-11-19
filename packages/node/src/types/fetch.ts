/**
 * Options to modify the behavior of a remote evaluation fetch request.
 */
export type FetchOptions = {
  /**
   * Specific flag keys to evaluate and set variants for.
   */
  flagKeys?: string[];

  /**
   * Whether to track exposure events for the request.
   * If not provided, the default is not to track exposure events.
   */
  tracksExposure?: boolean;

  /**
   * Whether to track assignment events for the request.
   * If not provided, the default is to track assignment events.
   */
  tracksAssignment?: boolean;
};
