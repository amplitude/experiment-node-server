export type EvaluationVariant = {
  key: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: any;
};

export type FlagResult = {
  variant: EvaluationVariant;
};

export type EvaluationResult = Record<string, FlagResult>;
