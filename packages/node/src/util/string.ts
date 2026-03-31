/**
 * Safely converts a value to a trimmed string.
 * Returns empty string for null/undefined values.
 * @param value - The value to convert
 * @returns Trimmed string representation
 */
export function safeStringTrim(value: unknown): string {
  if (value == null) {
    return '';
  }
  if (typeof value === 'string') {
    return value.trim();
  }
  return String(value).trim();
}
