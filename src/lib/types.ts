import { type Address } from 'viem';

export interface ChainConfig {
  id: number;
  name: string;
  factoryAddress: Address;
  chainlinkAdapterFactory?: Address;
  hebeswapAdapterFactory?: Address;
  nativeTokenSymbol: string;
  explorerUrl?: string;
}

export interface ChainLoadingState {
  chainId: number;
  loading: boolean;
  error: string | null;
  poolCount: number;
}

export interface BaseToken {
  id: Address;
  name: string;
  symbol: string;
  asset: Address;
}

export interface Token extends BaseToken {
  vault_creator: Address;
  vault_fee?: bigint;
  vault_creator_fee?: bigint;
  treasury_fee: bigint;
  // Additional fee properties for compatibility
  mint_fee?: bigint;
  burn_fee?: bigint;
  creator_fee?: bigint;
  asset_balance: bigint;
  supply: bigint;
  prediction_pool: Address;
  other_token: Address;
  price?: number;
  balance?: bigint;
  priceBuy?: number;
  priceSell?: number;
}

export interface TokenDisplay {
  symbol: string;
  name: string;
  price: number;
  balance: string;
  value: number;
}

export interface PredictionPool {
  id: Address;
  name: string;
  baseToken: Address;
  priceFeedAddress: Address;
  creator: Address;
  chainId: number;
  chainName: string;
  vaultFee: number;
  vaultCreatorFee: number;
  treasuryFee: number;
  isInitialized?: boolean;
  oracleType?: 'chainlink' | 'hebeswap' | 'pyth';
}

export interface Pool extends PredictionPool {
  bullToken: Token;
  bearToken: Token;
  bullPercentage: number;
  bearPercentage: number;
  previous_price: bigint;
  // Additional fee properties for compatibility
  mintFee?: number;
  burnFee?: number;
}

export interface PoolStats {
  totalValueLocked: number;
  participantCount?: number;
  volume24h?: number;
  createdAt?: number;
}

export interface PriceFeedInfo {
  feedAddress: Address;
  decimals: number;
  description: string;
  latestPrice?: number;
  updatedAt?: number;
}

export interface OracleAdapter {
  address: Address;
  type: 'chainlink' | 'hebeswap';
  priceFeed?: Address;
  pair?: Address;
  baseToken?: Address;
  quoteToken?: Address;
}

export interface AdapterFactoryConfig {
  chainlinkFactory: Address;
  hebeswapFactory: Address;
}

export interface PriceData {
  currentPrice: number;
  previousPrice: number;
  priceChange?: number;
  timestamp?: number;
}

export interface UserPortfolio {
  bullHoldings: TokenDisplay;
  bearHoldings: TokenDisplay;
  totalValue: number;
  dominantPosition: 'bull' | 'bear' | 'balanced';
  positionRatio: number;
}

export interface TransactionState {
  isPending: boolean;
  isConfirming: boolean;
  hash?: string;
  type?: 'buy' | 'sell' | 'approve' | 'rebalance' | 'updatePriceFeed';
}

export interface PendingApproval {
  token: Token;
  amount: string;
  type: 'buy';
}

export interface ContractReadResult<T = unknown> {
  result?: T;
  error?: Error;
  isLoading?: boolean;
}

export interface BatchContractReads {
  data?: ContractReadResult[];
  isLoading: boolean;
  refetch: () => void;
}

export interface TokenActionForm {
  amount: string;
  token: Token;
  action: 'buy' | 'sell';
}

export interface PoolCreationForm {
  name: string;
  baseToken: Address;
  priceFeed: Address;
  oracleType: 'chainlink' | 'hebeswap';
  hebeswapPair?: Address;
  hebeswapBaseToken?: Address;
  hebeswapQuoteToken?: Address;
  bullSymbol: string;
  bearSymbol: string;
  initialFunding: string;
}

export interface AppError extends Error {
  code?: string;
  context?: Record<string, unknown>;
}

export interface ProcessingError extends Error {
  message: string;
}

export interface AppConfig {
  supportedChains: Record<number, ChainConfig>;
  defaults: {
    batchSize: number;
    maxRetries: number;
    retryDelay: number;
  };
  feeDenominator: number;
}

export interface LoadingState<T = unknown> {
  loading: boolean;
  data?: T;
  error?: string | null;
}

export interface PaginationParams {
  page: number;
  limit: number;
  total?: number;
}

export interface SearchParams {
  query: string;
  chainId?: number;
  creator?: Address;
  sortBy?: 'name' | 'created' | 'tvl' | 'volume';
  sortOrder?: 'asc' | 'desc';
}

export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

export interface PoolCardProps extends BaseComponentProps {
  pool: Pool;
  onUse: (poolId: string) => void;
  loading?: boolean;
}

export interface TokenActionPanelProps extends BaseComponentProps {
  token: Token;
  amount: string;
  setAmount: (value: string) => void;
  onBuy: () => void;
  onSell: () => void;
  color: 'red' | 'green';
  label: string;
  isPending: boolean;
  isConfirming: boolean;
  baseTokenSymbol: string;
}

export type { Address };

export function isToken(obj: unknown): obj is Token {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'name' in obj &&
    'symbol' in obj &&
    'asset' in obj
  );
}

export function isPool(obj: unknown): obj is Pool {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'id' in obj &&
    'bullToken' in obj &&
    'bearToken' in obj &&
    'chainId' in obj
  );
}

export function isSupportedChainId(chainId: unknown): chainId is number {
  return typeof chainId === 'number' && chainId > 0;
}