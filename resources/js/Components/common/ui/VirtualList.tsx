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
    <div style={style} className={`overflow-y-auto ${className || ""}`}>
      {header && <div>{header}</div>}
      {items.map((item, index) => (
        <div key={index}>{renderItem(item, index)}</div>
      ))}
      {footer && <div>{footer}</div>}
    </div>
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
  className,
  emptyState,
  itemClassName,
  style,
}: VirtualGridProps<T>) {
  if (items.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  return (
    <div style={style} className={`overflow-y-auto ${className || ""}`}>
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-${columns} gap-6`}>
        {items.map((item, index) => (
          <div key={index} className={itemClassName}>
            {renderItem(item, index)}
          </div>
        ))}
      </div>
    </div>
  );
}
