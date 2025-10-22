// src/lib/indexeddb/config.ts
// Centralized IndexedDB configuration and schema definitions

export interface DatabaseConfig {
  name: string;
  version: number;
  stores: StoreConfig[];
}

export interface StoreConfig {
  name: string;
  keyPath: string;
  autoIncrement?: boolean;
  indexes?: IndexConfig[];
}

export interface IndexConfig {
  name: string;
  keyPath: string | string[];
  unique?: boolean;
}

// Database configuration
export const DATABASE_CONFIG: DatabaseConfig = {
  name: 'FatePoolsDB',
  version: 3,
  stores: [
    {
      name: 'poolDetails',
      keyPath: 'id',
      indexes: [
        { name: 'chainId', keyPath: 'chainId' },
        { name: 'creator', keyPath: 'creator' },
        { name: 'lastUpdated', keyPath: 'lastUpdated' }
      ]
    },
    {
      name: 'tokenDetails',
      keyPath: 'id',
      indexes: [
        { name: 'poolAddress', keyPath: 'poolAddress' },
        { name: 'tokenType', keyPath: 'tokenType' },
        { name: 'lastUpdated', keyPath: 'lastUpdated' }
      ]
    },
    {
      name: 'bullTokens',
      keyPath: 'id',
      indexes: [
        { name: 'poolAddress', keyPath: 'poolAddress' },
        { name: 'lastUpdated', keyPath: 'lastUpdated' }
      ]
    },
    {
      name: 'bearTokens',
      keyPath: 'id',
      indexes: [
        { name: 'poolAddress', keyPath: 'poolAddress' },
        { name: 'lastUpdated', keyPath: 'lastUpdated' }
      ]
    },
    {
      name: 'chainStatus',
      keyPath: 'chainId',
      indexes: [
        { name: 'lastUpdated', keyPath: 'lastUpdated' }
      ]
    },
    {
      name: 'cacheMetadata',
      keyPath: 'key',
      indexes: [
        { name: 'chainId', keyPath: 'chainId' },
        { name: 'expiresAt', keyPath: 'expiresAt' }
      ]
    },
    {
      name: 'portfolioPositions',
      keyPath: 'id',
      indexes: [
        { name: 'userAddress', keyPath: 'userAddress' },
        { name: 'chainId', keyPath: 'chainId' },
        { name: 'poolAddress', keyPath: 'poolAddress' },
        { name: 'lastUpdated', keyPath: 'lastUpdated' }
      ]
    },
    {
      name: 'portfolioTransactions',
      keyPath: 'id',
      indexes: [
        { name: 'userAddress', keyPath: 'userAddress' },
        { name: 'chainId', keyPath: 'chainId' },
        { name: 'poolAddress', keyPath: 'poolAddress' },
        { name: 'timestamp', keyPath: 'timestamp' }
      ]
    },
    {
      name: 'portfolioCache',
      keyPath: 'userAddress',
      indexes: [
        { name: 'chainId', keyPath: 'chainId' },
        { name: 'lastUpdated', keyPath: 'lastUpdated' }
      ]
    }
  ]
};

// Cache configuration
export const CACHE_CONFIG = {
  defaultTTL: 30, // minutes
  maxCacheSize: 100, // MB
  cleanupInterval: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
} as const;

// Supported chain IDs
export type SupportedChainId = 1 | 137 | 56 | 8453 | 10 | 250 | 42161 | 43114;

// Data type definitions (keeping existing interfaces)
export interface PoolDetails {
  id: string;
  name: string;
  description: string;
  assetAddress: string;
  oracleAddress: string;
  currentPrice: number;
  bullReserve: string;
  bearReserve: string;
  bullToken: {
    id: string;
    symbol: string;
    name: string;
    totalSupply: string;
  };
  bearToken: {
    id: string;
    symbol: string;
    name: string;
    totalSupply: string;
  };
  vaultCreator: string;
  creatorFee: number;
  mintFee: number;
  burnFee: number;
  treasuryFee: number;
  bullPercentage: number;
  bearPercentage: number;
  chainId: SupportedChainId;
  creator?: string;
  chainName?: string;
  priceFeedAddress?: string;
  createdAt: number;
  updatedAt: number;
}

export interface TokenDetails {
  id: string;
  poolAddress: string;
  tokenType: 'bull' | 'bear';
  symbol: string;
  name: string;
  totalSupply: string;
  reserve: string;
  price: number;
  chainId: SupportedChainId;
  vault_creator?: string;
  mint_fee?: bigint;
  burn_fee?: bigint;
  creator_fee?: bigint;
  treasury_fee?: bigint;
  prediction_pool?: string;
  other_token?: string;
  asset?: string;
  createdAt: number;
  updatedAt: number;
}

export interface ChainStatus {
  chainId: SupportedChainId;
  isActive: boolean;
  lastBlockNumber: number;
  lastUpdateTime: number;
  poolCount: number;
  createdAt: number;
  updatedAt: number;
}

export interface CacheMetadata {
  key: string;
  chainId?: SupportedChainId;
  data: unknown;
  ttlMinutes: number;
  expiresAt: number;
  createdAt: number;
  updatedAt: number;
}

export interface PortfolioPosition {
  id: string;
  userAddress: string;
  tokenAddress: string;
  poolAddress: string;
  chainId: SupportedChainId;
  tokenType: 'bull' | 'bear';
  currentBalance: number;
  currentValue: number;
  costBasis: number;
  pnL: number;
  returns: number;
  totalFeesPaid: number;
  netInvestment: number;
  grossInvestment: number;
  lastUpdated: number;
  blockNumber: number;
  baseTokenSymbol?: string;
}

export interface PortfolioTransaction {
  id: string;
  userAddress: string;
  poolAddress: string;
  chainId: SupportedChainId;
  tokenType: 'bull' | 'bear';
  action: 'buy' | 'sell';
  amount: number;
  price: number;
  value: number;
  fees: number;
  transactionHash: string;
  blockNumber: number;
  timestamp: number;
}

export interface PortfolioCache {
  userAddress: string;
  chainId: SupportedChainId;
  positions: PortfolioPosition[];
  transactions: PortfolioTransaction[];
  totalValue: number;
  totalPnL: number;
  totalReturns: number;
  lastUpdated: number;
}
