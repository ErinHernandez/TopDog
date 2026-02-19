/**
 * SWR Global Configuration Tests
 *
 * Validates the enterprise SWR config: deduplication, focus throttling,
 * exponential backoff retry, and smart error handling (no retry on 401/403/404).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { swrConfig } from '@/Documents/bestball-site/lib/swrConfig';

describe('SWR Global Configuration', () => {
  describe('Deduplication settings', () => {
    it('has expected deduping interval (5 seconds)', () => {
      expect(swrConfig.dedupingInterval).toBe(5000);
    });
  });

  describe('Focus throttle settings', () => {
    it('has expected focus throttle interval (5 minutes)', () => {
      expect(swrConfig.focusThrottleInterval).toBe(300000);
    });
  });

  describe('Error retry settings', () => {
    it('has error retry count of 3', () => {
      expect(swrConfig.errorRetryCount).toBe(3);
    });

    it('has error retry interval of 5 seconds', () => {
      expect(swrConfig.errorRetryInterval).toBe(5000);
    });

    it('has shouldRetryOnError enabled', () => {
      expect(swrConfig.shouldRetryOnError).toBe(true);
    });
  });

  describe('Revalidation settings', () => {
    it('revalidates on focus (throttled)', () => {
      expect(swrConfig.revalidateOnFocus).toBe(true);
    });

    it('revalidates on network reconnect', () => {
      expect(swrConfig.revalidateOnReconnect).toBe(true);
    });

    it('revalidates if data is stale', () => {
      expect(swrConfig.revalidateIfStale).toBe(true);
    });
  });

  describe('Data retention', () => {
    it('keeps previous data while revalidating', () => {
      expect(swrConfig.keepPreviousData).toBe(true);
    });
  });

  describe('onErrorRetry function', () => {
    const mockRevalidate = vi.fn();
    const mockConfig = {} as any;

    beforeEach(() => {
      mockRevalidate.mockClear();
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('does NOT retry on 404 errors', () => {
      const error = new Error('Not Found') as any;
      error.status = 404;

      swrConfig.onErrorRetry?.(error, 'key', mockConfig, mockRevalidate, {
        retryCount: 0,
      });

      expect(mockRevalidate).not.toHaveBeenCalled();
    });

    it('does NOT retry on 403 errors', () => {
      const error = new Error('Forbidden') as any;
      error.status = 403;

      swrConfig.onErrorRetry?.(error, 'key', mockConfig, mockRevalidate, {
        retryCount: 0,
      });

      expect(mockRevalidate).not.toHaveBeenCalled();
    });

    it('does NOT retry on 401 errors (auth required)', () => {
      const error = new Error('Unauthorized') as any;
      error.status = 401;

      swrConfig.onErrorRetry?.(error, 'key', mockConfig, mockRevalidate, {
        retryCount: 0,
      });

      expect(mockRevalidate).not.toHaveBeenCalled();
    });

    it('retries on 500 errors with exponential backoff (first retry: 5s)', () => {
      const error = new Error('Server Error') as any;
      error.status = 500;

      swrConfig.onErrorRetry?.(error, 'key', mockConfig, mockRevalidate, {
        retryCount: 0,
      });

      expect(mockRevalidate).not.toHaveBeenCalled();
      vi.advanceTimersByTime(5000);
      expect(mockRevalidate).toHaveBeenCalledWith({ retryCount: 0 });
    });

    it('applies exponential backoff for second retry (10s)', () => {
      const error = new Error('Server Error') as any;
      error.status = 500;

      swrConfig.onErrorRetry?.(error, 'key', mockConfig, mockRevalidate, {
        retryCount: 1,
      });

      expect(mockRevalidate).not.toHaveBeenCalled();
      vi.advanceTimersByTime(10000);
      expect(mockRevalidate).toHaveBeenCalledWith({ retryCount: 1 });
    });

    it('applies exponential backoff for third retry (20s)', () => {
      const error = new Error('Server Error') as any;
      error.status = 500;

      swrConfig.onErrorRetry?.(error, 'key', mockConfig, mockRevalidate, {
        retryCount: 2,
      });

      expect(mockRevalidate).not.toHaveBeenCalled();
      vi.advanceTimersByTime(20000);
      expect(mockRevalidate).toHaveBeenCalledWith({ retryCount: 2 });
    });

    it('respects max retry count (3) and does NOT retry beyond', () => {
      const error = new Error('Server Error') as any;
      error.status = 500;

      swrConfig.onErrorRetry?.(error, 'key', mockConfig, mockRevalidate, {
        retryCount: 3,
      });

      expect(mockRevalidate).not.toHaveBeenCalled();
      vi.runAllTimers();
      expect(mockRevalidate).not.toHaveBeenCalled();
    });

    it('retries on network errors (status 0)', () => {
      const error = new Error('Network error') as any;
      error.status = 0;

      swrConfig.onErrorRetry?.(error, 'key', mockConfig, mockRevalidate, {
        retryCount: 0,
      });

      expect(mockRevalidate).not.toHaveBeenCalled();
      vi.advanceTimersByTime(5000);
      expect(mockRevalidate).toHaveBeenCalledWith({ retryCount: 0 });
    });
  });
});
