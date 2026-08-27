import React, { useMemo, useRef, useEffect, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { AppCard } from '../components/ui/card';
import { cn } from '../utils/shadcn';

interface Column<T> {
  key: string;
  header: string;
  width?: number;
  minWidth?: number;
  maxWidth?: number;
  render?: (row: T, index: number) => React.ReactNode;
  align?: 'left' | 'center' | 'right';
  sticky?: boolean;
}

interface VirtualizedTableProps<T> {
  data: T[];
  columns: Column<T>[];
  rowKey: keyof T | ((row: T) => string);
  rowHeight?: number;
  overscan?: number;
  className?: string;
  emptyMessage?: string;
  onRowClick?: (row: T, index: number) => void;
  stickyHeader?: boolean;
  showBorders?: boolean;
  striped?: boolean;
}

export function VirtualizedTable<T extends Record<string, any>>({
  data,
  columns,
  rowKey,
  rowHeight = 48,
  overscan = 5,
  className,
  emptyMessage = 'No data available',
  onRowClick,
  stickyHeader = true,
  showBorders = true,
  striped = true,
}: VirtualizedTableProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(400);
  
  useEffect(() => {
    const updateHeight = () => {
      if (parentRef.current) {
        setContainerHeight(parentRef.current.clientHeight);
      }
    };
    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    if (parentRef.current) observer.observe(parentRef.current);
    return () => observer.disconnect();
  }, []);

  const virtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan,
    paddingStart: 0,
    paddingEnd: 0,
  });

  const getRowKey = useMemo(() => {
    if (typeof rowKey === 'function') return rowKey;
    return (row: T) => String(row[rowKey]);
  }, [rowKey]);

  if (data.length === 0) {
    return (
      <AppCard className={cn('flex items-center justify-center min-h-[200px]', className)}>
        <p className="text-muted-foreground text-center">{emptyMessage}</p>
      </AppCard>
    );
  }

  return (
    <AppCard className={cn('overflow-hidden', className)}>
      <div ref={parentRef} className="relative" style={{ height: containerHeight }}>
        {/* Header */}
        {stickyHeader && (
          <div
            className={cn(
              'flex bg-muted/50 border-b sticky top-0 z-10',
              showBorders && 'border-border'
            )}
            style={{ 
              position: 'sticky', 
              top: 0,
              zIndex: 10,
            }}
          >
            {columns.map((col, colIndex) => (
              <div
                key={col.key}
                className={cn(
                  'px-3 py-2 font-medium text-sm text-muted-foreground',
                  col.align === 'center' && 'justify-center',
                  col.align === 'right' && 'justify-end',
                  colIndex === columns.length - 1 && 'border-r-0'
                )}
                style={{
                  width: col.width ? `${col.width}px` : undefined,
                  minWidth: col.minWidth ? `${col.minWidth}px` : undefined,
                  maxWidth: col.maxWidth ? `${col.maxWidth}px` : undefined,
                  flex: col.width ? '0 0 auto' : '1',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {col.header}
              </div>
            ))}
          </div>
        )}
        
        {/* Virtualized Rows */}
        <div className="relative">
          {virtualizer.getVirtualItems().map((virtualRow) => (
            <div
              key={getRowKey(data[virtualRow.index])}
              className={cn(
                'flex border-b last:border-b-0 transition-colors',
                showBorders && 'border-border/50',
                striped && virtualRow.index % 2 === 1 && 'bg-muted/30',
                onRowClick && 'cursor-pointer hover:bg-muted/50'
              )}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
                willChange: 'transform',
              }}
              onClick={() => onRowClick?.(data[virtualRow.index], virtualRow.index)}
            >
              {columns.map((col, colIndex) => (
                <div
                  key={col.key}
                  className={cn(
                    'px-3 py-2 text-sm',
                    col.align === 'center' && 'flex items-center justify-center',
                    col.align === 'right' && 'flex items-center justify-end',
                    colIndex === columns.length - 1 && 'pr-4'
                  )}
                  style={{
                    width: col.width ? `${col.width}px` : undefined,
                    minWidth: col.minWidth ? `${col.minWidth}px` : undefined,
                    maxWidth: col.maxWidth ? `${col.maxWidth}px` : undefined,
                    flex: col.width ? '0 0 auto' : '1',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {col.render
                    ? col.render(data[virtualRow.index], virtualRow.index)
                    : String(data[virtualRow.index][col.key] ?? '')}
                </div>
              ))}
            </div>
          ))}
        </div>
        
        {/* Spacer for scrollbar */}
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
          }}
        />
      </div>
    </AppCard>
  );
}

// Fixed height virtualized table (for known container heights)
export function FixedHeightVirtualizedTable<T extends Record<string, any>>({
  data,
  columns,
  rowKey,
  rowHeight = 48,
  overscan = 5,
  height = 400,
  className,
  emptyMessage = 'No data available',
  onRowClick,
  stickyHeader = true,
  showBorders = true,
  striped = true,
}: Omit<VirtualizedTableProps<T>, 'rowHeight' | 'overscan'> & {
  rowHeight?: number;
  overscan?: number;
  height: number;
}) {
  const parentRef = useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan,
    paddingStart: 0,
    paddingEnd: 0,
  });

  const getRowKey = useMemo(() => {
    if (typeof rowKey === 'function') return rowKey;
    return (row: T) => String(row[rowKey]);
  }, [rowKey]);

  if (data.length === 0) {
    return (
      <AppCard className={cn('flex items-center justify-center', className)} style={{ height }}>
        <p className="text-muted-foreground text-center">{emptyMessage}</p>
      </AppCard>
    );
  }

  return (
    <AppCard className={cn('overflow-hidden', className)} style={{ height }}>
      <div ref={parentRef} className="relative" style={{ height }}>
        {/* Header */}
        {stickyHeader && (
          <div
            className={cn(
              'flex bg-muted/50 border-b sticky top-0 z-10',
              showBorders && 'border-border'
            )}
            style={{ 
              position: 'sticky', 
              top: 0,
              zIndex: 10,
            }}
          >
            {columns.map((col, colIndex) => (
              <div
                key={col.key}
                className={cn(
                  'px-3 py-2 font-medium text-sm text-muted-foreground',
                  col.align === 'center' && 'justify-center',
                  col.align === 'right' && 'justify-end',
                  colIndex === columns.length - 1 && 'border-r-0'
                )}
                style={{
                  width: col.width ? `${col.width}px` : undefined,
                  minWidth: col.minWidth ? `${col.minWidth}px` : undefined,
                  maxWidth: col.maxWidth ? `${col.maxWidth}px` : undefined,
                  flex: col.width ? '0 0 auto' : '1',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {col.header}
              </div>
            ))}
          </div>
        )}
        
        {/* Virtualized Rows */}
        <div className="relative">
          {virtualizer.getVirtualItems().map((virtualRow) => (
            <div
              key={getRowKey(data[virtualRow.index])}
              className={cn(
                'flex border-b last:border-b-0 transition-colors',
                showBorders && 'border-border/50',
                striped && virtualRow.index % 2 === 1 && 'bg-muted/30',
                onRowClick && 'cursor-pointer hover:bg-muted/50'
              )}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
                willChange: 'transform',
              }}
              onClick={() => onRowClick?.(data[virtualRow.index], virtualRow.index)}
            >
              {columns.map((col, colIndex) => (
                <div
                  key={col.key}
                  className={cn(
                    'px-3 py-2 text-sm',
                    col.align === 'center' && 'flex items-center justify-center',
                    col.align === 'right' && 'flex items-center justify-end',
                    colIndex === columns.length - 1 && 'pr-4'
                  )}
                  style={{
                    width: col.width ? `${col.width}px` : undefined,
                    minWidth: col.minWidth ? `${col.minWidth}px` : undefined,
                    maxWidth: col.maxWidth ? `${col.maxWidth}px` : undefined,
                    flex: col.width ? '0 0 auto' : '1',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {col.render
                    ? col.render(data[virtualRow.index], virtualRow.index)
                    : String(data[virtualRow.index][col.key] ?? '')}
                </div>
              ))}
            </div>
          ))}
        </div>
        
        {/* Spacer for scrollbar */}
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
          }}
        />
      </div>
    </AppCard>
  );
}