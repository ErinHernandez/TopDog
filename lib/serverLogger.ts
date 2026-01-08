/**
 * Server-side Logger
 * 
 * Simple logger for API routes and server-side code.
 */

export function createScopedLogger(scope: string) {
  return {
    debug: (message: string, ...args: unknown[]) => {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[${scope}] ${message}`, ...args);
      }
    },
    info: (message: string, ...args: unknown[]) => {
      console.log(`[${scope}] ${message}`, ...args);
    },
    warn: (message: string, ...args: unknown[]) => {
      console.warn(`[${scope}] ${message}`, ...args);
    },
    error: (message: string, error?: unknown, ...args: unknown[]) => {
      console.error(`[${scope}] ${message}`, error, ...args);
    },
  };
}

