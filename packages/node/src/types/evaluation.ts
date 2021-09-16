/**
 * Internal member for parsing variants as a result of evaluation.
 *
 * Evaluation engine uses legacy 'key' rather than 'value' to identify the
 * variant.
 *
 * TODO: Make evaluation engine respond with 'value' rather than 'key'.
 */
export type EvaluationVariant = {
  key: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload?: any;
};

export type FlagResult = {
  variant: EvaluationVariant;
};

export type EvaluationResult = Record<string, FlagResult>;

/**
 * Used more for code clarity than functionality.
 */
export type FlagConfig = Record<string, unknown>;
