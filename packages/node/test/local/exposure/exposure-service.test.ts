import * as amplitude from '@amplitude/analytics-node';
import { Exposure, ExposureFilter } from 'src/exposure/exposure';
import {
  AmplitudeExposureService,
  DAY_MILLIS,
  FLAG_TYPE_MUTUAL_EXCLUSION_GROUP,
  toExposureEvents,
} from 'src/exposure/exposure-service';
import { ExperimentUser } from 'src/types/user';
import { hashCode } from 'src/util/hash';

const testFilter: ExposureFilter = {
  ttlMillis: DAY_MILLIS,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  shouldTrack(exposure: Exposure): boolean {
    return true;
  },
};

const instance = amplitude.createInstance();
const service = new AmplitudeExposureService(instance, testFilter);
test('exposure to event as expected', async () => {
  const user: ExperimentUser = { user_id: 'user', device_id: 'device' };
  const results = {
    basic: {
      key: 'control',
      value: 'control',
      metadata: {
        segmentName: 'All Other Users',
        flagType: 'experiment',
        flagVersion: 10,
        default: false,
      },
    },
    different_value: {
      key: 'on',
      value: 'control',
      metadata: {
        segmentName: 'All Other Users',
        flagType: 'experiment',
        flagVersion: 10,
        default: false,
      },
    },
    default: {
      key: 'off',
      metadata: {
        segmentName: 'All Other Users',
        flagType: 'experiment',
        flagVersion: 10,
        default: true,
      },
    },
    mutex: {
      key: 'slot-1',
      value: 'slot-1',
      metadata: {
        segmentName: 'All Other Users',
        flagType: 'mutual-exclusion-group',
        flagVersion: 10,
        default: false,
      },
    },
    holdout: {
      key: 'holdout',
      value: 'holdout',
      metadata: {
        segmentName: 'All Other Users',
        flagType: 'holdout-group',
        flagVersion: 10,
        default: false,
      },
    },
    partial_metadata: {
      key: 'on',
      value: 'on',
      metadata: {
        segmentName: 'All Other Users',
        flagType: 'release',
      },
    },
    empty_metadata: {
      key: 'on',
      value: 'on',
    },
    empty_variant: {},
  };
  const exposure = new Exposure(user, results);
  const events = toExposureEvents(exposure, DAY_MILLIS);
  expect(events.length).toEqual(7); // Excludes default exposure.
  for (const event of events) {
    expect(event.user_id).toEqual(user.user_id);
    expect(event.device_id).toEqual(user.device_id);
    expect(event.event_type).toEqual('[Experiment] Exposure');

    const userProperties = event.user_properties;
    const eventProperties = event.event_properties;

    // Event Properties
    const flagKey = eventProperties['[Experiment] Flag Key'];
    expect(results[flagKey]).toBeDefined();
    expect(eventProperties['[Experiment] Variant']).toEqual(
      results[flagKey].key,
    );
    expect(eventProperties['metadata']).toEqual(results[flagKey].metadata);

    // User Properties
    if (
      results[flagKey].metadata?.flagType === FLAG_TYPE_MUTUAL_EXCLUSION_GROUP
    ) {
      expect(userProperties['$set']).toEqual({});
      expect(userProperties['$unset']).toEqual({});
    } else {
      if (results[flagKey].metadata?.default) {
        expect(userProperties['$set']).toEqual({});
        expect(userProperties['$unset']).toEqual({
          [`[Experiment] ${flagKey}`]: '-',
        });
      } else {
        expect(userProperties['$set']).toEqual({
          [`[Experiment] ${flagKey}`]: results[flagKey].key,
        });
        expect(userProperties['$unset']).toEqual({});
      }
    }

    const canonicalization =
      'user device basic control default off different_value on empty_metadata on holdout holdout mutex slot-1 partial_metadata on ';
    const expected = `user device ${hashCode(
      flagKey + ' ' + canonicalization,
    )} ${Math.floor(exposure.timestamp / DAY_MILLIS)}`;
    expect(event.insert_id).toEqual(expected);
  }
});

test('user_properties from ExperimentUser are forwarded to exposure event', async () => {
  const user: ExperimentUser = {
    user_id: 'user',
    device_id: 'device',
    user_properties: { anonymous: true, plan: 'premium' },
  };
  const results = {
    my_flag: {
      key: 'treatment',
      value: 'treatment',
      metadata: {
        segmentName: 'All Other Users',
        flagType: 'experiment',
        flagVersion: 1,
        default: false,
      },
    },
  };
  const exposure = new Exposure(user, results);
  const events = toExposureEvents(exposure, DAY_MILLIS);

  expect(events.length).toEqual(1);
  const event = events[0];

  // Verify custom user_properties are included in $set
  expect(event.user_properties['$set']).toEqual({
    anonymous: true,
    plan: 'premium',
    '[Experiment] my_flag': 'treatment',
  });
});

test('tracking called', async () => {
  const logEventMock = jest.spyOn(instance, 'logEvent');
  await service.track(
    new Exposure(
      {},
      {
        basic: {
          key: 'control',
          value: 'control',
        },
        different_value: {
          key: 'on',
          value: 'control',
        },
      },
    ),
  );
  expect(logEventMock).toHaveBeenCalledTimes(2);
});
