import { ConsoleLogger } from './util/logger';

import { ExperimentUser } from './types/user';

/**
 * This class provides utility functions for parsing and handling identity
 * from Amplitude cookies.
 */
export class AmplitudeCookie {
  /**
   * @param amplitudeApiKey The Amplitude API Key
   * @param newFormat True if the cookie is in the Browser SDK 2.0 format
   * @returns The cookie name that Amplitude sets for the provided
   * Amplitude API Key
   */
  public static cookieName(amplitudeApiKey: string, newFormat = false): string {
    if (newFormat) {
      if (amplitudeApiKey?.length < 10) {
        throw Error('Invalid Amplitude API Key');
      } else {
        return 'AMP_' + amplitudeApiKey.substring(0, 10);
      }
    }
    if (amplitudeApiKey?.length < 6) {
      throw Error('Invalid Amplitude API Key');
    }
    return 'amp_' + amplitudeApiKey.substring(0, 6);
  }

  /**
   * @param amplitudeCookie A string from the amplitude cookie
   * @param newFormat True if the cookie is in the Browser SDK 2.0 format
   * @returns a ExperimentUser context containing a device_id and user_id
   * (if available)
   */
  public static parse(
    amplitudeCookie: string,
    newFormat = false,
  ): ExperimentUser {
    if (newFormat) {
      const decoding = Buffer.from(amplitudeCookie, 'base64').toString('utf-8');
      try {
        const userSession = JSON.parse(decodeURIComponent(decoding));
        return {
          device_id: userSession.deviceId,
          user_id: userSession.userId,
        };
      } catch (e) {
        const logger = new ConsoleLogger(true);
        logger.error(`Error parsing the Amplitude cookie: ${e.message}`);
        return {};
      }
    }
    const values = amplitudeCookie.split('.');
    let user_id = undefined;
    if (values[1]) {
      try {
        user_id = Buffer.from(values[1], 'base64').toString('utf-8');
      } catch (e) {
        user_id = undefined;
      }
    }
    return {
      device_id: values[0],
      user_id,
    };
  }

  /**
   * Generates a cookie string to set for the Amplitude Javascript SDK
   * @param deviceId A device id to set
   * @param newFormat True if the cookie is in the Browser SDK 2.0 format
   * @returns A cookie string to set for the Amplitude Javascript SDK to read
   */
  public static generate(deviceId: string, newFormat = false): string {
    if (!newFormat) {
      return deviceId + '..........';
    }

    const userSessionHash = {
      deviceId: deviceId,
    };

    const json_data = JSON.stringify(userSessionHash);
    const encoded_json = encodeURIComponent(json_data);
    const base64Encoded = Buffer.from(encoded_json).toString('base64');

    return base64Encoded;
  }
}
