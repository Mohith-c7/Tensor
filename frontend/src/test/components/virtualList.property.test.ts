/**
 * Property 25: Virtual List Threshold
 * Validates: Requirements 6.6, 13.5
 * Lists > 100 items should use VirtualList; lists <= 100 items use DataTable.
 */
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { useVirtualList } from '../../hooks/useVirtualList';

describe('Property 25: Virtual List Threshold', () => {
  it('shouldVirtualize is true when items.length > 100', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 101, max: 10_000 }),
        (count) => {
          const items = Array.from({ length: count });
          const { shouldVirtualize } = useVirtualList(items);
          expect(shouldVirtualize).toBe(true);
        }
      )
    );
  });

  it('shouldVirtualize is false when items.length <= 100', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100 }),
        (count) => {
          const items = Array.from({ length: count });
          const { shouldVirtualize } = useVirtualList(items);
          expect(shouldVirtualize).toBe(false);
        }
      )
    );
  });

  it('items array is returned unchanged', () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer()),
        (items) => {
          const { items: returned } = useVirtualList(items);
          expect(returned).toBe(items);
        }
      )
    );
  });
});
