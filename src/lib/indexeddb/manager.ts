// src/lib/indexeddb/manager.ts
// Web3-specific operations and data management

import { logger } from '@/lib/logger';
import { IndexedDBDatabase } from './database';
import {
  type PoolDetails,
  type TokenDetails,
  type ChainStatus,
  type CacheMetadata,
  type PortfolioPosition,
  type PortfolioTransaction,
  type PortfolioCache,
  type SupportedChainId,
  CACHE_CONFIG,
  DATABASE_CONFIG
} from './config';

export class FatePoolsIndexedDBManager {
  private db: IndexedDBDatabase;

  constructor() {
    this.db = new IndexedDBDatabase();
  }

  async init(): Promise<void> {
    await this.db.init(this.handleUpgrade.bind(this));
  }

  private handleUpgrade(db: IDBDatabase, transaction: IDBTransaction, oldVersion: number, newVersion: number): void {
    console.log(`Upgrading database from version ${oldVersion} to ${newVersion}`);
    if (oldVersion < 4) {
      this.migrateToV4(db, transaction);
    }
  }

  private migrateToV4(db: IDBDatabase, transaction: IDBTransaction): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const positionStore = transaction.objectStore('portfolioPositions');
        const request = positionStore.getAll();

        request.onsuccess = () => {
          const positions = request.result as PortfolioPosition[];
          if (!positions || positions.length === 0) {
            logger.info('No positions to migrate.');
            resolve();
            return;
          }

          let pending = positions.length;
          let hasError = false;

          positions.forEach(position => {
            const upgradedPosition: PortfolioPosition = {
              ...position,
              totalBought: 0,
              totalSold: 0,
              totalInvested: 0,
              totalReceived: 0,
              avgBuyPrice: 0,
              realizedPnL: 0,
              unrealizedPnL: 0
            };

            const putRequest = positionStore.put(upgradedPosition);

            putRequest.onsuccess = () => {
              pending--;
              if (pending === 0 && !hasError) {
                logger.info(`Migrated ${positions.length} positions to v4 schema.`);

                // Also wait for transaction to complete for extra safety
                transaction.oncomplete = () => {
                  resolve();
                };

                transaction.onerror = () => {
                  reject(transaction.error || new Error('Transaction error after migration'));
                };

                transaction.onabort = () => {
                  reject(transaction.error || new Error('Transaction aborted after migration'));
                };
              }
            };

            putRequest.onerror = () => {
              if (!hasError) {
                hasError = true;
                reject(new Error('Failed to update position during migration'));
              }
            };
          });
        };

        request.onerror = () => {
          logger.error('Failed to read positions for migration');
          reject(new Error('Failed to read positions for migration'));
        };

        // Transaction pruning is handled by the app on next write (30 transactions limit)

      } catch (error) {
        logger.error('Migration to v4 failed:', error instanceof Error ? error : new Error(String(error)));
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    });
  }

  async close(): Promise<void> {
    await this.db.close();
  }

  // Pool Details Operations
  async savePoolDetails(pool: Omit<PoolDetails, 'createdAt' | 'updatedAt'>): Promise<void> {
    const now = Date.now();
    const poolData: PoolDetails = {
      ...pool,
      createdAt: now,
      updatedAt: now
    };
    await this.db.put('poolDetails', poolData);
    logger.debug('Pool details saved:', { poolId: pool.id });
  }

  async getPoolDetails(poolId: string): Promise<PoolDetails | null> {
    return await this.db.get<PoolDetails>('poolDetails', poolId);
  }

  async getAllPoolsForChain(chainId: SupportedChainId): Promise<PoolDetails[]> {
    return await this.db.getAll<PoolDetails>('poolDetails', 'chainId', chainId);
  }

  async getAllPools(): Promise<PoolDetails[]> {
    return await this.db.getAll<PoolDetails>('poolDetails');
  }

  async getPoolsByCreator(creator: string, chainId?: SupportedChainId): Promise<PoolDetails[]> {
    if (chainId) {
      // Get all pools for chain, then filter by creator
      const allPools = await this.getAllPoolsForChain(chainId);
      return allPools.filter(pool => pool.vaultCreator.toLowerCase() === creator.toLowerCase());
    } else {
      // Get all pools, then filter by creator
      const allPools = await this.getAllPools();
      return allPools.filter(pool => pool.vaultCreator.toLowerCase() === creator.toLowerCase());
    }
  }

  async batchSavePools(pools: Omit<PoolDetails, 'createdAt' | 'updatedAt'>[]): Promise<void> {
    const now = Date.now();
    const poolsData: PoolDetails[] = pools.map(pool => ({
      ...pool,
      createdAt: now,
      updatedAt: now
    }));

    // Save all pools in a single transaction
    for (const poolData of poolsData) {
      await this.db.put('poolDetails', poolData);
    }
    logger.debug(`Batch saved ${pools.length} pools`);
  }

  // Token Details Operations
  async saveTokenDetails(token: Omit<TokenDetails, 'createdAt' | 'updatedAt'>): Promise<void> {
    const now = Date.now();
    const tokenData: TokenDetails = {
      ...token,
      createdAt: now,
      updatedAt: now
    };
    await this.db.put('tokenDetails', tokenData);
    logger.debug('Token details saved:', { tokenId: token.id });
  }

  async getTokenDetails(tokenId: string): Promise<TokenDetails | null> {
    return await this.db.get<TokenDetails>('tokenDetails', tokenId);
  }

  async getTokensForPool(poolAddress: string): Promise<TokenDetails[]> {
    return await this.db.getAll<TokenDetails>('tokenDetails', 'poolAddress', poolAddress);
  }

  async batchSaveTokens(tokens: Omit<TokenDetails, 'createdAt' | 'updatedAt'>[]): Promise<void> {
    const now = Date.now();
    const tokensData: TokenDetails[] = tokens.map(token => ({
      ...token,
      createdAt: now,
      updatedAt: now
    }));

    for (const tokenData of tokensData) {
      await this.db.put('tokenDetails', tokenData);
    }
    logger.debug(`Batch saved ${tokens.length} tokens`);
  }

  // Chain Status Operations
  async saveChainStatus(status: Omit<ChainStatus, 'createdAt' | 'updatedAt'>): Promise<void> {
    const now = Date.now();
    const statusData: ChainStatus = {
      ...status,
      createdAt: now,
      updatedAt: now
    };
    await this.db.put('chainStatus', statusData);
    logger.debug('Chain status saved:', { chainId: status.chainId });
  }

  async getChainStatus(chainId: SupportedChainId): Promise<ChainStatus | null> {
    return await this.db.get<ChainStatus>('chainStatus', chainId);
  }

  async getAllChainStatuses(): Promise<ChainStatus[]> {
    return await this.db.getAll<ChainStatus>('chainStatus');
  }

  // Cache Operations
  async saveCache(key: string, data: unknown, ttlMinutes: number = CACHE_CONFIG.defaultTTL, chainId?: SupportedChainId): Promise<void> {
    const now = Date.now();
    const cacheData: CacheMetadata = {
      key,
      chainId,
      data,
      ttlMinutes,
      expiresAt: now + (ttlMinutes * 60 * 1000),
      createdAt: now,
      updatedAt: now
    };
    await this.db.put('cacheMetadata', cacheData);
    logger.debug('Cache saved:', { key });
  }

  async getCache(key: string): Promise<unknown | null> {
    const cacheData = await this.db.get<CacheMetadata>('cacheMetadata', key);

    if (!cacheData) {
      return null;
    }

    // Check if cache has expired
    if (Date.now() > cacheData.expiresAt) {
      await this.deleteCache(key);
      return null;
    }

    return cacheData.data;
  }

  async deleteCache(key: string): Promise<void> {
    await this.db.delete('cacheMetadata', key);
    logger.debug('Cache deleted:', { key });
  }

  async cleanupExpiredCache(): Promise<void> {
    const now = Date.now();
    const allCache = await this.db.getAll<CacheMetadata>('cacheMetadata');

    for (const cache of allCache) {
      if (now > cache.expiresAt) {
        await this.deleteCache(cache.key);
      }
    }
    logger.debug('Expired cache cleaned up');
  }

  // Portfolio Operations
  async savePortfolioPosition(position: Omit<PortfolioPosition, 'lastUpdated'>): Promise<void> {
    const now = Date.now();
    const positionData: PortfolioPosition = {
      ...position,
      lastUpdated: now
    };
    await this.db.put('portfolioPositions', positionData);
    logger.debug('Portfolio position saved:', { positionId: position.id });
  }

  async getPortfolioPositions(userAddress: string, chainId?: SupportedChainId): Promise<PortfolioPosition[]> {
    if (chainId) {
      // Get positions for specific user and chain
      const allPositions = await this.db.getAll<PortfolioPosition>('portfolioPositions', 'userAddress', userAddress);
      return allPositions.filter(pos => pos.chainId === chainId);
    } else {
      return await this.db.getAll<PortfolioPosition>('portfolioPositions', 'userAddress', userAddress);
    }
  }

  async savePortfolioTransaction(transaction: Omit<PortfolioTransaction, 'timestamp'>): Promise<void> {
    const now = Date.now();
    const transactionData: PortfolioTransaction = {
      ...transaction,
      timestamp: now
    };
    await this.db.put('portfolioTransactions', transactionData);
    logger.debug('Portfolio transaction saved:', { transactionId: transaction.id });
  }

  async getPortfolioTransactions(userAddress: string, chainId?: SupportedChainId): Promise<PortfolioTransaction[]> {
    if (chainId) {
      const allTransactions = await this.db.getAll<PortfolioTransaction>('portfolioTransactions', 'userAddress', userAddress);
      return allTransactions.filter(tx => tx.chainId === chainId);
    } else {
      return await this.db.getAll<PortfolioTransaction>('portfolioTransactions', 'userAddress', userAddress);
    }
  }

  // Portfolio Cache Operations
  async savePortfolioCache(cache: Omit<PortfolioCache, 'lastUpdated'>): Promise<void> {
    const now = Date.now();
    const cacheData: PortfolioCache = {
      ...cache,
      lastUpdated: now
    };

    // Use composite key for multi-chain support
    const cacheKey = `${cache.userAddress}-${cache.chainId}`;
    const cacheWithKey = {
      ...cacheData,
      userAddress: cacheKey // Override userAddress with composite key
    };

    await this.db.put('portfolioCache', cacheWithKey);
    logger.debug('Portfolio cache saved for user:', { userAddress: cache.userAddress, chainId: cache.chainId });
  }

  async getPortfolioCache(userAddress: string, chainId: SupportedChainId): Promise<PortfolioCache | null> {
    // First try to get by userAddress + chainId combination
    const cacheKey = `${userAddress}-${chainId}`;
    const cache = await this.db.get<PortfolioCache>('portfolioCache', cacheKey);

    if (cache) {
      return cache;
    }

    // Fallback: get by userAddress and filter by chainId
    const allCache = await this.db.get<PortfolioCache>('portfolioCache', userAddress);
    if (allCache && allCache.chainId === chainId) {
      return allCache;
    }

    return null;
  }

  async deletePortfolioCache(userAddress: string, chainId: SupportedChainId): Promise<void> {
    // Try to delete by userAddress + chainId combination first
    const cacheKey = `${userAddress}-${chainId}`;
    await this.db.delete('portfolioCache', cacheKey);
    logger.debug('Portfolio cache deleted for user:', { userAddress, chainId });
  }

  async deletePortfolioPositions(userAddress: string, chainId: SupportedChainId): Promise<void> {
    // Get all positions for the user
    const allPositions = await this.db.getAll<PortfolioPosition>('portfolioPositions', 'userAddress', userAddress);

    // Filter positions for the specific chain and delete them
    const positionsToDelete = allPositions.filter(pos => pos.chainId === chainId);

    for (const position of positionsToDelete) {
      await this.db.delete('portfolioPositions', position.id);
    }

    logger.debug('Portfolio positions deleted for user:', { userAddress, chainId, deletedCount: positionsToDelete.length });
  }

  async deletePortfolioTransactions(userAddress: string, chainId: SupportedChainId): Promise<void> {
    // Get all transactions for the user
    const allTransactions = await this.db.getAll<PortfolioTransaction>('portfolioTransactions', 'userAddress', userAddress);

    // Filter transactions for the specific chain and delete them
    const transactionsToDelete = allTransactions.filter(tx => tx.chainId === chainId);

    for (const transaction of transactionsToDelete) {
      await this.db.delete('portfolioTransactions', transaction.id);
    }

    logger.debug('Portfolio transactions deleted for user:', { userAddress, chainId, deletedCount: transactionsToDelete.length });
  }

  // Utility Operations
  async clearAllData(): Promise<void> {
    // Dynamically get store names from DATABASE_CONFIG
    const storeNames = DATABASE_CONFIG.stores.map(store => store.name);

    for (const storeName of storeNames) {
      await this.db.clear(storeName);
    }
    logger.debug('All data cleared from database');
  }

  async getDatabaseInfo(): Promise<{ name: string; version: number; objectStoreNames: string[] }> {
    return await this.db.getDatabaseInfo();
  }

  async getStoreCount(storeName: string): Promise<number> {
    return await this.db.count(storeName);
  }

  // Health check
  async isHealthy(): Promise<boolean> {
    try {
      await this.db.getDatabaseInfo();
      return true;
    } catch (error) {
      logger.error('Database health check failed:', error as Error);
      return false;
    }
  }
}
