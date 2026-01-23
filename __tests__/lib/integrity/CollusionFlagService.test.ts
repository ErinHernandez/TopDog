/**
 * Tests for lib/integrity/CollusionFlagService.ts
 *
 * Tests flag recording, retry logic, and transaction handling
 */

import { CollusionFlagService } from '@/lib/integrity/CollusionFlagService';
import { Timestamp } from 'firebase/firestore';

// Mock Firebase
jest.mock('@/lib/firebase', () => ({
  db: {},
}));

jest.mock('firebase/firestore', () => {
  let transactionAttempts = 0;
  const mockTransaction = jest.fn(async (callback: any) => {
    transactionAttempts++;
    // Simulate conflict on first attempt
    if (transactionAttempts === 1) {
      const error: any = new Error('Transaction conflict');
      error.code = 'failed-precondition';
      throw error;
    }
    // Success on retry
    return callback({
      get: jest.fn(() => ({
        exists: () => false,
        data: () => null,
      })),
      set: jest.fn(),
    });
  });

  return {
    doc: jest.fn(),
    getDoc: jest.fn(),
    setDoc: jest.fn(),
    updateDoc: jest.fn(),
    Timestamp: {
      now: jest.fn(() => Timestamp.fromDate(new Date())),
      fromDate: jest.fn((date: Date) => ({ toMillis: () => date.getTime() })),
    },
    serverTimestamp: jest.fn(),
    runTransaction: mockTransaction,
  };
});

describe('CollusionFlagService', () => {
  let service: CollusionFlagService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new CollusionFlagService();
  });

  describe('recordProximityFlag', () => {
    it('should return early if no flags to record', async () => {
      await service.recordProximityFlag({
        draftId: 'draft1',
        pickNumber: 1,
        triggeringUserId: 'user1',
        within50ft: [],
        sameIp: [],
      });

      // Should not call runTransaction
      const { runTransaction } = require('firebase/firestore');
      expect(runTransaction).not.toHaveBeenCalled();
    });

    it('should record within50ft flag', async () => {
      const { runTransaction } = require('firebase/firestore');
      // Reset attempt counter
      (runTransaction as any).mockClear();
      (runTransaction as any).mockImplementationOnce(async (callback: any) => {
        return callback({
          get: jest.fn(() => ({
            exists: () => false,
            data: () => null,
          })),
          set: jest.fn(),
        });
      });

      await service.recordProximityFlag({
        draftId: 'draft1',
        pickNumber: 1,
        triggeringUserId: 'user1',
        within50ft: ['user2'],
        sameIp: [],
      });

      expect(runTransaction).toHaveBeenCalled();
    });

    it('should record sameIp flag', async () => {
      const { runTransaction } = require('firebase/firestore');
      (runTransaction as any).mockImplementationOnce(async (callback: any) => {
        return callback({
          get: jest.fn(() => ({
            exists: () => false,
            data: () => null,
          })),
          set: jest.fn(),
        });
      });

      await service.recordProximityFlag({
        draftId: 'draft1',
        pickNumber: 1,
        triggeringUserId: 'user1',
        within50ft: [],
        sameIp: ['user2'],
      });

      expect(runTransaction).toHaveBeenCalled();
    });

    it('should retry on transaction conflict', async () => {
      const { runTransaction } = require('firebase/firestore');
      let attemptCount = 0;

      (runTransaction as any).mockImplementation(async (callback: any) => {
        attemptCount++;
        if (attemptCount === 1) {
          const error: any = new Error('Transaction conflict');
          error.code = 'failed-precondition';
          throw error;
        }
        return callback({
          get: jest.fn(() => ({
            exists: () => false,
            data: () => null,
          })),
          set: jest.fn(),
        });
      });

      await service.recordProximityFlag({
        draftId: 'draft1',
        pickNumber: 1,
        triggeringUserId: 'user1',
        within50ft: ['user2'],
        sameIp: [],
      });

      expect(attemptCount).toBe(2); // Should retry once
    });

    it('should throw after max retries', async () => {
      const { runTransaction } = require('firebase/firestore');

      (runTransaction as any).mockImplementation(async () => {
        const error: any = new Error('Transaction conflict');
        error.code = 'failed-precondition';
        throw error;
      });

      await expect(
        service.recordProximityFlag({
          draftId: 'draft1',
          pickNumber: 1,
          triggeringUserId: 'user1',
          within50ft: ['user2'],
          sameIp: [],
        })
      ).rejects.toThrow();
    });

    it('should handle both within50ft and sameIp flags', async () => {
      const { runTransaction } = require('firebase/firestore');
      let setCall: any;

      (runTransaction as any).mockImplementationOnce(async (callback: any) => {
        return callback({
          get: jest.fn(() => ({
            exists: () => false,
            data: () => null,
          })),
          set: jest.fn((ref, data) => {
            setCall = data;
          }),
        });
      });

      await service.recordProximityFlag({
        draftId: 'draft1',
        pickNumber: 1,
        triggeringUserId: 'user1',
        within50ft: ['user2'],
        sameIp: ['user2'],
      });

      expect(setCall).toBeDefined();
      expect(setCall.flaggedPairs).toHaveLength(1);
      expect(setCall.flaggedPairs[0].flagType).toBe('both');
    });
  });

  describe('getDraftFlags', () => {
    it('should return null for non-existent draft', async () => {
      const { getDoc } = require('firebase/firestore');
      (getDoc as jest.Mock).mockResolvedValueOnce({
        exists: () => false,
      });

      const result = await service.getDraftFlags('draft1');
      expect(result).toBeNull();
    });

    it('should return flags for existing draft', async () => {
      const { getDoc } = require('firebase/firestore');
      const mockFlags = {
        draftId: 'draft1',
        flaggedPairs: [],
        totalWithin50ftEvents: 0,
        totalSameIpEvents: 0,
        uniqueUserPairsFlagged: 0,
        status: 'active',
      };

      (getDoc as jest.Mock).mockResolvedValueOnce({
        exists: () => true,
        data: () => mockFlags,
      });

      const result = await service.getDraftFlags('draft1');
      expect(result).toEqual(mockFlags);
    });
  });
});
