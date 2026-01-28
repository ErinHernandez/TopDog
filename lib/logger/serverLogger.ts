// File: lib/logger/serverLogger.ts
import * as Sentry from '@sentry/nextjs';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface ServerLogContext {
  requestId?: string;
  userId?: string;
  method?: string;
  path?: string;
  duration?: number;
  [key: string]: unknown;
}

interface ServerLogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: ServerLogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

class ServerLogger {
  private serviceName: string;
  private environment: string;

  constructor() {
    this.serviceName = process.env.SERVICE_NAME || 'bestball-api';
    this.environment = process.env.NODE_ENV || 'development';
  }

  private formatEntry(
    level: LogLevel,
    message: string,
    context?: ServerLogContext,
    error?: Error
  ): ServerLogEntry {
    const entry: ServerLogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: {
        ...context,
        service: this.serviceName,
        environment: this.environment,
      },
    };

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    return entry;
  }

  private output(entry: ServerLogEntry): void {
    // In production, output as JSON for log aggregation
    if (this.environment === 'production') {
      console.log(JSON.stringify(entry));
    } else {
      // In development, use readable format
      const { level, message, context, error } = entry;
      const prefix = `[${entry.timestamp}] [${level.toUpperCase()}]`;
      console.log(prefix, message, context ? JSON.stringify(context, null, 2) : '');
      if (error) console.error(error.stack);
    }
  }

  debug(message: string, context?: ServerLogContext): void {
    if (this.environment === 'development') {
      this.output(this.formatEntry('debug', message, context));
    }
  }

  info(message: string, context?: ServerLogContext): void {
    this.output(this.formatEntry('info', message, context));
  }

  warn(message: string, error?: Error | null, context?: ServerLogContext): void {
    const entry = this.formatEntry('warn', message, context, error || undefined);
    this.output(entry);
  }

  error(message: string, error?: Error | null, context?: ServerLogContext): void {
    const entry = this.formatEntry('error', message, context, error || undefined);
    this.output(entry);

    // Also send to Sentry
    if (error && this.environment === 'production') {
      Sentry.captureException(error, {
        extra: context,
      });
    }
  }

  // Request logging middleware helper
  request(req: { method: string; url: string }, duration: number, statusCode: number): void {
    const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
    this.output(
      this.formatEntry(level, `${req.method} ${req.url} ${statusCode}`, {
        method: req.method,
        path: req.url,
        statusCode,
        duration,
      })
    );
  }
}

export const serverLogger = new ServerLogger();

// Usage:
// serverLogger.info('Processing payment', { userId: '123', amount: 100 });
// serverLogger.error('Database connection failed', error, { database: 'primary' });
