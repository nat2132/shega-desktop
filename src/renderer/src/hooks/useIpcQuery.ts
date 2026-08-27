import { useState, useEffect, useCallback, useRef } from 'react';
import {
  useQuery,
  useQueryClient,
  useMutation,
  QueryKey,
  MutationFunction,
} from '@tanstack/react-query';

// Simple in-memory cache for IPC responses
const ipcCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 30000; // 30 seconds

export function useIpcQuery<T>(
  key: QueryKey,
  ipcCall: () => Promise<T>,
  options?: {
    staleTime?: number;
    gcTime?: number;
    enabled?: boolean;
  }
) {
  const queryClient = useQueryClient();
  
  return useQuery<T, Error>({
    queryKey: key,
    queryFn: async () => {
      const cacheKey = JSON.stringify(key);
      const cached = ipcCache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data;
      }
      
      const data = await ipcCall();
      ipcCache.set(cacheKey, { data, timestamp: Date.now() });
      return data;
    },
    staleTime: options?.staleTime ?? 5000,
    gcTime: options?.gcTime ?? 1000 * 60 * 5, // 5 minutes
    enabled: options?.enabled ?? true,
    retry: 1,
  });
}

export function useIpcMutation<TData, TVariables>(
  mutationFn: MutationFunction<TData, TVariables>,
  options?: {
    onSuccess?: (data: TData, variables: TVariables) => void;
    onError?: (error: Error, variables: TVariables) => void;
    invalidateKeys?: QueryKey[];
  }
) {
  const queryClient = useQueryClient();
  
  return useMutation<TData, Error, TVariables>({
    mutationFn,
    onSuccess: async (data, variables) => {
      // Invalidate related queries
      if (options?.invalidateKeys) {
        await Promise.all(
          options.invalidateKeys.map(key => queryClient.invalidateQueries({ queryKey: key }))
        );
      }
      options?.onSuccess?.(data, variables);
    },
    onError: options?.onError,
  });
}

// Debounced search hook
export function useDebouncedSearch<T>(
  searchFn: (query: string) => Promise<T[]>,
  delay = 300
) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const abortRef = useRef<AbortController>();

  const executeSearch = useCallback(async (q: string) => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    
    if (!q.trim()) {
      setResults([]);
      return;
    }
    
    setLoading(true);
    try {
      const data = await searchFn(q);
      if (!abortRef.current.signal.aborted) {
        setResults(data);
      }
    } catch (e) {
      if (!abortRef.current.signal.aborted) {
        setResults([]);
      }
    } finally {
      if (!abortRef.current.signal.aborted) {
        setLoading(false);
      }
    }
  }, [searchFn]);

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    timeoutRef.current = setTimeout(() => {
      executeSearch(query);
    }, delay);
    
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [query, executeSearch, delay]);

  return { query, setQuery, results, loading };
}

// Prefetch helper
export function usePrefetch() {
  const queryClient = useQueryClient();
  
  return useCallback(async <T>(key: QueryKey, fn: () => Promise<T>) => {
    await queryClient.prefetchQuery({ queryKey: key, queryFn: fn });
  }, [queryClient]);
}

// Batch invalidation
export function useBatchInvalidate() {
  const queryClient = useQueryClient();
  
  return useCallback(async (keys: QueryKey[]) => {
    await Promise.all(keys.map(key => queryClient.invalidateQueries({ queryKey: key })));
  }, [queryClient]);
}