// src/hooks/useFatePoolsStorage.tsx
"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAccount } from 'wagmi';
import { toast } from 'sonner';

// Import types only - not the service class
import type { 
  PoolDetails, 
  TokenDetails, 
  ChainStatus, 
  SupportedChainId 
} from '@/utils/indexedDBTypes';

export interface UseFatePoolsStorageReturn {
  // Database state
  isInitialized: boolean;
  error: string | null;
  isOnline: boolean;
  
  // Pool operations
  savePoolDetails: (pool: Omit<PoolDetails, 'createdAt' | 'updatedAt'>) => Promise<void>;
  getPoolDetails: (poolId: string) => Promise<PoolDetails | null>;
  getAllPoolsForChain: (chainId: SupportedChainId) => Promise<PoolDetails[]>;
  getAllPools: () => Promise<PoolDetails[]>;
  getPoolsByCreator: (creator: string, chainId?: SupportedChainId) => Promise<PoolDetails[]>;
  batchSavePools: (pools: Omit<PoolDetails, 'createdAt' | 'updatedAt'>[]) => Promise<void>;
  
  // Token operations
  saveTokenDetails: (token: Omit<TokenDetails, 'createdAt' | 'updatedAt'>) => Promise<void>;
  getTokenDetails: (tokenId: string) => Promise<TokenDetails | null>;
  getTokensForPool: (poolAddress: string) => Promise<TokenDetails[]>;
  batchSaveTokens: (tokens: Omit<TokenDetails, 'createdAt' | 'updatedAt'>[]) => Promise<void>;
  
  // Chain status operations
  saveChainStatus: (status: Omit<ChainStatus, 'createdAt' | 'updatedAt'>) => Promise<void>;
  getChainStatus: (chainId: SupportedChainId) => Promise<ChainStatus | null>;
  getAllChainStatuses: () => Promise<ChainStatus[]>;
  
  // Cache operations
  saveCache: (key: string, data: unknown, ttlMinutes?: number, chainId?: SupportedChainId) => Promise<void>;
  getCache: (key: string) => Promise<unknown | null>;
  deleteCache: (key: string) => Promise<void>;
  
  // Cleanup operations
  cleanupExpiredCache: () => Promise<void>;
  clearAllData: () => Promise<void>;
  
  // Database info
  getDatabaseInfo: () => Promise<{
    name: string;
    version: number;
    stores: string[];
    isConnected: boolean;
    totalPools: number;
    totalTokens: number;
  }>;
}

export const useFatePoolsStorage = (): UseFatePoolsStorageReturn => {
  // Early return for SSR - prevent any IndexedDB operations on server
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(typeof window !== 'undefined');
  }, []);
  
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(false);
  const { address } = useAccount();

  // Define service interface to avoid any types
  interface IndexedDBService {
    init: () => Promise<void>;
    savePoolDetails: (pool: Omit<PoolDetails, 'createdAt' | 'updatedAt'>) => Promise<void>;
    getPoolDetails: (poolId: string) => Promise<PoolDetails | null>;
    getAllPoolsForChain: (chainId: SupportedChainId) => Promise<PoolDetails[]>;
    getAllPools: () => Promise<PoolDetails[]>;
    getPoolsByCreator: (creator: string, chainId?: SupportedChainId) => Promise<PoolDetails[]>;
    batchSavePools: (pools: Omit<PoolDetails, 'createdAt' | 'updatedAt'>[]) => Promise<void>;
    saveTokenDetails: (token: Omit<TokenDetails, 'createdAt' | 'updatedAt'>) => Promise<void>;
    getTokenDetails: (tokenId: string) => Promise<TokenDetails | null>;
    getTokensForPool: (poolAddress: string) => Promise<TokenDetails[]>;
    batchSaveTokens: (tokens: Omit<TokenDetails, 'createdAt' | 'updatedAt'>[]) => Promise<void>;
    saveChainStatus: (status: Omit<ChainStatus, 'createdAt' | 'updatedAt'>) => Promise<void>;
    getChainStatus: (chainId: SupportedChainId) => Promise<ChainStatus | null>;
    getAllChainStatuses: () => Promise<ChainStatus[]>;
    saveCache: (key: string, data: unknown, ttlMinutes?: number, chainId?: SupportedChainId) => Promise<void>;
    getCache: (key: string) => Promise<unknown | null>;
    deleteCache: (key: string) => Promise<void>;
    cleanupExpiredCache: () => Promise<void>;
    clearAllData: () => Promise<void>;
    getDatabaseInfo: () => Promise<{
      name: string;
      version: number;
      stores: string[];
      isConnected: boolean;
      totalPools: number;
      totalTokens: number;
    }>;
    close: () => void;
  }

  // Use a ref to hold the service instance to prevent recreation on re-renders
  const serviceRef = useRef<IndexedDBService | null>(null);
  const isClientRef = useRef(false);

  // Check if we're on the client side
  useEffect(() => {
    isClientRef.current = typeof window !== 'undefined';
    if (isClientRef.current) {
      setIsOnline(navigator.onLine);
    }
  }, []);

  // Helper function to check if operations are allowed
  const canOperate = useCallback(() => {
    return isClient && isClientRef.current && typeof window !== 'undefined';
  }, [isClient]);

  // Monitor online status only on client
  useEffect(() => {
    if (!isClientRef.current) return;
    
    const handleOnline = () => { 
      setIsOnline(true); 
      toast.success('Connection restored'); 
    };
    const handleOffline = () => { 
      setIsOnline(false); 
      toast.error('Connection lost - working offline'); 
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Initialize IndexedDB service on the client side only
  useEffect(() => {
    if (!isClientRef.current) return;
    
    const initDB = async () => {
      try {
        setError(null);
        
        // Additional check to ensure we're in a browser environment
        if (typeof window === 'undefined' || !window.indexedDB) {
          console.warn('IndexedDB not available, skipping initialization');
          setIsInitialized(false);
          return;
        }
        
        // Wait a bit to ensure the DOM is fully ready
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Dynamic import only on client side
        const { FatePoolsIndexedDBService } = await import('@/utils/indexedDB');
        
        if (!serviceRef.current) {
          serviceRef.current = new FatePoolsIndexedDBService();
          await serviceRef.current.init();
        }
        
        setIsInitialized(true);
        await serviceRef.current?.cleanupExpiredCache();
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to initialize database';
        console.error('Failed to initialize FatePoolsDB:', err);
        setError(errorMessage);
        setIsInitialized(false);
      }
    };
    
    initDB();
    
    return () => {
      if (serviceRef.current?.close) {
        serviceRef.current.close();
      }
    };
  }, []);













  // Pool operations with proper dependencies
  const savePoolDetails = useCallback(
    async (pool: Omit<PoolDetails, 'createdAt' | 'updatedAt'>) => {
      try {
        if (!canOperate()) {
          throw new Error('Not available on server side');
        }
        
        if (!isInitialized || !serviceRef.current) {
          throw new Error('Database not initialized');
        }
        
        await serviceRef.current.savePoolDetails({ ...pool, userAddress: address });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to save pool details';
        console.error('FatePoolsStorage error (save pool details):', err);
        setError(errorMessage);
        throw err;
      }
    },
    [isInitialized, address, canOperate]
  );

  const getPoolDetails = useCallback(
    async (poolId: string): Promise<PoolDetails | null> => {
      try {
        if (!isClientRef.current) {
          throw new Error('Not available on server side');
        }
        
        if (!isInitialized || !serviceRef.current) {
          throw new Error('Database not initialized');
        }
        
        return await serviceRef.current.getPoolDetails(poolId);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to get pool details';
        console.error('FatePoolsStorage error (get pool details):', err);
        setError(errorMessage);
        throw err;
      }
    },
    [isInitialized]
  );

  const getAllPoolsForChain = useCallback(
    async (chainId: SupportedChainId): Promise<PoolDetails[]> => {
      try {
        if (!isClientRef.current) {
          throw new Error('Not available on server side');
        }
        
        if (!isInitialized || !serviceRef.current) {
          throw new Error('Database not initialized');
        }
        
        return await serviceRef.current.getAllPoolsForChain(chainId);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to get pools for chain';
        console.error('FatePoolsStorage error (get pools for chain):', err);
        setError(errorMessage);
        throw err;
      }
    },
    [isInitialized]
  );

  const getAllPools = useCallback(
    async (): Promise<PoolDetails[]> => {
      try {
        if (!isClientRef.current) {
          throw new Error('Not available on server side');
        }
        
        if (!isInitialized || !serviceRef.current) {
          throw new Error('Database not initialized');
        }
        
        return await serviceRef.current.getAllPools();
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to get all pools';
        console.error('FatePoolsStorage error (get all pools):', err);
        setError(errorMessage);
        throw err;
      }
    },
    [isInitialized]
  );

  const getPoolsByCreator = useCallback(
    async (creator: string, chainId?: SupportedChainId): Promise<PoolDetails[]> => {
      try {
        if (!isClientRef.current) {
          throw new Error('Not available on server side');
        }
        
        if (!isInitialized || !serviceRef.current) {
          throw new Error('Database not initialized');
        }
        
        return await serviceRef.current.getPoolsByCreator(creator, chainId);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to get pools by creator';
        console.error('FatePoolsStorage error (get pools by creator):', err);
        setError(errorMessage);
        throw err;
      }
    },
    [isInitialized]
  );

  const batchSavePools = useCallback(
    async (pools: Omit<PoolDetails, 'createdAt' | 'updatedAt'>[]) => {
      try {
        if (!isClientRef.current) {
          throw new Error('Not available on server side');
        }
        
        if (!isInitialized || !serviceRef.current) {
          throw new Error('Database not initialized');
        }
        
        await serviceRef.current.batchSavePools(pools.map((p) => ({ ...p, userAddress: address })));
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to batch save pools';
        console.error('FatePoolsStorage error (batch save pools):', err);
        setError(errorMessage);
        throw err;
      }
    },
    [isInitialized, address]
  );

  // Token operations with proper dependencies
  const saveTokenDetails = useCallback(
    async (token: Omit<TokenDetails, 'createdAt' | 'updatedAt'>) => {
      try {
        if (!isClientRef.current) {
          throw new Error('Not available on server side');
        }
        
        if (!isInitialized || !serviceRef.current) {
          throw new Error('Database not initialized');
        }
        
        await serviceRef.current.saveTokenDetails(token);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to save token details';
        console.error('FatePoolsStorage error (save token details):', err);
        setError(errorMessage);
        throw err;
      }
    },
    [isInitialized]
  );

  const getTokenDetails = useCallback(
    async (tokenId: string): Promise<TokenDetails | null> => {
      try {
        if (!isClientRef.current) {
          throw new Error('Not available on server side');
        }
        
        if (!isInitialized || !serviceRef.current) {
          throw new Error('Database not initialized');
        }
        
        return await serviceRef.current.getTokenDetails(tokenId);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to get token details';
        console.error('FatePoolsStorage error (get token details):', err);
        setError(errorMessage);
        throw err;
      }
    },
    [isInitialized]
  );

  const getTokensForPool = useCallback(
    async (poolAddress: string): Promise<TokenDetails[]> => {
      try {
        if (!isClientRef.current) {
          throw new Error('Not available on server side');
        }
        
        if (!isClientRef.current) {
          throw new Error('Not available on server side');
        }
        
        if (!isInitialized || !serviceRef.current) {
          throw new Error('Database not initialized');
        }
        
        return await serviceRef.current.getTokensForPool(poolAddress);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to get tokens for pool';
        console.error('FatePoolsStorage error (get tokens for pool):', err);
        setError(errorMessage);
        throw err;
      }
    },
    [isInitialized]
  );

  const batchSaveTokens = useCallback(
    async (tokens: Omit<TokenDetails, 'createdAt' | 'updatedAt'>[]) => {
      try {
        if (!isClientRef.current) {
          throw new Error('Not available on server side');
        }
        
        if (!isInitialized || !serviceRef.current) {
          throw new Error('Database not initialized');
        }
        
        await serviceRef.current.batchSaveTokens(tokens);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to batch save tokens';
        console.error('FatePoolsStorage error (batch save tokens):', err);
        setError(errorMessage);
        throw err;
      }
    },
    [isInitialized]
  );

  // Chain status operations with proper dependencies
  const saveChainStatus = useCallback(
    async (status: Omit<ChainStatus, 'createdAt' | 'updatedAt'>) => {
      try {
        if (!isClientRef.current) {
          throw new Error('Not available on server side');
        }
        
        if (!isInitialized || !serviceRef.current) {
          throw new Error('Database not initialized');
        }
        
        await serviceRef.current.saveChainStatus(status);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to save chain status';
        console.error('FatePoolsStorage error (save chain status):', err);
        setError(errorMessage);
        throw err;
      }
    },
    [isInitialized]
  );

  const getChainStatus = useCallback(
    async (chainId: SupportedChainId): Promise<ChainStatus | null> => {
      try {
        if (!isClientRef.current) {
          throw new Error('Not available on server side');
        }
        
        if (!isInitialized || !serviceRef.current) {
          throw new Error('Database not initialized');
        }
        
        return await serviceRef.current.getChainStatus(chainId);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to get chain status';
        console.error('FatePoolsStorage error (get chain status):', err);
        setError(errorMessage);
        throw err;
      }
    },
    [isInitialized]
  );

  const getAllChainStatuses = useCallback(
    async (): Promise<ChainStatus[]> => {
      try {
        if (!isClientRef.current) {
          throw new Error('Not available on server side');
        }
        
        if (!isInitialized || !serviceRef.current) {
          throw new Error('Database not initialized');
        }
        
        return await serviceRef.current.getAllChainStatuses();
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to get all chain statuses';
        console.error('FatePoolsStorage error (get all chain statuses):', err);
        setError(errorMessage);
        throw err;
      }
    },
    [isInitialized]
  );

  // Cache operations with proper dependencies
  const saveCache = useCallback(
    async (key: string, data: unknown, ttlMinutes?: number, chainId?: SupportedChainId) => {
      try {
        if (!isClientRef.current) {
          throw new Error('Not available on server side');
        }
        
        if (!isInitialized || !serviceRef.current) {
          throw new Error('Database not initialized');
        }
        
        await serviceRef.current.saveCache(key, data, ttlMinutes, chainId);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to save cache';
        console.error('FatePoolsStorage error (save cache):', err);
        setError(errorMessage);
        throw err;
      }
    },
    [isInitialized]
  );

  const getCache = useCallback(
    async (key: string): Promise<unknown | null> => {
      try {
        if (!isClientRef.current) {
          throw new Error('Not available on server side');
        }
        
        if (!isInitialized || !serviceRef.current) {
          throw new Error('Database not initialized');
        }
        
        return await serviceRef.current.getCache(key);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to get cache';
        console.error('FatePoolsStorage error (get cache):', err);
        setError(errorMessage);
        throw err;
      }
    },
    [isInitialized]
  );

  const deleteCache = useCallback(
    async (key: string) => {
      try {
        if (!isClientRef.current) {
          throw new Error('Not available on server side');
        }
        
        if (!isInitialized || !serviceRef.current) {
          throw new Error('Database not initialized');
        }
        
        await serviceRef.current.deleteCache(key);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to delete cache';
        console.error('FatePoolsStorage error (delete cache):', err);
        setError(errorMessage);
        throw err;
      }
    },
    [isInitialized]
  );

  // Cleanup operations with proper dependencies
  const cleanupExpiredCache = useCallback(
    async () => {
      try {
        if (!isClientRef.current) {
          throw new Error('Not available on server side');
        }
        
        if (!isInitialized || !serviceRef.current) {
          throw new Error('Database not initialized');
        }
        
        await serviceRef.current.cleanupExpiredCache();
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to cleanup expired cache';
        console.error('FatePoolsStorage error (cleanup expired cache):', err);
        setError(errorMessage);
        throw err;
      }
    },
    [isInitialized]
  );

  const clearAllData = useCallback(
    async () => {
      try {
        if (!isClientRef.current) {
          throw new Error('Not available on server side');
        }
        
        if (!isInitialized || !serviceRef.current) {
          throw new Error('Database not initialized');
        }
        
        await serviceRef.current.clearAllData();
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to clear all data';
        console.error('FatePoolsStorage error (clear all data):', err);
        setError(errorMessage);
        throw err;
      }
    },
    [isInitialized]
  );

  // Database info with proper dependencies
  const getDatabaseInfo = useCallback(
    async (): Promise<{
      name: string;
      version: number;
      stores: string[];
      isConnected: boolean;
      totalPools: number;
      totalTokens: number;
    }> => {
      try {
        if (!isClientRef.current) {
          throw new Error('Not available on server side');
        }
        
        if (!isInitialized || !serviceRef.current) {
          throw new Error('Database not initialized');
        }
        
        return await serviceRef.current.getDatabaseInfo();
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to get database info';
        console.error('FatePoolsStorage error (get database info):', err);
        setError(errorMessage);
        throw err;
      }
    },
    [isInitialized]
  );

  // Clear error when coming back online
  useEffect(() => {
    if (isOnline && error) {
      setError(null);
    }
  }, [isOnline, error]);

  return useMemo(
    () => ({
      isInitialized, error, isOnline, savePoolDetails, getPoolDetails, getAllPoolsForChain, getAllPools, getPoolsByCreator, batchSavePools,
      saveTokenDetails, getTokenDetails, getTokensForPool, batchSaveTokens, saveChainStatus, getChainStatus, getAllChainStatuses,
      saveCache, getCache, deleteCache, cleanupExpiredCache, clearAllData, getDatabaseInfo,
    }),
    [
      isInitialized, error, isOnline, savePoolDetails, getPoolDetails, getAllPoolsForChain, getAllPools, getPoolsByCreator, batchSavePools,
      saveTokenDetails, getTokenDetails, getTokensForPool, batchSaveTokens, saveChainStatus, getChainStatus, getAllChainStatuses,
      saveCache, getCache, deleteCache, cleanupExpiredCache, clearAllData, getDatabaseInfo,
    ]
  );
}