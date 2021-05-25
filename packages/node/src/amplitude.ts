import { ExperimentUser } from './types/user';
import { base64Decode } from './util/encode';

/**
 * This class provides utility functions for parsing and handling identity
 * from Amplitude cookies.
 */
export class AmplitudeCookie {
  /**
   * @param amplitudeApiKey The Amplitude API Key
   * @returns The cookie name that Amplitude sets for the provided
   * Amplitude API Key
   */
  public static cookieName(amplitudeApiKey: string): string {
    if (amplitudeApiKey?.length < 6) {
      throw Error('Invalid Amplitude API Key');
    }
    return 'amp_' + amplitudeApiKey.substring(0, 6);
  }

  /**
   * @param amplitudeCookie A string from the amplitude cookie
   * @returns a ExperimentUser context containing a device_id and user_id
   * (if available)
   */
  public static parse(amplitudeCookie: string): ExperimentUser {
    const values = amplitudeCookie.split('.');
    let user_id = undefined;
    if (values[1]) {
      try {
        user_id = base64Decode(values[1]);
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
   * @returns A cookie string to set for the Amplitude Javascript SDK to read
   */
  public static generate(deviceId: string): string {
    return deviceId + '..........';
  }
}
