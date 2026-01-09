/**
 * Tests for useDisplayCurrency Hook
 *
 * Manages user display currency preferences and auto-detection.
 * Tests cover:
 * - Currency preference fetching
 * - Auto-detection based on location/last deposit
 * - Preference updates
 * - Reset to auto mode
 */

import { renderHook, waitFor, act } from '@testing-library/react';
import { useDisplayCurrency } from '../../hooks/useDisplayCurrency';

describe('useDisplayCurrency', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Initial Loading', () => {
    it('should start with loading state and USD default', () => {
      global.fetch.mockImplementation(() => new Promise(() => {})); // Never resolves

      const { result } = renderHook(() =>
        useDisplayCurrency('user-123', 'US')
      );

      expect(result.current.currency).toBe('USD');
      expect(result.current.symbol).toBe('$');
      expect(result.current.isLoading).toBe(true);
    });

    it('should not fetch when userId is null', async () => {
      const { result } = renderHook(() =>
        useDisplayCurrency(null, 'US')
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should not fetch when userCountry is null', async () => {
      const { result } = renderHook(() =>
        useDisplayCurrency('user-123', null)
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('Currency Detection', () => {
    it('should fetch display currency based on location', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ok: true,
          data: {
            currency: 'USD',
            symbol: '$',
            name: 'US Dollar',
            source: 'local_detection',
            sourceLabel: 'Based on your location',
            canChange: true,
            decimals: 2,
            availableCurrencies: [
              { value: 'USD', label: 'US Dollar', symbol: '$' },
              { value: 'EUR', label: 'Euro', symbol: '€' },
            ],
          },
        }),
      });

      const { result } = renderHook(() =>
        useDisplayCurrency('user-123', 'US')
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(global.fetch).toHaveBeenCalledWith(
        '/api/user/display-currency?userId=user-123&country=US'
      );
      expect(result.current.currency).toBe('USD');
      expect(result.current.symbol).toBe('$');
      expect(result.current.source).toBe('local_detection');
      expect(result.current.canChange).toBe(true);
    });

    it('should detect EUR for European users', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ok: true,
          data: {
            currency: 'EUR',
            symbol: '€',
            name: 'Euro',
            source: 'local_detection',
            sourceLabel: 'Based on your location',
            canChange: true,
            decimals: 2,
          },
        }),
      });

      const { result } = renderHook(() =>
        useDisplayCurrency('user-123', 'FR')
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.currency).toBe('EUR');
      expect(result.current.symbol).toBe('€');
    });

    it('should use last deposit currency when available', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ok: true,
          data: {
            currency: 'GBP',
            symbol: '£',
            name: 'British Pound',
            source: 'last_deposit',
            sourceLabel: 'Based on your last deposit',
            canChange: true,
            decimals: 2,
          },
        }),
      });

      const { result } = renderHook(() =>
        useDisplayCurrency('user-123', 'US')
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.source).toBe('last_deposit');
      expect(result.current.currency).toBe('GBP');
    });

    it('should use preference when manually set', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ok: true,
          data: {
            currency: 'AUD',
            symbol: 'A$',
            name: 'Australian Dollar',
            source: 'preference',
            sourceLabel: 'Manually selected',
            canChange: true,
            decimals: 2,
          },
        }),
      });

      const { result } = renderHook(() =>
        useDisplayCurrency('user-123', 'US')
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.source).toBe('preference');
      expect(result.current.currency).toBe('AUD');
    });
  });

  describe('Setting Currency Preference', () => {
    it('should update currency preference', async () => {
      // Initial fetch
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ok: true,
          data: {
            currency: 'USD',
            symbol: '$',
            name: 'US Dollar',
            source: 'local_detection',
            sourceLabel: 'Based on your location',
            canChange: true,
            decimals: 2,
          },
        }),
      });

      const { result } = renderHook(() =>
        useDisplayCurrency('user-123', 'US')
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Mock update request
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ok: true,
          data: {
            currency: 'EUR',
            symbol: '€',
            name: 'Euro',
            source: 'preference',
            sourceLabel: 'Manually selected',
            canChange: true,
            decimals: 2,
          },
        }),
      });

      // Update currency
      await act(async () => {
        await result.current.setCurrency('EUR');
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/user/display-currency', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'user-123',
          country: 'US',
          currency: 'EUR',
        }),
      });

      expect(result.current.currency).toBe('EUR');
      expect(result.current.source).toBe('preference');
    });

    it('should handle update errors gracefully', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ok: true,
          data: {
            currency: 'USD',
            symbol: '$',
            name: 'US Dollar',
            source: 'local_detection',
            sourceLabel: 'Based on your location',
            canChange: true,
            decimals: 2,
          },
        }),
      });

      const { result } = renderHook(() =>
        useDisplayCurrency('user-123', 'US')
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Mock failed update
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ok: false,
          error: {
            message: 'Currency not supported',
          },
        }),
      });

      await act(async () => {
        await result.current.setCurrency('XXX');
      });

      expect(result.current.error).toBe('Currency not supported');
      expect(result.current.currency).toBe('USD'); // Should keep old value
    });

    it('should track updating state', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ok: true,
          data: {
            currency: 'USD',
            symbol: '$',
            name: 'US Dollar',
            source: 'local_detection',
            sourceLabel: 'Based on your location',
            canChange: true,
            decimals: 2,
          },
        }),
      });

      const { result } = renderHook(() =>
        useDisplayCurrency('user-123', 'US')
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      global.fetch.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      act(() => {
        result.current.setCurrency('EUR');
      });

      expect(result.current.isUpdating).toBe(true);
    });
  });

  describe('Reset to Auto Mode', () => {
    it('should reset to auto-detected currency', async () => {
      // Initial fetch with preference
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ok: true,
          data: {
            currency: 'EUR',
            symbol: '€',
            name: 'Euro',
            source: 'preference',
            sourceLabel: 'Manually selected',
            canChange: true,
            decimals: 2,
          },
        }),
      });

      const { result } = renderHook(() =>
        useDisplayCurrency('user-123', 'US')
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Mock reset request
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ok: true,
          data: {
            currency: 'USD',
            symbol: '$',
            name: 'US Dollar',
            source: 'local_detection',
            sourceLabel: 'Based on your location',
            canChange: true,
            decimals: 2,
          },
        }),
      });

      // Reset to auto
      await act(async () => {
        await result.current.resetToAuto();
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/user/display-currency', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'user-123',
          country: 'US',
        }),
      });

      expect(result.current.currency).toBe('USD');
      expect(result.current.source).toBe('local_detection');
    });
  });

  describe('Refresh Functionality', () => {
    it('should allow manual refresh', async () => {
      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          ok: true,
          data: {
            currency: 'USD',
            symbol: '$',
            name: 'US Dollar',
            source: 'local_detection',
            sourceLabel: 'Based on your location',
            canChange: true,
            decimals: 2,
          },
        }),
      });

      const { result } = renderHook(() =>
        useDisplayCurrency('user-123', 'US')
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(global.fetch).toHaveBeenCalledTimes(1);

      // Refresh
      await act(async () => {
        await result.current.refresh();
      });

      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() =>
        useDisplayCurrency('user-123', 'US')
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe('Network error');
    });

    it('should handle API errors', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ok: false,
          error: {
            message: 'User not found',
          },
        }),
      });

      const { result } = renderHook(() =>
        useDisplayCurrency('user-123', 'US')
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe('User not found');
    });
  });

  describe('Available Currencies', () => {
    it('should include available currencies when canChange is true', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ok: true,
          data: {
            currency: 'USD',
            symbol: '$',
            name: 'US Dollar',
            source: 'local_detection',
            sourceLabel: 'Based on your location',
            canChange: true,
            decimals: 2,
            availableCurrencies: [
              { value: 'USD', label: 'US Dollar', symbol: '$' },
              { value: 'EUR', label: 'Euro', symbol: '€' },
              { value: 'GBP', label: 'British Pound', symbol: '£' },
            ],
          },
        }),
      });

      const { result } = renderHook(() =>
        useDisplayCurrency('user-123', 'US')
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.availableCurrencies).toHaveLength(3);
      expect(result.current.availableCurrencies[0]).toEqual({
        value: 'USD',
        label: 'US Dollar',
        symbol: '$',
      });
    });
  });

  describe('Zero-Decimal Currencies', () => {
    it('should handle zero-decimal currencies (JPY, KRW)', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ok: true,
          data: {
            currency: 'JPY',
            symbol: '¥',
            name: 'Japanese Yen',
            source: 'local_detection',
            sourceLabel: 'Based on your location',
            canChange: true,
            decimals: 0,
          },
        }),
      });

      const { result } = renderHook(() =>
        useDisplayCurrency('user-123', 'JP')
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.currency).toBe('JPY');
      expect(result.current.decimals).toBe(0);
    });
  });
});
