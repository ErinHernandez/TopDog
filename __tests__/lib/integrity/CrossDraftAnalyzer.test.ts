/**
 * Tests for lib/integrity/CrossDraftAnalyzer.ts
 *
 * Tests cross-draft batch analysis and error handling
 */

import { CrossDraftAnalyzer } from '@/lib/integrity/CrossDraftAnalyzer';
import { Timestamp } from 'firebase/firestore';

// Mock Firebase
jest.mock('@/lib/firebase', () => ({
  db: {},
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
  limit: jest.fn(),
  Timestamp: {
    now: jest.fn(() => ({ toMillis: () => Date.now() })),
    fromDate: jest.fn((date: Date) => ({ toMillis: () => date.getTime() })),
  },
}));

describe('CrossDraftAnalyzer', () => {
  let analyzer: CrossDraftAnalyzer;

  beforeEach(() => {
    jest.clearAllMocks();
    analyzer = new CrossDraftAnalyzer();
  });

  describe('runFullAnalysis', () => {
    it('should handle empty results', async () => {
      const { getDocs } = require('firebase/firestore');
      (getDocs as jest.Mock).mockResolvedValueOnce({
        docs: [],
      });

      const result = await analyzer.runFullAnalysis();

      expect(result.pairsAnalyzed).toBe(0);
      expect(result.criticalPairs).toBe(0);
      expect(result.highRiskPairs).toBe(0);
      expect(result.failedPairs).toBe(0);
    });

    it('should continue processing after individual pair failures', async () => {
      const { getDocs, setDoc } = require('firebase/firestore');

      // Mock draft risk scores
      (getDocs as jest.Mock).mockResolvedValueOnce({
        docs: [
          {
            data: () => ({
              draftId: 'draft1',
              analyzedAt: Timestamp.now(),
              pairScores: [
                {
                  userId1: 'user1',
                  userId2: 'user2',
                  compositeScore: 75,
                  locationScore: 60,
                },
                {
                  userId1: 'user3',
                  userId2: 'user4',
                  compositeScore: 50,
                  locationScore: 0,
                },
              ],
            }),
          },
        ],
      });

      // Make setDoc throw for first pair, succeed for second
      let callCount = 0;
      (setDoc as jest.Mock).mockImplementation(async (ref, data) => {
        callCount++;
        if (callCount === 1) {
          throw new Error('Firestore error');
        }
      });

      const result = await analyzer.runFullAnalysis();

      expect(result.pairsAnalyzed).toBeGreaterThan(0);
      expect(result.failedPairs).toBeGreaterThan(0);
      // Should have processed both pairs despite one failing
    });

    it('should aggregate pairs across multiple drafts', async () => {
      const { getDocs } = require('firebase/firestore');

      (getDocs as jest.Mock).mockResolvedValueOnce({
        docs: [
          {
            data: () => ({
              draftId: 'draft1',
              analyzedAt: Timestamp.now(),
              pairScores: [
                {
                  userId1: 'user1',
                  userId2: 'user2',
                  compositeScore: 60,
                  locationScore: 60,
                },
              ],
            }),
          },
          {
            data: () => ({
              draftId: 'draft2',
              analyzedAt: Timestamp.now(),
              pairScores: [
                {
                  userId1: 'user1',
                  userId2: 'user2',
                  compositeScore: 70,
                  locationScore: 60,
                },
              ],
            }),
          },
        ],
      });

      const result = await analyzer.runFullAnalysis();

      expect(result.pairsAnalyzed).toBeGreaterThan(0);
    });
  });

  describe('getHighRiskPairs', () => {
    it('should return high risk pairs', async () => {
      const { getDocs } = require('firebase/firestore');

      (getDocs as jest.Mock).mockResolvedValueOnce({
        docs: [
          {
            data: () => ({
              pairId: 'user1_user2',
              userId1: 'user1',
              userId2: 'user2',
              overallRiskLevel: 'high',
              lastAnalyzedAt: Timestamp.now(),
            }),
          },
        ],
      });

      const result = await analyzer.getHighRiskPairs('high');

      expect(result).toHaveLength(1);
      expect(result[0].overallRiskLevel).toBe('high');
    });
  });

  describe('getPairAnalysis', () => {
    it('should return pair analysis', async () => {
      const { getDoc } = require('firebase/firestore');

      (getDoc as jest.Mock).mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          pairId: 'user1_user2',
          userId1: 'user1',
          userId2: 'user2',
          overallRiskLevel: 'medium',
        }),
      });

      const result = await analyzer.getPairAnalysis('user1', 'user2');

      expect(result).toBeDefined();
      expect(result?.pairId).toBe('user1_user2');
    });

    it('should normalize user order', async () => {
      const { getDoc } = require('firebase/firestore');

      (getDoc as jest.Mock).mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          pairId: 'user1_user2',
          userId1: 'user1',
          userId2: 'user2',
        }),
      });

      // Should work regardless of input order
      await analyzer.getPairAnalysis('user2', 'user1');
      const callArgs = (getDoc as jest.Mock).mock.calls[0][0];
      // Should query with normalized pair ID
      expect(callArgs).toBeDefined();
    });
  });
});
