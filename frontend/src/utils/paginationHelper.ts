/**
 * Calculate total number of pages.
 * Requirements: 6.5, 18.8
 */
export function calculateTotalPages(total: number, pageSize: number): number {
  if (pageSize <= 0 || total <= 0) return 0;
  return Math.ceil(total / pageSize);
}

/**
 * Slice items array for the given page (1-indexed).
 * Requirements: 6.5, 18.8
 */
export function getPageItems<T>(items: T[], page: number, pageSize: number): T[] {
  if (pageSize <= 0 || page <= 0) return [];
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}
