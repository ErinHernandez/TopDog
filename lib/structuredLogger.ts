/**
 * Structured Logger — Production-Grade Implementation
 *
 * JSON-formatted logging with:
 * - Log level filtering via LOG_LEVEL env var
 * - JSON format: { timestamp, level, message, context, traceId }
 * - Request correlation via x-request-id header
 * - Sensitive field redaction (passwords, tokens, API keys)
 * - Sentry integration: error/warn → captureException/captureMessage
 * - Development: pretty-print to console
 * - Production: JSON to stdout (consumed by Vercel log drain)
 *
 * @module lib/structuredLogger
 */

import * as Sentry from '@sentry/nextjs';

/* ================================================================
   Types
   ================================================================ */

export interface LogContext {
  [key: string]: unknown;
}

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  traceId?: string;
  userId?: string;
  service: string;
}

/* ================================================================
   Configuration
   ================================================================ */

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

/** Sensitive keys that should be redacted from log output. */
const SENSITIVE_KEYS = new Set([
  'password',
  'token',
  'secret',
  'apiKey',
  'api_key',
  'apikey',
  'authorization',
  'cookie',
  'sessionId',
  'session_id',
  'creditCard',
  'credit_card',
  'ssn',
  'accessToken',
  'access_token',
  'refreshToken',
  'refresh_token',
  'privateKey',
  'private_key',
]);

const REDACTED = '[REDACTED]';

/* ================================================================
   Helpers
   ================================================================ */

function getConfiguredLevel(): LogLevel {
  const envLevel = (
    typeof process !== 'undefined'
      ? process.env?.LOG_LEVEL
      : undefined
  ) as string | undefined;

  if (envLevel && envLevel in LOG_LEVEL_PRIORITY) {
    return envLevel as LogLevel;
  }

  // Default: 'debug' in development, 'info' in production
  return isDevMode() ? 'debug' : 'info';
}

function isDevMode(): boolean {
  if (typeof process === 'undefined') return false;
  return process.env?.NODE_ENV === 'development' || process.env?.NODE_ENV === 'test';
}

function shouldLog(level: LogLevel): boolean {
  const configuredLevel = getConfiguredLevel();
  return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[configuredLevel];
}

/**
 * Deep-redact sensitive fields from an object.
 * Returns a new object — original is not mutated.
 */
function redactSensitive(obj: unknown, depth = 0): unknown {
  if (depth > 8) return '[MAX_DEPTH]';
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') return obj;
  if (typeof obj === 'number' || typeof obj === 'boolean') return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) => redactSensitive(item, depth + 1));
  }

  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      if (SENSITIVE_KEYS.has(key) || SENSITIVE_KEYS.has(key.toLowerCase())) {
        result[key] = REDACTED;
      } else {
        result[key] = redactSensitive(value, depth + 1);
      }
    }
    return result;
  }

  return String(obj);
}

/**
 * Extract a serializable representation of an Error.
 */
function serializeError(err: unknown): Record<string, unknown> {
  if (err instanceof Error) {
    return {
      name: err.name,
      message: err.message,
      stack: err.stack?.split('\n').slice(0, 8).join('\n'),
      ...(err.cause ? { cause: serializeError(err.cause) } : {}),
    };
  }
  if (typeof err === 'string') return { message: err };
  return { message: String(err) };
}

/**
 * Format a log entry for output.
 *
 * - Development: human-readable colored output
 * - Production: single-line JSON to stdout
 */
function formatAndEmit(entry: LogEntry): void {
  if (isDevMode()) {
    // Pretty development output
    const levelColors: Record<LogLevel, string> = {
      debug: '\x1b[90m', // gray
      info: '\x1b[36m',  // cyan
      warn: '\x1b[33m',  // yellow
      error: '\x1b[31m', // red
    };
    const reset = '\x1b[0m';
    const color = levelColors[entry.level];
    const prefix = `${color}[${entry.level.toUpperCase()}]${reset}`;
    const ts = entry.timestamp.slice(11, 23); // HH:mm:ss.SSS

    const parts = [`${ts} ${prefix} ${entry.message}`];

    if (entry.traceId) {
      parts[0] += ` ${'\x1b[90m'}(trace: ${entry.traceId})${reset}`;
    }

    if (entry.context && Object.keys(entry.context).length > 0) {
      const contextStr = JSON.stringify(entry.context, null, 2);
      parts.push(`  ${'\x1b[90m'}${contextStr}${reset}`);
    }

    const consoleFn = entry.level === 'error'
      ? console.error
      : entry.level === 'warn'
        ? console.warn
        : entry.level === 'debug'
          ? console.debug
          : console.info;

    consoleFn(parts.join('\n'));
  } else {
    // Production: single-line JSON to stdout
    const line = JSON.stringify(entry);
    if (entry.level === 'error') {
      process.stderr.write(line + '\n');
    } else {
      process.stdout.write(line + '\n');
    }
  }
}

/* ================================================================
   Logger API
   ================================================================ */

function createLogEntry(
  level: LogLevel,
  message: string,
  context?: LogContext,
  error?: Error | unknown,
): LogEntry {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    service: 'idesaign',
  };

  // Build context with redaction
  const ctx: Record<string, unknown> = {};

  if (context) {
    const redacted = redactSensitive(context) as Record<string, unknown>;
    Object.assign(ctx, redacted);

    // Extract well-known fields
    if (context.traceId) entry.traceId = String(context.traceId);
    if (context.requestId) entry.traceId = String(context.requestId);
    if (context.userId) entry.userId = String(context.userId);
  }

  if (error) {
    ctx.error = serializeError(error);
  }

  if (Object.keys(ctx).length > 0) {
    entry.context = ctx;
  }

  return entry;
}

export const logger = {
  debug(message: string, context?: LogContext): void {
    if (!shouldLog('debug')) return;
    formatAndEmit(createLogEntry('debug', message, context));
  },

  info(message: string, context?: LogContext): void {
    if (!shouldLog('info')) return;
    formatAndEmit(createLogEntry('info', message, context));
  },

  warn(message: string, context?: LogContext): void {
    if (!shouldLog('warn')) return;
    formatAndEmit(createLogEntry('warn', message, context));

    // Forward to Sentry as warning (no-op if Sentry isn't initialized)
    try {
      Sentry.captureMessage(message, { level: 'warning', extra: context as Record<string, unknown> });
    } catch {
      // Sentry not available — swallow silently
    }
  },

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    if (!shouldLog('error')) return;
    formatAndEmit(createLogEntry('error', message, context, error));

    // Forward to Sentry (no-op if Sentry isn't initialized)
    try {
      const scope = new Sentry.Scope();
      if (context?.traceId) scope.setTag('traceId', String(context.traceId));
      if (context?.requestId) scope.setTag('requestId', String(context.requestId));
      if (context?.userId) scope.setUser({ id: String(context.userId) });

      if (error instanceof Error) {
        Sentry.captureException(error, { extra: context as Record<string, unknown> });
      } else if (error) {
        Sentry.captureException(new Error(message), {
          extra: { ...context as Record<string, unknown>, originalError: String(error) },
        });
      } else {
        Sentry.captureMessage(message, { level: 'error', extra: context as Record<string, unknown> });
      }
    } catch {
      // Sentry not available — swallow silently
    }
  },

  /**
   * Create a child logger with preset context fields.
   * Useful for request-scoped logging.
   *
   * @example
   * const reqLogger = logger.child({ requestId: req.headers['x-request-id'], userId: req.uid });
   * reqLogger.info('Processing upload');
   */
  child(baseContext: LogContext) {
    return {
      debug: (msg: string, ctx?: LogContext) =>
        logger.debug(msg, { ...baseContext, ...ctx }),
      info: (msg: string, ctx?: LogContext) =>
        logger.info(msg, { ...baseContext, ...ctx }),
      warn: (msg: string, ctx?: LogContext) =>
        logger.warn(msg, { ...baseContext, ...ctx }),
      error: (msg: string, err?: Error | unknown, ctx?: LogContext) =>
        logger.error(msg, err, { ...baseContext, ...ctx }),
    };
  },
};

export default logger;

/* ================================================================
   Testing Helpers
   ================================================================ */

/** @internal Exposed for unit testing. */
export const _internals = {
  redactSensitive,
  serializeError,
  shouldLog,
  getConfiguredLevel,
  createLogEntry,
};
