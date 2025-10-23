// src/hooks/useIndexedDB.ts
// React hook for IndexedDB operations with proper state management

import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { FatePoolsIndexedDBManager } from '@/lib/indexeddb/manager';
import { 
  type PoolDetails, 
  type TokenDetails, 
  type ChainStatus, 
  type PortfolioPosition,
  type PortfolioTransaction,
  type PortfolioCache,
  type SupportedChainId 
} from '@/lib/indexeddb/config';

interface UseIndexedDBReturn {
  // Initialization
  isInitialized: boolean;
  isOnline: boolean;
  error: string | null;
  
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
  cleanupExpiredCache: () => Promise<void>;
  
  // Portfolio operations
  savePortfolioPosition: (position: Omit<PortfolioPosition, 'lastUpdated'>) => Promise<void>;
  getPortfolioPositions: (userAddress: string, chainId?: SupportedChainId) => Promise<PortfolioPosition[]>;
  savePortfolioTransaction: (transaction: Omit<PortfolioTransaction, 'timestamp'>) => Promise<void>;
  getPortfolioTransactions: (userAddress: string, chainId?: SupportedChainId) => Promise<PortfolioTransaction[]>;
  savePortfolioCache: (cache: Omit<PortfolioCache, 'lastUpdated'>) => Promise<void>;
  getPortfolioCache: (userAddress: string, chainId: SupportedChainId) => Promise<PortfolioCache | null>;
  deletePortfolioCache: (userAddress: string, chainId: SupportedChainId) => Promise<void>;
  deletePortfolioPositions: (userAddress: string, chainId: SupportedChainId) => Promise<void>;
  deletePortfolioTransactions: (userAddress: string, chainId: SupportedChainId) => Promise<void>;
  
  // Utility operations
  clearAllData: () => Promise<void>;
  getDatabaseInfo: () => Promise<{ name: string; version: number; objectStoreNames: string[] }>;
  isHealthy: () => Promise<boolean>;
}

export const useIndexedDB = (): UseIndexedDBReturn => {
  // State management
  const [isInitialized, setIsInitialized] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Manager instance
  const managerRef = useRef<FatePoolsIndexedDBManager | null>(null);
  const isClientRef = useRef(false);

  // Check if we're on the client side
  useEffect(() => {
    isClientRef.current = typeof window !== 'undefined';
    if (isClientRef.current) {
      setIsOnline(navigator.onLine);
    }
  }, []);

  // Monitor online status
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

  // Initialize database
  useEffect(() => {
    const initializeDB = async () => {
      if (!isClientRef.current) return;
      
      try {
        if (!managerRef.current) {
          managerRef.current = new FatePoolsIndexedDBManager();
        }
        
        await managerRef.current.init();
        setIsInitialized(true);
        setError(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to initialize database';
        setError(errorMessage);
        console.error('IndexedDB initialization failed:', err);
      }
    };

    initializeDB();
  }, []);

  // Helper function to check if operations are allowed
  const canOperate = useCallback(() => {
    return isInitialized && isClientRef.current && managerRef.current !== null;
  }, [isInitialized]);

  // Wrapper functions with error handling
  const safeOperation = useCallback(async <T>(operation: () => Promise<T>): Promise<T> => {
    if (!canOperate()) {
      throw new Error('Database not initialized or not available');
    }
    
    try {
      return await operation();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Database operation failed';
      setError(errorMessage);
      throw err;
    }
  }, [canOperate]);

  // Pool operations
  const savePoolDetails = useCallback(async (pool: Omit<PoolDetails, 'createdAt' | 'updatedAt'>) => {
    return safeOperation(() => managerRef.current!.savePoolDetails(pool));
  }, [safeOperation]);

  const getPoolDetails = useCallback(async (poolId: string) => {
    return safeOperation(() => managerRef.current!.getPoolDetails(poolId));
  }, [safeOperation]);

  const getAllPoolsForChain = useCallback(async (chainId: SupportedChainId) => {
    return safeOperation(() => managerRef.current!.getAllPoolsForChain(chainId));
  }, [safeOperation]);

  const getAllPools = useCallback(async () => {
    return safeOperation(() => managerRef.current!.getAllPools());
  }, [safeOperation]);

  const getPoolsByCreator = useCallback(async (creator: string, chainId?: SupportedChainId) => {
    return safeOperation(() => managerRef.current!.getPoolsByCreator(creator, chainId));
  }, [safeOperation]);

  const batchSavePools = useCallback(async (pools: Omit<PoolDetails, 'createdAt' | 'updatedAt'>[]) => {
    return safeOperation(() => managerRef.current!.batchSavePools(pools));
  }, [safeOperation]);

  // Token operations
  const saveTokenDetails = useCallback(async (token: Omit<TokenDetails, 'createdAt' | 'updatedAt'>) => {
    return safeOperation(() => managerRef.current!.saveTokenDetails(token));
  }, [safeOperation]);

  const getTokenDetails = useCallback(async (tokenId: string) => {
    return safeOperation(() => managerRef.current!.getTokenDetails(tokenId));
  }, [safeOperation]);

  const getTokensForPool = useCallback(async (poolAddress: string) => {
    return safeOperation(() => managerRef.current!.getTokensForPool(poolAddress));
  }, [safeOperation]);

  const batchSaveTokens = useCallback(async (tokens: Omit<TokenDetails, 'createdAt' | 'updatedAt'>[]) => {
    return safeOperation(() => managerRef.current!.batchSaveTokens(tokens));
  }, [safeOperation]);

  // Chain status operations
  const saveChainStatus = useCallback(async (status: Omit<ChainStatus, 'createdAt' | 'updatedAt'>) => {
    return safeOperation(() => managerRef.current!.saveChainStatus(status));
  }, [safeOperation]);

  const getChainStatus = useCallback(async (chainId: SupportedChainId) => {
    return safeOperation(() => managerRef.current!.getChainStatus(chainId));
  }, [safeOperation]);

  const getAllChainStatuses = useCallback(async () => {
    return safeOperation(() => managerRef.current!.getAllChainStatuses());
  }, [safeOperation]);

  // Cache operations
  const saveCache = useCallback(async (key: string, data: unknown, ttlMinutes?: number, chainId?: SupportedChainId) => {
    return safeOperation(() => managerRef.current!.saveCache(key, data, ttlMinutes, chainId));
  }, [safeOperation]);

  const getCache = useCallback(async (key: string) => {
    return safeOperation(() => managerRef.current!.getCache(key));
  }, [safeOperation]);

  const deleteCache = useCallback(async (key: string) => {
    return safeOperation(() => managerRef.current!.deleteCache(key));
  }, [safeOperation]);

  const cleanupExpiredCache = useCallback(async () => {
    return safeOperation(() => managerRef.current!.cleanupExpiredCache());
  }, [safeOperation]);

  // Portfolio operations
  const savePortfolioPosition = useCallback(async (position: Omit<PortfolioPosition, 'lastUpdated'>) => {
    return safeOperation(() => managerRef.current!.savePortfolioPosition(position));
  }, [safeOperation]);

  const getPortfolioPositions = useCallback(async (userAddress: string, chainId?: SupportedChainId) => {
    return safeOperation(() => managerRef.current!.getPortfolioPositions(userAddress, chainId));
  }, [safeOperation]);

  const savePortfolioTransaction = useCallback(async (transaction: Omit<PortfolioTransaction, 'timestamp'>) => {
    return safeOperation(() => managerRef.current!.savePortfolioTransaction(transaction));
  }, [safeOperation]);

  const getPortfolioTransactions = useCallback(async (userAddress: string, chainId?: SupportedChainId) => {
    return safeOperation(() => managerRef.current!.getPortfolioTransactions(userAddress, chainId));
  }, [safeOperation]);

  const savePortfolioCache = useCallback(async (cache: Omit<PortfolioCache, 'lastUpdated'>) => {
    return safeOperation(() => managerRef.current!.savePortfolioCache(cache));
  }, [safeOperation]);

  const getPortfolioCache = useCallback(async (userAddress: string, chainId: SupportedChainId) => {
    return safeOperation(() => managerRef.current!.getPortfolioCache(userAddress, chainId));
  }, [safeOperation]);

  const deletePortfolioCache = useCallback(async (userAddress: string, chainId: SupportedChainId) => {
    return safeOperation(() => managerRef.current!.deletePortfolioCache(userAddress, chainId));
  }, [safeOperation]);

  const deletePortfolioPositions = useCallback(async (userAddress: string, chainId: SupportedChainId) => {
    return safeOperation(() => managerRef.current!.deletePortfolioPositions(userAddress, chainId));
  }, [safeOperation]);

  const deletePortfolioTransactions = useCallback(async (userAddress: string, chainId: SupportedChainId) => {
    return safeOperation(() => managerRef.current!.deletePortfolioTransactions(userAddress, chainId));
  }, [safeOperation]);

  // Utility operations
  const clearAllData = useCallback(async () => {
    return safeOperation(() => managerRef.current!.clearAllData());
  }, [safeOperation]);

  const getDatabaseInfo = useCallback(async () => {
    return safeOperation(() => managerRef.current!.getDatabaseInfo());
  }, [safeOperation]);

  const isHealthy = useCallback(async () => {
    return safeOperation(() => managerRef.current!.isHealthy());
  }, [safeOperation]);

  return {
    // State
    isInitialized,
    isOnline,
    error,
    
    // Pool operations
    savePoolDetails,
    getPoolDetails,
    getAllPoolsForChain,
    getAllPools,
    getPoolsByCreator,
    batchSavePools,
    
    // Token operations
    saveTokenDetails,
    getTokenDetails,
    getTokensForPool,
    batchSaveTokens,
    
    // Chain status operations
    saveChainStatus,
    getChainStatus,
    getAllChainStatuses,
    
    // Cache operations
    saveCache,
    getCache,
    deleteCache,
    cleanupExpiredCache,
    
    // Portfolio operations
    savePortfolioPosition,
    getPortfolioPositions,
    savePortfolioTransaction,
    getPortfolioTransactions,
    savePortfolioCache,
    getPortfolioCache,
    deletePortfolioCache,
    deletePortfolioPositions,
    deletePortfolioTransactions,
    
    // Utility operations
    clearAllData,
    getDatabaseInfo,
    isHealthy
  };
};
