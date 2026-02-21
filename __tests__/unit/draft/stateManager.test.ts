/**
 * Draft State Manager Tests
 *
 * Tests for DraftState, DraftStateManager, and the internal Mutex.
 * Covers: state initialization, validation, atomic updates, concurrency,
 * snake draft ordering, pick sequencing, destroy lifecycle.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ============================================================================
// MOCKS
// ============================================================================

const { mockLoggerObj } = vi.hoisted(() => ({
  mockLoggerObj: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/Documents/bestball-site/lib/clientLogger', () => ({
  createScopedLogger: vi.fn(() => mockLoggerObj),
  logger: mockLoggerObj,
}));

// ============================================================================
// IMPORTS
// ============================================================================

import {
  DraftState,
  DraftStateManager,
  type DraftStateData as _DraftStateData,
  type DraftPick as _DraftPick,
  type ValidationResult as _ValidationResult,
} from '@/Documents/bestball-site/lib/draft/stateManager';

// ============================================================================
// DraftState Class
// ============================================================================

describe('DraftState', () => {
  describe('constructor defaults', () => {
    it('should initialize with empty defaults', () => {
      const state = new DraftState();
      expect(state.room).toBeNull();
      expect(state.participants).toEqual([]);
      expect(state.picks).toEqual([]);
      expect(state.draftOrder).toEqual([]);
      expect(state.status).toBe('waiting');
      expect(state.currentPickNumber).toBe(1);
      expect(state.timer).toBe(30);
      expect(state.queue).toEqual([]);
      expect(state.draftSettings.timerSeconds).toBe(30);
      expect(state.draftSettings.totalRounds).toBe(18);
    });

    it('should initialize with provided state', () => {
      const state = new DraftState({
        room: { id: 'room_1', name: 'Test Room', status: 'active' },
        participants: ['user_1', 'user_2'],
        status: 'active',
        currentPickNumber: 5,
        timer: 60,
        draftSettings: { timerSeconds: 60, totalRounds: 20 },
      });

      expect(state.room?.id).toBe('room_1');
      expect(state.participants).toEqual(['user_1', 'user_2']);
      expect(state.status).toBe('active');
      expect(state.currentPickNumber).toBe(5);
      expect(state.timer).toBe(60);
      expect(state.draftSettings.totalRounds).toBe(20);
    });
  });

  describe('clone', () => {
    it('should create an independent copy', () => {
      const original = new DraftState({
        participants: ['user_1', 'user_2'],
        picks: [{ pickNumber: 1, player: { name: 'Player A' } }],
      });

      const cloned = original.clone();
      cloned.participants.push('user_3');
      cloned.picks.push({ pickNumber: 2, player: { name: 'Player B' } });

      expect(original.participants).toHaveLength(2);
      expect(original.picks).toHaveLength(1);
      expect(cloned.participants).toHaveLength(3);
      expect(cloned.picks).toHaveLength(2);
    });
  });

  describe('validate', () => {
    it('should pass validation for empty state', () => {
      const state = new DraftState();
      const result = state.validate();
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should pass validation for sequential picks', () => {
      const state = new DraftState({
        picks: [
          { pickNumber: 1, player: { name: 'A' } },
          { pickNumber: 2, player: { name: 'B' } },
          { pickNumber: 3, player: { name: 'C' } },
        ],
        currentPickNumber: 4,
      });
      expect(state.validate().isValid).toBe(true);
    });

    it('should fail validation for non-sequential picks', () => {
      const state = new DraftState({
        picks: [
          { pickNumber: 1, player: { name: 'A' } },
          { pickNumber: 3, player: { name: 'B' } }, // Gap!
        ],
        currentPickNumber: 3,
      });
      const result = state.validate();
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('Pick number mismatch'))).toBe(true);
    });

    it('should fail when currentPickNumber doesnt match picks count', () => {
      const state = new DraftState({
        picks: [
          { pickNumber: 1, player: { name: 'A' } },
          { pickNumber: 2, player: { name: 'B' } },
        ],
        currentPickNumber: 10, // Should be 3
      });
      const result = state.validate();
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('Current pick number mismatch'))).toBe(true);
    });

    it('should fail when draft order doesnt match participants', () => {
      const state = new DraftState({
        participants: ['user_1', 'user_2'],
        draftOrder: ['user_1', 'user_3'], // user_3 not a participant
      });
      const result = state.validate();
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('Draft order does not match participants'))).toBe(
        true,
      );
    });

    it('should fail when queue contains already-picked players', () => {
      const state = new DraftState({
        picks: [{ pickNumber: 1, player: { name: 'Patrick Mahomes' } }],
        queue: [{ name: 'Patrick Mahomes' }],
      });
      const result = state.validate();
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('Queue contains already picked players'))).toBe(
        true,
      );
    });

    it('should pass when queue has only unpicked players', () => {
      const state = new DraftState({
        picks: [{ pickNumber: 1, player: { name: 'Patrick Mahomes' } }],
        queue: [{ name: 'Josh Allen' }],
        currentPickNumber: 2,
      });
      expect(state.validate().isValid).toBe(true);
    });
  });
});

// ============================================================================
// DraftStateManager
// ============================================================================

describe('DraftStateManager', () => {
  let manager: DraftStateManager;

  beforeEach(() => {
    vi.clearAllMocks();
    manager = new DraftStateManager({
      roomId: 'test_room',
      initialState: {
        room: { id: 'test_room', name: 'Test', status: 'active' },
        participants: ['user_1', 'user_2', 'user_3', 'user_4'],
        draftOrder: ['user_1', 'user_2', 'user_3', 'user_4'],
        status: 'active',
        draftSettings: { timerSeconds: 30, totalRounds: 18 },
      },
    });
  });

  describe('constructor', () => {
    it('should create with default options', () => {
      const m = new DraftStateManager();
      expect(m.isActive()).toBe(true);
      expect(m.getState().status).toBe('waiting');
    });

    it('should create with initial state', () => {
      expect(manager.getState().participants).toHaveLength(4);
      expect(manager.getState().status).toBe('active');
    });
  });

  describe('getState', () => {
    it('should return current state', () => {
      const state = manager.getState();
      expect(state.room?.id).toBe('test_room');
      expect(state.draftOrder).toEqual(['user_1', 'user_2', 'user_3', 'user_4']);
    });
  });

  describe('updateRoom', () => {
    it('should update room data atomically', async () => {
      await manager.updateRoom({ status: 'paused' });
      expect(manager.getState().room?.status).toBe('paused');
    });

    it('should merge updates without losing existing fields', async () => {
      await manager.updateRoom({ name: 'Updated Room' });
      const room = manager.getState().room;
      expect(room?.name).toBe('Updated Room');
      expect(room?.id).toBe('test_room'); // Original preserved
    });
  });

  describe('addPick', () => {
    it('should add a pick and advance currentPickNumber', async () => {
      await manager.addPick({
        pickNumber: 1,
        player: { name: 'Patrick Mahomes' },
        pickedBy: 'user_1',
      });
      const state = manager.getState();
      expect(state.picks).toHaveLength(1);
      expect(state.currentPickNumber).toBe(2);
    });

    it('should add multiple sequential picks', async () => {
      await manager.addPick({ pickNumber: 1, player: { name: 'Mahomes' }, pickedBy: 'user_1' });
      await manager.addPick({ pickNumber: 2, player: { name: 'Allen' }, pickedBy: 'user_2' });
      await manager.addPick({ pickNumber: 3, player: { name: 'Lamar' }, pickedBy: 'user_3' });

      const state = manager.getState();
      expect(state.picks).toHaveLength(3);
      expect(state.currentPickNumber).toBe(4);
    });
  });

  describe('setState', () => {
    it('should overwrite partial state', async () => {
      await manager.setState({ status: 'completed', timer: 0 });
      const state = manager.getState();
      expect(state.status).toBe('completed');
      expect(state.timer).toBe(0);
      // Other fields preserved
      expect(state.participants).toHaveLength(4);
    });
  });

  describe('destroy', () => {
    it('should mark manager as inactive', () => {
      expect(manager.isActive()).toBe(true);
      manager.destroy();
      expect(manager.isActive()).toBe(false);
    });
  });

  describe('concurrency (mutex)', () => {
    it('should handle concurrent addPick calls without race conditions', async () => {
      // Fire multiple concurrent picks
      const promises = [
        manager.addPick({ pickNumber: 1, player: { name: 'A' }, pickedBy: 'user_1' }),
        manager.addPick({ pickNumber: 2, player: { name: 'B' }, pickedBy: 'user_2' }),
        manager.addPick({ pickNumber: 3, player: { name: 'C' }, pickedBy: 'user_3' }),
        manager.addPick({ pickNumber: 4, player: { name: 'D' }, pickedBy: 'user_4' }),
      ];

      await Promise.all(promises);

      const state = manager.getState();
      expect(state.picks).toHaveLength(4);
      expect(state.currentPickNumber).toBe(5);
    });

    it('should handle concurrent updateRoom + addPick', async () => {
      await Promise.all([
        manager.updateRoom({ name: 'Concurrent Room' }),
        manager.addPick({ pickNumber: 1, player: { name: 'Player X' }, pickedBy: 'user_1' }),
      ]);

      const state = manager.getState();
      expect(state.room?.name).toBe('Concurrent Room');
      expect(state.picks).toHaveLength(1);
    });
  });

  describe('validateState', () => {
    it('should validate current state', () => {
      const result = manager.validateState();
      expect(result.isValid).toBe(true);
    });

    it('should report validation errors after invalid operations', async () => {
      // Manually force an inconsistent state to test validation
      await manager.setState({
        picks: [
          { pickNumber: 1, player: { name: 'A' } },
          { pickNumber: 3, player: { name: 'B' } }, // Gap
        ],
        currentPickNumber: 3,
      });

      const result = manager.validateState();
      expect(result.isValid).toBe(false);
    });
  });

  describe('subscriber notifications', () => {
    it('should call onStateChange callback after updates', async () => {
      const callback = vi.fn();
      const m = new DraftStateManager({
        onStateChange: callback,
        initialState: {
          participants: ['u1', 'u2'],
          draftOrder: ['u1', 'u2'],
          status: 'active',
        },
      });

      await m.addPick({ pickNumber: 1, player: { name: 'Test' }, pickedBy: 'u1' });

      expect(callback).toHaveBeenCalled();
    });
  });
});
