/**
 * Tests for useStripeExchangeRate Hook
 *
 * Critical hook for currency conversion in payment flows.
 * Tests cover:
 * - Exchange rate fetching
 * - Currency conversion (USD to local, local to USD)
 * - $25 increment validation
 * - Caching and error handling
 */

import { renderHook, waitFor } from '@testing-library/react';
import { useStripeExchangeRate } from '../../hooks/useStripeExchangeRate';

describe('useStripeExchangeRate', () => {
  beforeEach(() => {
    // Reset fetch mock before each test
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('USD Currency (No API Call)', () => {
    it('should return rate of 1 for USD without API call', async () => {
      const { result } = renderHook(() => useStripeExchangeRate('USD'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.rate).toBe(1);
      expect(result.current.rateDisplay).toBe('1 USD = 1 USD');
      expect(result.current.error).toBe(null);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should handle null currency as USD', async () => {
      const { result } = renderHook(() => useStripeExchangeRate(null));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.rate).toBe(1);
    });

    it('should handle undefined currency as USD', async () => {
      const { result } = renderHook(() => useStripeExchangeRate(undefined));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.rate).toBe(1);
    });
  });

  describe('Exchange Rate Fetching', () => {
    it('should fetch exchange rate for non-USD currency', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ok: true,
          data: {
            currency: 'EUR',
            rate: 0.85,
            rateDisplay: '1 USD = 0.85 EUR',
            fetchedAt: Date.now(),
            source: 'stripe',
          },
        }),
      });

      const { result } = renderHook(() => useStripeExchangeRate('EUR'));

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/stripe/exchange-rate?currency=EUR'
      );
      expect(result.current.rate).toBe(0.85);
      expect(result.current.rateDisplay).toBe('1 USD = 0.85 EUR');
      expect(result.current.error).toBe(null);
    });

    it('should normalize currency code to uppercase', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ok: true,
          data: {
            currency: 'AUD',
            rate: 1.55,
            rateDisplay: '1 USD = 1.55 AUD',
            fetchedAt: Date.now(),
            source: 'stripe',
          },
        }),
      });

      const { result } = renderHook(() => useStripeExchangeRate('aud'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/stripe/exchange-rate?currency=AUD'
      );
    });

    it('should handle API errors gracefully', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ok: false,
          error: {
            message: 'Invalid currency code',
          },
        }),
      });

      const { result } = renderHook(() => useStripeExchangeRate('XXX'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Invalid currency code');
      expect(result.current.rate).toBe(null);
    });

    it('should handle network errors', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useStripeExchangeRate('EUR'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Network error fetching exchange rate');
    });
  });

  describe('Currency Conversion', () => {
    beforeEach(() => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          ok: true,
          data: {
            currency: 'EUR',
            rate: 0.85,
            rateDisplay: '1 USD = 0.85 EUR',
            fetchedAt: Date.now(),
            source: 'stripe',
          },
        }),
      });
    });

    it('should convert USD to local currency', async () => {
      const { result } = renderHook(() => useStripeExchangeRate('EUR'));

      await waitFor(() => {
        expect(result.current.rate).toBe(0.85);
      });

      const eurAmount = result.current.toLocal(100); // $100 USD
      expect(eurAmount).toBe(85); // 85 EUR
    });

    it('should convert local currency to USD', async () => {
      const { result } = renderHook(() => useStripeExchangeRate('EUR'));

      await waitFor(() => {
        expect(result.current.rate).toBe(0.85);
      });

      const usdAmount = result.current.toUSD(85); // 85 EUR
      expect(usdAmount).toBeCloseTo(100, 2); // ~$100 USD
    });

    it('should handle zero rate safely in toUSD', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ok: true,
          data: {
            currency: 'XXX',
            rate: 0,
            rateDisplay: '1 USD = 0 XXX',
            fetchedAt: Date.now(),
            source: 'stripe',
          },
        }),
      });

      const { result } = renderHook(() => useStripeExchangeRate('XXX'));

      await waitFor(() => {
        expect(result.current.rate).toBe(0);
      });

      const usdAmount = result.current.toUSD(100);
      expect(usdAmount).toBe(0); // Should not divide by zero
    });
  });

  describe('$25 Increment Functions', () => {
    beforeEach(() => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          ok: true,
          data: {
            currency: 'AUD',
            rate: 1.5,
            rateDisplay: '1 USD = 1.5 AUD',
            fetchedAt: Date.now(),
            source: 'stripe',
          },
        }),
      });
    });

    it('should calculate $25 increments in local currency', async () => {
      const { result } = renderHook(() => useStripeExchangeRate('AUD'));

      await waitFor(() => {
        expect(result.current.rate).toBe(1.5);
      });

      const increments = result.current.get25Increments();

      // $25, $50, $100, $250, $500 USD in AUD
      expect(increments).toEqual([
        37.5,   // $25 * 1.5
        75,     // $50 * 1.5
        150,    // $100 * 1.5
        375,    // $250 * 1.5
        750,    // $500 * 1.5
      ]);
    });

    it('should validate valid $25 increment', async () => {
      const { result } = renderHook(() => useStripeExchangeRate('AUD'));

      await waitFor(() => {
        expect(result.current.rate).toBe(1.5);
      });

      // 37.5 AUD = $25 USD (exact increment)
      const isValid = result.current.isValid25Increment(37.5);
      expect(isValid).toBe(true);
    });

    it('should reject invalid $25 increment', async () => {
      const { result } = renderHook(() => useStripeExchangeRate('AUD'));

      await waitFor(() => {
        expect(result.current.rate).toBe(1.5);
      });

      // 40 AUD ≠ $25 increment
      const isValid = result.current.isValid25Increment(40);
      expect(isValid).toBe(false);
    });

    it('should get nearest $25 increments', async () => {
      const { result } = renderHook(() => useStripeExchangeRate('AUD'));

      await waitFor(() => {
        expect(result.current.rate).toBe(1.5);
      });

      // For 100 AUD (~$66.67 USD)
      const [lower, higher] = result.current.getNearestIncrements(100);

      expect(lower).toBe(75);    // $50 * 1.5 = 75 AUD
      expect(higher).toBe(112.5); // $75 * 1.5 = 112.5 AUD
    });

    it('should enforce minimum of $25', async () => {
      const { result } = renderHook(() => useStripeExchangeRate('AUD'));

      await waitFor(() => {
        expect(result.current.rate).toBe(1.5);
      });

      // For very small amount
      const [lower, higher] = result.current.getNearestIncrements(10);

      expect(lower).toBe(37.5);  // $25 * 1.5 (minimum)
      expect(higher).toBe(37.5); // $25 * 1.5 (minimum)
    });
  });

  describe('Refresh Functionality', () => {
    it('should allow manual refresh of exchange rate', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          ok: true,
          data: {
            currency: 'EUR',
            rate: 0.85,
            rateDisplay: '1 USD = 0.85 EUR',
            fetchedAt: Date.now(),
            source: 'stripe',
          },
        }),
      });

      const { result } = renderHook(() => useStripeExchangeRate('EUR'));

      await waitFor(() => {
        expect(result.current.rate).toBe(0.85);
      });

      expect(global.fetch).toHaveBeenCalledTimes(1);

      // Update mock to return new rate
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ok: true,
          data: {
            currency: 'EUR',
            rate: 0.90,
            rateDisplay: '1 USD = 0.90 EUR',
            fetchedAt: Date.now(),
            source: 'stripe',
          },
        }),
      });

      // Refresh
      await result.current.refresh();

      await waitFor(() => {
        expect(result.current.rate).toBe(0.90);
      });

      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('Currency Change', () => {
    it('should refetch rate when currency changes', async () => {
      global.fetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            ok: true,
            data: {
              currency: 'EUR',
              rate: 0.85,
              rateDisplay: '1 USD = 0.85 EUR',
              fetchedAt: Date.now(),
              source: 'stripe',
            },
          }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            ok: true,
            data: {
              currency: 'GBP',
              rate: 0.75,
              rateDisplay: '1 USD = 0.75 GBP',
              fetchedAt: Date.now(),
              source: 'stripe',
            },
          }),
        });

      const { result, rerender } = renderHook(
        ({ currency }) => useStripeExchangeRate(currency),
        { initialProps: { currency: 'EUR' } }
      );

      await waitFor(() => {
        expect(result.current.rate).toBe(0.85);
      });

      // Change currency
      rerender({ currency: 'GBP' });

      await waitFor(() => {
        expect(result.current.rate).toBe(0.75);
      });

      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });
});
