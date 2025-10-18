// src/hooks/useOptimizedData.ts
// Optimized data fetching with caching and performance optimizations

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { logger } from '@/lib/logger';

interface UseOptimizedDataOptions<T> {
  staleTime?: number; // Time in ms before data is considered stale
  cacheTime?: number; // Time in ms to keep data in cache
  retryCount?: number; // Number of retry attempts
  retryDelay?: number; // Delay between retries in ms
  enabled?: boolean; // Whether to enable the hook
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

interface UseOptimizedDataReturn<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  isStale: boolean;
  lastFetched: number | null;
}

// Global cache for data
const dataCache = new Map<string, { data: unknown; timestamp: number; staleTime: number }>();

export const useOptimizedData = <T>(
  key: string,
  fetchFn: () => Promise<T>,
  options: UseOptimizedDataOptions<T> = {}
): UseOptimizedDataReturn<T> => {
  const {
    staleTime = 5 * 60 * 1000, // 5 minutes
    cacheTime = 30 * 60 * 1000, // 30 minutes
    retryCount = 3,
    retryDelay = 1000,
    enabled = true,
    onSuccess,
    onError
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastFetched, setLastFetched] = useState<number | null>(null);
  
  const retryCountRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Check if data is stale
  const isStale = useMemo(() => {
    if (!lastFetched) return true;
    return Date.now() - lastFetched > staleTime;
  }, [lastFetched, staleTime]);

  // Check cache first
  const getCachedData = useCallback((): T | null => {
    const cached = dataCache.get(key);
    if (!cached) return null;
    
    const now = Date.now();
    const isExpired = now - cached.timestamp > cacheTime;
    
    if (isExpired) {
      dataCache.delete(key);
      return null;
    }
    
    // Use cached timestamp for lastFetched when returning cached data
    setLastFetched(cached.timestamp);
    return cached.data as T;
  }, [key, cacheTime]);

  // Fetch data with retry logic
  const fetchData = useCallback(async (isRetry = false): Promise<void> => {
    if (!enabled) return;
    
    // Clear any existing retry timeout
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    
    try {
      if (!isRetry) {
        setLoading(true);
        setError(null);
      }
      
      // Call fetchFn (it may or may not accept AbortSignal)
      const result = await fetchFn();
      
      if (signal.aborted) {
        return;
      }
      
      setData(result);
      setLastFetched(Date.now());
      setError(null);
      retryCountRef.current = 0;
      
      // Cache the result
      dataCache.set(key, {
        data: result,
        timestamp: Date.now(),
        staleTime
      });
      
      onSuccess?.(result);
      
    } catch (err) {
      if (signal.aborted) {
        return;
      }
      
      const error = err instanceof Error ? err : new Error(String(err));
      
      if (retryCountRef.current < retryCount) {
        retryCountRef.current++;
        logger.warn(`Retry ${retryCountRef.current}/${retryCount} for ${key}:`, { error: error.message });
        
        retryTimeoutRef.current = setTimeout(() => {
          fetchData(true);
        }, retryDelay * retryCountRef.current);
        
        return;
      }
      
      setError(error);
      onError?.(error);
      logger.error(`Failed to fetch data for ${key}:`, error);
      
    } finally {
      // Always clear loading state when done (success or final retry failure)
      setLoading(false);
    }
  }, [key, fetchFn, enabled, staleTime, retryCount, retryDelay, onSuccess, onError]);

  // Initial load
  useEffect(() => {
    if (!enabled) return;
    
    // Check cache first
    const cachedData = getCachedData();
    if (cachedData) {
      setData(cachedData);
      // lastFetched is already set by getCachedData using cached timestamp
      return;
    }
    
    fetchData();
    
    return () => {
      // Clear retry timeout on unmount
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
      
      // Abort ongoing request on unmount
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [enabled, getCachedData, fetchData]);

  // Refetch function
  const refetch = useCallback(async () => {
    retryCountRef.current = 0;
    await fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch,
    isStale,
    lastFetched
  };
};

// Optimized hook for portfolio data
export const useOptimizedPortfolio = (
  address: string | undefined,
  chainId: number | undefined,
  enabled: boolean = true
) => {
  const fetchPortfolioData = useCallback(async () => {
    if (!address || !chainId) {
      throw new Error('Address and chainId are required');
    }
    
    // This would be your actual portfolio fetching logic
    // For now, returning a placeholder
    return {
      positions: [],
      totalValue: 0,
      totalPnL: 0,
      lastUpdated: Date.now()
    };
  }, [address, chainId]);

  return useOptimizedData(
    `portfolio_${address}_${chainId}`,
    fetchPortfolioData,
    {
      staleTime: 2 * 60 * 1000, // 2 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      enabled: enabled && !!address && !!chainId
    }
  );
};

// Optimized hook for pool data
export const useOptimizedPools = (
  chainId: number | undefined,
  enabled: boolean = true
) => {
  const fetchPoolsData = useCallback(async () => {
    if (!chainId) {
      throw new Error('ChainId is required');
    }
    
    // This would be your actual pools fetching logic
    return [];
  }, [chainId]);

  return useOptimizedData(
    `pools_${chainId}`,
    fetchPoolsData,
    {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 30 * 60 * 1000, // 30 minutes
      enabled: enabled && !!chainId
    }
  );
};

// Debounced hook for search
export const useDebouncedSearch = <T>(
  searchFn: (query: string) => Promise<T>,
  delay: number = 300
) => {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      setDebouncedQuery(query);
    }, delay);
    
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [query, delay]);

  const searchData = useOptimizedData(
    `search_${debouncedQuery}`,
    () => searchFn(debouncedQuery),
    {
      enabled: debouncedQuery.length > 2,
      staleTime: 60 * 1000, // 1 minute
      cacheTime: 5 * 60 * 1000 // 5 minutes
    }
  );

  return {
    ...searchData,
    query,
    setQuery
  };
};