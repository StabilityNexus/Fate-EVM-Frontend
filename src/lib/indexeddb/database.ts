// src/lib/indexeddb/database.ts
// Core IndexedDB wrapper with proper error handling and versioning

import { logger } from '@/lib/logger';
import { DATABASE_CONFIG, type DatabaseConfig } from './config';

export class IndexedDBDatabase {
  private db: IDBDatabase | null = null;
  private config: DatabaseConfig;

  constructor(config: DatabaseConfig = DATABASE_CONFIG) {
    this.config = config;
  }

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Check if we're in a browser environment
      if (typeof window === 'undefined' || !window.indexedDB) {
        const error = new Error('IndexedDB is not available in this environment');
        logger.error('IndexedDB initialization failed:', error);
        reject(error);
        return;
      }

      const request = indexedDB.open(this.config.name, this.config.version);

      request.onerror = () => {
        const error = new Error(`Failed to open database: ${request.error?.message}`);
        logger.error('Database open failed:', error);
        reject(error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        logger.info('IndexedDB database initialized successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        this.createStores(db);
        logger.info('Database schema upgraded successfully');
      };
    });
  }

  private createStores(db: IDBDatabase): void {
    this.config.stores.forEach(storeConfig => {
      if (!db.objectStoreNames.contains(storeConfig.name)) {
        const store = db.createObjectStore(storeConfig.name, {
          keyPath: storeConfig.keyPath,
          autoIncrement: storeConfig.autoIncrement
        });

        // Create indexes
        storeConfig.indexes?.forEach(indexConfig => {
          store.createIndex(
            indexConfig.name,
            indexConfig.keyPath,
            { unique: indexConfig.unique || false }
          );
        });
      }
    });
  }

  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
      this.db = null;
      logger.info('Database connection closed');
    }
  }

  async put<T>(storeName: string, data: T): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);

      request.onsuccess = () => resolve();
      request.onerror = () => {
        const error = new Error(`Failed to put data in ${storeName}: ${request.error?.message}`);
        logger.error('Database put failed:', error);
        reject(error);
      };
    });
  }

  async get<T>(storeName: string, key: IDBValidKey): Promise<T | null> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => {
        const result = request.result;
        resolve(result || null);
      };
      request.onerror = () => {
        const error = new Error(`Failed to get data from ${storeName}: ${request.error?.message}`);
        logger.error('Database get failed:', error);
        reject(error);
      };
    });
  }

  async getAll<T>(storeName: string, indexName?: string, query?: IDBValidKey | IDBKeyRange): Promise<T[]> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const source = indexName ? store.index(indexName) : store;
      const request = source.getAll(query);

      request.onsuccess = () => {
        resolve(request.result || []);
      };
      request.onerror = () => {
        const error = new Error(`Failed to get all data from ${storeName}: ${request.error?.message}`);
        logger.error('Database getAll failed:', error);
        reject(error);
      };
    });
  }

  async delete(storeName: string, key: IDBValidKey): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => {
        const error = new Error(`Failed to delete data from ${storeName}: ${request.error?.message}`);
        logger.error('Database delete failed:', error);
        reject(error);
      };
    });
  }

  async clear(storeName: string): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => {
        const error = new Error(`Failed to clear ${storeName}: ${request.error?.message}`);
        logger.error('Database clear failed:', error);
        reject(error);
      };
    });
  }

  async count(storeName: string, indexName?: string, query?: IDBValidKey | IDBKeyRange): Promise<number> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const source = indexName ? store.index(indexName) : store;
      const request = source.count(query);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        const error = new Error(`Failed to count data in ${storeName}: ${request.error?.message}`);
        logger.error('Database count failed:', error);
        reject(error);
      };
    });
  }

  async getDatabaseInfo(): Promise<{ name: string; version: number; objectStoreNames: string[] }> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return {
      name: this.db.name,
      version: this.db.version,
      objectStoreNames: Array.from(this.db.objectStoreNames)
    };
  }

  // Utility method to check if database is ready
  isReady(): boolean {
    return this.db !== null;
  }
}
