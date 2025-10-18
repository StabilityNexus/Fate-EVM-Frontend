// src/utils/format.ts

// Number formatting utilities
export const formatNumber = (n: number, decimals = 9): string => {
  if (!isFinite(n) || isNaN(n)) return "0";
  const rounded = Number(n.toFixed(decimals));
  const s = rounded.toString();
  if (s.indexOf('e') !== -1) {
    return n.toExponential(3);
  }
  return s;
};

export const formatNumberDown = (n: number, decimals = 9): string => {
  if (!isFinite(n) || isNaN(n)) return "0";
  const factor = Math.pow(10, decimals);
  const floored = Math.floor(n * factor) / factor;
  const s = floored.toString();
  if (s.indexOf('e') !== -1) {
    return n.toExponential(3);
  }
  return s;
};

// Chain name formatting utility
export const formatChainName = (chainId: number): string => {
  // Dynamic import to avoid require() style import
  const getChainConfig = (id: number) => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { getChainConfig: config } = require('./chainConfig');
      return config(id);
    } catch {
      return null;
    }
  };
  return getChainConfig(chainId)?.name || `Chain ${chainId}`;
};
