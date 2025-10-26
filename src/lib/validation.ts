// src/lib/validation.ts
// Comprehensive validation layer for production security

import { SUPPORTED_CHAIN_IDS } from './indexeddb/config';
import { isAddress, getAddress } from 'viem';

export class ValidationError extends Error {
  constructor(message: string, public field: string, public code: string = 'VALIDATION_ERROR') {
    super(message);
    this.name = 'ValidationError';
  }
}

// Rate limiting for API calls and user actions
const rateLimiter = new Map<string, { count: number; resetTime: number }>();

// Cleanup interval for expired rate limit entries
let cleanupInterval: NodeJS.Timeout | null = null;

// Start periodic cleanup of expired rate limit entries
const startRateLimitCleanup = (): void => {
  if (cleanupInterval) return; // Already running
  
  cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimiter.entries()) {
      if (now > entry.resetTime) {
        rateLimiter.delete(key);
      }
    }
  }, 30000); // Clean up every 30 seconds
};

// Stop cleanup interval (for testing or shutdown)
export const stopRateLimitCleanup = (): void => {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
};

// Initialize cleanup on module load
startRateLimitCleanup();

export const checkRateLimit = (
  key: string, 
  maxRequests: number = 10, 
  windowMs: number = 60000 // 1 minute
): boolean => {
  const now = Date.now();
  const userLimit = rateLimiter.get(key);
  
  if (!userLimit || now > userLimit.resetTime) {
    rateLimiter.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (userLimit.count >= maxRequests) {
    throw new ValidationError(
      `Rate limit exceeded. Maximum ${maxRequests} requests per minute.`,
      'rateLimit',
      'RATE_LIMIT_EXCEEDED'
    );
  }
  
  userLimit.count++;
  return true;
};

// Test function to verify rate limit cleanup behavior
export const testRateLimitCleanup = (): { 
  mapSize: number; 
  expiredEntries: number; 
  activeEntries: number 
} => {
  const now = Date.now();
  let expiredEntries = 0;
  let activeEntries = 0;
  
  for (const [, entry] of rateLimiter.entries()) {
    if (now > entry.resetTime) {
      expiredEntries++;
    } else {
      activeEntries++;
    }
  }
  
  return {
    mapSize: rateLimiter.size,
    expiredEntries,
    activeEntries
  };
};

// Amount validation with string-based checks
export const validateAmount = (amount: string, maxDecimals: number = 18): string => {
  if (!amount || typeof amount !== 'string') {
    throw new ValidationError('Amount is required', 'amount');
  }
  
  const trimmed = amount.trim();
  if (!trimmed) {
    throw new ValidationError('Amount cannot be empty', 'amount');
  }
  
  // Check for valid number format
  // Require at least one digit, and if decimal point exists, require digit after it
  // This prevents parseUnits errors from inputs like "." or "1."
  if (!/^\d+(\.\d+)?$/.test(trimmed)) {
    throw new ValidationError('Amount must be a valid number', 'amount');
  }
  
  // Check for non-zero amount using string-based validation
  // Reject strings that are all zeros like "0", "0.0", "00.000"
  const nonZeroPattern = /^0*\.?0*$/;
  if (nonZeroPattern.test(trimmed)) {
    throw new ValidationError('Amount must be positive', 'amount');
  }
  
  // Check decimal places
  const decimalPlaces = (trimmed.split('.')[1] || '').length;
  if (decimalPlaces > maxDecimals) {
    throw new ValidationError(`Amount cannot have more than ${maxDecimals} decimal places`, 'amount');
  }
  
  return trimmed;
};

// Address validation with checksum
export const validateAddress = (address: string): string => {
  if (!address || typeof address !== 'string') {
    throw new ValidationError('Address is required', 'address');
  }

  const trimmed = address.trim();

  if (!isAddress(trimmed)) {
    throw new ValidationError('Invalid address format', 'address');
  }

  return getAddress(trimmed);
};

// Pool ID validation
export const validatePoolId = (poolId: string): string => {
  if (!poolId || typeof poolId !== 'string') {
    throw new ValidationError('Pool ID is required', 'poolId');
  }
  
  const trimmed = poolId.trim();
  
  if (!isAddress(trimmed)) {
    throw new ValidationError('Invalid pool ID format', 'poolId');
  }
  
  return getAddress(trimmed);
};

// Chain ID validation
export const validateChainId = (chainId: number | string): number => {
  const num = typeof chainId === 'string' 
    ? (chainId.startsWith('0x') ? parseInt(chainId, 16) : parseInt(chainId, 10))
    : chainId;
  
  if (isNaN(num) || !Number.isInteger(num) || num <= 0) {
    throw new ValidationError('Invalid chain ID', 'chainId');
  }
  
  // Check against authoritative supported chain IDs
  if (!SUPPORTED_CHAIN_IDS.some(id => id === num)) {
    throw new ValidationError('Unsupported chain ID', 'chainId');
  }
  
  return num;
};

// Token symbol validation
export const validateTokenSymbol = (symbol: string): string => {
  if (!symbol || typeof symbol !== 'string') {
    throw new ValidationError('Token symbol is required', 'symbol');
  }
  
  const trimmed = symbol.trim().toUpperCase();
  
  if (trimmed.length < 1 || trimmed.length > 10) {
    throw new ValidationError('Token symbol must be 1-10 characters', 'symbol');
  }
  
  if (!/^[A-Z0-9]+$/.test(trimmed)) {
    throw new ValidationError('Token symbol can only contain letters and numbers', 'symbol');
  }
  
  return trimmed;
};

// Pool name validation
export const validatePoolName = (name: string): string => {
  if (!name || typeof name !== 'string') {
    throw new ValidationError('Pool name is required', 'name');
  }
  
  const trimmed = name.trim();
  
  if (trimmed.length < 3 || trimmed.length > 50) {
    throw new ValidationError('Pool name must be 3-50 characters', 'name');
  }
  
  // Allow letters, numbers, spaces, and common symbols
  if (!/^[a-zA-Z0-9\s\-_.,!?()]+$/.test(trimmed)) {
    throw new ValidationError('Pool name contains invalid characters', 'name');
  }
  
  return trimmed;
};

// Fee validation
export const validateFee = (fee: string | number, maxFee: number = 100): number => {
  const num = typeof fee === 'string' ? parseFloat(fee) : fee;
  
  if (isNaN(num) || !isFinite(num)) {
    throw new ValidationError('Fee must be a valid number', 'fee');
  }
  
  if (num < 0) {
    throw new ValidationError('Fee cannot be negative', 'fee');
  }
  
  if (num > maxFee) {
    throw new ValidationError(`Fee cannot exceed ${maxFee}%`, 'fee');
  }
  
  return num;
};

// Combined validation for transaction inputs
export const validateTransactionInput = (input: {
  amount: string;
  poolId: string;
  chainId: number;
  userAddress: string;
}): {
  amount: string;
  poolId: string;
  chainId: number;
  userAddress: string;
} => {
  // Rate limiting
  checkRateLimit(`tx_${input.userAddress}`, 5, 60000); // 5 transactions per minute
  
  return {
    amount: validateAmount(input.amount),
    poolId: validatePoolId(input.poolId),
    chainId: validateChainId(input.chainId),
    userAddress: validateAddress(input.userAddress)
  };
};

// Validation for pool creation
export const validatePoolCreation = (input: {
  name: string;
  baseTokenAddress: string;
  bullCoinSymbol: string;
  bearCoinSymbol: string;
  mintFee: string;
  burnFee: string;
  creatorFee: string;
  treasuryFee: string;
}): {
  name: string;
  baseTokenAddress: string;
  bullCoinSymbol: string;
  bearCoinSymbol: string;
  mintFee: number;
  burnFee: number;
  creatorFee: number;
  treasuryFee: number;
} => {
  const mintFee = validateFee(input.mintFee);
  const burnFee = validateFee(input.burnFee);
  const creatorFee = validateFee(input.creatorFee);
  const treasuryFee = validateFee(input.treasuryFee);
  
  const totalFee = mintFee + burnFee + creatorFee + treasuryFee;
  if (totalFee >= 100) {
    throw new ValidationError('Total fees must be less than 100%', 'fees');
  }
  
  return {
    name: validatePoolName(input.name),
    baseTokenAddress: validateAddress(input.baseTokenAddress),
    bullCoinSymbol: validateTokenSymbol(input.bullCoinSymbol),
    bearCoinSymbol: validateTokenSymbol(input.bearCoinSymbol),
    mintFee,
    burnFee,
    creatorFee,
    treasuryFee
  };
};
