/**
 * Tests for Player Service
 *
 * @module __tests__/lib/services/playerService.test
 */

import {
  getAvailablePlayers,
  getTopAvailableByPosition,
  clearPlayerCache,
  getPlayerCacheStats,
} from '../../../lib/services/playerService';

// Mock Firebase
jest.mock('../../../lib/firebase', () => ({
  db: {},
}));

// Mock Firestore
const mockGetDocs = jest.fn();
const mockQuery = jest.fn();
const mockCollection = jest.fn();
const mockOrderBy = jest.fn();
const mockLimit = jest.fn();
const mockWhere = jest.fn();

jest.mock('firebase/firestore', () => ({
  collection: (...args: unknown[]) => mockCollection(...args),
  query: (...args: unknown[]) => mockQuery(...args),
  getDocs: (...args: unknown[]) => mockGetDocs(...args),
  where: (...args: unknown[]) => mockWhere(...args),
  orderBy: (...args: unknown[]) => mockOrderBy(...args),
  limit: (...args: unknown[]) => mockLimit(...args),
}));

// Mock retry utils
jest.mock('../../../lib/firebase/retryUtils', () => ({
  withFullProtection: jest.fn((key: string, fn: () => Promise<unknown>) => fn()),
}));

// Mock query optimization
jest.mock('../../../lib/firebase/queryOptimization', () => ({
  buildOptimizedQuery: jest.fn((q: unknown) => q),
  generateCacheKey: jest.fn(
    (collection: string, filters: Record<string, unknown>) =>
      `${collection}:${JSON.stringify(filters)}`
  ),
}));

// Mock logger
jest.mock('../../../lib/structuredLogger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('PlayerService', () => {
  beforeEach(() => {
    clearPlayerCache();
    jest.clearAllMocks();
  });

  describe('getAvailablePlayers', () => {
    it('should return players from Firestore', async () => {
      const mockPlayers = [
        {
          id: 'p1',
          data: () => ({
            name: 'Patrick Mahomes',
            position: 'QB',
            team: 'KC',
            adp: 1.5,
          }),
        },
        {
          id: 'p2',
          data: () => ({
            name: 'Josh Allen',
            position: 'QB',
            team: 'BUF',
            adp: 2.1,
          }),
        },
      ];

      mockGetDocs.mockResolvedValue({ docs: mockPlayers });

      const result = await getAvailablePlayers({ limit: 10 });

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Patrick Mahomes');
      expect(result[0].position).toBe('QB');
      expect(result[1].name).toBe('Josh Allen');
    });

    it('should apply limit to query', async () => {
      mockGetDocs.mockResolvedValue({ docs: [] });

      await getAvailablePlayers({ limit: 100 });

      expect(mockLimit).toHaveBeenCalledWith(100);
    });

    it('should cap limit at MAX_PLAYER_LIMIT (500)', async () => {
      mockGetDocs.mockResolvedValue({ docs: [] });

      await getAvailablePlayers({ limit: 1000 });

      expect(mockLimit).toHaveBeenCalledWith(500);
    });

    it('should use default limit when not specified', async () => {
      mockGetDocs.mockResolvedValue({ docs: [] });

      await getAvailablePlayers();

      expect(mockLimit).toHaveBeenCalledWith(200);
    });

    it('should cache results on subsequent calls', async () => {
      const mockPlayers = [
        {
          id: 'p1',
          data: () => ({
            name: 'Player 1',
            position: 'QB',
            team: 'KC',
            adp: 1,
          }),
        },
      ];

      mockGetDocs.mockResolvedValue({ docs: mockPlayers });

      // First call - should hit Firestore
      await getAvailablePlayers({ limit: 10 });
      expect(mockGetDocs).toHaveBeenCalledTimes(1);

      // Second call - should use cache
      await getAvailablePlayers({ limit: 10 });
      expect(mockGetDocs).toHaveBeenCalledTimes(1);
    });

    it('should exclude drafted players', async () => {
      const mockPlayers = [
        {
          id: 'p1',
          data: () => ({
            name: 'Player 1',
            position: 'QB',
            team: 'KC',
            adp: 1,
          }),
        },
        {
          id: 'p2',
          data: () => ({
            name: 'Player 2',
            position: 'RB',
            team: 'SF',
            adp: 2,
          }),
        },
      ];

      mockGetDocs.mockResolvedValue({ docs: mockPlayers });

      const result = await getAvailablePlayers({
        excludeIds: new Set(['p1']),
      });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('p2');
    });

    it('should filter by position when specified', async () => {
      mockGetDocs.mockResolvedValue({ docs: [] });

      await getAvailablePlayers({ positions: ['QB', 'RB'] });

      expect(mockWhere).toHaveBeenCalledWith('position', 'in', ['QB', 'RB']);
    });

    it('should handle displayName fallback', async () => {
      const mockPlayers = [
        {
          id: 'p1',
          data: () => ({
            displayName: 'Display Name',
            position: 'QB',
            team: 'KC',
            adp: 1,
          }),
        },
      ];

      mockGetDocs.mockResolvedValue({ docs: mockPlayers });

      const result = await getAvailablePlayers();

      expect(result[0].name).toBe('Display Name');
    });

    it('should handle nflTeam fallback', async () => {
      const mockPlayers = [
        {
          id: 'p1',
          data: () => ({
            name: 'Player',
            position: 'QB',
            nflTeam: 'NYG',
            adp: 1,
          }),
        },
      ];

      mockGetDocs.mockResolvedValue({ docs: mockPlayers });

      const result = await getAvailablePlayers();

      expect(result[0].team).toBe('NYG');
    });

    it('should handle averageDraftPosition fallback', async () => {
      const mockPlayers = [
        {
          id: 'p1',
          data: () => ({
            name: 'Player',
            position: 'QB',
            team: 'KC',
            averageDraftPosition: 5.5,
          }),
        },
      ];

      mockGetDocs.mockResolvedValue({ docs: mockPlayers });

      const result = await getAvailablePlayers();

      expect(result[0].adp).toBe(5.5);
    });
  });

  describe('getTopAvailableByPosition', () => {
    it('should return top N players per position', async () => {
      const mockPlayers = [
        { id: 'qb1', data: () => ({ name: 'QB1', position: 'QB', team: 'KC', adp: 1 }) },
        { id: 'qb2', data: () => ({ name: 'QB2', position: 'QB', team: 'BUF', adp: 2 }) },
        { id: 'rb1', data: () => ({ name: 'RB1', position: 'RB', team: 'SF', adp: 3 }) },
        { id: 'rb2', data: () => ({ name: 'RB2', position: 'RB', team: 'MIN', adp: 4 }) },
        { id: 'wr1', data: () => ({ name: 'WR1', position: 'WR', team: 'MIA', adp: 5 }) },
        { id: 'te1', data: () => ({ name: 'TE1', position: 'TE', team: 'KC', adp: 6 }) },
      ];

      mockGetDocs.mockResolvedValue({ docs: mockPlayers });

      const result = await getTopAvailableByPosition(new Set(), 1);

      expect(result.QB).toHaveLength(1);
      expect(result.QB[0].name).toBe('QB1');
      expect(result.RB).toHaveLength(1);
      expect(result.RB[0].name).toBe('RB1');
      expect(result.WR).toHaveLength(1);
      expect(result.TE).toHaveLength(1);
    });

    it('should respect excludeIds', async () => {
      const mockPlayers = [
        { id: 'qb1', data: () => ({ name: 'QB1', position: 'QB', team: 'KC', adp: 1 }) },
        { id: 'qb2', data: () => ({ name: 'QB2', position: 'QB', team: 'BUF', adp: 2 }) },
      ];

      mockGetDocs.mockResolvedValue({ docs: mockPlayers });

      const result = await getTopAvailableByPosition(new Set(['qb1']), 5);

      expect(result.QB).toHaveLength(1);
      expect(result.QB[0].id).toBe('qb2');
    });
  });

  describe('clearPlayerCache', () => {
    it('should clear the cache', async () => {
      const mockPlayers = [
        { id: 'p1', data: () => ({ name: 'Player', position: 'QB', team: 'KC', adp: 1 }) },
      ];

      mockGetDocs.mockResolvedValue({ docs: mockPlayers });

      // First call
      await getAvailablePlayers();
      expect(mockGetDocs).toHaveBeenCalledTimes(1);

      // Clear cache
      clearPlayerCache();

      // Next call should hit Firestore again
      await getAvailablePlayers();
      expect(mockGetDocs).toHaveBeenCalledTimes(2);
    });
  });

  describe('getPlayerCacheStats', () => {
    it('should return cache statistics', async () => {
      const stats = getPlayerCacheStats();

      expect(stats).toHaveProperty('size');
      expect(stats).toHaveProperty('keys');
      expect(Array.isArray(stats.keys)).toBe(true);
    });

    it('should reflect cache entries', async () => {
      const mockPlayers = [
        { id: 'p1', data: () => ({ name: 'Player', position: 'QB', team: 'KC', adp: 1 }) },
      ];

      mockGetDocs.mockResolvedValue({ docs: mockPlayers });

      await getAvailablePlayers({ limit: 10 });

      const stats = getPlayerCacheStats();
      expect(stats.size).toBeGreaterThan(0);
    });
  });
});
