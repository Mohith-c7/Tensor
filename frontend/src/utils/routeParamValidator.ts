/**
 * Validate a route parameter as a positive integer.
 * Returns the parsed number, or null if invalid.
 * Requirements: 15.8
 */
export function validatePositiveInt(param: string | undefined): number | null {
  if (param === undefined || param === null) return null;
  if (!/^[1-9]\d*$/.test(param)) return null;
  return parseInt(param, 10);
}
