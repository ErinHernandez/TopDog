/**
 * Fire-and-Forget Promise Utility
 *
 * Provides a safe way to execute promises without blocking the main flow.
 * Useful for background operations that should not fail the main request.
 *
 * ## Best Practices
 *
 * 1. Always provide a descriptive operation name
 * 2. Include relevant context for debugging
 * 3. Consider if the operation truly doesn't need awaiting
 *
 * @module lib/utils/fireAndForget
 */

import { serverLogger } from '../logger/serverLogger';

// ============================================================================
// TYPES
// ============================================================================

export interface FireAndForgetOptions {
  /**
   * Descriptive name of the operation being performed
   * Used in logs to identify what failed
   */
  operation: string;

  /**
   * Component or module initiating the operation
   * e.g., 'draft-complete', 'analytics', 'notifications'
   */
  component: string;

  /**
   * Additional context for logging
   * Include IDs or relevant data for debugging
   */
  context?: Record<string, unknown>;

  /**
   * Custom error handler
   * If not provided, errors are logged with serverLogger
   */
  onError?: (error: Error, context: Record<string, unknown>) => void;

  /**
   * Optional success callback
   * Called when the promise resolves successfully
   */
  onSuccess?: <T>(result: T) => void;

  /**
   * Whether to suppress default logging
   * Useful when custom onError handles all logging
   * @default false
   */
  suppressDefaultLogging?: boolean;
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

/**
 * Execute a promise in a fire-and-forget manner with mandatory logging context
 *
 * Errors are caught and logged but do not propagate to the caller.
 * This is useful for background operations that should not fail the main request.
 *
 * @param promise - Promise to execute
 * @param options - Configuration including operation name and context
 *
 * @example
 * // Basic usage with required context
 * fireAndForget(
 *   collusionFlagService.markDraftCompleted(roomId),
 *   {
 *     operation: 'mark-draft-completed',
 *     component: 'draft-room',
 *     context: { roomId, userId },
 *   }
 * );
 *
 * @example
 * // With custom error handler
 * fireAndForget(
 *   sendNotificationEmail(userId, email),
 *   {
 *     operation: 'send-notification-email',
 *     component: 'notifications',
 *     context: { userId, emailType: 'draft-reminder' },
 *     onError: (error, ctx) => {
 *       // Custom handling - maybe retry or queue for later
 *       notificationQueue.add({ ...ctx, error: error.message });
 *     },
 *   }
 * );
 *
 * @example
 * // With success callback
 * fireAndForget(
 *   analytics.track('draft_completed', eventData),
 *   {
 *     operation: 'track-analytics-event',
 *     component: 'analytics',
 *     context: { eventType: 'draft_completed' },
 *     onSuccess: () => {
 *       // Maybe increment a counter
 *     },
 *   }
 * );
 */
export function fireAndForget<T>(
  promise: Promise<T>,
  options: FireAndForgetOptions
): void {
  const { operation, component, context = {}, onError, onSuccess, suppressDefaultLogging = false } =
    options;

  const logContext = {
    operation,
    component,
    ...context,
  };

  promise
    .then((result) => {
      // Call success handler if provided
      if (onSuccess) {
        try {
          onSuccess(result);
        } catch (callbackError) {
          // Don't let callback errors propagate
          if (!suppressDefaultLogging) {
            const cbError = callbackError instanceof Error ? callbackError : new Error(String(callbackError));
            serverLogger.warn('Fire-and-forget success callback failed', cbError, logContext);
          }
        }
      }
    })
    .catch((error) => {
      const err = error instanceof Error ? error : new Error(String(error));

      // Call custom error handler if provided
      if (onError) {
        try {
          onError(err, logContext);
        } catch (callbackError) {
          // Don't let callback errors propagate
          if (!suppressDefaultLogging) {
            serverLogger.error(
              'Fire-and-forget error callback failed',
              callbackError instanceof Error ? callbackError : new Error(String(callbackError)),
              logContext
            );
          }
        }
      }

      // Default logging unless suppressed
      if (!suppressDefaultLogging) {
        serverLogger.error(`Fire-and-forget operation failed: ${operation}`, err, logContext);
      }
    });
}

// ============================================================================
// CONVENIENCE WRAPPERS
// ============================================================================

/**
 * Fire-and-forget for analytics operations
 * Pre-configured with 'analytics' component
 */
export function fireAndForgetAnalytics<T>(
  promise: Promise<T>,
  operation: string,
  context?: Record<string, unknown>
): void {
  fireAndForget(promise, {
    operation,
    component: 'analytics',
    context,
    // Analytics failures are typically less critical
    suppressDefaultLogging: process.env.NODE_ENV === 'production',
  });
}

/**
 * Fire-and-forget for notification operations
 * Pre-configured with 'notifications' component
 */
export function fireAndForgetNotification<T>(
  promise: Promise<T>,
  operation: string,
  context?: Record<string, unknown>
): void {
  fireAndForget(promise, {
    operation,
    component: 'notifications',
    context,
  });
}

/**
 * Fire-and-forget for cleanup operations
 * Pre-configured with 'cleanup' component
 */
export function fireAndForgetCleanup<T>(
  promise: Promise<T>,
  operation: string,
  context?: Record<string, unknown>
): void {
  fireAndForget(promise, {
    operation,
    component: 'cleanup',
    context,
  });
}

// ============================================================================
// LEGACY SUPPORT
// ============================================================================

/**
 * Legacy fire-and-forget function for backwards compatibility
 *
 * @deprecated Use fireAndForget with options object instead
 *
 * @param promise - Promise to execute
 * @param onError - Optional error handler
 */
export function fireAndForgetLegacy<T>(
  promise: Promise<T>,
  onError?: (error: Error) => void
): void {
  promise.catch((error) => {
    const err = error instanceof Error ? error : new Error(String(error));
    if (onError) {
      onError(err);
    } else {
      // Default error logging
      console.error('Fire-and-forget promise failed:', err);
    }
  });
}

// ============================================================================
// EXPORTS
// ============================================================================

export default fireAndForget;
