/**
 * Production-ready logging service for Fate Protocol
 * Provides different log levels and can be easily configured for different environments
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4,
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: Record<string, unknown>;
  error?: Error;
}

class Logger {
  private logLevel: LogLevel;
  private isDevelopment: boolean;

  constructor() {
    // Set log level based on environment
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.logLevel = this.isDevelopment ? LogLevel.DEBUG : LogLevel.WARN;
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.logLevel;
  }

  // Safe JSON serializer that handles BigInt and circular references
  private safeStringify(value: unknown): string {
    const seen = new WeakSet();

    const replacer = (key: string, val: unknown): unknown => {
      // Handle BigInt values
      if (typeof val === 'bigint') {
        return val.toString();
      }

      // Handle circular references
      if (val !== null && typeof val === 'object') {
        if (seen.has(val)) {
          return '[Circular]';
        }
        seen.add(val);
      }

      return val;
    };

    try {
      return JSON.stringify(value, replacer, 2);
    } catch {
      // Fallback for any other serialization errors
      try {
        return String(value);
      } catch {
        return '[Unserializable value]';
      }
    }
  }

  // Standardized error logging utility
  logError(message: string, error: unknown, context?: Record<string, unknown>): void {
    const errorInstance = error instanceof Error ? error : undefined;
    this.error(message, errorInstance, context);
  }

  // Standardized contract error logging utility
  logContractError(functionName: string, contractError: unknown, context?: Record<string, unknown>): void {
    const error = contractError as { message?: string; [key: string]: unknown };
    const errorInstance = contractError instanceof Error ? contractError : undefined;
    this.error(`Error in ${functionName}:`, errorInstance, {
      ...context,
      message: error.message || 'Unknown contract error',
      contractError: error
    });
  }

  private formatMessage(level: LogLevel, message: string, context?: Record<string, unknown>): string {
    const timestamp = new Date().toISOString();
    const levelName = LogLevel[level];
    const contextStr = context ? ` ${this.safeStringify(context)}` : '';
    return `[${timestamp}] ${levelName}: ${message}${contextStr}`;
  }

  private log(level: LogLevel, message: string, context?: Record<string, unknown>, error?: Error): void {
    if (!this.shouldLog(level)) return;

    const formattedMessage = this.formatMessage(level, message, context);
    
    // In development, use console methods for better debugging
    if (this.isDevelopment) {
      switch (level) {
        case LogLevel.DEBUG:
          console.debug(formattedMessage);
          break;
        case LogLevel.INFO:
          console.info(formattedMessage);
          break;
        case LogLevel.WARN:
          console.warn(formattedMessage);
          break;
        case LogLevel.ERROR:
          console.error(formattedMessage, error);
          break;
      }
    } else {
      // In production, you might want to send logs to a service like Sentry, LogRocket, etc.
      // For now, we'll use console methods but with structured logging
      switch (level) {
        case LogLevel.WARN:
          console.warn(formattedMessage);
          break;
        case LogLevel.ERROR:
          console.error(formattedMessage, error);
          // Here you could send to external logging service
          // this.sendToLoggingService({ level, message, context, error, timestamp: new Date() });
          break;
      }
    }
  }

  debug(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, error?: Error, context?: Record<string, unknown>): void {
    this.log(LogLevel.ERROR, message, context, error);
  }

  // Specialized logging methods for common use cases
  transaction(message: string, txHash?: string, context?: Record<string, unknown>): void {
    this.info(`Transaction: ${message}`, { txHash, ...context });
  }

  wallet(message: string, address?: string, context?: Record<string, unknown>): void {
    this.info(`Wallet: ${message}`, { address, ...context });
  }

  contract(message: string, contractAddress?: string, context?: Record<string, unknown>): void {
    this.info(`Contract: ${message}`, { contractAddress, ...context });
  }

  pool(message: string, poolId?: string, context?: Record<string, unknown>): void {
    this.info(`Pool: ${message}`, { poolId, ...context });
  }

  // Method to send logs to external service (implement as needed)
  private sendToLoggingService(): void {
    // Implement integration with external logging service
    // Examples: Sentry, LogRocket, DataDog, etc.
    // fetch('/api/logs', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: this.safeStringify(logEntry)
    // }).catch(err => console.error('Failed to send log:', err));
  }

  // Method to set log level dynamically
  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  // Static utility methods for external use
  static logError(message: string, error: unknown, context?: Record<string, unknown>): void {
    logger.logError(message, error, context);
  }

  static logContractError(functionName: string, contractError: unknown, context?: Record<string, unknown>): void {
    logger.logContractError(functionName, contractError, context);
  }
}

// Create and export a singleton instance
export const logger = new Logger();

// Export the Logger class for testing or custom instances
export { Logger };
