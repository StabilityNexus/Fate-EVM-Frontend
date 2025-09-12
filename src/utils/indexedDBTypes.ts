// src/utils/indexedDBTypes.ts
// Type definitions only - no service class implementation

export type SupportedChainId = 1 | 137 | 56 | 8453 | 11155111 | 61;

export interface PoolDetails {
  id: string;
  chainId: SupportedChainId;
  name: string;
  baseToken: string;
  priceFeedAddress: string;
  creator: string;
  bullPercentage: number;
  bearPercentage: number;
  vaultFee: number;
  vaultCreatorFee: number;
  treasuryFee: number;
  chainName: string;
  userAddress?: string;
  createdAt?: number;
  updatedAt?: number;
}

export interface TokenDetails {
  id: string;
  chainId: SupportedChainId;
  prediction_pool: string;
  other_token: string;
  asset: string;
  name: string;
  symbol: string;
  vault_creator: string;
  mint_fee: bigint;
  burn_fee: bigint;
  creator_fee: bigint;
  treasury_fee: bigint;
  asset_balance: bigint;
  supply: bigint;
  priceBuy: number;
  priceSell: number;
  createdAt?: number;
  updatedAt?: number;
}

export interface ChainStatus {
  chainId: SupportedChainId;
  chainName: string;
  poolCount: number;
  lastSyncTime: number;
  isLoading: boolean;
  error: string | null;
  createdAt?: number;
  updatedAt?: number;
}

export interface CacheMetadata {
  key: string;
  data: unknown;
  ttlMinutes: number;
  chainId?: SupportedChainId;
  createdAt: number;
  updatedAt: number;
  expiresAt: number;
}
