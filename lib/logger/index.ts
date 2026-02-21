/**
 * Unified Logger Facade
 *
 * Single entry point for all general-purpose logging throughout the application.
 * Automatically selects the right transport based on runtime environment:
 *
 *   - **Client (browser):** Uses `lib/clientLogger` — development console + production batching
 *   - **Server (Node.js):** Uses `lib/structuredLogger` — JSON output, Sentry integration,
 *     sensitive field redaction, trace correlation
 *
 * For specialized logging, import directly:
 *   - Security events: `import { logSecurityEvent } from '@/lib/securityLogger'`
 *   - Draft audit trail: `import { auditLogger } from '@/lib/draft/auditLogger'`
 *
 * @example
 * // Basic usage — auto-detects environment
 * import { log } from '@/lib/logger';
 * log.info('User signed in', { userId: 'abc' });
 * log.error('Payment failed', error, { orderId: '123' });
 *
 * @example
 * // Scoped logger — prefixes all messages
 * import { createLogger } from '@/lib/logger';
 * const log = createLogger('PaymentService');
 * log.info('Processing payment');  // → "[PaymentService] Processing payment"
 *
 * @module lib/logger
 */

// ============================================================================
// TYPES
// ============================================================================

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  [key: string]: unknown;
}

export interface Logger {
  debug(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, error?: Error | unknown, context?: LogContext): void;
}

// ============================================================================
// ENVIRONMENT DETECTION
// ============================================================================

const isServer = typeof window === 'undefined';

// ============================================================================
// SERVER LOGGER (uses structuredLogger — the most feature-rich server logger)
// ============================================================================

function createServerLogger(scope?: string): Logger {
  // Dynamic import to avoid bundling server code in client
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { logger: structuredLogger } = require('../structuredLogger');

  if (scope) {
    const child = structuredLogger.child({ scope });
    return {
      debug: (msg: string, ctx?: LogContext) => child.debug(msg, ctx),
      info: (msg: string, ctx?: LogContext) => child.info(msg, ctx),
      warn: (msg: string, ctx?: LogContext) => child.warn(msg, ctx),
      error: (msg: string, err?: Error | unknown, ctx?: LogContext) => child.error(msg, err, ctx),
    };
  }

  return {
    debug: (msg: string, ctx?: LogContext) => structuredLogger.debug(msg, ctx),
    info: (msg: string, ctx?: LogContext) => structuredLogger.info(msg, ctx),
    warn: (msg: string, ctx?: LogContext) => structuredLogger.warn(msg, ctx),
    error: (msg: string, err?: Error | unknown, ctx?: LogContext) =>
      structuredLogger.error(msg, err, ctx),
  };
}

// ============================================================================
// CLIENT LOGGER (uses lib/clientLogger — simple, dev-friendly)
// ============================================================================

function createClientLogger(scope?: string): Logger {
  // Dynamic import to avoid bundling client code in server
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { logger, createScopedLogger } = require('../clientLogger');

  if (scope) {
    const scoped = createScopedLogger(scope);
    return {
      debug: (msg: string, ctx?: LogContext) => scoped.debug(msg, ctx),
      info: (msg: string, ctx?: LogContext) => scoped.info(msg, ctx),
      warn: (msg: string, ctx?: LogContext) => scoped.warn(msg, ctx),
      error: (msg: string, err?: Error | unknown, ctx?: LogContext) =>
        scoped.error(msg, err instanceof Error ? err : undefined, ctx),
    };
  }

  return {
    debug: (msg: string, ctx?: LogContext) => logger.debug(msg, ctx),
    info: (msg: string, ctx?: LogContext) => logger.info(msg, ctx),
    warn: (msg: string, ctx?: LogContext) => logger.warn(msg, ctx),
    error: (msg: string, err?: Error | unknown, ctx?: LogContext) =>
      logger.error(msg, err instanceof Error ? err : undefined, ctx),
  };
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Create a scoped logger instance.
 * Use this in modules/services that want a consistent prefix.
 *
 * @param scope - Prefix for all log messages (e.g., "PaymentService", "DraftRoom")
 */
export function createLogger(scope: string): Logger {
  return isServer ? createServerLogger(scope) : createClientLogger(scope);
}

/**
 * Default logger instance (unscoped).
 * For quick usage when you don't need a scoped prefix.
 */
export const log: Logger = isServer ? createServerLogger() : createClientLogger();

// ============================================================================
// BACKWARD-COMPATIBLE EXPORTS
// ============================================================================
// These preserve existing import paths while migration to the unified facade proceeds.

export { logger } from './clientLogger';
export { serverLogger } from './serverLogger';
