import { IndexedDBDatabase } from './database';
import { PortfolioSnapshot, Transaction, CachedTransaction } from '../types';
import { Address } from 'viem';
import { logger } from '../logger';

const MAX_TRANSACTIONS = 10;

const db = new IndexedDBDatabase();

async function getDB() {
  try {
    if (!db.isReady()) {
      await db.init();
    }
    return db;
  } catch (error) {
    logger.logError("Failed to initialize IndexedDB:", error);
    throw error;
  }
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
  try {
    const db = await getDB();
    const transactions = await db.getAll<CachedTransaction>('recentTransactions', 'userAddress', userAddress);
    logger.info(`Found ${transactions.length} recent transactions for ${userAddress}`, { transactions });
    return transactions;
  } catch (error) {
    logger.logError(`Failed to get recent transactions for ${userAddress}:`, error);
    return [];
  }
}

export async function addTransaction(transaction: Transaction): Promise<void> {
  try {
    const db = await getDB();
    const tx: CachedTransaction = { ...transaction, cachedAt: Date.now() };
    await db.put('recentTransactions', tx);
    logger.info("Added new transaction", { transaction: tx });

    const allTransactions = await db.getAll<CachedTransaction>('recentTransactions', 'userAddress', transaction.userAddress);
    if (allTransactions.length > MAX_TRANSACTIONS) {
      const oldestTransaction = allTransactions.sort((a, b) => a.timestamp - b.timestamp)[0];
      await db.delete('recentTransactions', oldestTransaction.hash);
      logger.info("Removed oldest transaction", { transaction: oldestTransaction });
    }
  } catch (error) {
    logger.logError("Failed to add transaction", error);
  }
}