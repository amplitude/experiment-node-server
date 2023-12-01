/**
 * @category Types
 */
export type Variant = {
  /**
   * The key of the variant.
   */
  key?: string;
  /**
   * The value of the variant.
   */
  value?: string;

  /**
   * The attached payload, if any.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload?: any;

  /**
   * Flag, segment, and variant metadata produced as a result of
   * evaluation for the user. Used for system purposes.
   */
  metadata?: Record<string, unknown>;
};

/**
 * @category Types
 */
export type Variants = {
  [flagKey: string]: Variant;
};
