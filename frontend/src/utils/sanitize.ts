import DOMPurify from 'dompurify';

/**
 * Strip all HTML tags and attributes from a string.
 * Uses DOMPurify with no allowed tags or attributes.
 * Requirements: 15.2, 15.3
 */
export function sanitize(dirty: string): string {
  return DOMPurify.sanitize(dirty, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
}
