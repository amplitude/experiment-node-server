/**
 * Used to store flag configs in-memory and share the configs between multiple
 * clients which use the same environment key.
 */
export interface FlagCache {
  /**
   * Access flag configs from the cache. If the {@link flagKeys} argument is
   * empty, this function will return the entire cache.
   *
   * @param flagKeys the keys for the flags to access from the cache. If empty,
   * the entire cache will be returned.
   */
  get(flagKeys?: string[]): Record<string, string>;

  /**
   * Put flag configs into the cache. Existing configs for a flag key will be
   * overwritten.
   *
   * @param flags the flag configs to put in the cache.
   */
  put(flags: Record<string, string>): void;

  /**
   * Clear the cache.
   */
  clear(): void;
}

export class DefaultFlagCache implements FlagCache {
  private cache: Record<string, string> = {};

  get(flagKeys?: string[]): Record<string, string> {
    if (!flagKeys) {
      return { ...this.cache };
    }
    const result: Record<string, string> = {};
    for (const key in flagKeys) {
      const flag = this.cache[key];
      if (flag) {
        result[key] = flag;
      }
    }
    return result;
  }

  put(flags: Record<string, string>): void {
    for (const key in flags) {
      const flag = flags[key];
      if (flag) {
        this.cache[key] = flag;
      }
    }
  }

  clear(): void {
    this.cache = {};
  }
}
