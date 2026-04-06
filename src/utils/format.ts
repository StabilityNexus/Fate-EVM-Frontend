// src/utils/format.ts
import { getChainConfig } from './chainConfig';
import { formatUnits } from 'viem';

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

// Amount input normalization - Bug 3 fix
export const stripTrailingZeros = (value: string): string => {
  if (!value.includes('.')) return value;
  return value.replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1');
};

export const truncateDecimalString = (value: string, maxDecimals: number): string => {
  const trimmed = value.trim();
  if (!trimmed || !/^\d*(\.\d*)?$/.test(trimmed)) return '';

  const [integerPartRaw = '0', fractionalPartRaw = ''] = trimmed.split('.');
  const integerPart = integerPartRaw.replace(/^0+(?=\d)/, '') || '0';
  const fractionalPart = fractionalPartRaw.slice(0, maxDecimals).replace(/0+$/, '');

  return fractionalPart ? `${integerPart}.${fractionalPart}` : integerPart;
};

export const normalizeAmountInput = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed || !/^\d*(\.\d*)?$/.test(trimmed)) return '';

  // Keep comparison exact in wei while capping user input at token precision.
  return stripTrailingZeros(truncateDecimalString(trimmed, 18));
};

// Display amount helpers - Bug 4 fix
export const toDisplayAmount = (value: bigint, tokenDecimals = 18, displayDecimals = 4): string => {
  return truncateDecimalString(formatUnits(value, tokenDecimals), displayDecimals);
};

export const toExactAmount = (value: bigint, tokenDecimals = 18): string => {
  return formatUnits(value, tokenDecimals);
};

export const toDisplayAmountWithMin = (value: bigint, tokenDecimals = 18, displayDecimals = 6): string => {
  const display = toDisplayAmount(value, tokenDecimals, displayDecimals);
  if (value > BigInt(0) && display === '0') {
    return `< 0.${'0'.repeat(Math.max(displayDecimals - 1, 0))}1`;
  }
  return display;
};
