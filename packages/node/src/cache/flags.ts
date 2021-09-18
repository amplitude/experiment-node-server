import { FlagConfigCache, FlagConfig } from 'src/types/cache';

export class DefaultFlagConfigCache implements FlagConfigCache {
  private cache: Record<string, FlagConfig> = {};

  get(flagKeys?: string[]): Promise<Record<string, FlagConfig>> {
    if (!flagKeys) {
      return Promise.resolve({ ...this.cache });
    }
    const result: Record<string, FlagConfig> = {};
    for (const key in flagKeys) {
      const flag = this.cache[key];
      if (flag) {
        result[key] = flag;
      }
    }
    return Promise.resolve(result);
  }

  put(flags: Record<string, FlagConfig>): void {
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
