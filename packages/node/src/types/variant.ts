/**
 * @category Types
 */
export type Variant = {
  /**
   * The value of the variant determined by the flag configuration
   */
  value: string;

  /**
   * The attached payload, if any
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload?: any;
};

/**
 * @category Types
 */
export type Variants = {
  [flagKey: string]: Variant;
};

export type FlagResult = {
  value: string;
  payload: string;
  description: string;
  isDefaultVariant: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  expKey: string | null | undefined;
  deployed: boolean;
  type: string;
};

export type Results = {
  [flagKey: string]: FlagResult;
};
