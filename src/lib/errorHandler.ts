// src/lib/errorHandler.ts
// Standardized error handling system for production

import { logger } from './logger';
import { ValidationError } from './validation';

export class AppError extends Error {
  constructor(
    message: string,
    public code: ErrorCode,
    public statusCode: number = 500,
    public userMessage?: string,
    public context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
    
    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, AppError.prototype);
    
    // Capture stack trace if available (Node.js environments)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
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

// Define ErrorCode type from ErrorCodes
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
    
    // Check for ValidationError instances (includes rate limiting)
    if (error instanceof ValidationError || error.name === 'ValidationError') {
      // Check if it's a rate limit error specifically
      if (message.toLowerCase().includes('rate limit') || 
          (message.toLowerCase().includes('maximum') && message.toLowerCase().includes('requests'))) {
        return new AppError(
          message,
          ErrorCodes.RATE_LIMIT_EXCEEDED,
          429,
          'Too many requests. Please wait a moment and try again.',
          { originalError: error.message, ...context }
        );
      }
      
      // Regular validation error
      return new AppError(
        message,
        ErrorCodes.VALIDATION_ERROR,
        400,
        'Invalid input. Please check your data and try again.',
        { originalError: error.message, ...context }
      );
    }
    
    // Network errors - more specific matching
    const networkKeywords = ['fetch failed', 'network error', 'connection timeout', 'request timeout', 'dns'];
    if (networkKeywords.some(keyword => message.toLowerCase().includes(keyword.toLowerCase()))) {
      return createNetworkError(message, { originalError: error.message, ...context });
    }
    
    // Transaction errors - more specific matching
    const transactionKeywords = ['transaction failed', 'gas estimation failed', 'revert', 'execution reverted'];
    if (transactionKeywords.some(keyword => message.toLowerCase().includes(keyword.toLowerCase()))) {
      return createTransactionError(message, { originalError: error.message, ...context });
    }
    
    // Balance errors - more specific matching
    const balanceKeywords = ['insufficient balance', 'insufficient funds', 'balance too low'];
    if (balanceKeywords.some(keyword => message.toLowerCase().includes(keyword.toLowerCase()))) {
      return createBalanceError(message, { originalError: error.message, ...context });
    }
    
    // Wallet errors - more specific matching
    const walletKeywords = ['wallet not connected', 'please connect', 'wrong chain', 'unsupported chain'];
    if (walletKeywords.some(keyword => message.toLowerCase().includes(keyword.toLowerCase()))) {
      return createWalletError(message, { originalError: error.message, ...context });
    }
    
    // Generic error for truly unknown cases
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
    let timeoutId: NodeJS.Timeout | null = null;
    
    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new AppError(
          `Operation timed out after ${timeoutMs}ms`,
          ErrorCodes.TIMEOUT_ERROR,
          408,
          'The operation took too long to complete. Please try again.',
          { timeoutMs }
        ));
      }, timeoutMs);
    });

    try {
      const result = await Promise.race([
        fn(...args),
        timeoutPromise
      ]);
      
      // Clear timeout on success
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      return result;
    } catch (error) {
      // Clear timeout on error
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      // Re-throw the error (could be from main function or timeout)
      throw error;
    }
  };
};
