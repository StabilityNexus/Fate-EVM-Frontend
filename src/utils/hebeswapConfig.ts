// Hebeswap Oracle Configuration for Ethereum Classic
// This file contains the configuration for Hebeswap trading pairs and tokens

export interface HebeswapPair {
  pairAddress: string;
  baseToken: string;
  quoteToken: string;
  baseTokenSymbol: string;
  quoteTokenSymbol: string;
  description: string;
}

export interface HebeswapToken {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
}

// Common tokens on Ethereum Classic
export const ETC_TOKENS: Record<string, HebeswapToken> = {
  ETC: {
    address: '0x0000000000000000000000000000000000000000', // Native ETC
    symbol: 'ETC',
    name: 'Ethereum Classic',
    decimals: 18
  },
  WETC: {
    address: '0x1953cab0E5bFa6D4a9BaD6E05fD46C1CC6527a5a', // Wrapped ETC (Canonical)
    symbol: 'WETC',
    name: 'Wrapped Ethereum Classic',
    decimals: 18
  },
  USDC: {
    address: '0x53915195c2ee2146ac2e7f10744e54383fe9b28d', // Ethereum Classic USDC
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6
  },
  USDT: {
    address: '0x258d3dd5095e5030f3fafacd74116f46228eb850', // Ethereum Classic USDT
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 6
  },
  WBTC: {
    address: '0x635a60e1b714106a872fc45f80f5d78a0617f028', // Wrapped Bitcoin on ETC
    symbol: 'WBTC',
    name: 'Wrapped Bitcoin',
    decimals: 8
  }
};

// Hebeswap trading pairs on Ethereum Classic
export const HEBESWAP_PAIRS: HebeswapPair[] = [
  {
    pairAddress: '0x1234567890123456789012345678901234567890', // ETC/USDC pair
    baseToken: ETC_TOKENS.ETC.address,
    quoteToken: ETC_TOKENS.USDC.address,
    baseTokenSymbol: 'ETC',
    quoteTokenSymbol: 'USDC',
    description: 'ETC/USDC Trading Pair'
  },
  {
    pairAddress: '0x2345678901234567890123456789012345678901', // ETC/USDT pair
    baseToken: ETC_TOKENS.ETC.address,
    quoteToken: ETC_TOKENS.USDT.address,
    baseTokenSymbol: 'ETC',
    quoteTokenSymbol: 'USDT',
    description: 'ETC/USDT Trading Pair'
  },
  {
    pairAddress: '0x3456789012345678901234567890123456789012', // ETC/WBTC pair
    baseToken: ETC_TOKENS.ETC.address,
    quoteToken: ETC_TOKENS.WBTC.address,
    baseTokenSymbol: 'ETC',
    quoteTokenSymbol: 'WBTC',
    description: 'ETC/WBTC Trading Pair'
  },
  {
    pairAddress: '0x4567890123456789012345678901234567890123', // WETC/USDC pair
    baseToken: ETC_TOKENS.WETC.address,
    quoteToken: ETC_TOKENS.USDC.address,
    baseTokenSymbol: 'WETC',
    quoteTokenSymbol: 'USDC',
    description: 'WETC/USDC Trading Pair'
  }
];

// Get Hebeswap pairs by base token
export function getHebeswapPairsByBaseToken(baseTokenAddress: string): HebeswapPair[] {
  return HEBESWAP_PAIRS.filter(pair => 
    pair.baseToken.toLowerCase() === baseTokenAddress.toLowerCase()
  );
}

// Get Hebeswap pairs by quote token
export function getHebeswapPairsByQuoteToken(quoteTokenAddress: string): HebeswapPair[] {
  return HEBESWAP_PAIRS.filter(pair => 
    pair.quoteToken.toLowerCase() === quoteTokenAddress.toLowerCase()
  );
}

// Get Hebeswap pair by address
export function getHebeswapPairByAddress(pairAddress: string): HebeswapPair | undefined {
  return HEBESWAP_PAIRS.find(pair => 
    pair.pairAddress.toLowerCase() === pairAddress.toLowerCase()
  );
}

// Get token info by address
export function getTokenByAddress(tokenAddress: string): HebeswapToken | undefined {
  return Object.values(ETC_TOKENS).find(token => 
    token.address.toLowerCase() === tokenAddress.toLowerCase()
  );
}

// Get token info by symbol
export function getTokenBySymbol(symbol: string): HebeswapToken | undefined {
  return Object.values(ETC_TOKENS).find(token => 
    token.symbol.toUpperCase() === symbol.toUpperCase()
  );
}
