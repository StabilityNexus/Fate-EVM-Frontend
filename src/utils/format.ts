// src/utils/format.ts
import { formatUnits } from 'viem';
import { getChainConfig } from './chainConfig';

// Compact, human-readable TVL from a base-unit reserve total.
// Base-token denominated (not USD); cross-token comparison is approximate.
export const formatTVL = (tvl: bigint, decimals: number, symbol: string): string => {
  const value = Number(formatUnits(tvl, decimals));
  if (!isFinite(value)) return `0 ${symbol}`;
  let display: string;
  // Thresholds sit at the rounding boundary (e.g. 999_995, not 1_000_000) so a value
  // that rounds up to 1000.00 promotes to the next unit instead of showing "1000.00K".
  if (value >= 999_995) display = `${(value / 1_000_000).toFixed(2)}M`;
  else if (value >= 999.995) display = `${(value / 1_000).toFixed(2)}K`;
  else if (value >= 0.01) display = value.toFixed(2);
  else if (value > 0) return `< 0.01 ${symbol}`;
  else display = "0";
  return `${display} ${symbol}`;
};

const trimZeros = (s: string): string => s.replace(/\.?0+$/, "");

// Traded volume in base-token units: up to 3 decimals, with the same K/M steps as formatTVL.
export const formatVolume = (value: number, symbol: string): string => {
  if (!isFinite(value) || value <= 0) return `0 ${symbol}`;
  let display: string;
  if (value >= 999_999.5) display = `${trimZeros((value / 1_000_000).toFixed(3))}M`;
  else if (value >= 999.9995) display = `${trimZeros((value / 1_000).toFixed(3))}K`;
  else if (value >= 0.001) display = trimZeros(value.toFixed(3));
  else return `< 0.001 ${symbol}`;
  return `${display} ${symbol}`;
};

// Number formatting utilities
export const formatNumber = (n: number, decimals = 9): string => {
  if (!isFinite(n) || isNaN(n)) return "0";
  const rounded = Number(n.toFixed(decimals));
  const s = rounded.toString();
  if (s.indexOf('e') !== -1) {
    return rounded.toExponential(decimals);
  }
  return s;
};

export const formatNumberDown = (value: string, decimals = 9): string => {
  const [int, frac = ""] = value.split(".");
  const kept = trimZeros(frac.slice(0, decimals));
  return kept ? `${int}.${kept}` : int;
};

// Chain name formatting utility
export const formatChainName = (chainId: number): string => {
  return getChainConfig(chainId)?.name || `Chain ${chainId}`;
};
