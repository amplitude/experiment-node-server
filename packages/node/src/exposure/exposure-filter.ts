import { Cache } from '../util/cache';

import { Exposure, ExposureFilter } from './exposure';
import { DAY_MILLIS } from './exposure-service';

export class InMemoryExposureFilter implements ExposureFilter {
  public ttlMillis: number;
  private readonly cache: Cache<number>;

  constructor(size: number, ttlMillis: number = DAY_MILLIS) {
    this.ttlMillis = ttlMillis;
    this.cache = new Cache<number>(size, ttlMillis);
  }

  public shouldTrack(exposure: Exposure): boolean {
    if (Object.keys(exposure.results).length === 0) {
      // Don't track empty exposures.
      return false;
    }
    const canonicalExposure = exposure.canonicalize();
    const track = this.cache.get(canonicalExposure) == undefined;
    if (track) {
      this.cache.put(canonicalExposure, 0);
    }
    return track;
  }
}
