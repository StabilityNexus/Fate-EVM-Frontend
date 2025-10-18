// src/lib/errorHandler.ts
// Standardized error handling system for production

import { logger } from './logger';

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public userMessage?: string,
    public context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// Predefined error types
export const ErrorCodes = {
  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  INVALID_INPUT: 'INVALID_INPUT',
  
  // Network errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  RPC_ERROR: 'RPC_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  
  // Blockchain errors
  TRANSACTION_FAILED: 'TRANSACTION_FAILED',
  INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
  INSUFFICIENT_ALLOWANCE: 'INSUFFICIENT_ALLOWANCE',
  GAS_ESTIMATION_FAILED: 'GAS_ESTIMATION_FAILED',
  
  // Database errors
  DATABASE_ERROR: 'DATABASE_ERROR',
  CACHE_ERROR: 'CACHE_ERROR',
  
  // Authentication errors
  WALLET_NOT_CONNECTED: 'WALLET_NOT_CONNECTED',
  WRONG_CHAIN: 'WRONG_CHAIN',
  
  // Unknown errors
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR'
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

// Error factory functions
export const createValidationError = (message: string, field: string, context?: Record<string, unknown>): AppError => {
  return new AppError(
    message,
    ErrorCodes.VALIDATION_ERROR,
    400,
    message,
    { field, ...context }
  );
};

export const createNetworkError = (message: string, context?: Record<string, unknown>): AppError => {
  return new AppError(
    message,
    ErrorCodes.NETWORK_ERROR,
    503,
    'Network error. Please check your connection and try again.',
    context
  );
};

export const createTransactionError = (message: string, context?: Record<string, unknown>): AppError => {
  return new AppError(
    message,
    ErrorCodes.TRANSACTION_FAILED,
    400,
    'Transaction failed. Please try again.',
    context
  );
};

export const createBalanceError = (message: string, context?: Record<string, unknown>): AppError => {
  return new AppError(
    message,
    ErrorCodes.INSUFFICIENT_BALANCE,
    400,
    'Insufficient balance for this transaction.',
    context
  );
};

export const createWalletError = (message: string, context?: Record<string, unknown>): AppError => {
  return new AppError(
    message,
    ErrorCodes.WALLET_NOT_CONNECTED,
    401,
    'Please connect your wallet to continue.',
    context
  );
};

// Main error handler
export const handleError = (error: unknown, context?: Record<string, unknown>): AppError => {
  // If it's already an AppError, return it
  if (error instanceof AppError) {
    return error;
  }

  // Handle specific error types
  if (error instanceof Error) {
    const message = error.message;
    
    // Network errors
    if (message.includes('fetch') || message.includes('network') || message.includes('timeout')) {
      return createNetworkError(message, { originalError: error.message, ...context });
    }
    
    // Transaction errors
    if (message.includes('transaction') || message.includes('gas') || message.includes('revert')) {
      return createTransactionError(message, { originalError: error.message, ...context });
    }
    
    // Balance errors
    if (message.includes('balance') || message.includes('insufficient')) {
      return createBalanceError(message, { originalError: error.message, ...context });
    }
    
    // Wallet errors
    if (message.includes('wallet') || message.includes('connect') || message.includes('chain')) {
      return createWalletError(message, { originalError: error.message, ...context });
    }
    
    // Generic error
    return new AppError(
      message,
      ErrorCodes.UNKNOWN_ERROR,
      500,
      'An unexpected error occurred. Please try again.',
      { originalError: error.message, ...context }
    );
  }

  // Handle non-Error objects
  const errorMessage = typeof error === 'string' ? error : 'An unknown error occurred';
  return new AppError(
    errorMessage,
    ErrorCodes.UNKNOWN_ERROR,
    500,
    'An unexpected error occurred. Please try again.',
    { originalError: error, ...context }
  );
};

// Higher-order function for error handling
export const withErrorHandling = <T extends unknown[], R>(
  fn: (...args: T) => Promise<R>,
  context?: Record<string, unknown>
) => {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      const appError = handleError(error, context);
      logger.error('Function error:', appError, { 
        functionName: fn.name,
        args: args.length > 0 ? 'provided' : 'none',
        ...context 
      });
      throw appError;
    }
  };
};

// Error boundary helper
export const getErrorDisplayMessage = (error: AppError): string => {
  return error.userMessage || error.message;
};

// Error reporting (for production monitoring)
export const reportError = (error: AppError, additionalContext?: Record<string, unknown>) => {
  const errorReport = {
    code: error.code,
    message: error.message,
    statusCode: error.statusCode,
    context: { ...error.context, ...additionalContext },
    timestamp: new Date().toISOString(),
    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
    url: typeof window !== 'undefined' ? window.location.href : 'server'
  };

  // Log for now - in production, send to monitoring service
  logger.error('Error report:', error, errorReport);
  
  // Example: Send to monitoring service
  // if (process.env.NODE_ENV === 'production') {
  //   fetch('/api/errors', {
  //     method: 'POST',
  //     headers: { 'Content-Type': 'application/json' },
  //     body: JSON.stringify(errorReport)
  //   }).catch(() => {
  //     // Fallback logging
  //     console.error('Failed to report error:', errorReport);
  //   });
  // }
};

// Retry mechanism
export const withRetry = <T extends unknown[], R>(
  fn: (...args: T) => Promise<R>,
  maxRetries: number = 3,
  delayMs: number = 1000
) => {
  return async (...args: T): Promise<R> => {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn(...args);
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) {
          throw handleError(lastError, { attempt, maxRetries });
        }
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
        
        logger.warn(`Retry attempt ${attempt}/${maxRetries} for ${fn.name}:`, { error: lastError.message });
      }
    }
    
    throw lastError!;
  };
};

// Timeout wrapper
export const withTimeout = <T extends unknown[], R>(
  fn: (...args: T) => Promise<R>,
  timeoutMs: number = 30000
) => {
  return async (...args: T): Promise<R> => {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Operation timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    });

    return Promise.race([
      fn(...args),
      timeoutPromise
    ]);
  };
};
