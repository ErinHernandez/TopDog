/**
 * Tests for lib/paystack/retryUtils
 * 
 * Tier 0 business logic (95%+ coverage).
 * Tests focus on retry logic and exponential backoff:
 * - Exponential backoff calculation
 * - Retry attempts and limits
 * - Retryable error detection
 * - Paystack-specific retry behavior
 * - Error handling and logging
 */

jest.mock('../../../lib/errorTracking', () => ({
  captureError: jest.fn(),
}));

let retryUtils;
let withRetry;
let withPaystackRetry;

beforeAll(() => {
  jest.useFakeTimers();
  retryUtils = require('../../../lib/paystack/retryUtils');
  withRetry = retryUtils.withRetry;
  withPaystackRetry = retryUtils.withPaystackRetry;
});

afterAll(() => {
  jest.useRealTimers();
});

describe('withRetry', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  describe('Successful Execution', () => {
    it('returns result on first attempt', async () => {
      const fn = jest.fn().mockResolvedValue('success');

      const result = await withRetry(fn);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('succeeds after retries', async () => {
      const fn = jest.fn()
        .mockRejectedValueOnce(new Error('Temporary error'))
        .mockResolvedValueOnce('success');

      const promise = withRetry(fn, {
        maxRetries: 3,
        initialDelay: 100,
      });

      // Fast-forward past the delay
      jest.advanceTimersByTime(100);
      await Promise.resolve(); // Allow promises to resolve

      const result = await promise;

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('logs successful retry when logger provided', async () => {
      const logger = {
        warn: jest.fn(),
        error: jest.fn(),
      };

      const fn = jest.fn()
        .mockRejectedValueOnce(new Error('Temporary error'))
        .mockResolvedValueOnce('success');

      const promise = withRetry(fn, {
        maxRetries: 3,
        initialDelay: 100,
        logger,
      });

      jest.advanceTimersByTime(100);
      await Promise.resolve();
      await promise;

      expect(logger.warn).toHaveBeenCalledWith('Retry succeeded', expect.objectContaining({
        attempt: 1,
        totalAttempts: 2,
      }));
    });
  });

  describe('Exponential Backoff', () => {
    it('uses exponential backoff for delays', async () => {
      const fn = jest.fn()
        .mockRejectedValueOnce(new Error('Error 1'))
        .mockRejectedValueOnce(new Error('Error 2'))
        .mockResolvedValueOnce('success');

      const promise = withRetry(fn, {
        maxRetries: 3,
        initialDelay: 100,
        backoffMultiplier: 2,
      });

      // First retry: 100ms
      await jest.advanceTimersByTimeAsync(100);
      // Second retry: 200ms (100 * 2^1)
      await jest.advanceTimersByTimeAsync(200);

      await promise;

      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('respects maxDelay limit', async () => {
      const fn = jest.fn()
        .mockRejectedValueOnce(new Error('Error 1'))
        .mockRejectedValueOnce(new Error('Error 2'))
        .mockResolvedValueOnce('success');

      const promise = withRetry(fn, {
        maxRetries: 3,
        initialDelay: 1000,
        maxDelay: 2000,
        backoffMultiplier: 4, // Would be 4000ms but capped at 2000ms
      });

      // First retry: 1000ms
      await jest.advanceTimersByTimeAsync(1000);
      // Second retry: capped at 2000ms (not 4000ms)
      await jest.advanceTimersByTimeAsync(2000);

      await promise;

      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('uses default backoff parameters', async () => {
      const fn = jest.fn()
        .mockRejectedValueOnce(new Error('Error'))
        .mockResolvedValueOnce('success');

      const promise = withRetry(fn);

      // Default: initialDelay=1000, multiplier=2, so first retry = 1000ms
      await jest.advanceTimersByTimeAsync(1000);

      await promise;

      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  describe('Retry Limits', () => {
    it('stops after maxRetries exceeded', async () => {
      const error = new Error('Persistent error');
      const fn = jest.fn().mockRejectedValue(error);

      const promise = withRetry(fn, {
        maxRetries: 2,
        initialDelay: 100,
      });

      jest.advanceTimersByTime(300); // Past all delays
      await Promise.resolve();

      await expect(promise).rejects.toThrow('Persistent error');
      expect(fn).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });

    it('uses default maxRetries (3)', async () => {
      const error = new Error('Persistent error');
      const fn = jest.fn().mockRejectedValue(error);

      const promise = withRetry(fn, {
        initialDelay: 100,
      });

      jest.advanceTimersByTime(700); // 100 + 200 + 400
      await Promise.resolve();

      await expect(promise).rejects.toThrow('Persistent error');
      expect(fn).toHaveBeenCalledTimes(4); // Initial + 3 retries
    });
  });

  describe('Retryable Error Detection', () => {
    it('retries on HTTP 500 errors', async () => {
      const error = new Error('Server error');
      error.status = 500;
      const fn = jest.fn()
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce('success');

      const promise = withRetry(fn, {
        initialDelay: 100,
      });

      jest.advanceTimersByTime(100);
      await Promise.resolve();
      await promise;

      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('retries on network errors', async () => {
      const error = new Error('Network timeout');
      const fn = jest.fn()
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce('success');

      const promise = withRetry(fn, {
        initialDelay: 100,
      });

      jest.advanceTimersByTime(100);
      await Promise.resolve();
      await promise;

      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('does not retry non-retryable errors', async () => {
      const error = new Error('Client error');
      error.status = 400; // Client error - not retryable by default
      const fn = jest.fn().mockRejectedValue(error);

      await expect(withRetry(fn)).rejects.toThrow('Client error');
      expect(fn).toHaveBeenCalledTimes(1); // No retries
    });

    it('uses custom retryableErrors list', async () => {
      const error = new Error('Custom error');
      error.status = 400;
      const fn = jest.fn()
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce('success');

      const promise = withRetry(fn, {
        retryableErrors: [400, 500],
        initialDelay: 100,
      });

      jest.advanceTimersByTime(100);
      await Promise.resolve();
      await promise;

      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('uses custom shouldRetry function', async () => {
      const error = new Error('Custom error');
      const fn = jest.fn()
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce('success');

      const shouldRetry = jest.fn().mockReturnValue(true);

      const promise = withRetry(fn, {
        shouldRetry,
        initialDelay: 100,
      });

      jest.advanceTimersByTime(100);
      await Promise.resolve();
      await promise;

      expect(shouldRetry).toHaveBeenCalled();
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });

  describe('Error Handling', () => {
    it('captures error when max retries exhausted', async () => {
      const captureError = require('../../../lib/errorTracking').captureError;
      const error = new Error('Persistent error');
      error.status = 500;
      const fn = jest.fn().mockRejectedValue(error);

      const promise = withRetry(fn, {
        maxRetries: 1,
        initialDelay: 100,
      });

      jest.advanceTimersByTime(200);
      await Promise.resolve();

      await expect(promise).rejects.toThrow();

      expect(captureError).toHaveBeenCalled();
    });

    it('logs errors when logger provided', async () => {
      const logger = {
        warn: jest.fn(),
        error: jest.fn(),
      };

      const error = new Error('Persistent error');
      error.status = 500;
      const fn = jest.fn().mockRejectedValue(error);

      const promise = withRetry(fn, {
        maxRetries: 1,
        initialDelay: 100,
        logger,
      });

      jest.advanceTimersByTime(200);
      await Promise.resolve();

      await expect(promise).rejects.toThrow();

      expect(logger.error).toHaveBeenCalledWith(
        'Max retries exhausted',
        expect.anything(),
        expect.objectContaining({
          maxRetries: 1,
        })
      );
    });

    it('logs non-retryable errors', async () => {
      const logger = {
        warn: jest.fn(),
        error: jest.fn(),
      };

      const error = new Error('Client error');
      error.status = 400;
      const fn = jest.fn().mockRejectedValue(error);

      await expect(
        withRetry(fn, { logger })
      ).rejects.toThrow();

      expect(logger.error).toHaveBeenCalledWith(
        'Non-retryable error',
        expect.anything(),
        expect.objectContaining({
          attempt: 1,
        })
      );
    });
  });
});

describe('withPaystackRetry', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  describe('Paystack-Specific Retry Behavior', () => {
    it('retries on 5xx server errors', async () => {
      const error = new Error('Server error');
      error.status = 503;
      const fn = jest.fn()
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce('success');

      const promise = withPaystackRetry(fn, {
        initialDelay: 100,
      });

      jest.advanceTimersByTime(100);
      await Promise.resolve();
      await promise;

      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('retries on 408 (Request Timeout)', async () => {
      const error = new Error('Timeout');
      error.status = 408;
      const fn = jest.fn()
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce('success');

      const promise = withPaystackRetry(fn, {
        initialDelay: 100,
      });

      jest.advanceTimersByTime(100);
      await Promise.resolve();
      await promise;

      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('retries on 429 (Too Many Requests)', async () => {
      const error = new Error('Rate limited');
      error.status = 429;
      const fn = jest.fn()
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce('success');

      const promise = withPaystackRetry(fn, {
        initialDelay: 100,
      });

      jest.advanceTimersByTime(100);
      await Promise.resolve();
      await promise;

      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('does not retry on other 4xx client errors', async () => {
      const error = new Error('Bad request');
      error.status = 400;
      const fn = jest.fn().mockRejectedValue(error);

      await expect(withPaystackRetry(fn)).rejects.toThrow('Bad request');
      expect(fn).toHaveBeenCalledTimes(1); // No retries
    });

    it('does not retry on 404 (Not Found)', async () => {
      const error = new Error('Not found');
      error.status = 404;
      const fn = jest.fn().mockRejectedValue(error);

      await expect(withPaystackRetry(fn)).rejects.toThrow('Not found');
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('retries on network errors (no status code)', async () => {
      const error = new Error('Network error');
      const fn = jest.fn()
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce('success');

      const promise = withPaystackRetry(fn, {
        initialDelay: 100,
      });

      jest.advanceTimersByTime(100);
      await Promise.resolve();
      await promise;

      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('uses Paystack defaults (maxRetries: 3, initialDelay: 1000)', async () => {
      const error = new Error('Server error');
      error.status = 500;
      const fn = jest.fn()
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce('success');

      const promise = withPaystackRetry(fn);

      // Default initialDelay is 1000ms
      await jest.advanceTimersByTimeAsync(1000);
      await promise;

      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('allows overriding Paystack defaults', async () => {
      const error = new Error('Server error');
      error.status = 500;
      const fn = jest.fn()
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce('success');

      const promise = withPaystackRetry(fn, {
        maxRetries: 5,
        initialDelay: 100,
      });

      jest.advanceTimersByTime(100);
      await Promise.resolve();
      await promise;

      expect(fn).toHaveBeenCalledTimes(2);
    });
  });
});
