/**
 * Firebase Retry Utilities
 *
 * Provides configurable retry logic with:
 * - Exponential backoff
 * - Jitter to prevent thundering herd
 * - Circuit breaker pattern
 * - Retry budget management
 * - Error classification
 */

import { logger } from '../structuredLogger';

// ============================================================================
// TYPES
// ============================================================================

export interface RetryConfig {
  /** Maximum number of retry attempts */
  maxRetries: number;
  /** Base delay in milliseconds */
  baseDelayMs: number;
  /** Maximum delay cap in milliseconds */
  maxDelayMs: number;
  /** Jitter factor (0-1) for randomizing delays */
  jitterFactor: number;
  /** Error codes that should trigger retry */
  retryableErrors: string[];
  /** Callback fired on each retry attempt */
  onRetry?: (attempt: number, error: Error, delayMs: number) => void;
}

export interface CircuitBreakerConfig {
  /** Number of failures before opening circuit */
  failureThreshold: number;
  /** Time in ms before attempting to close circuit */
  resetTimeMs: number;
  /** Max attempts in half-open state */
  halfOpenMaxAttempts: number;
}

export interface RetryBudgetConfig {
  /** Maximum tokens available */
  maxTokens: number;
  /** Tokens refilled per second */
  refillRate: number;
}

interface CircuitBreakerState {
  failures: number;
  lastFailure: number | null;
  state: 'closed' | 'open' | 'half-open';
  halfOpenAttempts: number;
}

interface RetryBudget {
  tokens: number;
  lastRefill: number;
}

export interface RetryResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
  attempts: number;
  totalTimeMs: number;
}

// ============================================================================
// DEFAULT CONFIGURATIONS
// ============================================================================

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelayMs: 100,
  maxDelayMs: 5000,
  jitterFactor: 0.2,
  retryableErrors: [
    // Firestore errors
    'unavailable',
    'deadline-exceeded',
    'resource-exhausted',
    'aborted',
    'internal',
    'unknown',
    'cancelled',
    // Network errors
    'network-request-failed',
    'ECONNRESET',
    'ETIMEDOUT',
    'ENOTFOUND',
    'ECONNREFUSED',
    'EPIPE',
    'EAI_AGAIN',
    // Firebase Auth errors
    'auth/network-request-failed',
    'auth/too-many-requests',
  ],
};

export const DEFAULT_CIRCUIT_BREAKER_CONFIG: CircuitBreakerConfig = {
  failureThreshold: 5,
  resetTimeMs: 30000,
  halfOpenMaxAttempts: 3,
};

export const DEFAULT_RETRY_BUDGET_CONFIG: RetryBudgetConfig = {
  maxTokens: 10,
  refillRate: 1,
};

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

const circuitBreakers = new Map<string, CircuitBreakerState>();
const retryBudgets = new Map<string, RetryBudget>();

/**
 * Reset all circuit breakers and retry budgets (for testing)
 */
export function resetRetryState(): void {
  circuitBreakers.clear();
  retryBudgets.clear();
}

/**
 * Get circuit breaker state for a key
 */
export function getCircuitBreakerState(key: string): CircuitBreakerState | undefined {
  return circuitBreakers.get(key);
}

// ============================================================================
// ERROR CLASSIFICATION
// ============================================================================

/**
 * Extract error code from various error formats
 */
export function getErrorCode(error: unknown): string {
  if (error instanceof Error) {
    // Firebase errors often have a code property
    const firebaseError = error as Error & { code?: string };
    if (firebaseError.code) {
      return firebaseError.code;
    }

    // Node.js errors
    const nodeError = error as NodeJS.ErrnoException;
    if (nodeError.code) {
      return nodeError.code;
    }

    // Check error name
    if (error.name && error.name !== 'Error') {
      return error.name;
    }
  }

  return 'unknown';
}

/**
 * Determine if an error is retryable based on its code or message
 */
export function isRetryableError(
  error: unknown,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): boolean {
  const errorCode = getErrorCode(error).toLowerCase();
  const errorMessage = error instanceof Error ? error.message.toLowerCase() : '';

  // Check against configured retryable error codes
  for (const retryableCode of config.retryableErrors) {
    if (errorCode.includes(retryableCode.toLowerCase())) {
      return true;
    }
  }

  // Check error message for network-related issues
  const networkPatterns = [
    'network',
    'timeout',
    'unavailable',
    'connection',
    'econnreset',
    'etimedout',
    'socket',
    'dns',
    'getaddrinfo',
    'fetch failed',
    'failed to fetch',
  ];

  for (const pattern of networkPatterns) {
    if (errorMessage.includes(pattern)) {
      return true;
    }
  }

  return false;
}

/**
 * Determine if error is a permanent failure (should not retry)
 */
export function isPermanentError(error: unknown): boolean {
  const errorCode = getErrorCode(error).toLowerCase();

  const permanentCodes = [
    'permission-denied',
    'unauthenticated',
    'not-found',
    'already-exists',
    'invalid-argument',
    'failed-precondition',
    'out-of-range',
    'unimplemented',
    'data-loss',
  ];

  return permanentCodes.some(code => errorCode.includes(code));
}

// ============================================================================
// DELAY CALCULATION
// ============================================================================

/**
 * Calculate delay with exponential backoff and jitter
 */
export function calculateDelay(
  attempt: number,
  config: Partial<RetryConfig> = {}
): number {
  const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config };

  // Exponential backoff: baseDelay * 2^attempt
  const exponentialDelay = finalConfig.baseDelayMs * Math.pow(2, attempt);

  // Cap at maxDelay
  const cappedDelay = Math.min(exponentialDelay, finalConfig.maxDelayMs);

  // Add jitter (±jitterFactor)
  const jitterRange = cappedDelay * finalConfig.jitterFactor;
  const jitter = jitterRange * (Math.random() * 2 - 1);

  return Math.max(0, Math.floor(cappedDelay + jitter));
}

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================================
// RETRY LOGIC
// ============================================================================

/**
 * Execute operation with retry logic
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry permanent errors
      if (isPermanentError(error)) {
        throw lastError;
      }

      // Check if we've exhausted retries or error isn't retryable
      if (attempt >= finalConfig.maxRetries || !isRetryableError(error, finalConfig)) {
        throw lastError;
      }

      // Calculate delay for next attempt
      const delayMs = calculateDelay(attempt, finalConfig);

      // Call retry callback if provided
      if (finalConfig.onRetry) {
        finalConfig.onRetry(attempt + 1, lastError, delayMs);
      }

      // Log retry attempt
      logger.warn(`Retry attempt ${attempt + 1}/${finalConfig.maxRetries}`, {
        component: 'firebase',
        operation: 'retry',
        attempt: attempt + 1,
        maxRetries: finalConfig.maxRetries,
        delayMs,
        errorCode: getErrorCode(error),
        errorMessage: lastError.message,
      });

      // Wait before retry
      await sleep(delayMs);
    }
  }

  // Should never reach here, but TypeScript needs it
  throw lastError || new Error('Retry failed with unknown error');
}

/**
 * Execute operation with retry logic and return detailed result
 */
export async function withRetryResult<T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<RetryResult<T>> {
  const startTime = Date.now();
  let attempts = 0;

  try {
    const finalConfig = {
      ...DEFAULT_RETRY_CONFIG,
      ...config,
      onRetry: (attempt: number, error: Error, delayMs: number) => {
        attempts = attempt;
        config.onRetry?.(attempt, error, delayMs);
      },
    };

    const data = await withRetry(operation, finalConfig);

    return {
      success: true,
      data,
      attempts: attempts + 1,
      totalTimeMs: Date.now() - startTime,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error(String(error)),
      attempts: attempts + 1,
      totalTimeMs: Date.now() - startTime,
    };
  }
}

// ============================================================================
// CIRCUIT BREAKER
// ============================================================================

/**
 * Get or create circuit breaker state for a key
 */
function getOrCreateCircuitBreaker(key: string): CircuitBreakerState {
  let state = circuitBreakers.get(key);

  if (!state) {
    state = {
      failures: 0,
      lastFailure: null,
      state: 'closed',
      halfOpenAttempts: 0,
    };
    circuitBreakers.set(key, state);
  }

  return state;
}

/**
 * Execute operation with circuit breaker protection
 */
export async function withCircuitBreaker<T>(
  key: string,
  operation: () => Promise<T>,
  config: Partial<CircuitBreakerConfig> = {}
): Promise<T> {
  const finalConfig = { ...DEFAULT_CIRCUIT_BREAKER_CONFIG, ...config };
  const state = getOrCreateCircuitBreaker(key);

  // Check circuit state
  if (state.state === 'open') {
    const timeSinceFailure = Date.now() - (state.lastFailure || 0);

    if (timeSinceFailure > finalConfig.resetTimeMs) {
      // Transition to half-open
      state.state = 'half-open';
      state.halfOpenAttempts = 0;

      logger.info('Circuit breaker transitioning to half-open', {
        component: 'firebase',
        operation: 'circuit_breaker',
        key,
        timeSinceFailure,
      });
    } else {
      // Circuit is still open, fail fast
      const error = new Error(`Circuit breaker open for ${key}`);
      (error as Error & { code: string }).code = 'CIRCUIT_BREAKER_OPEN';
      throw error;
    }
  }

  // Check half-open state limits
  if (state.state === 'half-open' && state.halfOpenAttempts >= finalConfig.halfOpenMaxAttempts) {
    // Too many attempts in half-open, back to open
    state.state = 'open';
    state.lastFailure = Date.now();

    const error = new Error(`Circuit breaker reopened for ${key}`);
    (error as Error & { code: string }).code = 'CIRCUIT_BREAKER_OPEN';
    throw error;
  }

  try {
    // Track half-open attempts
    if (state.state === 'half-open') {
      state.halfOpenAttempts++;
    }

    const result = await operation();

    // Success - reset state
    if (state.state === 'half-open') {
      logger.info('Circuit breaker closing after successful half-open attempt', {
        component: 'firebase',
        operation: 'circuit_breaker',
        key,
      });
    }

    state.failures = 0;
    state.state = 'closed';
    state.halfOpenAttempts = 0;

    return result;
  } catch (error) {
    state.failures++;
    state.lastFailure = Date.now();

    // Check if we should open the circuit
    if (state.failures >= finalConfig.failureThreshold) {
      state.state = 'open';

      logger.error('Circuit breaker opened', error instanceof Error ? error : undefined, {
        component: 'firebase',
        operation: 'circuit_breaker',
        key,
        failures: state.failures,
        threshold: finalConfig.failureThreshold,
      });
    }

    throw error;
  }
}

// ============================================================================
// RETRY BUDGET
// ============================================================================

/**
 * Get or create retry budget for a key
 */
function getOrCreateRetryBudget(
  key: string,
  config: RetryBudgetConfig = DEFAULT_RETRY_BUDGET_CONFIG
): RetryBudget {
  let budget = retryBudgets.get(key);

  if (!budget) {
    budget = {
      tokens: config.maxTokens,
      lastRefill: Date.now(),
    };
    retryBudgets.set(key, budget);
  }

  return budget;
}

/**
 * Refill tokens based on time elapsed
 */
function refillBudget(
  budget: RetryBudget,
  config: RetryBudgetConfig = DEFAULT_RETRY_BUDGET_CONFIG
): void {
  const now = Date.now();
  const elapsedSeconds = (now - budget.lastRefill) / 1000;
  const refillAmount = Math.floor(elapsedSeconds * config.refillRate);

  if (refillAmount > 0) {
    budget.tokens = Math.min(budget.tokens + refillAmount, config.maxTokens);
    budget.lastRefill = now;
  }
}

/**
 * Check if retry budget allows another attempt
 */
export function canRetry(
  key: string,
  config: Partial<RetryBudgetConfig> = {}
): boolean {
  const finalConfig = { ...DEFAULT_RETRY_BUDGET_CONFIG, ...config };
  const budget = getOrCreateRetryBudget(key, finalConfig);

  refillBudget(budget, finalConfig);

  return budget.tokens > 0;
}

/**
 * Consume a retry token
 */
export function consumeRetryToken(
  key: string,
  config: Partial<RetryBudgetConfig> = {}
): boolean {
  const finalConfig = { ...DEFAULT_RETRY_BUDGET_CONFIG, ...config };
  const budget = getOrCreateRetryBudget(key, finalConfig);

  refillBudget(budget, finalConfig);

  if (budget.tokens <= 0) {
    logger.warn('Retry budget exhausted', {
      component: 'firebase',
      operation: 'retry_budget',
      key,
      tokens: budget.tokens,
    });
    return false;
  }

  budget.tokens--;
  return true;
}

/**
 * Get current token count for a key
 */
export function getRetryTokens(
  key: string,
  config: Partial<RetryBudgetConfig> = {}
): number {
  const finalConfig = { ...DEFAULT_RETRY_BUDGET_CONFIG, ...config };
  const budget = getOrCreateRetryBudget(key, finalConfig);

  refillBudget(budget, finalConfig);

  return budget.tokens;
}

// ============================================================================
// COMBINED UTILITIES
// ============================================================================

/**
 * Execute operation with retry, circuit breaker, and budget protection
 */
export async function withFullProtection<T>(
  key: string,
  operation: () => Promise<T>,
  options: {
    retry?: Partial<RetryConfig>;
    circuitBreaker?: Partial<CircuitBreakerConfig>;
    retryBudget?: Partial<RetryBudgetConfig>;
  } = {}
): Promise<T> {
  // Check retry budget
  if (!canRetry(key, options.retryBudget)) {
    const error = new Error(`Retry budget exhausted for ${key}`);
    (error as Error & { code: string }).code = 'RETRY_BUDGET_EXHAUSTED';
    throw error;
  }

  // Consume token before attempting
  consumeRetryToken(key, options.retryBudget);

  // Execute with circuit breaker and retry
  return withCircuitBreaker(
    key,
    () => withRetry(operation, options.retry),
    options.circuitBreaker
  );
}
