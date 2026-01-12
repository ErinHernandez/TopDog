/**
 * Structured Logger
 * 
 * Replaces console.log with structured JSON logging for production.
 * In development, logs are pretty-printed. In production, logs are JSON.
 * 
 * @example
 * ```ts
 * import { logger } from '@/lib/structuredLogger';
 * 
 * logger.info('User made pick', { userId, draftId, playerId });
 * logger.error('Draft failed', error, { draftId, userId });
 * ```
 */

// ============================================================================
// TYPES
// ============================================================================

export interface LogContext {
  [key: string]: unknown;
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// ============================================================================
// CONFIGURATION
// ============================================================================

const IS_DEV = process.env.NODE_ENV === 'development';
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const LOG_LEVEL = (process.env.LOG_LEVEL || (IS_DEV ? 'debug' : 'info')).toLowerCase() as LogLevel;

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

// ============================================================================
// LOG FORMATTING
// ============================================================================

function formatLog(
  level: LogLevel,
  message: string,
  context?: LogContext,
  error?: Error
): void {
  // Check if we should log at this level
  if (LEVEL_PRIORITY[level] < LEVEL_PRIORITY[LOG_LEVEL]) {
    return;
  }

  const timestamp = new Date().toISOString();

  if (IS_DEV) {
    // Pretty print in development
    const prefix = `[${level.toUpperCase()}] ${timestamp}`;
    const consoleMethod = 
      level === 'error' ? console.error :
      level === 'warn' ? console.warn :
      level === 'info' ? console.info :
      console.log;

    if (error) {
      consoleMethod(prefix, message, context || {}, error);
    } else {
      consoleMethod(prefix, message, context || {});
    }
  } else {
    // Structured JSON in production
    const logEntry: Record<string, unknown> = {
      timestamp,
      level,
      message,
      ...context,
    };

    if (error) {
      logEntry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    // Use appropriate console method (some log aggregators parse these)
    const consoleMethod = 
      level === 'error' ? console.error :
      level === 'warn' ? console.warn :
      console.log;

    consoleMethod(JSON.stringify(logEntry));
  }
}

// ============================================================================
// PUBLIC API
// ============================================================================

export const logger = {
  /**
   * Debug-level logging (development only, or when LOG_LEVEL=debug)
   */
  debug(message: string, context?: LogContext): void {
    formatLog('debug', message, context);
  },

  /**
   * Info-level logging (normal operations)
   */
  info(message: string, context?: LogContext): void {
    formatLog('info', message, context);
  },

  /**
   * Warning-level logging (something unexpected but not an error)
   */
  warn(message: string, context?: LogContext): void {
    formatLog('warn', message, context);
  },

  /**
   * Error-level logging (something went wrong)
   */
  error(message: string, error?: Error, context?: LogContext): void {
    formatLog('error', message, context, error);
  },
};

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Log a draft room event
 */
export function logDraftEvent(
  event: string,
  context: LogContext & { roomId: string; userId?: string }
): void {
  logger.info(`[Draft] ${event}`, {
    ...context,
    component: 'DraftRoom',
  });
}

/**
 * Log a payment event
 */
export function logPaymentEvent(
  event: string,
  context: LogContext & { userId: string; amount?: number; currency?: string }
): void {
  logger.info(`[Payment] ${event}`, {
    ...context,
    component: 'Payment',
  });
}

/**
 * Log an API request
 */
export function logApiRequest(
  method: string,
  path: string,
  context?: LogContext
): void {
  logger.info(`[API] ${method} ${path}`, {
    ...context,
    component: 'API',
  });
}
