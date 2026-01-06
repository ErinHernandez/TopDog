/**
 * Client-Side Logging Utility
 * 
 * Provides consistent, environment-aware logging for client-side code.
 * Automatically gates debug logs in production while preserving error/warn logs.
 * 
 * @example
 * ```ts
 * import { logger } from '@/lib/clientLogger';
 * 
 * logger.debug('Debug info', { userId: '123' });
 * logger.info('User action', { action: 'click' });
 * logger.warn('Deprecated API used');
 * logger.error('Failed to load data', error);
 * ```
 */

/**
 * Log levels
 */
const LogLevel = {
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
} as const;

type LogLevel = typeof LogLevel[keyof typeof LogLevel];

/**
 * Check if we're in development mode
 */
const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Check if debug logging is enabled
 * Can be overridden with localStorage flag: `localStorage.setItem('debug', 'true')`
 */
function isDebugEnabled(): boolean {
  if (typeof window === 'undefined') return isDevelopment;
  
  // Check localStorage override
  const debugOverride = localStorage.getItem('debug');
  if (debugOverride === 'true') return true;
  if (debugOverride === 'false') return false;
  
  return isDevelopment;
}

/**
 * Format log entry with context
 */
interface LogContext {
  [key: string]: unknown;
}

function formatLog(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
  const timestamp = new Date().toISOString();
  
  const logEntry: Record<string, unknown> = {
    timestamp,
    level,
    message,
    ...context,
  };

  if (error) {
    logEntry.error = {
      message: error.message,
      name: error.name,
      stack: isDevelopment ? error.stack : undefined,
    };
  }

  // Choose console method based on level
  const logMethod = 
    level === LogLevel.ERROR ? console.error :
    level === LogLevel.WARN ? console.warn :
    level === LogLevel.INFO ? console.info :
    console.log;

  // In production, only log errors and warnings (unless debug is enabled)
  const shouldLog = 
    level === LogLevel.ERROR ||
    level === LogLevel.WARN ||
    (isDebugEnabled() && (level === LogLevel.DEBUG || level === LogLevel.INFO));

  if (shouldLog) {
    if (isDevelopment) {
      // Pretty print in development
      logMethod(`[${level}] ${message}`, context || {}, error || '');
    } else {
      // Compact JSON in production
      logMethod(JSON.stringify(logEntry));
    }
  }
}

/**
 * Client-side logger
 */
export const logger = {
  /**
   * Debug-level logging (only in development or when debug enabled)
   * Use for detailed debugging information
   */
  debug(message: string, context?: LogContext): void {
    formatLog(LogLevel.DEBUG, message, context);
  },

  /**
   * Info-level logging (only in development or when debug enabled)
   * Use for informational messages about normal operations
   */
  info(message: string, context?: LogContext): void {
    formatLog(LogLevel.INFO, message, context);
  },

  /**
   * Warning-level logging (always logged)
   * Use for non-critical issues or deprecation warnings
   */
  warn(message: string, context?: LogContext): void {
    formatLog(LogLevel.WARN, message, context);
  },

  /**
   * Error-level logging (always logged)
   * Use for errors that need attention
   */
  error(message: string, error?: Error, context?: LogContext): void {
    formatLog(LogLevel.ERROR, message, context, error);
  },
};

/**
 * Create a scoped logger with a prefix
 * 
 * @example
 * ```ts
 * const draftLogger = createScopedLogger('[DraftRoom]');
 * draftLogger.debug('Timer expired'); // Logs: [DraftRoom] Timer expired
 * ```
 */
export function createScopedLogger(prefix: string) {
  return {
    debug: (message: string, context?: LogContext) => 
      logger.debug(`${prefix} ${message}`, context),
    info: (message: string, context?: LogContext) => 
      logger.info(`${prefix} ${message}`, context),
    warn: (message: string, context?: LogContext) => 
      logger.warn(`${prefix} ${message}`, context),
    error: (message: string, error?: Error, context?: LogContext) => 
      logger.error(`${prefix} ${message}`, error, context),
  };
}

export default logger;

