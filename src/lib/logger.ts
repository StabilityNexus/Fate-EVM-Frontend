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

  private formatMessage(level: LogLevel, message: string, context?: Record<string, unknown>): string {
    const timestamp = new Date().toISOString();
    const levelName = LogLevel[level];
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
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
  private sendToLoggingService(logEntry: LogEntry): void {
    // Implement integration with external logging service
    // Examples: Sentry, LogRocket, DataDog, etc.
    // fetch('/api/logs', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(logEntry)
    // }).catch(err => console.error('Failed to send log:', err));
  }

  // Method to set log level dynamically
  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }
}

// Create and export a singleton instance
export const logger = new Logger();

// Export the Logger class for testing or custom instances
export { Logger };
