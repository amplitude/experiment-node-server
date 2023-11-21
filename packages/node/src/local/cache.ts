import { FlagConfigCache, FlagConfig } from '../types/flag';

export class InMemoryFlagConfigCache implements FlagConfigCache {
  private readonly store: FlagConfigCache | undefined;
  private cache: Record<string, FlagConfig>;

  public constructor(
    store?: FlagConfigCache,
    flagConfigs: Record<string, FlagConfig> = {},
  ) {
    this.store = store;
    this.cache = flagConfigs;
  }

  public getAllCached(): Record<string, FlagConfig> {
    return { ...this.cache };
  }

  public async get(flagKey: string): Promise<FlagConfig> {
    return this.cache[flagKey];
  }
  public async getAll(): Promise<Record<string, FlagConfig>> {
    return { ...this.cache };
  }
  public async put(flagKey: string, flagConfig: FlagConfig): Promise<void> {
    this.cache[flagKey] = flagConfig;
    await this.store?.put(flagKey, flagConfig);
  }
  public async putAll(flagConfigs: Record<string, FlagConfig>): Promise<void> {
    for (const key in flagConfigs) {
      const flag = flagConfigs[key];
      if (flag) {
        this.cache[key] = flag;
      }
    }
    await this.store?.putAll(flagConfigs);
  }
  public async delete(flagKey: string): Promise<void> {
    delete this.cache[flagKey];
    await this.store?.delete(flagKey);
  }
  public async clear(): Promise<void> {
    this.cache = {};
    await this.store?.clear();
  }
}
