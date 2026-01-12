/**
 * Server-side Logger
 * 
 * Simple logger for API routes and server-side code.
 */

export interface ScopedLogger {
  debug: (message: string, ...args: unknown[]) => void;
  info: (message: string, ...args: unknown[]) => void;
  warn: (message: string, ...args: unknown[]) => void;
  error: (message: string, error?: unknown, ...args: unknown[]) => void;
}

export function createScopedLogger(scope: string): ScopedLogger {
  return {
    debug: (message: string, ...args: unknown[]): void => {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[${scope}] ${message}`, ...args);
      }
    },
    info: (message: string, ...args: unknown[]): void => {
      console.log(`[${scope}] ${message}`, ...args);
    },
    warn: (message: string, ...args: unknown[]): void => {
      console.warn(`[${scope}] ${message}`, ...args);
    },
    error: (message: string, error?: unknown, ...args: unknown[]): void => {
      console.error(`[${scope}] ${message}`, error, ...args);
    },
  };
}

