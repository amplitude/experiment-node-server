import { BaseEvent, CoreClient } from '@amplitude/analytics-types';
import { EvaluationVariant } from '@amplitude/experiment-core';
import { ExperimentUser } from 'src/types/user';
import { hashCode } from 'src/util/hash';

import { Exposure, ExposureFilter, ExposureService } from './exposure';

export const DAY_MILLIS = 24 * 60 * 60 * 1000;
export const FLAG_TYPE_MUTUAL_EXCLUSION_GROUP = 'mutual-exclusion-group';

export class AmplitudeExposureService implements ExposureService {
  private readonly amplitude: CoreClient;
  private readonly exposureFilter: ExposureFilter;

  constructor(amplitude: CoreClient, exposureFilter: ExposureFilter) {
    this.amplitude = amplitude;
    this.exposureFilter = exposureFilter;
  }

  async track(exposure: Exposure): Promise<void> {
    if (this.exposureFilter.shouldTrack(exposure)) {
      toExposureEvents(exposure, this.exposureFilter.ttlMillis).forEach(
        (event) => {
          this.amplitude.logEvent(event);
        },
      );
    }
  }
}

export const toExposureEvents = (
  exposure: Exposure,
  ttlMillis: number,
): BaseEvent[] => {
  const events: BaseEvent[] = [];
  const canonicalExposure = exposure.canonicalize();
  for (const flagKey in exposure.results) {
    const variant = exposure.results[flagKey];

    const trackExposure = (variant?.metadata?.trackExposure as boolean) ?? true;
    if (!trackExposure) {
      continue;
    }

    const flagType = variant.metadata?.flagType;
    const isDefault: boolean = variant.metadata?.default as boolean;
    if (isDefault) {
      continue;
    }

    // Determine user properties to set and unset.
    const set = {};
    const unset = {};
    if (flagType != FLAG_TYPE_MUTUAL_EXCLUSION_GROUP) {
      if (variant.key) {
        set[`[Experiment] ${flagKey}`] = variant.key;
      } else if (variant.value) {
        set[`[Experiment] ${flagKey}`] = variant.value;
      }
    }

    // Build event properties.
    const eventProperties = {};
    eventProperties['[Experiment] Flag Key'] = flagKey;
    if (variant.key) {
      eventProperties['[Experiment] Variant'] = variant.key;
    } else if (variant.value) {
      eventProperties['[Experiment] Variant'] = variant.value;
    }
    if (variant.metadata) {
      eventProperties['metadata'] = variant.metadata;
    }

    // Build event.
    const event: BaseEvent = {
      event_type: '[Experiment] Exposure',
      user_id: exposure.user.user_id,
      device_id: exposure.user.device_id,
      event_properties: eventProperties,
      user_properties: {
        $set: set,
        $unset: unset,
      },
      insert_id: `${exposure.user.user_id} ${
        exposure.user.device_id
      } ${hashCode(flagKey + ' ' + canonicalExposure)} ${Math.floor(
        exposure.timestamp / ttlMillis,
      )}`,
    };
    if (exposure.user.groups) {
      event.groups = exposure.user.groups;
    }

    events.push(event);
  }

  return events;
};
