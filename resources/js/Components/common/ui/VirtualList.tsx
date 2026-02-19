import { Virtuoso, VirtuosoGrid } from "react-virtuoso";
import { ReactNode, CSSProperties } from "react";

interface VirtualListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  estimatedItemSize?: number;
  overscan?: number;
  className?: string;
  emptyState?: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  style?: CSSProperties;
}

export function VirtualList<T>({
  items,
  renderItem,
  estimatedItemSize = 100,
  overscan = 5,
  className,
  emptyState,
  header,
  footer,
  style,
}: VirtualListProps<T>) {
  if (items.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  return (
    <Virtuoso
      style={style}
      className={className}
      data={items}
      overscan={overscan}
      defaultItemHeight={estimatedItemSize}
      itemContent={(index, item) => renderItem(item, index)}
      components={{
        Header: header ? () => <>{header}</> : undefined,
        Footer: footer ? () => <>{footer}</> : undefined,
      }}
    />
  );
}

interface VirtualGridProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  columns?: number;
  overscan?: number;
  className?: string;
  emptyState?: ReactNode;
  itemClassName?: string;
  style?: CSSProperties;
}

export function VirtualGrid<T>({
  items,
  renderItem,
  columns = 4,
  overscan = 5,
  className,
  emptyState,
  itemClassName,
  style,
}: VirtualGridProps<T>) {
  if (items.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  return (
    <VirtuosoGrid
      style={style}
      className={className}
      data={items}
      overscan={overscan}
      listClassName={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-${columns} gap-6`}
      itemClassName={itemClassName}
      itemContent={(index, item) => renderItem(item, index)}
    />
  );
}
