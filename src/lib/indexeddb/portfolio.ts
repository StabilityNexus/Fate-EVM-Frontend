import { openDB } from 'idb';
import { DATABASE_CONFIG } from './config';
import { PortfolioSnapshot, Transaction, CachedTransaction } from '../types';
import { Address } from 'viem';

const MAX_TRANSACTIONS = 10;

async function getDB() {
  return openDB(DATABASE_CONFIG.name, DATABASE_CONFIG.version, {
    upgrade(db) {
      DATABASE_CONFIG.stores.forEach(storeConfig => {
        if (!db.objectStoreNames.contains(storeConfig.name)) {
          const store = db.createObjectStore(storeConfig.name, {
            keyPath: storeConfig.keyPath,
            autoIncrement: storeConfig.autoIncrement,
          });
          storeConfig.indexes?.forEach(indexConfig => {
            store.createIndex(indexConfig.name, indexConfig.keyPath, {
              unique: indexConfig.unique,
            });
          });
        }
      });
    },
  });
}

export async function getPortfolioSnapshot(userAddress: Address): Promise<PortfolioSnapshot | undefined> {
  const db = await getDB();
  return db.get('portfolioSnapshots', userAddress);
}

export async function updatePortfolioSnapshot(snapshot: PortfolioSnapshot): Promise<void> {
  const db = await getDB();
  await db.put('portfolioSnapshots', snapshot);
}

export async function getRecentTransactions(userAddress: Address): Promise<CachedTransaction[]> {
  const db = await getDB();
  return db.getAllFromIndex('recentTransactions', 'userAddress', userAddress);
}

export async function addTransaction(transaction: Transaction): Promise<void> {
  const db = await getDB();
  const tx: CachedTransaction = { ...transaction, cachedAt: Date.now() };
  await db.add('recentTransactions', tx);

  const allTransactions = await db.getAllFromIndex('recentTransactions', 'userAddress', transaction.userAddress);
  if (allTransactions.length > MAX_TRANSACTIONS) {
    const oldestTransaction = allTransactions.sort((a, b) => a.timestamp - b.timestamp)[0];
    await db.delete('recentTransactions', oldestTransaction.hash);
  }
}