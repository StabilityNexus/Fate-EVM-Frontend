// src/utils/indexedDB.ts

// IndexedDB service for storing Fate Pools data
// Following best practices with versioning, proper indexing, and error handling

import { logger } from '@/lib/logger';

import type { 
  PoolDetails, 
  TokenDetails, 
  ChainStatus, 
  CacheMetadata,
  PortfolioPosition,
  PortfolioTransaction,
  PortfolioCache,
  SupportedChainId 
} from './indexedDBTypes';

export class FatePoolsIndexedDBService {
  private dbName = 'FatePoolsDB';
  private dbVersion = 3;
  private db: IDBDatabase | null = null;

  private readonly stores = {
    poolDetails: 'poolDetails',
    tokenDetails: 'tokenDetails',
    bullTokens: 'bullTokens',
    bearTokens: 'bearTokens',
    chainStatus: 'chainStatus',
    cacheMetadata: 'cacheMetadata',
    portfolioPositions: 'portfolioPositions',
    portfolioTransactions: 'portfolioTransactions',
    portfolioCache: 'portfolioCache'
  } as const;

  async init(): Promise<void> {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      throw new Error('IndexedDB is not available on server side');
    }
    
    // Check if IndexedDB is supported
    if (!window.indexedDB) {
      throw new Error('IndexedDB is not supported in this browser');
    }

    return new Promise((resolve, reject) => {
      const request = window.indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        logger.error('FatePoolsDB failed to open:', request.error instanceof Error ? request.error : undefined);
        reject(new Error(`Failed to open IndexedDB: ${request.error?.message}`));
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.db.onerror = (event) => {
          logger.error('Database error:', event instanceof Error ? event : undefined);
        };
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(this.stores.poolDetails)) {
          const poolStore = db.createObjectStore(this.stores.poolDetails, { keyPath: 'id' });
          poolStore.createIndex('chainId', 'chainId', { unique: false });
          poolStore.createIndex('creator', 'creator', { unique: false });
          poolStore.createIndex('name', 'name', { unique: false });
          poolStore.createIndex('chainId_creator', ['chainId', 'creator'], { unique: false });
          poolStore.createIndex('updatedAt', 'updatedAt', { unique: false });
          poolStore.createIndex('userAddress', 'userAddress', { unique: false });
          poolStore.createIndex('priceFeedAddress', 'priceFeedAddress', { unique: false });
        }

        if (!db.objectStoreNames.contains(this.stores.tokenDetails)) {
          const tokenStore = db.createObjectStore(this.stores.tokenDetails, { keyPath: 'id' });
          tokenStore.createIndex('chainId', 'chainId', { unique: false });
          tokenStore.createIndex('prediction_pool', 'prediction_pool', { unique: false });
          tokenStore.createIndex('symbol', 'symbol', { unique: false });
          tokenStore.createIndex('vault_creator', 'vault_creator', { unique: false });
          tokenStore.createIndex('updatedAt', 'updatedAt', { unique: false });
          tokenStore.createIndex('chainId_pool', ['chainId', 'prediction_pool'], { unique: false });
        }

        if (!db.objectStoreNames.contains(this.stores.bullTokens)) {
          const bullTokenStore = db.createObjectStore(this.stores.bullTokens, { keyPath: 'id' });
          bullTokenStore.createIndex('chainId', 'chainId', { unique: false });
          bullTokenStore.createIndex('prediction_pool', 'prediction_pool', { unique: false });
          bullTokenStore.createIndex('symbol', 'symbol', { unique: false });
          bullTokenStore.createIndex('vault_creator', 'vault_creator', { unique: false });
          bullTokenStore.createIndex('updatedAt', 'updatedAt', { unique: false });
          bullTokenStore.createIndex('chainId_pool', ['chainId', 'prediction_pool'], { unique: false });
        }

        if (!db.objectStoreNames.contains(this.stores.bearTokens)) {
          const bearTokenStore = db.createObjectStore(this.stores.bearTokens, { keyPath: 'id' });
          bearTokenStore.createIndex('chainId', 'chainId', { unique: false });
          bearTokenStore.createIndex('prediction_pool', 'prediction_pool', { unique: false });
          bearTokenStore.createIndex('symbol', 'symbol', { unique: false });
          bearTokenStore.createIndex('vault_creator', 'vault_creator', { unique: false });
          bearTokenStore.createIndex('updatedAt', 'updatedAt', { unique: false });
          bearTokenStore.createIndex('chainId_pool', ['chainId', 'prediction_pool'], { unique: false });
        }

        if (!db.objectStoreNames.contains(this.stores.chainStatus)) {
          const chainStore = db.createObjectStore(this.stores.chainStatus, { keyPath: 'chainId' });
          chainStore.createIndex('chainName', 'chainName', { unique: false });
          chainStore.createIndex('lastSyncTime', 'lastSyncTime', { unique: false });
          chainStore.createIndex('poolCount', 'poolCount', { unique: false });
          chainStore.createIndex('isLoading', 'isLoading', { unique: false });
          chainStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        }

        if (!db.objectStoreNames.contains(this.stores.cacheMetadata)) {
          const cacheStore = db.createObjectStore(this.stores.cacheMetadata, { keyPath: 'key' });
          cacheStore.createIndex('chainId', 'chainId', { unique: false });
          cacheStore.createIndex('expiresAt', 'expiresAt', { unique: false });
          cacheStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        }

        // Portfolio-specific stores
        if (!db.objectStoreNames.contains(this.stores.portfolioPositions)) {
          const positionStore = db.createObjectStore(this.stores.portfolioPositions, { keyPath: 'id' });
          positionStore.createIndex('userAddress', 'userAddress', { unique: false });
          positionStore.createIndex('chainId', 'chainId', { unique: false });
          positionStore.createIndex('tokenAddress', 'tokenAddress', { unique: false });
          positionStore.createIndex('userAddress_chainId', ['userAddress', 'chainId'], { unique: false });
          positionStore.createIndex('lastUpdated', 'lastUpdated', { unique: false });
          positionStore.createIndex('blockNumber', 'blockNumber', { unique: false });
        }

        if (!db.objectStoreNames.contains(this.stores.portfolioTransactions)) {
          const transactionStore = db.createObjectStore(this.stores.portfolioTransactions, { keyPath: 'id' });
          transactionStore.createIndex('userAddress', 'userAddress', { unique: false });
          transactionStore.createIndex('chainId', 'chainId', { unique: false });
          transactionStore.createIndex('tokenAddress', 'tokenAddress', { unique: false });
          transactionStore.createIndex('userAddress_chainId', ['userAddress', 'chainId'], { unique: false });
          transactionStore.createIndex('blockNumber', 'blockNumber', { unique: false });
          transactionStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        if (!db.objectStoreNames.contains(this.stores.portfolioCache)) {
          const portfolioCacheStore = db.createObjectStore(this.stores.portfolioCache, { keyPath: 'userAddress' });
          portfolioCacheStore.createIndex('chainId', 'chainId', { unique: false });
          portfolioCacheStore.createIndex('lastUpdated', 'lastUpdated', { unique: false });
          portfolioCacheStore.createIndex('expiresAt', 'expiresAt', { unique: false });
          portfolioCacheStore.createIndex('blockNumber', 'blockNumber', { unique: false });
        }
      };
    });
  }

  private async ensureDB(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.init();
    }
    if (!this.db) {
      throw new Error('Failed to initialize database');
    }
    
    // Verify all required stores exist
    const requiredStores = Object.values(this.stores);
    const existingStores = Array.from(this.db.objectStoreNames);
    const missingStores = requiredStores.filter(store => !existingStores.includes(store));
    
    if (missingStores.length > 0) {
      logger.error('Missing object stores:', new Error(missingStores.join(', ')));
      logger.info('Attempting to reinitialize database...');
      
      try {
        await this.forceReinit();
        // Verify stores exist after reinit
        const newExistingStores = Array.from(this.db!.objectStoreNames);
        const stillMissing = requiredStores.filter(store => !newExistingStores.includes(store));
        
        if (stillMissing.length > 0) {
          throw new Error(`Still missing stores after reinit: ${stillMissing.join(', ')}`);
        }
        
        logger.info('Database successfully reinitialized with all required stores');
      } catch (error) {
        logger.error('Failed to reinitialize database:', error instanceof Error ? error : undefined);
        throw new Error(`Missing required object stores: ${missingStores.join(', ')}. Failed to reinitialize database. Please refresh the page.`);
      }
    }
    
    return this.db;
  }

  // --- Pool Details operations ---
  async savePoolDetails(poolDetails: Omit<PoolDetails, 'createdAt' | 'updatedAt'>): Promise<void> {
    const db = await this.ensureDB();
    const now = Date.now();
    const transaction = db.transaction([this.stores.poolDetails], 'readwrite');
    const store = transaction.objectStore(this.stores.poolDetails);
    const existing = await this.getPoolDetails(poolDetails.id);
    const dataToSave: PoolDetails = { ...poolDetails, createdAt: existing?.createdAt || now, updatedAt: now };
    return new Promise((resolve, reject) => {
      const request = store.put(dataToSave);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error(`Failed to save pool details: ${request.error?.message}`));
    });
  }

  async getPoolDetails(poolId: string): Promise<PoolDetails | null> {
    const db = await this.ensureDB();
    const transaction = db.transaction([this.stores.poolDetails], 'readonly');
    const store = transaction.objectStore(this.stores.poolDetails);
    return new Promise((resolve, reject) => {
      const request = store.get(poolId);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(new Error(`Failed to get pool details: ${request.error?.message}`));
    });
  }

  async getAllPoolsForChain(chainId: SupportedChainId): Promise<PoolDetails[]> {
    const db = await this.ensureDB();
    const transaction = db.transaction([this.stores.poolDetails], 'readonly');
    const store = transaction.objectStore(this.stores.poolDetails);
    return new Promise((resolve, reject) => {
      const results: PoolDetails[] = [];
      const request = store.index('chainId').openCursor(IDBKeyRange.only(chainId));
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          results.push(cursor.value);
          cursor.continue();
        } else {
          results.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
          resolve(results);
        }
      };
      request.onerror = () => reject(new Error(`Failed to get pools for chain: ${request.error?.message}`));
    });
  }

  async getAllPools(): Promise<PoolDetails[]> {
    const db = await this.ensureDB();
    const transaction = db.transaction([this.stores.poolDetails], 'readonly');
    const store = transaction.objectStore(this.stores.poolDetails);
    return new Promise((resolve, reject) => {
      const results: PoolDetails[] = [];
      const request = store.openCursor();
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          results.push(cursor.value);
          cursor.continue();
        } else {
          results.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
          resolve(results);
        }
      };
      request.onerror = () => reject(new Error(`Failed to get all pools: ${request.error?.message}`));
    });
  }

  async getPoolsByCreator(creator: string, chainId?: SupportedChainId): Promise<PoolDetails[]> {
    const db = await this.ensureDB();
    const transaction = db.transaction([this.stores.poolDetails], 'readonly');
    const store = transaction.objectStore(this.stores.poolDetails);
    return new Promise((resolve, reject) => {
      const results: PoolDetails[] = [];
      const indexName = chainId ? 'chainId_creator' : 'creator';
      const keyRange = chainId ? IDBKeyRange.only([chainId, creator]) : IDBKeyRange.only(creator);
      const request = store.index(indexName).openCursor(keyRange);
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          results.push(cursor.value);
          cursor.continue();
        } else {
          results.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
          resolve(results);
        }
      };
      request.onerror = () => reject(new Error(`Failed to get pools by creator: ${request.error?.message}`));
    });
  }

  // --- Token Details operations ---
  async saveTokenDetails(tokenDetails: Omit<TokenDetails, 'createdAt' | 'updatedAt'>): Promise<void> {
    const db = await this.ensureDB();
    const now = Date.now();
    const existing = await this.getTokenDetails(tokenDetails.id);
    const transaction = db.transaction([this.stores.tokenDetails], 'readwrite');
    const store = transaction.objectStore(this.stores.tokenDetails);
    const dataToSave: TokenDetails = { ...tokenDetails, createdAt: existing?.createdAt || now, updatedAt: now };
    return new Promise((resolve, reject) => {
      const request = store.put(dataToSave);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error(`Failed to save token details: ${request.error?.message}`));
    });
  }

  async getTokenDetails(tokenId: string): Promise<TokenDetails | null> {
    const db = await this.ensureDB();
    const transaction = db.transaction([this.stores.tokenDetails], 'readonly');
    const store = transaction.objectStore(this.stores.tokenDetails);
    return new Promise((resolve, reject) => {
      const request = store.get(tokenId);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(new Error(`Failed to get token details: ${request.error?.message}`));
    });
  }

  async getTokensForPool(poolAddress: string): Promise<TokenDetails[]> {
    const db = await this.ensureDB();
    const transaction = db.transaction([this.stores.tokenDetails], 'readonly');
    const store = transaction.objectStore(this.stores.tokenDetails);
    return new Promise((resolve, reject) => {
      const results: TokenDetails[] = [];
      const request = store.index('prediction_pool').openCursor(IDBKeyRange.only(poolAddress));
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          results.push(cursor.value);
          cursor.continue();
        } else {
          results.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
          resolve(results);
        }
      };
      request.onerror = () => reject(new Error(`Failed to get tokens for pool: ${request.error?.message}`));
    });
  }

  // --- Chain Status operations ---
  async saveChainStatus(chainStatus: Omit<ChainStatus, 'createdAt' | 'updatedAt'>): Promise<void> {
    const db = await this.ensureDB();
    const now = Date.now();
    const existing = await this.getChainStatus(chainStatus.chainId);
    const transaction = db.transaction([this.stores.chainStatus], 'readwrite');
    const store = transaction.objectStore(this.stores.chainStatus);
    const dataToSave: ChainStatus = { ...chainStatus, createdAt: existing?.createdAt || now, updatedAt: now };
    return new Promise((resolve, reject) => {
      const request = store.put(dataToSave);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error(`Failed to save chain status: ${request.error?.message}`));
    });
  }

  async getChainStatus(chainId: SupportedChainId): Promise<ChainStatus | null> {
    const db = await this.ensureDB();
    const transaction = db.transaction([this.stores.chainStatus], 'readonly');
    const store = transaction.objectStore(this.stores.chainStatus);
    return new Promise((resolve, reject) => {
      const request = store.get(chainId);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(new Error(`Failed to get chain status: ${request.error?.message}`));
    });
  }

  async getAllChainStatuses(): Promise<ChainStatus[]> {
    const db = await this.ensureDB();
    const transaction = db.transaction([this.stores.chainStatus], 'readonly');
    const store = transaction.objectStore(this.stores.chainStatus);
    return new Promise((resolve, reject) => {
      const results: ChainStatus[] = [];
      const request = store.openCursor();
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          results.push(cursor.value);
          cursor.continue();
        } else {
          resolve(results);
        }
      };
      request.onerror = () => reject(new Error(`Failed to get all chain statuses: ${request.error?.message}`));
    });
  }

  // --- Cache operations ---
  async saveCache(key: string, data: unknown, ttlMinutes: number = 30, chainId?: SupportedChainId): Promise<void> {
    const db = await this.ensureDB();
    const transaction = db.transaction([this.stores.cacheMetadata], 'readwrite');
    const store = transaction.objectStore(this.stores.cacheMetadata);
    const now = Date.now();
    const cacheData: CacheMetadata = { key, chainId, data, ttlMinutes: ttlMinutes || 60, expiresAt: now + ((ttlMinutes || 60) * 60 * 1000), createdAt: now, updatedAt: now };
    return new Promise((resolve, reject) => {
      const request = store.put(cacheData);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error(`Failed to save cache: ${request.error?.message}`));
    });
  }

  async getCache(key: string): Promise<unknown | null> {
    const db = await this.ensureDB();
    const transaction = db.transaction([this.stores.cacheMetadata], 'readonly');
    const store = transaction.objectStore(this.stores.cacheMetadata);
    return new Promise((resolve, reject) => {
      const request = store.get(key);
      request.onsuccess = () => {
        const result = request.result;
        if (!result) {
          resolve(null);
          return;
        }
        if (Date.now() > result.expiresAt) {
          this.deleteCache(key).catch((err) => logger.error('Failed to delete cache:', err instanceof Error ? err : undefined));
          resolve(null);
          return;
        }
        resolve(result.data);
      };
      request.onerror = () => reject(new Error(`Failed to get cache: ${request.error?.message}`));
    });
  }

  async deleteCache(key: string): Promise<void> {
    const db = await this.ensureDB();
    const transaction = db.transaction([this.stores.cacheMetadata], 'readwrite');
    const store = transaction.objectStore(this.stores.cacheMetadata);
    return new Promise((resolve, reject) => {
      const request = store.delete(key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error(`Failed to delete cache: ${request.error?.message}`));
    });
  }

  // --- Batch operations for better performance ---
  async batchSavePools(pools: Omit<PoolDetails, 'createdAt' | 'updatedAt'>[]): Promise<void> {
    const db = await this.ensureDB();
    const transaction = db.transaction([this.stores.poolDetails], 'readwrite');
    const store = transaction.objectStore(this.stores.poolDetails);
    const now = Date.now();
    const promises = pools.map(pool => {
      return new Promise<void>((resolve, reject) => {
        const getRequest = store.get(pool.id);
        getRequest.onsuccess = () => {
          const existing = getRequest.result;
          const dataToSave: PoolDetails = { ...pool, createdAt: existing?.createdAt || now, updatedAt: now };
          const putRequest = store.put(dataToSave);
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(new Error(`Failed to save pool: ${putRequest.error?.message}`));
        };
        getRequest.onerror = () => reject(new Error(`Failed to check existing pool: ${getRequest.error?.message}`));
      });
    });
    await Promise.all(promises);
  }

  async batchSaveTokens(tokens: Omit<TokenDetails, 'createdAt' | 'updatedAt'>[]): Promise<void> {
    const db = await this.ensureDB();
    const transaction = db.transaction([this.stores.tokenDetails], 'readwrite');
    const store = transaction.objectStore(this.stores.tokenDetails);
    const now = Date.now();
    const promises = tokens.map(token => {
      return new Promise<void>((resolve, reject) => {
        const getRequest = store.get(token.id);
        getRequest.onsuccess = () => {
          const existing = getRequest.result;
          const dataToSave: TokenDetails = { ...token, createdAt: existing?.createdAt || now, updatedAt: now };
          const putRequest = store.put(dataToSave);
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(new Error(`Failed to save token: ${putRequest.error?.message}`));
        };
        getRequest.onerror = () => reject(new Error(`Failed to check existing token: ${getRequest.error?.message}`));
      });
    });
    await Promise.all(promises);
  }

  // --- Cleanup operations ---
  async cleanupExpiredCache(): Promise<void> {
    const db = await this.ensureDB();
    const transaction = db.transaction([this.stores.cacheMetadata], 'readwrite');
    const store = transaction.objectStore(this.stores.cacheMetadata);
    return new Promise((resolve, reject) => {
      const now = Date.now();
      const request = store.index('expiresAt').openCursor(IDBKeyRange.upperBound(now));
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };
      request.onerror = () => reject(new Error(`Failed to cleanup cache: ${request.error?.message}`));
    });
  }

  async clearAllData(): Promise<void> {
    const db = await this.ensureDB();
    const transaction = db.transaction([this.stores.poolDetails, this.stores.tokenDetails, this.stores.chainStatus, this.stores.cacheMetadata], 'readwrite');
    const clearPromises = [
      this.clearStore(transaction.objectStore(this.stores.poolDetails)),
      this.clearStore(transaction.objectStore(this.stores.tokenDetails)),
      this.clearStore(transaction.objectStore(this.stores.chainStatus)),
      this.clearStore(transaction.objectStore(this.stores.cacheMetadata)),
    ];
    await Promise.all(clearPromises);
  }

  private clearStore(store: IDBObjectStore): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error(`Failed to clear store: ${request.error?.message}`));
    });
  }

  private putInStore(store: IDBObjectStore, data: unknown): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = store.put(data);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error(`Failed to put data in store: ${request.error?.message}`));
    });
  }

  // --- Database status and info ---
  async getDatabaseInfo(): Promise<{ name: string; version: number; stores: string[]; isConnected: boolean; totalPools: number; totalTokens: number; }> {
    const isConnected = this.db !== null;
    let totalPools = 0;
    let totalTokens = 0;
    if (isConnected) {
      try {
        const pools = await this.getAllPools();
        const db = await this.ensureDB();
        const transaction = db.transaction([this.stores.tokenDetails], 'readonly');
        const store = transaction.objectStore(this.stores.tokenDetails);
        const tokenCount = await new Promise<number>((resolve, reject) => {
          const request = store.count();
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(new Error('Failed to count tokens'));
        });
        totalPools = pools.length;
        totalTokens = tokenCount;
      } catch (error) {
        logger.error('Error getting database stats:', error instanceof Error ? error : undefined);
      }
    }
    return { name: this.dbName, version: this.dbVersion, stores: Object.values(this.stores), isConnected, totalPools, totalTokens };
  }

  // --- Portfolio-specific methods ---
  
  // Save portfolio position
  async savePortfolioPosition(position: Omit<PortfolioPosition, 'id'>): Promise<void> {
    const db = await this.ensureDB();
    const transaction = db.transaction([this.stores.portfolioPositions], 'readwrite');
    const store = transaction.objectStore(this.stores.portfolioPositions);
    
    const positionWithId: PortfolioPosition = {
      ...position,
      id: `${position.userAddress}-${position.tokenAddress}-${position.chainId}`
    };
    
    await this.putInStore(store, positionWithId);
  }

  // Get portfolio positions for user and chain
  async getPortfolioPositions(userAddress: string, chainId: SupportedChainId): Promise<PortfolioPosition[]> {
    const db = await this.ensureDB();
    const transaction = db.transaction([this.stores.portfolioPositions], 'readonly');
    const store = transaction.objectStore(this.stores.portfolioPositions);
    const index = store.index('userAddress_chainId');
    
    return new Promise((resolve, reject) => {
      const request = index.getAll([userAddress, chainId]);
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(new Error(`Failed to get portfolio positions: ${request.error?.message}`));
    });
  }

  // Save portfolio transaction
  async savePortfolioTransaction(transaction: Omit<PortfolioTransaction, 'id'>): Promise<void> {
    const db = await this.ensureDB();
    const dbTransaction = db.transaction([this.stores.portfolioTransactions], 'readwrite');
    const store = dbTransaction.objectStore(this.stores.portfolioTransactions);
    
    const transactionWithId: PortfolioTransaction = {
      ...transaction,
      id: `${transaction.userAddress}-${transaction.tokenAddress}-${transaction.transactionHash}-${transaction.logIndex}`
    };
    
    await this.putInStore(store, transactionWithId);
  }

  // Get portfolio transactions for user and chain
  async getPortfolioTransactions(userAddress: string, chainId: SupportedChainId): Promise<PortfolioTransaction[]> {
    const db = await this.ensureDB();
    const transaction = db.transaction([this.stores.portfolioTransactions], 'readonly');
    const store = transaction.objectStore(this.stores.portfolioTransactions);
    const index = store.index('userAddress_chainId');
    
    return new Promise((resolve, reject) => {
      const request = index.getAll([userAddress, chainId]);
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(new Error(`Failed to get portfolio transactions: ${request.error?.message}`));
    });
  }

  // Save complete portfolio cache
  async savePortfolioCache(cache: Omit<PortfolioCache, 'userAddress'> & { userAddress: string }): Promise<void> {
    const db = await this.ensureDB();
    const transaction = db.transaction([this.stores.portfolioCache], 'readwrite');
    const store = transaction.objectStore(this.stores.portfolioCache);
    
    const cacheWithExpiry: PortfolioCache = {
      ...cache,
      expiresAt: Date.now() + (cache.ttlMinutes * 60 * 1000)
    };
    
    await this.putInStore(store, cacheWithExpiry);
  }

  // Get portfolio cache
  async getPortfolioCache(userAddress: string, chainId: SupportedChainId): Promise<PortfolioCache | null> {
    const db = await this.ensureDB();
    const transaction = db.transaction([this.stores.portfolioCache], 'readonly');
    const store = transaction.objectStore(this.stores.portfolioCache);
    
    return new Promise((resolve, reject) => {
      const request = store.get(userAddress);
      request.onsuccess = () => {
        const result = request.result;
        if (!result) {
          resolve(null);
          return;
        }
        
        // Check if cache is expired
        if (result.expiresAt && Date.now() > result.expiresAt) {
          resolve(null);
          return;
        }
        
        // Check if it's for the right chain
        if (result.chainId !== chainId) {
          resolve(null);
          return;
        }
        
        resolve(result);
      };
      request.onerror = () => reject(new Error(`Failed to get portfolio cache: ${request.error?.message}`));
    });
  }

  // Clear portfolio data for user
  async clearPortfolioData(userAddress: string, chainId?: SupportedChainId): Promise<void> {
    const db = await this.ensureDB();
    
    // Helper function to wrap IndexedDB operations in Promises
    const wrapRequest = <T>(request: IDBRequest<T>): Promise<T> => {
      return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(new Error(`Request failed: ${request.error?.message}`));
      });
    };

    // Helper function to wrap transaction completion in Promise
    const wrapTransaction = (transaction: IDBTransaction): Promise<void> => {
      return new Promise((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(new Error(`Transaction failed: ${transaction.error?.message}`));
      });
    };

    // Helper function to wrap store.delete in Promise
    const wrapDelete = (store: IDBObjectStore, key: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        const deleteRequest = store.delete(key);
        deleteRequest.onsuccess = () => resolve();
        deleteRequest.onerror = () => reject(new Error(`Delete failed: ${deleteRequest.error?.message}`));
      });
    };

    try {
      // Clear positions
      const positionTransaction = db.transaction([this.stores.portfolioPositions], 'readwrite');
      const positionStore = positionTransaction.objectStore(this.stores.portfolioPositions);
      const positionIndex = positionStore.index('userAddress_chainId');
      
      const positionRequest = chainId 
        ? positionIndex.getAll([userAddress, chainId])
        : positionIndex.getAll(userAddress);
      
      const positions = await wrapRequest(positionRequest);
      
      // Delete all positions
      const positionDeletePromises = positions.map(position => 
        wrapDelete(positionStore, position.id)
      );
      await Promise.all(positionDeletePromises);
      
      // Wait for position transaction to complete
      await wrapTransaction(positionTransaction);
      
      // Clear transactions
      const transactionTransaction = db.transaction([this.stores.portfolioTransactions], 'readwrite');
      const transactionStore = transactionTransaction.objectStore(this.stores.portfolioTransactions);
      const transactionIndex = transactionStore.index('userAddress_chainId');
      
      const transactionRequest = chainId 
        ? transactionIndex.getAll([userAddress, chainId])
        : transactionIndex.getAll(userAddress);
      
      const transactions = await wrapRequest(transactionRequest);
      
      // Delete all transactions
      const transactionDeletePromises = transactions.map(transaction => 
        wrapDelete(transactionStore, transaction.id)
      );
      await Promise.all(transactionDeletePromises);
      
      // Wait for transaction transaction to complete
      await wrapTransaction(transactionTransaction);
      
      // Clear cache
      const cacheTransaction = db.transaction([this.stores.portfolioCache], 'readwrite');
      const cacheStore = cacheTransaction.objectStore(this.stores.portfolioCache);
      await wrapDelete(cacheStore, userAddress);
      
      // Wait for cache transaction to complete
      await wrapTransaction(cacheTransaction);
      
    } catch (error) {
      logger.error('Failed to clear portfolio data:', error instanceof Error ? error : undefined);
      throw error;
    }
  }

  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  // Force database recreation when stores are missing
  async forceReinit(): Promise<void> {
    logger.info('Forcing database reinitialization...');
    
    // Close existing connection
    await this.close();
    
    // Delete the database to force recreation
    if (typeof window !== 'undefined' && window.indexedDB) {
      return new Promise((resolve, reject) => {
        const deleteRequest = window.indexedDB.deleteDatabase(this.dbName);
        deleteRequest.onsuccess = async () => {
          try {
            await this.init();
            resolve();
          } catch (error) {
            reject(error);
          }
        };
        deleteRequest.onerror = () => {
          reject(new Error('Failed to delete database'));
        };
      });
    }
  }
}