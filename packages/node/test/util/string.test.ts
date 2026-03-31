import { safeStringTrim } from 'src/util/string';

describe('safeStringTrim', () => {
  test('trims string values', () => {
    expect(safeStringTrim('  hello  ')).toBe('hello');
    expect(safeStringTrim('test')).toBe('test');
  });

  test('converts non-string values to trimmed strings', () => {
    expect(safeStringTrim(123)).toBe('123');
    expect(safeStringTrim(null)).toBe('');
    expect(safeStringTrim(undefined)).toBe('');
    expect(safeStringTrim(true)).toBe('true');
  });
});
