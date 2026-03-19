/**
 * Determine whether to use virtualization based on item count.
 * Virtualizes when items.length > 100.
 * Requirements: 6.6, 13.5
 */
export function useVirtualList<T>(items: T[]) {
  return {
    shouldVirtualize: items.length > 100,
    items,
  };
}
