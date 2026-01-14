/**
 * Tests for hooks/useShare.js
 * 
 * Tier 4 components & hooks (40%+ coverage).
 * Tests focus on business logic:
 * - Share modal state management
 * - Native vs clipboard fallback logic
 * - Share type handling
 * - Error handling
 */

import { renderHook, act } from '@testing-library/react';
import { useShare } from '../../hooks/useShare';

// Mock shareConfig
jest.mock('../../lib/shareConfig', () => ({
  generateShareData: jest.fn((type, data) => ({
    title: `Share ${type}`,
    text: `Check this out: ${data.title || 'content'}`,
    url: `https://example.com/share/${type}`,
  })),
  trackShare: jest.fn(),
}));

const { generateShareData, trackShare } = require('../../lib/shareConfig');

describe('useShare', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset navigator mocks
    global.navigator.share = undefined;
    global.navigator.canShare = undefined;
    global.navigator.clipboard = {
      writeText: jest.fn().mockResolvedValue(),
    };
  });

  describe('Modal State Management', () => {
    it('initializes with modal closed', () => {
      const { result } = renderHook(() => useShare());

      expect(result.current.isModalOpen).toBe(false);
      expect(result.current.currentShareType).toBeNull();
      expect(result.current.currentShareData).toEqual({});
    });

    it('opens share modal with type and data', () => {
      const { result } = renderHook(() => useShare());

      act(() => {
        result.current.openShareModal('draft', { title: 'My Draft' });
      });

      expect(result.current.isModalOpen).toBe(true);
      expect(result.current.currentShareType).toBe('draft');
      expect(result.current.currentShareData).toEqual({ title: 'My Draft' });
    });

    it('closes share modal and resets state', () => {
      const { result } = renderHook(() => useShare());

      act(() => {
        result.current.openShareModal('draft', { title: 'My Draft' });
      });

      expect(result.current.isModalOpen).toBe(true);

      act(() => {
        result.current.closeShareModal();
      });

      expect(result.current.isModalOpen).toBe(false);
      expect(result.current.currentShareType).toBeNull();
      expect(result.current.currentShareData).toEqual({});
    });
  });

  describe('Quick Share (Native vs Clipboard)', () => {
    it('uses native share when available and canShare returns true', async () => {
      const mockShare = jest.fn().mockResolvedValue();
      global.navigator.share = mockShare;
      global.navigator.canShare = jest.fn().mockReturnValue(true);

      const { result } = renderHook(() => useShare());

      let shareResult;
      await act(async () => {
        shareResult = await result.current.quickShare('draft', { title: 'My Draft' });
      });

      expect(mockShare).toHaveBeenCalled();
      expect(global.navigator.clipboard.writeText).not.toHaveBeenCalled();
      expect(shareResult.success).toBe(true);
      expect(shareResult.method).toBe('native');
      expect(trackShare).toHaveBeenCalledWith('draft', 'native', true);
    });

    it('falls back to clipboard when native share not available', async () => {
      global.navigator.share = undefined;

      const { result } = renderHook(() => useShare());

      let shareResult;
      await act(async () => {
        shareResult = await result.current.quickShare('draft', { title: 'My Draft' });
      });

      expect(global.navigator.clipboard.writeText).toHaveBeenCalled();
      expect(shareResult.success).toBe(true);
      expect(shareResult.method).toBe('clipboard');
      expect(shareResult.message).toContain('clipboard');
      expect(trackShare).toHaveBeenCalledWith('draft', 'clipboard', true);
    });

    it('falls back to clipboard when canShare returns false', async () => {
      const mockShare = jest.fn();
      global.navigator.share = mockShare;
      global.navigator.canShare = jest.fn().mockReturnValue(false);

      const { result } = renderHook(() => useShare());

      let shareResult;
      await act(async () => {
        shareResult = await result.current.quickShare('draft', { title: 'My Draft' });
      });

      expect(mockShare).not.toHaveBeenCalled();
      expect(global.navigator.clipboard.writeText).toHaveBeenCalled();
      expect(shareResult.success).toBe(true);
      expect(shareResult.method).toBe('clipboard');
    });

    it('handles native share errors gracefully', async () => {
      const mockShare = jest.fn().mockRejectedValue(new Error('Share cancelled'));
      global.navigator.share = mockShare;
      global.navigator.canShare = jest.fn().mockReturnValue(true);

      const { result } = renderHook(() => useShare());

      let shareResult;
      await act(async () => {
        shareResult = await result.current.quickShare('draft', { title: 'My Draft' });
      });

      expect(shareResult.success).toBe(false);
      expect(shareResult.error).toBe('Share cancelled');
      expect(trackShare).toHaveBeenCalledWith('draft', 'quick_share', false);
    });

    it('handles clipboard errors gracefully', async () => {
      global.navigator.share = undefined;
      global.navigator.clipboard.writeText = jest.fn().mockRejectedValue(new Error('Clipboard failed'));

      const { result } = renderHook(() => useShare());

      let shareResult;
      await act(async () => {
        shareResult = await result.current.quickShare('draft', { title: 'My Draft' });
      });

      expect(shareResult.success).toBe(false);
      expect(shareResult.error).toBe('Clipboard failed');
    });

    it('sets isSharing state during share operation', async () => {
      const mockShare = jest.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      global.navigator.share = mockShare;
      global.navigator.canShare = jest.fn().mockReturnValue(true);

      const { result } = renderHook(() => useShare());

      const sharePromise = act(async () => {
        return result.current.quickShare('draft', { title: 'My Draft' });
      });

      // isSharing should be true during operation
      expect(result.current.isSharing).toBe(true);

      await sharePromise;

      // isSharing should be false after operation
      expect(result.current.isSharing).toBe(false);
    });
  });

  describe('Share Data Generation', () => {
    it('generates share data using shareConfig', async () => {
      global.navigator.share = undefined;

      const { result } = renderHook(() => useShare());

      await act(async () => {
        await result.current.quickShare('draft', { title: 'My Draft' });
      });

      expect(generateShareData).toHaveBeenCalledWith('draft', { title: 'My Draft' });
    });
  });

  describe('Share Tracking', () => {
    it('tracks successful native shares', async () => {
      const mockShare = jest.fn().mockResolvedValue();
      global.navigator.share = mockShare;
      global.navigator.canShare = jest.fn().mockReturnValue(true);

      const { result } = renderHook(() => useShare());

      await act(async () => {
        await result.current.quickShare('draft', { title: 'My Draft' });
      });

      expect(trackShare).toHaveBeenCalledWith('draft', 'native', true);
    });

    it('tracks successful clipboard shares', async () => {
      global.navigator.share = undefined;

      const { result } = renderHook(() => useShare());

      await act(async () => {
        await result.current.quickShare('tournament', { title: 'Tournament' });
      });

      expect(trackShare).toHaveBeenCalledWith('tournament', 'clipboard', true);
    });

    it('tracks failed shares', async () => {
      const mockShare = jest.fn().mockRejectedValue(new Error('Failed'));
      global.navigator.share = mockShare;
      global.navigator.canShare = jest.fn().mockReturnValue(true);

      const { result } = renderHook(() => useShare());

      await act(async () => {
        await result.current.quickShare('draft', { title: 'My Draft' });
      });

      expect(trackShare).toHaveBeenCalledWith('draft', 'quick_share', false);
    });
  });
});
