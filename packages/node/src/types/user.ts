/**
 * Defines a user context for evaluation.
 * `device_id` and `user_id` are used for identity resolution.
 * All other predefined fields and user properties are used for
 * rule based user targeting.
 * @category Types
 */
export type ExperimentUser = {
  /**
   * Device ID for associating with an identity in Amplitude
   */
  device_id?: string;

  /**
   * User ID for associating with an identity in Amplitude
   */
  user_id?: string;

  /**
   * Predefined field, must be manually provided
   */
  country?: string;

  /**
   * Predefined field, must be manually provided
   */
  city?: string;

  /**
   * Predefined field, must be manually provided
   */
  region?: string;

  /**
   * Predefined field, must be manually provided
   */
  dma?: string;

  /**
   * Predefined field, must be manually provided
   */
  language?: string;

  /**
   * Predefined field, must be manually provided
   */
  platform?: string;

  /**
   * Predefined field, must be manually provided
   */
  version?: string;

  /**
   * Predefined field, must be manually provided
   */
  os?: string;

  /**
   * Predefined field, must be manually provided
   */
  device_manufacturer?: string;

  /**
   * Predefined field, must be manually provided
   */
  device_brand?: string;

  /**
   * Predefined field, must be manually provided
   */
  device_model?: string;

  /**
   * Predefined field, must be manually provided
   */
  carrier?: string;

  /**
   * Predefined field, auto populated, can be manually overridden
   */
  library?: string;

  /**
   * Predefined field, must be manually provided
   */
  ip_address?: string;

  /**
   * Custom user properties
   */
  user_properties?: {
    [propertyName: string]:
      | string
      | number
      | boolean
      | Array<string | number | boolean>;
  };

  groups?: {
    [groupType: string]: string[];
  };

  group_properties?: {
    [groupType: string]: {
      [groupName: string]: {
        [propertyName: string]:
          | string
          | number
          | boolean
          | Array<string | number | boolean>;
      };
    };
  };
};
