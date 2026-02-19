/**
 * Error Tracking Service
 *
 * Centralized error tracking with Sentry integration.
 * Currently stubbed - enable by setting NEXT_PUBLIC_SENTRY_DSN environment variable.
 *
 * @example
 * ```ts
 * import { captureError, captureMessage, setUser } from '@/lib/errorTracking';
 *
 * // Capture an error with context
 * captureError(error, {
 *   tags: { component: 'DraftRoom' },
 *   extra: { draftId: '123' }
 * });
 *
 * // Set user context for all future errors
 * setUser({ id: userId, username });
 * ```
 *
 * ## Setup Instructions
 *
 * 1. Create a Sentry project at https://sentry.io
 * 2. Get your DSN from Project Settings > Client Keys
 * 3. Add to .env.local:
 *    ```
 *    NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx
 *    ```
 * 4. Restart the dev server
 *
 * The integration will automatically enable when the DSN is present.
 */

import { createScopedLogger } from './clientLogger';

const logger = createScopedLogger('[ErrorTracking]');

// ============================================================================
// TYPES
// ============================================================================

export interface ErrorContext {
  /** Key-value tags for filtering in Sentry */
  tags?: Record<string, string>;
  /** Additional data attached to the error */
  extra?: Record<string, unknown>;
  /** Error level override */
  level?: 'fatal' | 'error' | 'warning' | 'info' | 'debug';
  /** Fingerprint for grouping similar errors */
  fingerprint?: string[];
}

export interface UserContext {
  id: string;
  username?: string;
  email?: string;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;
const IS_ENABLED = !!SENTRY_DSN;
const IS_DEV = process.env.NODE_ENV === 'development';

// ============================================================================
// SENTRY TYPES
// ============================================================================

/**
 * Minimal Sentry interface for type safety
 * Matches @sentry/nextjs API surface we use
 */
interface SentryScope {
  setTag: (key: string, value: string) => void;
  setExtra: (key: string, value: unknown) => void;
  setLevel: (level: ErrorContext['level']) => void;
  setFingerprint: (fingerprint: string[]) => void;
}

interface SentryInstance {
  captureException: (error: Error, context?: ErrorContext) => string;
  captureMessage: (message: string, level?: ErrorContext['level']) => string;
  setUser: (user: UserContext | null) => void;
  setTag: (key: string, value: string) => void;
  setContext: (name: string, context: Record<string, unknown>) => void;
  withScope: (callback: (scope: SentryScope) => void) => void;
  addBreadcrumb: (breadcrumb: {
    message: string;
    category: string;
    data?: Record<string, unknown>;
    level: string;
  }) => void;
  init: (config: Record<string, unknown>) => void;
}

// Lazy-loaded Sentry instance
let SentryInstance: SentryInstance | null = null;
let SentryLoadAttempted = false;

/**
 * Initialize Sentry (called automatically on first use)
 * Returns null if Sentry is not installed or not configured
 */
async function initSentry(): Promise<SentryInstance | null> {
  if (!IS_ENABLED) return null;
  if (SentryInstance) return SentryInstance;
  if (SentryLoadAttempted) return null;
  
  SentryLoadAttempted = true;
  
  try {
    // Dynamic import - will fail gracefully if @sentry/nextjs is not installed
    const Sentry = await import('@sentry/nextjs');
    
    Sentry.init({
      dsn: SENTRY_DSN,
      environment: process.env.NODE_ENV,
      
      // Performance monitoring (adjust as needed)
      tracesSampleRate: IS_DEV ? 1.0 : 0.1,
      
      // Only send errors in production by default
      enabled: !IS_DEV,
      
      // Filter out common noise
      ignoreErrors: [
        // Network errors
        'Network request failed',
        'Failed to fetch',
        'Load failed',
        // User-triggered navigation
        'ResizeObserver loop',
        // Browser extensions
        /^chrome-extension:/,
        /^moz-extension:/,
      ],
      
      beforeSend(event: unknown) {
        // Don't send in development unless explicitly enabled
        if (IS_DEV && typeof localStorage !== 'undefined' && !localStorage.getItem('sentry_debug')) {
          logger.debug('Sentry would send event', { event });
          return null;
        }
        return event as any;
      },
    });

    // Create a typed wrapper around Sentry
    SentryInstance = {
      captureException: (error: Error, context?: ErrorContext) => {
        return Sentry.captureException(error, {
          tags: context?.tags,
          extra: context?.extra,
          level: context?.level,
          fingerprint: context?.fingerprint,
        });
      },
      captureMessage: (message: string, level?: ErrorContext['level']) => {
        return Sentry.captureMessage(message, level);
      },
      setUser: (user: UserContext | null) => {
        Sentry.setUser(user ? { id: user.id, username: user.username, email: user.email } : null);
      },
      setTag: (key: string, value: string) => {
        Sentry.setTag(key, value);
      },
      setContext: (name: string, context: Record<string, unknown>) => {
        Sentry.setContext(name, context);
      },
      withScope: (callback: (scope: SentryScope) => void) => {
        Sentry.withScope(callback as any);
      },
      addBreadcrumb: (breadcrumb: {
        message: string;
        category: string;
        data?: Record<string, unknown>;
        level: string;
      }) => {
        Sentry.addBreadcrumb(breadcrumb as any);
      },
      init: Sentry.init,
    };
    logger.info('Sentry initialized');
    return SentryInstance;
  } catch (err) {
    // Sentry not installed or failed to load - this is fine
    if (IS_DEV) {
      logger.debug('Sentry not available (install @sentry/nextjs to enable)');
    }
    return null;
  }
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Check if error tracking is enabled
 */
export function isErrorTrackingEnabled(): boolean {
  return IS_ENABLED;
}

/**
 * Capture an error and send to Sentry
 */
export async function captureError(
  error: Error,
  context?: ErrorContext
): Promise<string | null> {
  // Always log locally
  logger.error(error.message, error, context?.extra);

  if (!IS_ENABLED) return null;
  
  const Sentry = await initSentry();
  if (!Sentry) return null;
  
  let eventId: string | null = null;

  Sentry.withScope((scope: SentryScope) => {
    if (context?.tags) {
      Object.entries(context.tags).forEach(([key, value]: [string, string]) => {
        scope.setTag(key, value);
      });
    }

    if (context?.extra) {
      Object.entries(context.extra).forEach(([key, value]: [string, unknown]) => {
        scope.setExtra(key, value);
      });
    }

    if (context?.level) {
      scope.setLevel(context.level);
    }

    if (context?.fingerprint) {
      scope.setFingerprint(context.fingerprint);
    }

    eventId = Sentry.captureException(error);
  });

  return eventId;
}

/**
 * Capture a message (for non-error events)
 */
export async function captureMessage(
  message: string,
  context?: ErrorContext
): Promise<string | null> {
  if (!IS_ENABLED) {
    logger.info(message, context?.extra);
    return null;
  }
  
  const Sentry = await initSentry();
  if (!Sentry) return null;
  
  let eventId: string | null = null;

  Sentry.withScope((scope: SentryScope) => {
    if (context?.tags) {
      Object.entries(context.tags).forEach(([key, value]: [string, string]) => {
        scope.setTag(key, value);
      });
    }

    if (context?.extra) {
      scope.setExtra('context', context.extra);
    }

    eventId = Sentry.captureMessage(message, context?.level || 'info');
  });

  return eventId;
}

/**
 * Set user context for all future errors
 */
export async function setUser(user: UserContext | null): Promise<void> {
  if (!IS_ENABLED) return;
  
  const Sentry = await initSentry();
  if (!Sentry) return;
  
  if (user) {
    Sentry.setUser({
      id: user.id,
      username: user.username,
      email: user.email,
    });
  } else {
    Sentry.setUser(null);
  }
}

/**
 * Add breadcrumb for debugging
 */
export async function addBreadcrumb(
  message: string,
  category: string,
  data?: Record<string, unknown>
): Promise<void> {
  if (!IS_ENABLED) return;
  
  const Sentry = await initSentry();
  if (!Sentry) return;
  
  Sentry.addBreadcrumb({
    message,
    category,
    data,
    level: 'info',
  });
}

// ============================================================================
// REACT ERROR BOUNDARY HELPER
// ============================================================================

/**
 * Report error from React Error Boundary
 * Use this in componentDidCatch
 */
export async function captureReactError(
  error: Error,
  componentStack: string | undefined,
  componentName: string
): Promise<string | null> {
  return captureError(error, {
    tags: {
      component: componentName,
      type: 'react_error_boundary',
    },
    extra: {
      componentStack: componentStack?.substring(0, 500),
    },
    level: 'error',
  });
}

// ============================================================================
// CONVENIENCE WRAPPERS
// ============================================================================

/**
 * Wrap an async function to automatically capture errors
 */
export function withErrorTracking<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  context?: ErrorContext
): T {
  return (async (...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> => {
    try {
      return await fn(...args) as Awaited<ReturnType<T>>;
    } catch (error: unknown) {
      await captureError(error as Error, context);
      throw error;
    }
  }) as T;
}

