export type EvaluationVariant = {
  key: string;
  payload: any;
};

export type FlagResult = {
  variant: EvaluationVariant;
};

export type EvaluationResult = Record<string, FlagResult>;
