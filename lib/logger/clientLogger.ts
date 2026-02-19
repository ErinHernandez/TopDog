// File: lib/logger/clientLogger.ts
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  component?: string;
  action?: string;
  userId?: string;
  [key: string]: unknown;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

class ClientLogger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private buffer: LogEntry[] = [];
  private flushInterval: NodeJS.Timeout | null = null;
  
  constructor() {
    // Batch send logs every 10 seconds in production
    if (typeof window !== 'undefined' && !this.isDevelopment) {
      this.flushInterval = setInterval(() => this.flush(), 10000);
      window.addEventListener('beforeunload', () => this.flush());
    }
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
    };
  }

  private log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
    const entry = this.formatMessage(level, message, context);
    
    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    }

    // Development: use console with structured output
    if (this.isDevelopment) {
      const consoleMethod = level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'info';
      // eslint-disable-next-line no-console -- dynamic access using only allowed methods (error, warn, info)
      console[consoleMethod](`[${level.toUpperCase()}]`, message, context || '', error || '');
      return;
    }

    // Production: buffer and batch send
    this.buffer.push(entry);
    
    // Immediately flush errors
    if (level === 'error') {
      this.flush();
    }
  }

  private async flush(): Promise<void> {
    if (this.buffer.length === 0) return;
    
    const entries = [...this.buffer];
    this.buffer = [];

    try {
      await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries }),
      });
    } catch {
      // Re-add to buffer if send fails
      this.buffer.unshift(...entries);
    }
  }

  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }

  error(message: string, error?: Error, context?: LogContext): void {
    this.log('error', message, context, error);
  }
}

export const logger = new ClientLogger();

// Usage examples:
// logger.info('User joined draft', { component: 'DraftRoom', userId: '123', draftId: '456' });
// logger.error('Payment failed', error, { component: 'Checkout', amount: 100 });
