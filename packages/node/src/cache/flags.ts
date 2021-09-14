import { FlagCache } from 'src/types/cache';

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
