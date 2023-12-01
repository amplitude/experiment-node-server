import { EvaluationVariant } from '@amplitude/experiment-core';

import { Variant, Variants } from '../types/variant';

export const filterDefaultVariants = (
  variants: Record<string, Variant>,
): Record<string, Variant> => {
  const results = {};
  for (const flagKey in variants) {
    const variant = variants[flagKey];
    const isDefault = variant?.metadata?.default;
    const isDeployed = variant?.metadata?.deployed || true;
    if (!isDefault && isDeployed) {
      results[flagKey] = variant;
    }
  }
  return results;
};

export const evaluationVariantToVariant = (
  evaluationVariant: EvaluationVariant,
): Variant => {
  let stringValue: string | undefined;
  if (typeof evaluationVariant.value === 'string') {
    stringValue = evaluationVariant.value;
  } else if (
    evaluationVariant.value !== null &&
    evaluationVariant.value !== undefined
  ) {
    stringValue = JSON.stringify(evaluationVariant.value);
  }
  return {
    ...evaluationVariant,
    value: stringValue,
  };
};

export const evaluationVariantsToVariants = (
  evaluationVariants: Record<string, EvaluationVariant>,
): Variants => {
  const variants: Variants = {};
  Object.keys(evaluationVariants).forEach((key) => {
    variants[key] = evaluationVariantToVariant(evaluationVariants[key]);
  });
  return variants;
};
