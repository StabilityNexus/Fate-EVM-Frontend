// src/utils/indexedDB.ts

// IndexedDB service for storing Fate Pools data
// Following best practices with versioning, proper indexing, and error handling

import type { 
  PoolDetails, 
  TokenDetails, 
  ChainStatus, 
  CacheMetadata,
  SupportedChainId 
} from './indexedDBTypes';

export class FatePoolsIndexedDBService {
  private dbName = 'FatePoolsDB';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;

  private readonly stores = {
    poolDetails: 'poolDetails',
    tokenDetails: 'tokenDetails',
    bullTokens: 'bullTokens',
    bearTokens: 'bearTokens',
    chainStatus: 'chainStatus',
    cacheMetadata: 'cacheMetadata'
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
        console.error('FatePoolsDB failed to open:', request.error);
        reject(new Error(`Failed to open IndexedDB: ${request.error?.message}`));
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.db.onerror = (event) => {
          console.error('Database error:', event);
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
          this.deleteCache(key).catch(console.error);
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
        console.error('Error getting database stats:', error);
      }
    }
    return { name: this.dbName, version: this.dbVersion, stores: Object.values(this.stores), isConnected, totalPools, totalTokens };
  }

  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}