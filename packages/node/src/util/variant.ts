import { Variant } from '../types/variant';

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
