/**
 * Tests for Draft Picks Service
 *
 * @module __tests__/lib/services/draftPicksService.test
 */

import {
  getDraftPicks,
  getDraftedPlayerIds,
  batchGetUserPicks,
  countPositionsForParticipant,
} from '../../../lib/services/draftPicksService';

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

// Mock logger
jest.mock('../../../lib/structuredLogger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

describe('DraftPicksService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getDraftPicks', () => {
    it('should return picks from Firestore', async () => {
      const mockPicks = [
        {
          id: 'pick1',
          data: () => ({
            pickNumber: 1,
            round: 1,
            pickInRound: 1,
            playerId: 'p1',
            playerName: 'Player 1',
            playerPosition: 'QB',
            playerTeam: 'KC',
            participantId: 'user1',
            participantIndex: 0,
            timestamp: { toMillis: () => 1000 },
          }),
        },
        {
          id: 'pick2',
          data: () => ({
            pickNumber: 13,
            round: 2,
            pickInRound: 1,
            playerId: 'p2',
            playerName: 'Player 2',
            playerPosition: 'RB',
            playerTeam: 'SF',
            participantId: 'user1',
            participantIndex: 0,
            timestamp: { toMillis: () => 2000 },
          }),
        },
      ];

      mockGetDocs.mockResolvedValue({ docs: mockPicks });

      const result = await getDraftPicks('room123');

      expect(result).toHaveLength(2);
      expect(result[0].pickNumber).toBe(1);
      expect(result[0].playerName).toBe('Player 1');
      expect(result[1].pickNumber).toBe(13);
    });

    it('should apply limit to prevent unbounded queries', async () => {
      mockGetDocs.mockResolvedValue({ docs: [] });

      await getDraftPicks('room123');

      expect(mockLimit).toHaveBeenCalledWith(500);
    });

    it('should respect custom limit', async () => {
      mockGetDocs.mockResolvedValue({ docs: [] });

      await getDraftPicks('room123', { limit: 100 });

      expect(mockLimit).toHaveBeenCalledWith(100);
    });

    it('should filter by participant when provided', async () => {
      mockGetDocs.mockResolvedValue({ docs: [] });

      await getDraftPicks('room123', { participantId: 'user1' });

      expect(mockWhere).toHaveBeenCalledWith('participantId', '==', 'user1');
    });

    it('should order by pickNumber ascending', async () => {
      mockGetDocs.mockResolvedValue({ docs: [] });

      await getDraftPicks('room123');

      expect(mockOrderBy).toHaveBeenCalledWith('pickNumber', 'asc');
    });

    it('should handle missing timestamp gracefully', async () => {
      const mockPicks = [
        {
          id: 'pick1',
          data: () => ({
            pickNumber: 1,
            round: 1,
            pickInRound: 1,
            playerId: 'p1',
            playerName: 'Player 1',
            playerPosition: 'QB',
            playerTeam: 'KC',
            participantId: 'user1',
            participantIndex: 0,
            // No timestamp
          }),
        },
      ];

      mockGetDocs.mockResolvedValue({ docs: mockPicks });

      const result = await getDraftPicks('room123');

      expect(result[0].timestamp).toBeDefined();
      expect(typeof result[0].timestamp).toBe('number');
    });

    it('should handle Unknown player name', async () => {
      const mockPicks = [
        {
          id: 'pick1',
          data: () => ({
            pickNumber: 1,
            round: 1,
            pickInRound: 1,
            playerId: 'p1',
            // No playerName
            playerPosition: 'QB',
            playerTeam: 'KC',
            participantId: 'user1',
            participantIndex: 0,
          }),
        },
      ];

      mockGetDocs.mockResolvedValue({ docs: mockPicks });

      const result = await getDraftPicks('room123');

      expect(result[0].playerName).toBe('Unknown');
    });
  });

  describe('getDraftedPlayerIds', () => {
    it('should return set of drafted player IDs', async () => {
      const mockPicks = [
        {
          id: 'pick1',
          data: () => ({
            playerId: 'p1',
            pickNumber: 1,
            round: 1,
            pickInRound: 1,
            playerName: 'Player 1',
            playerPosition: 'QB',
            participantId: 'user1',
            participantIndex: 0,
          }),
        },
        {
          id: 'pick2',
          data: () => ({
            playerId: 'p2',
            pickNumber: 2,
            round: 1,
            pickInRound: 2,
            playerName: 'Player 2',
            playerPosition: 'RB',
            participantId: 'user2',
            participantIndex: 1,
          }),
        },
      ];

      mockGetDocs.mockResolvedValue({ docs: mockPicks });

      const result = await getDraftedPlayerIds('room123');

      expect(result).toBeInstanceOf(Set);
      expect(result.has('p1')).toBe(true);
      expect(result.has('p2')).toBe(true);
      expect(result.has('p3')).toBe(false);
    });
  });

  describe('batchGetUserPicks', () => {
    it('should batch process multiple rooms', async () => {
      mockGetDocs.mockResolvedValue({ docs: [] });

      const roomIds = ['room1', 'room2', 'room3'];
      const participantIdMap = new Map([
        ['room1', 'user1'],
        ['room2', 'user1'],
        ['room3', 'user1'],
      ]);

      const result = await batchGetUserPicks(roomIds, participantIdMap);

      expect(result).toBeInstanceOf(Map);
      expect(result.size).toBe(3);
    });

    it('should handle rooms without participant mapping', async () => {
      mockGetDocs.mockResolvedValue({ docs: [] });

      const roomIds = ['room1', 'room2'];
      const participantIdMap = new Map([
        ['room1', 'user1'],
        // room2 not in map
      ]);

      const result = await batchGetUserPicks(roomIds, participantIdMap);

      expect(result.get('room1')).toEqual([]);
      expect(result.get('room2')).toEqual([]);
    });

    it('should handle errors for individual rooms gracefully', async () => {
      let callCount = 0;
      mockGetDocs.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.reject(new Error('Firestore error'));
        }
        return Promise.resolve({ docs: [] });
      });

      const roomIds = ['room1', 'room2'];
      const participantIdMap = new Map([
        ['room1', 'user1'],
        ['room2', 'user1'],
      ]);

      // Should not throw
      const result = await batchGetUserPicks(roomIds, participantIdMap);

      expect(result.size).toBe(2);
      expect(result.get('room1')).toEqual([]);
      expect(result.get('room2')).toEqual([]);
    });

    it('should process in batches of 5', async () => {
      mockGetDocs.mockResolvedValue({ docs: [] });

      const roomIds = Array.from({ length: 12 }, (_, i) => `room${i}`);
      const participantIdMap = new Map(roomIds.map((id) => [id, `user${id}`]));

      await batchGetUserPicks(roomIds, participantIdMap);

      // 12 rooms / 5 batch size = 3 batches (5 + 5 + 2)
      // Each room with participantId makes 1 query
      expect(mockGetDocs).toHaveBeenCalledTimes(12);
    });
  });

  describe('countPositionsForParticipant', () => {
    it('should count positions for a participant', () => {
      const picks = [
        { participantIndex: 0, playerPosition: 'QB' },
        { participantIndex: 0, playerPosition: 'RB' },
        { participantIndex: 0, playerPosition: 'RB' },
        { participantIndex: 0, playerPosition: 'WR' },
        { participantIndex: 1, playerPosition: 'QB' }, // Different participant
      ] as Parameters<typeof countPositionsForParticipant>[0];

      const result = countPositionsForParticipant(picks, 0);

      expect(result.QB).toBe(1);
      expect(result.RB).toBe(2);
      expect(result.WR).toBe(1);
      expect(result.TE).toBe(0);
    });

    it('should return zeros for participant with no picks', () => {
      const picks = [
        { participantIndex: 0, playerPosition: 'QB' },
      ] as Parameters<typeof countPositionsForParticipant>[0];

      const result = countPositionsForParticipant(picks, 5);

      expect(result.QB).toBe(0);
      expect(result.RB).toBe(0);
      expect(result.WR).toBe(0);
      expect(result.TE).toBe(0);
    });

    it('should handle empty picks array', () => {
      const result = countPositionsForParticipant([], 0);

      expect(result.QB).toBe(0);
      expect(result.RB).toBe(0);
      expect(result.WR).toBe(0);
      expect(result.TE).toBe(0);
    });
  });
});
