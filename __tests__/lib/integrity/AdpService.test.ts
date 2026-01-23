/**
 * Tests for lib/integrity/AdpService.ts
 *
 * Tests ADP data caching and expiration
 */

import { AdpService } from '@/lib/integrity/AdpService';
import { Timestamp } from 'firebase/firestore';

// Mock Firebase
jest.mock('@/lib/firebase', () => ({
  db: {},
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  Timestamp: {
    now: jest.fn(() => ({ toMillis: () => Date.now() })),
  },
}));

describe('AdpService', () => {
  let service: AdpService;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    service = new AdpService();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('getCurrentAdp', () => {
    it('should load and cache ADP data', async () => {
      const { getDoc } = require('firebase/firestore');

      (getDoc as jest.Mock).mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          players: [
            { playerId: 'player1', adp: 10 },
            { playerId: 'player2', adp: 20 },
          ],
        }),
      });

      const result = await service.getCurrentAdp();

      expect(result.size).toBe(2);
      expect(result.get('player1')).toBe(10);
      expect(result.get('player2')).toBe(20);
    });

    it('should return cached data within TTL', async () => {
      const { getDoc } = require('firebase/firestore');

      (getDoc as jest.Mock).mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          players: [{ playerId: 'player1', adp: 10 }],
        }),
      });

      // First call - loads from Firestore
      await service.getCurrentAdp();
      expect(getDoc).toHaveBeenCalledTimes(1);

      // Second call - should use cache
      await service.getCurrentAdp();
      expect(getDoc).toHaveBeenCalledTimes(1); // Still 1, not 2
    });

    it('should reload after cache expires', async () => {
      const { getDoc } = require('firebase/firestore');

      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => ({
          players: [{ playerId: 'player1', adp: 10 }],
        }),
      });

      // First call
      await service.getCurrentAdp();
      expect(getDoc).toHaveBeenCalledTimes(1);

      // Advance time past TTL (1 hour)
      jest.advanceTimersByTime(1000 * 60 * 60 + 1000);

      // Second call - should reload
      await service.getCurrentAdp();
      expect(getDoc).toHaveBeenCalledTimes(2);
    });

    it('should clear stale cache even if not expired', async () => {
      const { getDoc } = require('firebase/firestore');

      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => ({
          players: [{ playerId: 'player1', adp: 10 }],
        }),
      });

      // Load cache
      await service.getCurrentAdp();
      expect(getDoc).toHaveBeenCalledTimes(1);

      // Advance time past MAX_CACHE_AGE (2 hours)
      jest.advanceTimersByTime(1000 * 60 * 60 * 2 + 1000);

      // Should reload even if expiry hasn't been checked
      await service.getCurrentAdp();
      expect(getDoc).toHaveBeenCalledTimes(2);
    });

    it('should return empty map if no ADP data exists', async () => {
      const { getDoc } = require('firebase/firestore');

      (getDoc as jest.Mock).mockResolvedValueOnce({
        exists: () => false,
      });

      const result = await service.getCurrentAdp();

      expect(result.size).toBe(0);
    });

    it('should handle Firestore errors gracefully', async () => {
      const { getDoc } = require('firebase/firestore');

      (getDoc as jest.Mock).mockRejectedValueOnce(new Error('Firestore error'));

      const result = await service.getCurrentAdp();

      expect(result.size).toBe(0); // Should return empty map on error
    });
  });

  describe('clearCache', () => {
    it('should clear cache', async () => {
      const { getDoc } = require('firebase/firestore');

      (getDoc as jest.Mock).mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          players: [{ playerId: 'player1', adp: 10 }],
        }),
      });

      // Load cache
      await service.getCurrentAdp();
      expect(getDoc).toHaveBeenCalledTimes(1);

      // Clear cache
      service.clearCache();

      // Next call should reload
      await service.getCurrentAdp();
      expect(getDoc).toHaveBeenCalledTimes(2);
    });
  });

  describe('updateAdpData', () => {
    it('should update ADP data and clear cache', async () => {
      const { setDoc } = require('firebase/firestore');

      const players = [
        { playerId: 'player1', adp: 10, playerName: 'Player 1', position: 'QB', team: 'KC', adpByPosition: 1, lastUpdated: Timestamp.now() },
      ];

      await service.updateAdpData(players);

      expect(setDoc).toHaveBeenCalled();
      const callArgs = (setDoc as jest.Mock).mock.calls[0];
      expect(callArgs[1].playerCount).toBe(1);
    });
  });
});
