// src/lib/indexeddb/database.ts
// Core IndexedDB wrapper with proper error handling and versioning

import { logger } from '@/lib/logger';
import { DATABASE_CONFIG, type DatabaseConfig } from './config';

export class IndexedDBDatabase {
  private db: IDBDatabase | null = null;
  private config: DatabaseConfig = DATABASE_CONFIG;

  async init(onUpgrade?: (db: IDBDatabase, transaction: IDBTransaction, oldVersion: number, newVersion: number) => Promise<void> | void): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.config.name, this.config.version);

      request.onerror = () => {
        const error = new Error(`Failed to open database: ${request.error?.message}`);
        logger.error('Database initialization failed:', error);
        reject(error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = request.result;
        const transaction = request.transaction!;
        const oldVersion = event.oldVersion;
        const newVersion = event.newVersion || this.config.version;

        try {
          this.createStores(db, transaction);

          if (onUpgrade) {
            onUpgrade(db, transaction, oldVersion, newVersion);
          }
        } catch (error) {
          logger.error('Database upgrade failed:', error as Error);
          transaction.abort();
          reject(error);
        }
      };
    });
  }

  private createStores(db: IDBDatabase, transaction: IDBTransaction): void {
    this.config.stores.forEach(storeConfig => {
      if (!db.objectStoreNames.contains(storeConfig.name)) {
        // Create new object store
        const store = db.createObjectStore(storeConfig.name, {
          keyPath: storeConfig.keyPath,
          autoIncrement: storeConfig.autoIncrement
        });

        // Create indexes for new store
        storeConfig.indexes?.forEach(indexConfig => {
          store.createIndex(
            indexConfig.name,
            indexConfig.keyPath,
            { unique: indexConfig.unique || false }
          );
        });
      } else {
        // Store exists, check for missing indexes
        // Use existing transaction instead of trying to open a new one
        const store = transaction.objectStore(storeConfig.name);

        // Check and create missing indexes
        storeConfig.indexes?.forEach(indexConfig => {
          if (!store.indexNames.contains(indexConfig.name)) {
            store.createIndex(
              indexConfig.name,
              indexConfig.keyPath,
              { unique: indexConfig.unique || false }
            );
          }
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

      // Validate index existence before accessing
      let source: IDBObjectStore | IDBIndex;
      if (indexName) {
        if (!store.indexNames.contains(indexName)) {
          const error = new Error(`Index '${indexName}' does not exist on store '${storeName}'`);
          logger.error('Database getAll failed:', error);
          reject(error);
          return;
        }
        source = store.index(indexName);
      } else {
        source = store;
      }

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

      // Validate index existence before accessing
      let source: IDBObjectStore | IDBIndex;
      if (indexName) {
        if (!store.indexNames.contains(indexName)) {
          const error = new Error(`Index '${indexName}' does not exist on store '${storeName}'`);
          logger.error('Database count failed:', error);
          reject(error);
          return;
        }
        source = store.index(indexName);
      } else {
        source = store;
      }

      const request = source.count(query);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => {
        const error = new Error(`Failed to count data in ${storeName}: ${request.error?.message}`);
        logger.error('Database count failed:', error);
        reject(error);
      };
    });
  }

  async getByIndex<T>(storeName: string, indexName: string, key: IDBValidKey): Promise<T | null> {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);

      // Check if index exists before using it
      if (!store.indexNames.contains(indexName)) {
        const error = new Error(`Index '${indexName}' does not exist in store '${storeName}'`);
        logger.error('Database getByIndex failed:', error);
        reject(error);
        return;
      }

      const index = store.index(indexName);
      const request = index.get(key);

      request.onsuccess = () => {
        const result = request.result;
        resolve(result || null);
      };
      request.onerror = () => {
        const error = new Error(`Failed to get data from ${storeName} by index ${indexName}: ${request.error?.message}`);
        logger.error('Database getByIndex failed:', error);
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
