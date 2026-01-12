/**
 * Paystack Retry Utilities
 * 
 * Generic retry utility with exponential backoff for Paystack API calls.
 * Handles transient errors and network issues with automatic retries.
 * 
 * @module lib/paystack/retryUtils
 */

import { captureError } from '../errorTracking';

// ============================================================================
// TYPES
// ============================================================================

export interface RetryOptions {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number;
  /** Initial delay in milliseconds (default: 1000) */
  initialDelay?: number;
  /** Maximum delay in milliseconds (default: 10000) */
  maxDelay?: number;
  /** Multiplier for exponential backoff (default: 2) */
  backoffMultiplier?: number;
  /** Whether to retry on specific error codes (default: all transient errors) */
  retryableErrors?: number[];
  /** Custom function to determine if error is retryable */
  shouldRetry?: (error: unknown, attempt: number) => boolean;
  /** Optional logger for retry attempts */
  logger?: {
    warn: (message: string, context?: Record<string, unknown>) => void;
    error: (message: string, error: unknown, context?: Record<string, unknown>) => void;
  };
}

/**
 * Default retryable HTTP status codes for Paystack API
 */
const DEFAULT_RETRYABLE_STATUSES = [
  408, // Request Timeout
  429, // Too Many Requests
  500, // Internal Server Error
  502, // Bad Gateway
  503, // Service Unavailable
  504, // Gateway Timeout
];

/**
 * Default retryable error messages patterns
 */
const DEFAULT_RETRYABLE_PATTERNS = [
  /network/i,
  /timeout/i,
  /ECONNRESET/i,
  /ECONNREFUSED/i,
  /ENOTFOUND/i,
  /ETIMEDOUT/i,
];

// ============================================================================
// RETRY UTILITY
// ============================================================================

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calculate exponential backoff delay
 */
function calculateBackoffDelay(
  attempt: number,
  initialDelay: number,
  maxDelay: number,
  multiplier: number
): number {
  const delay = initialDelay * Math.pow(multiplier, attempt - 1);
  return Math.min(delay, maxDelay);
}

/**
 * Determine if error is retryable
 */
function isRetryableError(
  error: unknown,
  retryableErrors?: number[],
  shouldRetry?: (error: unknown, attempt: number) => boolean
): boolean {
  // Use custom retry function if provided
  if (shouldRetry) {
    return shouldRetry(error, 0);
  }

  // Check if it's an HTTP error with retryable status
  if (error && typeof error === 'object' && 'status' in error) {
    const status = (error as { status: number }).status;
    const retryableStatuses = retryableErrors || DEFAULT_RETRYABLE_STATUSES;
    if (retryableStatuses.includes(status)) {
      return true;
    }
  }

  // Check error message for retryable patterns
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return DEFAULT_RETRYABLE_PATTERNS.some((pattern) => pattern.test(message));
  }

  // Default: not retryable
  return false;
}

/**
 * Extract HTTP status from error
 */
function getErrorStatus(error: unknown): number | null {
  if (error && typeof error === 'object') {
    if ('status' in error && typeof (error as { status: unknown }).status === 'number') {
      return (error as { status: number }).status;
    }
    if ('statusCode' in error && typeof (error as { statusCode: unknown }).statusCode === 'number') {
      return (error as { statusCode: number }).statusCode;
    }
    if ('response' in error) {
      const response = (error as { response: unknown }).response;
      if (response && typeof response === 'object' && 'status' in response) {
        return (response as { status: number }).status;
      }
    }
  }
  return null;
}

/**
 * Retry a function with exponential backoff
 * 
 * @param fn - Function to retry
 * @param options - Retry configuration options
 * @returns Result of the function call
 * @throws Last error if all retries exhausted
 * 
 * @example
 * ```typescript
 * const result = await withRetry(
 *   () => paystackRequest('/transaction/verify', { method: 'GET' }),
 *   { maxRetries: 3, initialDelay: 1000 }
 * );
 * ```
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffMultiplier = 2,
    retryableErrors,
    shouldRetry,
    logger,
  } = options;

  let lastError: unknown;
  let attempt = 0;

  while (attempt <= maxRetries) {
    try {
      const result = await fn();
      
      // Log successful retry if not first attempt
      if (attempt > 0 && logger) {
        logger.warn('Retry succeeded', {
          attempt,
          totalAttempts: attempt + 1,
        });
      }
      
      return result;
    } catch (error) {
      lastError = error;
      attempt++;

      // Check if error is retryable
      const isRetryable = attempt <= maxRetries && isRetryableError(
        error,
        retryableErrors,
        shouldRetry
          ? (err, att) => shouldRetry(err, att)
          : undefined
      );

      if (!isRetryable) {
        // Error is not retryable, throw immediately
        if (logger) {
          logger.error('Non-retryable error', error, {
            attempt,
            status: getErrorStatus(error),
          });
        }
        throw error;
      }

      // Check if we've exhausted retries
      if (attempt > maxRetries) {
        if (logger) {
          logger.error('Max retries exhausted', error, {
            maxRetries,
            totalAttempts: attempt,
            status: getErrorStatus(error),
          });
        }
        
        // Capture final error for monitoring
        await captureError(
          error instanceof Error ? error : new Error('Unknown error'),
          {
            tags: {
              component: 'paystack',
              operation: 'retry_exhausted',
              attempts: attempt.toString(),
            },
            extra: {
              maxRetries,
              totalAttempts: attempt,
              status: getErrorStatus(error),
              errorMessage: error instanceof Error ? error.message : 'Unknown error',
            },
          }
        );
        
        throw error;
      }

      // Calculate backoff delay
      const delay = calculateBackoffDelay(attempt, initialDelay, maxDelay, backoffMultiplier);

      if (logger) {
        logger.warn('Retrying after error', {
          attempt,
          maxRetries,
          delayMs: delay,
          status: getErrorStatus(error),
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        });
      }

      // Wait before retrying
      await sleep(delay);
    }
  }

  // Should never reach here, but TypeScript needs it
  throw lastError;
}

/**
 * Retry with Paystack-specific error handling
 * 
 * Paystack-specific retry configuration:
 * - Retries on 408, 429, 500, 502, 503, 504
 * - Does not retry on 4xx client errors (except 408, 429)
 * - Exponential backoff with jitter
 * 
 * @param fn - Function to retry
 * @param options - Retry configuration (Paystack defaults applied)
 * @returns Result of the function call
 */
export async function withPaystackRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  // Paystack-specific defaults
  const paystackOptions: RetryOptions = {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
    retryableErrors: DEFAULT_RETRYABLE_STATUSES,
    // Paystack-specific: don't retry 4xx client errors (except 408, 429)
    shouldRetry: (error: unknown, attempt: number) => {
      const status = getErrorStatus(error);
      
      // Always retry transient server errors (5xx)
      if (status && status >= 500 && status < 600) {
        return true;
      }
      
      // Retry specific client errors (408, 429)
      if (status === 408 || status === 429) {
        return true;
      }
      
      // Don't retry other 4xx client errors
      if (status && status >= 400 && status < 500) {
        return false;
      }
      
      // Retry network errors (no status code)
      return isRetryableError(error);
    },
    ...options, // Override with user options
  };

  return withRetry(fn, paystackOptions);
}
