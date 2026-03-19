import React from 'react';
import { FixedSizeList, type ListChildComponentProps } from 'react-window';

interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  height?: number;
  overscan?: number;
}

/**
 * Virtualized list using react-window for large datasets.
 * Requirements: 6.6, 13.5
 */
export function VirtualList<T>({
  items,
  itemHeight,
  renderItem,
  height = 600,
  overscan = 10,
}: VirtualListProps<T>) {
  const Row = ({ index, style }: ListChildComponentProps) => (
    <div style={style}>{renderItem(items[index], index)}</div>
  );

  return (
    <FixedSizeList
      height={height}
      itemCount={items.length}
      itemSize={itemHeight}
      width="100%"
      overscanCount={overscan}
    >
      {Row}
    </FixedSizeList>
  );
}
