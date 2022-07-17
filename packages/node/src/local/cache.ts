import { FlagConfigCache, FlagConfig } from '../types/flag';

export class InMemoryFlagConfigCache implements FlagConfigCache {
  private cache: Record<string, FlagConfig> = {};

  public constructor(flagConfigs: Record<string, FlagConfig> = {}) {
    this.cache = flagConfigs;
  }
  public async get(flagKey: string): Promise<FlagConfig> {
    return this.cache[flagKey];
  }
  public async getAll(): Promise<Record<string, FlagConfig>> {
    return { ...this.cache };
  }
  public async put(flagKey: string, flagConfig: FlagConfig): Promise<void> {
    this.cache[flagKey] = flagConfig;
  }
  public async putAll(flagConfigs: Record<string, FlagConfig>): Promise<void> {
    for (const key in flagConfigs) {
      const flag = flagConfigs[key];
      if (flag) {
        this.cache[key] = flag;
      }
    }
  }
  public async delete(flagKey: string): Promise<void> {
    delete this.cache[flagKey];
  }
  public async clear(): Promise<void> {
    this.cache = {};
  }
}
