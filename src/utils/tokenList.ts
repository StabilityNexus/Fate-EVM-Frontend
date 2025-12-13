/**
 * Token list utilities for managing supported tokens across different chains
 */

// Import token lists statically
import ethereumTokens from "@/data/tokens/ethereum-tokens.json";
import baseTokens from "@/data/tokens/base-tokens.json";
import bscTokens from "@/data/tokens/binance-smart-chain-tokens.json";
import polygonTokens from "@/data/tokens/polygon-pos-tokens.json";
import etcTokens from "@/data/tokens/ethereum-classic-tokens.json";
import milkomedaTokens from "@/data/tokens/cardano's-milkomeda-tokens.json";

export interface Token {
  id: string;
  symbol: string;
  name: string;
  image: string;
  contract_address: string;
}

// Normalize token addresses to lowercase
const normalizeTokens = (tokens: Token[]): Token[] => {
  return tokens.map(token => ({
    ...token,
    contract_address: token.contract_address.toLowerCase(),
  }));
};

// Pre-processed token lists by chain ID
const CHAIN_TOKENS: Record<number, Token[]> = {
  1: normalizeTokens(ethereumTokens as Token[]), // Ethereum Mainnet
  56: normalizeTokens(bscTokens as Token[]), // BSC
  137: normalizeTokens(polygonTokens as Token[]), // Polygon
  8453: normalizeTokens(baseTokens as Token[]), // Base
  61: normalizeTokens(etcTokens as Token[]), // Ethereum Classic
  2001: normalizeTokens(milkomedaTokens as Token[]), // Milkomeda Cardano sidechain
};

/**
 * Load tokens for a specific chain
 * @param chainId - The chain ID to load tokens for
 * @returns Promise resolving to array of tokens
 */
export async function loadTokensForChain(chainId: number): Promise<Token[]> {
  const tokens = CHAIN_TOKENS[chainId];
  
  if (!tokens) {
    console.warn(`No token list available for chain ID ${chainId}`);
    return [];
  }

  return tokens;
}

/**
 * Search tokens by name, symbol, or address
 * @param tokens - Array of tokens to search
 * @param query - Search query
 * @returns Filtered array of tokens
 */
export function searchTokens(tokens: Token[], query: string): Token[] {
  if (!query.trim()) {
    return tokens;
  }

  const lowerQuery = query.toLowerCase().trim();
  
  return tokens.filter(token => 
    token.name.toLowerCase().includes(lowerQuery) ||
    token.symbol.toLowerCase().includes(lowerQuery) ||
    token.contract_address.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Find a token by its contract address
 * @param tokens - Array of tokens to search
 * @param address - Contract address
 * @returns Token if found, undefined otherwise
 */
export function findTokenByAddress(tokens: Token[], address: string): Token | undefined {
  const lowerAddress = address.toLowerCase();
  return tokens.find(token => token.contract_address.toLowerCase() === lowerAddress);
}
