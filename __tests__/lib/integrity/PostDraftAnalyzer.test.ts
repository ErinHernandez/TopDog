/**
 * Tests for lib/integrity/PostDraftAnalyzer.ts
 *
 * Tests risk score calculations and draft analysis
 */

import { PostDraftAnalyzer } from '@/lib/integrity/PostDraftAnalyzer';
import { Timestamp } from 'firebase/firestore';
import type { DraftPick, PickLocationRecord } from '@/lib/integrity/types';

// Mock dependencies
jest.mock('@/lib/firebase', () => ({
  db: {},
}));

jest.mock('@/lib/integrity/AdpService', () => ({
  adpService: {
    getCurrentAdp: jest.fn(() =>
      Promise.resolve(
        new Map([
          ['player1', 10],
          ['player2', 20],
          ['player3', 30],
          ['player4', 40],
        ])
      )
    ),
  },
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  getDocs: jest.fn(),
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  Timestamp: {
    now: jest.fn(() => ({ toMillis: () => Date.now() })),
    fromDate: jest.fn((date: Date) => ({ toMillis: () => date.getTime() })),
  },
}));

describe('PostDraftAnalyzer', () => {
  let analyzer: PostDraftAnalyzer;

  beforeEach(() => {
    jest.clearAllMocks();
    analyzer = new PostDraftAnalyzer();
  });

  describe('analyzeDraft', () => {
    it('should handle draft with no flags', async () => {
      const { getDoc, getDocs, setDoc } = require('firebase/firestore');

      // Mock no integrity flags
      (getDoc as jest.Mock).mockResolvedValueOnce({
        exists: () => false,
      });

      // Mock pick locations
      (getDocs as jest.Mock).mockResolvedValueOnce({
        docs: [],
      });

      // Mock draft picks
      (getDocs as jest.Mock).mockResolvedValueOnce({
        docs: [],
      });

      const result = await analyzer.analyzeDraft('draft1');

      expect(result.draftId).toBe('draft1');
      expect(result.pairScores).toHaveLength(0);
      expect(result.maxRiskScore).toBe(0);
    });

    it('should analyze flagged pairs', async () => {
      const { getDoc, getDocs, setDoc } = require('firebase/firestore');

      // Mock integrity flags
      (getDoc as jest.Mock).mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          draftId: 'draft1',
          flaggedPairs: [
            {
              userId1: 'user1',
              userId2: 'user2',
              flagType: 'within50ft',
              eventCount: 3,
            },
          ],
        }),
      });

      // Mock pick locations
      (getDocs as jest.Mock).mockResolvedValueOnce({
        docs: [
          {
            data: () => ({
              userId: 'user1',
              pickNumber: 1,
            }),
          },
          {
            data: () => ({
              userId: 'user2',
              pickNumber: 2,
            }),
          },
        ],
      });

      // Mock draft picks
      (getDocs as jest.Mock).mockResolvedValueOnce({
        docs: [
          {
            data: () => ({
              pickNumber: 1,
              userId: 'user1',
              playerId: 'player1',
              timestamp: Timestamp.now(),
            }),
          },
          {
            data: () => ({
              pickNumber: 2,
              userId: 'user2',
              playerId: 'player2',
              timestamp: Timestamp.now(),
            }),
          },
        ],
      });

      const result = await analyzer.analyzeDraft('draft1');

      expect(result.pairScores.length).toBeGreaterThan(0);
      expect(result.pairScores[0].userId1).toBe('user1');
      expect(result.pairScores[0].userId2).toBe('user2');
      expect(result.pairScores[0].locationScore).toBeGreaterThan(0);
    });
  });

  describe('computeBehaviorScore', () => {
    it('should detect reaching pattern', () => {
      const picks: DraftPick[] = [
        { pickNumber: 5, userId: 'user1', playerId: 'player1', timestamp: Timestamp.now() }, // Reached (ADP 10)
        { pickNumber: 15, userId: 'user2', playerId: 'player2', timestamp: Timestamp.now() }, // Value (ADP 20)
      ];

      const adpData = new Map([
        ['player1', 10],
        ['player2', 20],
      ]);

      // Access private method via reflection (for testing)
      const analyzer = new PostDraftAnalyzer();
      const behaviorScore = (analyzer as any).computeBehaviorScore(
        'user1',
        'user2',
        picks,
        adpData,
        []
      );

      expect(behaviorScore).toBeGreaterThan(0);
    });
  });

  describe('computeBenefitScore', () => {
    it('should detect value transfer', () => {
      const picks: DraftPick[] = [
        { pickNumber: 5, userId: 'user1', playerId: 'player1', timestamp: Timestamp.now() }, // Reached
        { pickNumber: 10, userId: 'user2', playerId: 'player2', timestamp: Timestamp.now() }, // Got value
      ];

      const adpData = new Map([
        ['player1', 10],
        ['player2', 20],
      ]);

      const analyzer = new PostDraftAnalyzer();
      const benefitScore = (analyzer as any).computeBenefitScore(
        'user1',
        'user2',
        picks,
        adpData,
        []
      );

      expect(benefitScore).toBeGreaterThan(0);
    });
  });
});
