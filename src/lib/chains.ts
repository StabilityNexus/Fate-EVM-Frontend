import { config } from '../utils/wagmiConfig';

export interface ChainMeta {
  id: number;
  name: string;
  shortName: string;
  explorerBaseUrl: string;
  nativeCurrency: { symbol: string; decimals: number };
  isTestnet: boolean;
}

export const SUPPORTED_CHAIN_IDS: number[] = config.chains.map((chain) => chain.id);

export const CHAIN_METADATA: Record<number, ChainMeta> = {
  1: {
    id: 1,
    name: 'Ethereum Mainnet',
    shortName: 'ETH',
    explorerBaseUrl: 'https://etherscan.io',
    nativeCurrency: { symbol: 'ETH', decimals: 18 },
    isTestnet: false,
  },
  10: {
    id: 10,
    name: 'OP Mainnet',
    shortName: 'ETH',
    explorerBaseUrl: 'https://optimistic.etherscan.io',
    nativeCurrency: { symbol: 'ETH', decimals: 18 },
    isTestnet: false,
  },
  137: {
    id: 137,
    name: 'Polygon',
    shortName: 'MATIC',
    explorerBaseUrl: 'https://polygonscan.com',
    nativeCurrency: { symbol: 'MATIC', decimals: 18 },
    isTestnet: false,
  },
  8453: {
    id: 8453,
    name: 'Base',
    shortName: 'ETH',
    explorerBaseUrl: 'https://basescan.org',
    nativeCurrency: { symbol: 'ETH', decimals: 18 },
    isTestnet: false,
  },
  42161: {
    id: 42161,
    name: 'Arbitrum One',
    shortName: 'ETH',
    explorerBaseUrl: 'https://arbiscan.io',
    nativeCurrency: { symbol: 'ETH', decimals: 18 },
    isTestnet: false,
  },
  11155111: {
    id: 11155111,
    name: 'Sepolia',
    shortName: 'ETH',
    explorerBaseUrl: 'https://sepolia.etherscan.io',
    nativeCurrency: { symbol: 'ETH', decimals: 18 },
    isTestnet: true,
  },
};

export const UNKNOWN_CHAIN_LABEL = 'Unknown Network';

export function getChainMeta(chainId?: number): ChainMeta | null {
  if (typeof chainId !== "number") return null;
  return CHAIN_METADATA[chainId] ?? null;
}

export function isSupportedChain(chainId?: number): boolean {
  return typeof chainId === "number" && config.chains.some(c => c.id === chainId);
}
