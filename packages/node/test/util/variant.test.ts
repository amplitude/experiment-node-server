import { EvaluationVariant } from '@amplitude/experiment-core';
import {
  evaluationVariantsToVariants,
  evaluationVariantToVariant,
} from 'src/util/variant';

describe('evaluation variant to variant with typed values', () => {
  test('string value', () => {
    const evaluationVariant: EvaluationVariant = {
      key: 'on',
      value: 'test',
    };
    const variant = evaluationVariantToVariant(evaluationVariant);
    expect(variant.key).toEqual('on');
    expect(variant.value).toEqual('test');
  });
  test('boolean value', () => {
    const evaluationVariant: EvaluationVariant = {
      key: 'on',
      value: true,
    };
    const variant = evaluationVariantToVariant(evaluationVariant);
    expect(variant.key).toEqual('on');
    expect(variant.value).toEqual('true');
  });
  test('number value', () => {
    const evaluationVariant: EvaluationVariant = {
      key: 'on',
      value: 1.2,
    };
    const variant = evaluationVariantToVariant(evaluationVariant);
    expect(variant.key).toEqual('on');
    expect(variant.value).toEqual('1.2');
  });
  test('array value', () => {
    const evaluationVariant: EvaluationVariant = {
      key: 'on',
      value: [1, 2, 3],
    };
    const variant = evaluationVariantToVariant(evaluationVariant);
    expect(variant.key).toEqual('on');
    expect(variant.value).toEqual('[1,2,3]');
  });
  test('object value', () => {
    const evaluationVariant: EvaluationVariant = {
      key: 'on',
      value: { k: 'v' },
    };
    const variant = evaluationVariantToVariant(evaluationVariant);
    expect(variant.key).toEqual('on');
    expect(variant.value).toEqual('{"k":"v"}');
  });
  test('null value', () => {
    const evaluationVariant: EvaluationVariant = {
      key: 'on',
      value: null,
    };
    const variant = evaluationVariantToVariant(evaluationVariant);
    expect(variant.key).toEqual('on');
    expect(variant.value).toEqual('null');
  });
  test('undefined value', () => {
    const evaluationVariant: EvaluationVariant = {
      key: 'on',
    };
    const variant = evaluationVariantToVariant(evaluationVariant);
    expect(variant.key).toEqual('on');
    expect(variant.value).toBeUndefined();
  });
});

test('test evaluation variants to variants', () => {
  const evaluationVariants: Record<string, EvaluationVariant> = {
    string: { key: 'on', value: 'test' },
    boolean: { key: 'on', value: true },
    number: { key: 'on', value: 1.2 },
    array: { key: 'on', value: [1, 2, 3] },
    object: { key: 'on', value: { k: 'v' } },
    null: { key: 'on', value: null },
    undefined: { key: 'on' },
  };
  const variants = evaluationVariantsToVariants(evaluationVariants);
  expect(variants).toEqual({
    string: { key: 'on', value: 'test' },
    boolean: { key: 'on', value: 'true' },
    number: { key: 'on', value: '1.2' },
    array: { key: 'on', value: '[1,2,3]' },
    object: { key: 'on', value: '{"k":"v"}' },
    null: { key: 'on', value: 'null' },
    undefined: { key: 'on' },
  });
});
