/**
 * Tests for Firebase Retry Utilities
 *
 * Tests cover:
 * - Retry logic with exponential backoff
 * - Circuit breaker pattern
 * - Retry budget management
 * - Error classification
 */

import {
  withRetry,
  withRetryResult,
  withCircuitBreaker,
  withFullProtection,
  calculateDelay,
  isRetryableError,
  isPermanentError,
  getErrorCode,
  canRetry,
  consumeRetryToken,
  getRetryTokens,
  resetRetryState,
  getCircuitBreakerState,
  DEFAULT_RETRY_CONFIG,
  DEFAULT_CIRCUIT_BREAKER_CONFIG,
  DEFAULT_RETRY_BUDGET_CONFIG,
} from '../../../lib/firebase/retryUtils';

// Mock the logger
jest.mock('../../../lib/structuredLogger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

describe('Firebase Retry Utils', () => {
  beforeEach(() => {
    resetRetryState();
    jest.clearAllMocks();
  });

  describe('Error Classification', () => {
    describe('getErrorCode', () => {
      it('extracts code from Firebase-style errors', () => {
        const error = new Error('Test error');
        (error as Error & { code: string }).code = 'unavailable';
        expect(getErrorCode(error)).toBe('unavailable');
      });

      it('extracts code from Node.js errors', () => {
        const error = new Error('Connection refused') as NodeJS.ErrnoException;
        error.code = 'ECONNREFUSED';
        expect(getErrorCode(error)).toBe('ECONNREFUSED');
      });

      it('returns error name if no code', () => {
        const error = new TypeError('Invalid type');
        expect(getErrorCode(error)).toBe('TypeError');
      });

      it('returns unknown for non-Error objects', () => {
        expect(getErrorCode('string error')).toBe('unknown');
        expect(getErrorCode(null)).toBe('unknown');
        expect(getErrorCode(undefined)).toBe('unknown');
      });
    });

    describe('isRetryableError', () => {
      it('identifies retryable Firestore error codes', () => {
        const retryableCodes = [
          'unavailable',
          'deadline-exceeded',
          'resource-exhausted',
          'aborted',
          'internal',
        ];

        for (const code of retryableCodes) {
          const error = new Error('Test');
          (error as Error & { code: string }).code = code;
          expect(isRetryableError(error)).toBe(true);
        }
      });

      it('identifies retryable network errors', () => {
        const networkCodes = ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'ECONNREFUSED'];

        for (const code of networkCodes) {
          const error = new Error('Network error') as NodeJS.ErrnoException;
          error.code = code;
          expect(isRetryableError(error)).toBe(true);
        }
      });

      it('identifies retryable errors from message', () => {
        const messages = [
          'network request failed',
          'connection timeout',
          'service unavailable',
          'socket hang up',
          'DNS lookup failed',
        ];

        for (const msg of messages) {
          const error = new Error(msg);
          expect(isRetryableError(error)).toBe(true);
        }
      });

      it('returns false for non-retryable errors', () => {
        const nonRetryableCodes = [
          'permission-denied',
          'not-found',
          'already-exists',
          'invalid-argument',
        ];

        for (const code of nonRetryableCodes) {
          const error = new Error('Test');
          (error as Error & { code: string }).code = code;
          expect(isRetryableError(error)).toBe(false);
        }
      });
    });

    describe('isPermanentError', () => {
      it('identifies permanent errors', () => {
        const permanentCodes = [
          'permission-denied',
          'unauthenticated',
          'not-found',
          'already-exists',
          'invalid-argument',
          'failed-precondition',
        ];

        for (const code of permanentCodes) {
          const error = new Error('Test');
          (error as Error & { code: string }).code = code;
          expect(isPermanentError(error)).toBe(true);
        }
      });

      it('returns false for transient errors', () => {
        const transientCodes = ['unavailable', 'deadline-exceeded', 'resource-exhausted'];

        for (const code of transientCodes) {
          const error = new Error('Test');
          (error as Error & { code: string }).code = code;
          expect(isPermanentError(error)).toBe(false);
        }
      });
    });
  });

  describe('Delay Calculation', () => {
    describe('calculateDelay', () => {
      it('applies exponential backoff', () => {
        const config = { baseDelayMs: 100, maxDelayMs: 10000, jitterFactor: 0 };

        expect(calculateDelay(0, config)).toBe(100); // 100 * 2^0
        expect(calculateDelay(1, config)).toBe(200); // 100 * 2^1
        expect(calculateDelay(2, config)).toBe(400); // 100 * 2^2
        expect(calculateDelay(3, config)).toBe(800); // 100 * 2^3
        expect(calculateDelay(4, config)).toBe(1600); // 100 * 2^4
      });

      it('caps at maxDelay', () => {
        const config = { baseDelayMs: 100, maxDelayMs: 500, jitterFactor: 0 };

        expect(calculateDelay(10, config)).toBe(500); // Would be 102400, capped at 500
        expect(calculateDelay(5, config)).toBe(500); // 3200 capped at 500
      });

      it('applies jitter within range', () => {
        const config = { baseDelayMs: 1000, maxDelayMs: 10000, jitterFactor: 0.2 };

        // Run multiple times to test jitter
        const delays: number[] = [];
        for (let i = 0; i < 100; i++) {
          delays.push(calculateDelay(0, config));
        }

        // Base is 1000, jitter is ±200
        const min = Math.min(...delays);
        const max = Math.max(...delays);

        expect(min).toBeGreaterThanOrEqual(800); // 1000 - 200
        expect(max).toBeLessThanOrEqual(1200); // 1000 + 200

        // Should have some variation
        expect(new Set(delays).size).toBeGreaterThan(1);
      });

      it('never returns negative delay', () => {
        const config = { baseDelayMs: 10, maxDelayMs: 10000, jitterFactor: 1 };

        for (let i = 0; i < 100; i++) {
          expect(calculateDelay(0, config)).toBeGreaterThanOrEqual(0);
        }
      });
    });
  });

  describe('Retry Logic', () => {
    describe('withRetry', () => {
      it('succeeds on first attempt', async () => {
        const operation = jest.fn().mockResolvedValue('success');

        const result = await withRetry(operation);

        expect(result).toBe('success');
        expect(operation).toHaveBeenCalledTimes(1);
      });

      it('retries on transient failure then succeeds', async () => {
        const error = new Error('Temporary failure');
        (error as Error & { code: string }).code = 'unavailable';

        const operation = jest.fn()
          .mockRejectedValueOnce(error)
          .mockResolvedValue('success');

        const result = await withRetry(operation, { baseDelayMs: 1 });

        expect(result).toBe('success');
        expect(operation).toHaveBeenCalledTimes(2);
      });

      it('retries multiple times before success', async () => {
        const error = new Error('Temporary failure');
        (error as Error & { code: string }).code = 'unavailable';

        const operation = jest.fn()
          .mockRejectedValueOnce(error)
          .mockRejectedValueOnce(error)
          .mockResolvedValue('success');

        const result = await withRetry(operation, { baseDelayMs: 1, maxRetries: 3 });

        expect(result).toBe('success');
        expect(operation).toHaveBeenCalledTimes(3);
      });

      it('throws after max retries exceeded', async () => {
        const error = new Error('Persistent failure');
        (error as Error & { code: string }).code = 'unavailable';

        const operation = jest.fn().mockRejectedValue(error);

        await expect(withRetry(operation, { maxRetries: 2, baseDelayMs: 1 }))
          .rejects.toThrow('Persistent failure');

        expect(operation).toHaveBeenCalledTimes(3); // Initial + 2 retries
      });

      it('does not retry non-retryable errors', async () => {
        const error = new Error('Permission denied');
        (error as Error & { code: string }).code = 'permission-denied';

        const operation = jest.fn().mockRejectedValue(error);

        await expect(withRetry(operation)).rejects.toThrow('Permission denied');

        expect(operation).toHaveBeenCalledTimes(1);
      });

      it('does not retry permanent errors', async () => {
        const error = new Error('Not found');
        (error as Error & { code: string }).code = 'not-found';

        const operation = jest.fn().mockRejectedValue(error);

        await expect(withRetry(operation)).rejects.toThrow('Not found');

        expect(operation).toHaveBeenCalledTimes(1);
      });

      it('calls onRetry callback on each retry', async () => {
        const error = new Error('Temporary');
        (error as Error & { code: string }).code = 'unavailable';

        const onRetry = jest.fn();
        const operation = jest.fn()
          .mockRejectedValueOnce(error)
          .mockRejectedValueOnce(error)
          .mockResolvedValue('success');

        await withRetry(operation, { baseDelayMs: 1, onRetry });

        expect(onRetry).toHaveBeenCalledTimes(2);
        expect(onRetry).toHaveBeenCalledWith(1, error, expect.any(Number));
        expect(onRetry).toHaveBeenCalledWith(2, error, expect.any(Number));
      });
    });

    describe('withRetryResult', () => {
      it('returns success result on success', async () => {
        const operation = jest.fn().mockResolvedValue('data');

        const result = await withRetryResult(operation);

        expect(result.success).toBe(true);
        expect(result.data).toBe('data');
        expect(result.attempts).toBe(1);
        expect(result.totalTimeMs).toBeGreaterThanOrEqual(0);
      });

      it('returns failure result on failure', async () => {
        const error = new Error('Failed');
        (error as Error & { code: string }).code = 'not-found';

        const operation = jest.fn().mockRejectedValue(error);

        const result = await withRetryResult(operation);

        expect(result.success).toBe(false);
        expect(result.error).toEqual(error);
        expect(result.attempts).toBe(1);
      });

      it('tracks attempts on retry', async () => {
        const error = new Error('Temporary');
        (error as Error & { code: string }).code = 'unavailable';

        const operation = jest.fn()
          .mockRejectedValueOnce(error)
          .mockResolvedValue('success');

        const result = await withRetryResult(operation, { baseDelayMs: 1 });

        expect(result.success).toBe(true);
        expect(result.attempts).toBe(2);
      });
    });
  });

  describe('Circuit Breaker', () => {
    describe('withCircuitBreaker', () => {
      it('allows requests when circuit is closed', async () => {
        const operation = jest.fn().mockResolvedValue('success');

        const result = await withCircuitBreaker('test-key', operation);

        expect(result).toBe('success');
        expect(operation).toHaveBeenCalledTimes(1);
      });

      it('opens circuit after threshold failures', async () => {
        const error = new Error('Service error');
        const operation = jest.fn().mockRejectedValue(error);

        // Fail enough times to trip the breaker (default threshold is 5)
        for (let i = 0; i < 5; i++) {
          await expect(withCircuitBreaker('fail-key', operation))
            .rejects.toThrow('Service error');
        }

        // Next call should fail immediately with circuit breaker error
        await expect(withCircuitBreaker('fail-key', operation))
          .rejects.toThrow('Circuit breaker open');

        // Operation should not be called when breaker is open
        expect(operation).toHaveBeenCalledTimes(5);
      });

      it('transitions to half-open after reset time', async () => {
        jest.useFakeTimers();

        const error = new Error('Service error');
        const operation = jest.fn().mockRejectedValue(error);

        // Trip the breaker
        for (let i = 0; i < 5; i++) {
          await expect(withCircuitBreaker('timing-key', operation))
            .rejects.toThrow('Service error');
        }

        // Verify circuit is open
        const state = getCircuitBreakerState('timing-key');
        expect(state?.state).toBe('open');

        // Advance time past reset period
        jest.advanceTimersByTime(35000);

        // Mock success for next call
        operation.mockResolvedValueOnce('recovered');

        // Should transition to half-open and allow request
        const result = await withCircuitBreaker('timing-key', operation);
        expect(result).toBe('recovered');

        jest.useRealTimers();
      });

      it('closes circuit after successful half-open attempt', async () => {
        jest.useFakeTimers();

        const error = new Error('Service error');
        const operation = jest.fn()
          .mockRejectedValue(error);

        // Trip the breaker
        for (let i = 0; i < 5; i++) {
          await expect(withCircuitBreaker('recover-key', operation))
            .rejects.toThrow();
        }

        // Advance time
        jest.advanceTimersByTime(35000);

        // Mock recovery
        operation.mockResolvedValue('success');

        await withCircuitBreaker('recover-key', operation);

        // Circuit should be closed
        const state = getCircuitBreakerState('recover-key');
        expect(state?.state).toBe('closed');
        expect(state?.failures).toBe(0);

        jest.useRealTimers();
      });

      it('reopens if too many half-open attempts fail', async () => {
        jest.useFakeTimers();

        const error = new Error('Service error');
        const operation = jest.fn().mockRejectedValue(error);

        // Trip the breaker
        for (let i = 0; i < 5; i++) {
          await expect(withCircuitBreaker('half-open-key', operation))
            .rejects.toThrow('Service error');
        }

        // Advance time to half-open
        jest.advanceTimersByTime(35000);

        // Max half-open attempts is 3
        for (let i = 0; i < 3; i++) {
          await expect(withCircuitBreaker('half-open-key', operation))
            .rejects.toThrow('Service error');
        }

        // Should now fail with circuit breaker open
        await expect(withCircuitBreaker('half-open-key', operation))
          .rejects.toThrow('Circuit breaker');

        jest.useRealTimers();
      });

      it('uses separate circuits for different keys', async () => {
        const error = new Error('Service error');
        const failingOp = jest.fn().mockRejectedValue(error);
        const successOp = jest.fn().mockResolvedValue('success');

        // Trip circuit for key1
        for (let i = 0; i < 5; i++) {
          await expect(withCircuitBreaker('key1', failingOp))
            .rejects.toThrow();
        }

        // key2 should still work
        const result = await withCircuitBreaker('key2', successOp);
        expect(result).toBe('success');
      });
    });
  });

  describe('Retry Budget', () => {
    describe('canRetry', () => {
      it('returns true when tokens are available', () => {
        expect(canRetry('budget-key')).toBe(true);
      });

      it('returns false when tokens are exhausted', () => {
        // Consume all tokens
        for (let i = 0; i < 10; i++) {
          consumeRetryToken('exhaust-key');
        }

        expect(canRetry('exhaust-key')).toBe(false);
      });
    });

    describe('consumeRetryToken', () => {
      it('decrements token count', () => {
        const initialTokens = getRetryTokens('consume-key');
        consumeRetryToken('consume-key');
        const afterTokens = getRetryTokens('consume-key');

        expect(afterTokens).toBe(initialTokens - 1);
      });

      it('returns false when no tokens available', () => {
        // Exhaust tokens
        for (let i = 0; i < 10; i++) {
          consumeRetryToken('no-tokens-key');
        }

        expect(consumeRetryToken('no-tokens-key')).toBe(false);
      });
    });

    describe('getRetryTokens', () => {
      it('returns max tokens for new key', () => {
        expect(getRetryTokens('new-key')).toBe(DEFAULT_RETRY_BUDGET_CONFIG.maxTokens);
      });

      it('refills tokens over time', () => {
        jest.useFakeTimers();

        // Consume some tokens
        for (let i = 0; i < 5; i++) {
          consumeRetryToken('refill-key');
        }

        const beforeRefill = getRetryTokens('refill-key');
        expect(beforeRefill).toBe(5);

        // Advance time (1 token per second)
        jest.advanceTimersByTime(3000);

        const afterRefill = getRetryTokens('refill-key');
        expect(afterRefill).toBe(8); // 5 + 3 (3 seconds = 3 tokens)

        jest.useRealTimers();
      });

      it('caps refill at max tokens', () => {
        jest.useFakeTimers();

        consumeRetryToken('cap-key');

        // Advance lots of time
        jest.advanceTimersByTime(100000);

        const tokens = getRetryTokens('cap-key');
        expect(tokens).toBe(DEFAULT_RETRY_BUDGET_CONFIG.maxTokens);

        jest.useRealTimers();
      });
    });
  });

  describe('Combined Protection', () => {
    describe('withFullProtection', () => {
      it('applies all protections and succeeds', async () => {
        const operation = jest.fn().mockResolvedValue('success');

        const result = await withFullProtection('full-key', operation);

        expect(result).toBe('success');
      });

      it('retries on transient failure', async () => {
        const error = new Error('Temporary');
        (error as Error & { code: string }).code = 'unavailable';

        const operation = jest.fn()
          .mockRejectedValueOnce(error)
          .mockResolvedValue('success');

        const result = await withFullProtection('retry-full-key', operation, {
          retry: { baseDelayMs: 1 },
        });

        expect(result).toBe('success');
        expect(operation).toHaveBeenCalledTimes(2);
      });

      it('fails when retry budget exhausted', async () => {
        // Exhaust budget
        for (let i = 0; i < 10; i++) {
          consumeRetryToken('budget-full-key');
        }

        const operation = jest.fn().mockResolvedValue('success');

        await expect(withFullProtection('budget-full-key', operation))
          .rejects.toThrow('Retry budget exhausted');

        expect(operation).not.toHaveBeenCalled();
      });

      it('respects circuit breaker', async () => {
        const error = new Error('Service error');
        const operation = jest.fn().mockRejectedValue(error);

        // Trip the breaker
        for (let i = 0; i < 5; i++) {
          try {
            await withFullProtection(`cb-full-key`, operation, {
              retry: { maxRetries: 0 },
            });
          } catch {
            // Expected
          }
        }

        // Should fail with circuit breaker
        await expect(
          withFullProtection('cb-full-key', operation, {
            retry: { maxRetries: 0 },
          })
        ).rejects.toThrow('Circuit breaker open');
      });
    });
  });

  describe('resetRetryState', () => {
    it('clears all circuit breakers and budgets', async () => {
      const error = new Error('Error');
      const operation = jest.fn().mockRejectedValue(error);

      // Create some state
      for (let i = 0; i < 5; i++) {
        try {
          await withCircuitBreaker('reset-test', operation);
        } catch {
          // Expected
        }
      }

      consumeRetryToken('reset-budget');

      // Reset
      resetRetryState();

      // Circuit should be closed again
      const cbState = getCircuitBreakerState('reset-test');
      expect(cbState).toBeUndefined();

      // Budget should be full again
      expect(getRetryTokens('reset-budget')).toBe(DEFAULT_RETRY_BUDGET_CONFIG.maxTokens);
    });
  });
});
