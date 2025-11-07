import { IndexedDBDatabase } from './database';
import { PortfolioSnapshot, Transaction, CachedTransaction } from '../types';
import { Address } from 'viem';

const MAX_TRANSACTIONS = 10;

const db = new IndexedDBDatabase();

async function getDB() {
  if (!db.isReady()) {
    await db.init();
  }
  return db;
}

export async function getPortfolioSnapshot(userAddress: Address): Promise<PortfolioSnapshot | null> {
  const db = await getDB();
  return db.get<PortfolioSnapshot>('portfolioSnapshots', userAddress);
}

export async function updatePortfolioSnapshot(snapshot: PortfolioSnapshot): Promise<void> {
  const db = await getDB();
  await db.put('portfolioSnapshots', snapshot);
}

export async function getRecentTransactions(userAddress: Address): Promise<CachedTransaction[]> {
  const db = await getDB();
  return db.getAll<CachedTransaction>('recentTransactions', 'userAddress', userAddress);
}

export async function addTransaction(transaction: Transaction): Promise<void> {
  const db = await getDB();
  const tx: CachedTransaction = { ...transaction, cachedAt: Date.now() };
  await db.put('recentTransactions', tx);

  const allTransactions = await db.getAll<CachedTransaction>('recentTransactions', 'userAddress', transaction.userAddress);
  if (allTransactions.length > MAX_TRANSACTIONS) {
    const oldestTransaction = allTransactions.sort((a, b) => a.timestamp - b.timestamp)[0];
    await db.delete('recentTransactions', oldestTransaction.hash);
  }
}