// src/utils/format.ts
import { getChainConfig } from './chainConfig';

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

export const formatNumberDown = (n: number, decimals = 9): string => {
  if (!isFinite(n) || isNaN(n)) return "0";
  const factor = Math.pow(10, decimals);
  const truncated = Math.trunc(n * factor) / factor;
  const s = truncated.toString();
  if (s.indexOf('e') !== -1) {
    return truncated.toExponential(decimals);
  }
  return s;
};

// Chain name formatting utility
export const formatChainName = (chainId: number): string => {
  return getChainConfig(chainId)?.name || `Chain ${chainId}`;
};
