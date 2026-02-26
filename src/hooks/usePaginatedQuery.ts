import { useState, useCallback, useRef } from 'react';

interface UsePaginatedQueryOptions<T> {
  fetchFn: (lastVisible?: any, limit?: number) => Promise<{
    items: T[];
    lastVisible: any;
    hasMore: boolean;
  }>;
  limit?: number;
  onError?: (error: Error) => void;
}

export const usePaginatedQuery = <T,>({
  fetchFn,
  limit = 10,
  onError,
}: UsePaginatedQueryOptions<T>) => {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const lastVisibleRef = useRef<any>(null);

  const load = useCallback(async (refresh = false) => {
    try {
      setLoading(true);
      const result = await fetchFn(
        refresh ? null : lastVisibleRef.current,
        limit
      );
      
      if (refresh) {
        setItems(result.items);
      } else {
        setItems(prev => [...prev, ...result.items]);
      }
      
      lastVisibleRef.current = result.lastVisible;
      setHasMore(result.hasMore);
    } catch (error) {
      if (onError) {
        onError(error as Error);
      }
    } finally {
      setLoading(false);
    }
  }, [fetchFn, limit, onError]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await load(true);
    setRefreshing(false);
  }, [load]);

  const loadMore = useCallback(() => {
    if (hasMore && !loading) {
      load();
    }
  }, [hasMore, loading, load]);

  return {
    items,
    loading,
    refreshing,
    hasMore,
    loadMore,
    refresh,
  };
};
