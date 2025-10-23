// src/lib/fatePoolHook.ts
// Legacy wrapper for backward compatibility with existing components

"use client";

import { useCallback } from 'react';
import { useIndexedDB } from '@/hooks/useIndexedDB';
import type {
  PoolDetails,
  TokenDetails,
  ChainStatus,
  PortfolioPosition,
  PortfolioTransaction,
  PortfolioCache,
  SupportedChainId
} from '@/lib/indexeddb/config';

// Legacy interface for backward compatibility
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
  
  // Portfolio operations
  savePortfolioPosition: (position: Omit<PortfolioPosition, 'id'>) => Promise<void>;
  getPortfolioPositions: (userAddress: string, chainId: SupportedChainId) => Promise<PortfolioPosition[]>;
  savePortfolioTransaction: (transaction: Omit<PortfolioTransaction, 'id'>) => Promise<void>;
  getPortfolioTransactions: (userAddress: string, chainId: SupportedChainId) => Promise<PortfolioTransaction[]>;
  savePortfolioCache: (cache: Omit<PortfolioCache, 'userAddress'> & { userAddress: string }) => Promise<void>;
  getPortfolioCache: (userAddress: string, chainId: SupportedChainId) => Promise<PortfolioCache | null>;
  clearPortfolioData: (userAddress: string, chainId?: SupportedChainId) => Promise<void>;
  
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
  // Use the new centralized IndexedDB hook
  const indexedDB = useIndexedDB();

  // Legacy wrapper functions to maintain backward compatibility
  const savePortfolioPosition = useCallback(async (position: Omit<PortfolioPosition, 'id'>) => {
    const positionWithId: Omit<PortfolioPosition, 'lastUpdated'> = {
      ...position,
      id: `${position.userAddress}-${position.poolAddress}-${position.tokenType}-${Date.now()}`
    };
    return indexedDB.savePortfolioPosition(positionWithId);
  }, [indexedDB]);

  const getPortfolioPositions = useCallback(async (userAddress: string, chainId: SupportedChainId) => {
    return indexedDB.getPortfolioPositions(userAddress, chainId);
  }, [indexedDB]);

  const savePortfolioTransaction = useCallback(async (transaction: Omit<PortfolioTransaction, 'id'>) => {
    const transactionWithId: Omit<PortfolioTransaction, 'timestamp'> = {
      ...transaction,
      id: `${transaction.userAddress}-${transaction.poolAddress}-${transaction.transactionHash}`
    };
    return indexedDB.savePortfolioTransaction(transactionWithId);
  }, [indexedDB]);

  const getPortfolioTransactions = useCallback(async (userAddress: string, chainId: SupportedChainId) => {
    return indexedDB.getPortfolioTransactions(userAddress, chainId);
  }, [indexedDB]);

  const savePortfolioCache = useCallback(async (cache: Omit<PortfolioCache, 'userAddress'> & { userAddress: string }) => {
    return indexedDB.savePortfolioCache(cache);
  }, [indexedDB]);

  const getPortfolioCache = useCallback(async (userAddress: string, chainId: SupportedChainId) => {
    return indexedDB.getPortfolioCache(userAddress, chainId);
  }, [indexedDB]);

  const clearPortfolioData = useCallback(async (userAddress: string, chainId?: SupportedChainId) => {
    if (chainId) {
      // Clear specific user's data for specific chain
      await indexedDB.deletePortfolioCache(userAddress, chainId);
      await indexedDB.deletePortfolioPositions(userAddress, chainId);
      await indexedDB.deletePortfolioTransactions(userAddress, chainId);
    } else {
      // Clear all portfolio data for user across all chains
      // This would require iterating through all supported chains
      // For now, we'll clear the cache without chainId (legacy behavior)
      await indexedDB.deletePortfolioCache(userAddress, 1 as SupportedChainId); // Fallback
      await indexedDB.deletePortfolioPositions(userAddress, 1 as SupportedChainId); // Fallback
      await indexedDB.deletePortfolioTransactions(userAddress, 1 as SupportedChainId); // Fallback
    }
  }, [indexedDB]);

  const getDatabaseInfo = useCallback(async () => {
    const info = await indexedDB.getDatabaseInfo();
    return {
      name: info.name,
      version: info.version,
      stores: info.objectStoreNames,
      isConnected: await indexedDB.isHealthy(),
      totalPools: 0, // Will be calculated if needed
      totalTokens: 0 // Will be calculated if needed
    };
  }, [indexedDB]);

  return {
    // Database state
    isInitialized: indexedDB.isInitialized,
    error: indexedDB.error,
    isOnline: indexedDB.isOnline,
    
    // Pool operations
    savePoolDetails: indexedDB.savePoolDetails,
    getPoolDetails: indexedDB.getPoolDetails,
    getAllPoolsForChain: indexedDB.getAllPoolsForChain,
    getAllPools: indexedDB.getAllPools,
    getPoolsByCreator: indexedDB.getPoolsByCreator,
    batchSavePools: indexedDB.batchSavePools,
    
    // Token operations
    saveTokenDetails: indexedDB.saveTokenDetails,
    getTokenDetails: indexedDB.getTokenDetails,
    getTokensForPool: indexedDB.getTokensForPool,
    batchSaveTokens: indexedDB.batchSaveTokens,
    
    // Chain status operations
    saveChainStatus: indexedDB.saveChainStatus,
    getChainStatus: indexedDB.getChainStatus,
    getAllChainStatuses: indexedDB.getAllChainStatuses,
    
    // Cache operations
    saveCache: indexedDB.saveCache,
    getCache: indexedDB.getCache,
    deleteCache: indexedDB.deleteCache,
    
    // Cleanup operations
    cleanupExpiredCache: indexedDB.cleanupExpiredCache,
    clearAllData: indexedDB.clearAllData,
    
    // Portfolio operations (with legacy compatibility)
    savePortfolioPosition,
    getPortfolioPositions,
    savePortfolioTransaction,
    getPortfolioTransactions,
    savePortfolioCache,
    getPortfolioCache,
    clearPortfolioData,
    
    // Database info (with legacy format)
    getDatabaseInfo
  };
};