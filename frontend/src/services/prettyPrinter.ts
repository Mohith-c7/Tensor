import { format, parse } from 'date-fns';

const DISPLAY_FORMAT = 'dd/MM/yyyy';
const API_FORMAT = 'yyyy-MM-dd';

/**
 * Format a Date to display format: dd/MM/yyyy
 */
export function formatDate(date: Date): string {
  return format(date, DISPLAY_FORMAT);
}

/**
 * Format a Date to API format: yyyy-MM-dd
 */
export function toApiDate(date: Date): string {
  return format(date, API_FORMAT);
}

/**
 * Parse a display-format string (dd/MM/yyyy) back to a Date
 */
export function parseDate(str: string): Date {
  return parse(str, DISPLAY_FORMAT, new Date());
}

/**
 * Format a number as currency with 2 decimal places
 */
export function formatCurrency(amount: number, locale = 'en-IN'): string {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Parse a formatted currency string back to a float
 * Strips all non-numeric characters except the decimal point
 */
export function parseCurrency(str: string): number {
  // Remove everything except digits and the last decimal separator
  const cleaned = str.replace(/[^\d.]/g, '');
  return parseFloat(cleaned);
}
