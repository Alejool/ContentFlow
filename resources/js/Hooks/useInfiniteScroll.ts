import { useState, useEffect, useRef, useCallback } from 'react';

interface UseInfiniteScrollOptions<T> {
  fetchFn: (page: number) => Promise<{ data: T[]; hasMore: boolean }>;
  initialPage?: number;
  threshold?: number;
  rootMargin?: string;
}

interface UseInfiniteScrollReturn<T> {
  items: T[];
  isLoading: boolean;
  hasMore: boolean;
  error: Error | null;
  loadMore: () => void;
  reset: () => void;
  observerRef: React.RefObject<HTMLDivElement>;
}

/**
 * Hook for infinite scroll with Intersection Observer
 * Optimized for performance with automatic loading
 */
export function useInfiniteScroll<T>({
  fetchFn,
  initialPage = 1,
  threshold = 0.5,
  rootMargin = '100px',
}: UseInfiniteScrollOptions<T>): UseInfiniteScrollReturn<T> {
  const [items, setItems] = useState<T[]>([]);
  const [page, setPage] = useState(initialPage);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const observerRef = useRef<HTMLDivElement>(null);
  const isLoadingRef = useRef(false);

  const loadMore = useCallback(async () => {
    if (isLoadingRef.current || !hasMore) return;

    isLoadingRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchFn(page);

      setItems((prev) => [...prev, ...result.data]);
      setHasMore(result.hasMore);
      setPage((prev) => prev + 1);
    } catch (err) {
      setError(err as Error);
      console.error('Failed to load more items:', err);
    } finally {
      setIsLoading(false);
      isLoadingRef.current = false;
    }
  }, [page, hasMore, fetchFn]);

  const reset = useCallback(() => {
    setItems([]);
    setPage(initialPage);
    setHasMore(true);
    setError(null);
    isLoadingRef.current = false;
  }, [initialPage]);

  useEffect(() => {
    if (!observerRef.current || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingRef.current) {
          loadMore();
        }
      },
      {
        threshold,
        rootMargin,
      },
    );

    observer.observe(observerRef.current);

    return () => {
      observer.disconnect();
    };
  }, [loadMore, hasMore, threshold, rootMargin]);

  // Load initial page
  useEffect(() => {
    if (items.length === 0 && !isLoadingRef.current) {
      loadMore();
    }
  }, []);

  return {
    items,
    isLoading,
    hasMore,
    error,
    loadMore,
    reset,
    observerRef,
  };
}

/**
 * Hook for virtualized list rendering
 * Only renders visible items for better performance
 */
export function useVirtualizedList<T>({
  items,
  itemHeight,
  containerHeight,
  overscan = 3,
}: {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}) {
  const [scrollTop, setScrollTop] = useState(0);

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan,
  );

  const visibleItems = items.slice(startIndex, endIndex + 1);
  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return {
    visibleItems,
    totalHeight,
    offsetY,
    startIndex,
    endIndex,
    handleScroll,
  };
}
