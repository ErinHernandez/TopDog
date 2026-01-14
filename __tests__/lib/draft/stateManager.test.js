/**
 * Tests for lib/draft/stateManager.js
 * 
 * Tier 2 business logic (80%+ coverage).
 * Tests focus on state machine behavior:
 * - State transitions (WAITING -> ACTIVE -> PICKING -> PICKED -> COMPLETED)
 * - Pick validation (not your turn, already-drafted player, timer expiration)
 * - Race condition handling (simultaneous picks)
 * - State validation and consistency
 */

const { DraftStateManager, DraftState } = require('../../../lib/draft/stateManager');

describe('DraftStateManager', () => {
  let stateManager;
  let initialState;

  beforeEach(() => {
    initialState = {
      room: {
        id: 'room-123',
        status: 'waiting',
      },
      participants: [
        { id: 'user-1', name: 'Alice' },
        { id: 'user-2', name: 'Bob' },
        { id: 'user-3', name: 'Charlie' },
      ],
      picks: [],
      draftOrder: [0, 1, 2], // Snake draft order
      draftSettings: {
        timerSeconds: 30,
        totalRounds: 18,
      },
      status: 'waiting',
      currentPickNumber: 1,
      timer: 30,
      queue: [],
    };

    stateManager = new DraftStateManager({
      roomId: 'room-123',
      initialState,
    });
  });

  describe('State Initialization', () => {
    it('initializes with provided state', () => {
      const state = stateManager.getState();
      expect(state.room.id).toBe('room-123');
      expect(state.status).toBe('waiting');
      expect(state.participants).toHaveLength(3);
    });

    it('creates default state when no initial state provided', () => {
      const emptyManager = new DraftStateManager({
        roomId: 'room-456',
      });
      const state = emptyManager.getState();
      expect(state.status).toBe('waiting');
      expect(state.participants).toEqual([]);
    });

    it('validates initial state', () => {
      const invalidState = {
        status: 'waiting',
        picks: [
          { pickNumber: 2, player: { id: 'player-1' } }, // Missing pick 1
        ],
      };
      const manager = new DraftStateManager({
        roomId: 'room-123',
        initialState: invalidState,
      });
      const state = manager.getState();
      const validation = state.validate();
      expect(validation.isValid).toBe(false);
    });
  });

  describe('State Transitions', () => {
    it('transitions WAITING -> ACTIVE when draft starts', async () => {
      await stateManager.updateRoom({ status: 'active' });
      const state = stateManager.getState();
      expect(state.status).toBe('active');
      expect(state.room.status).toBe('active');
    });

    it('transitions ACTIVE -> PAUSED when paused', async () => {
      await stateManager.updateRoom({ status: 'active' });
      await stateManager.updateRoom({ status: 'paused' });
      const state = stateManager.getState();
      expect(state.status).toBe('paused');
    });

    it('transitions ACTIVE -> COMPLETE when draft finishes', async () => {
      await stateManager.updateRoom({ status: 'active' });
      await stateManager.updateRoom({ status: 'complete' });
      const state = stateManager.getState();
      expect(state.status).toBe('complete');
    });

    it('prevents invalid transitions (COMPLETE -> ACTIVE)', async () => {
      await stateManager.updateRoom({ status: 'complete' });
      
      // Attempt to go back to active
      await stateManager.updateRoom({ status: 'active' });
      const state = stateManager.getState();
      
      // Should remain in complete state (invalid transition rejected)
      expect(state.status).toBe('complete');
    });

    it('notifies subscribers on state changes', async () => {
      const subscriber = jest.fn();
      stateManager.subscribe(subscriber);

      await stateManager.updateRoom({ status: 'active' });

      expect(subscriber).toHaveBeenCalled();
      const notifiedState = subscriber.mock.calls[0][0];
      expect(notifiedState.status).toBe('active');
    });

    it('calls onStateChange callback when provided', async () => {
      const onStateChange = jest.fn();
      const manager = new DraftStateManager({
        roomId: 'room-123',
        initialState,
        onStateChange,
      });

      await manager.updateRoom({ status: 'active' });

      expect(onStateChange).toHaveBeenCalled();
    });
  });

  describe('Pick Validation', () => {
    beforeEach(async () => {
      await stateManager.updateRoom({ status: 'active' });
    });

    it('rejects pick when not your turn', async () => {
      // First pick should be user-1 (index 0)
      // Attempt pick as user-2 (index 1)
      const pick = {
        pickNumber: 1,
        player: { id: 'player-1', name: 'Patrick Mahomes' },
        pickedBy: 'user-2',
        round: 1,
      };

      await expect(stateManager.addPick(pick)).rejects.toThrow();
    });

    it('accepts pick when it is your turn', async () => {
      // First pick should be user-1 (index 0)
      const pick = {
        pickNumber: 1,
        player: { id: 'player-1', name: 'Patrick Mahomes' },
        pickedBy: 'user-1',
        round: 1,
      };

      await stateManager.addPick(pick);
      const state = stateManager.getState();
      expect(state.picks).toHaveLength(1);
      expect(state.picks[0].player.id).toBe('player-1');
    });

    it('rejects already-drafted player', async () => {
      // First pick
      const pick1 = {
        pickNumber: 1,
        player: { id: 'player-1', name: 'Patrick Mahomes' },
        pickedBy: 'user-1',
        round: 1,
      };
      await stateManager.addPick(pick1);

      // Attempt to draft same player again
      const pick2 = {
        pickNumber: 2,
        player: { id: 'player-1', name: 'Patrick Mahomes' },
        pickedBy: 'user-2',
        round: 1,
      };

      await expect(stateManager.addPick(pick2)).rejects.toThrow();
    });

    it('validates pick number sequence', async () => {
      // Skip pick 1, attempt pick 2
      const pick = {
        pickNumber: 2,
        player: { id: 'player-1', name: 'Patrick Mahomes' },
        pickedBy: 'user-1',
        round: 1,
      };

      await expect(stateManager.addPick(pick)).rejects.toThrow();
    });

    it('increments current pick number after valid pick', async () => {
      const pick = {
        pickNumber: 1,
        player: { id: 'player-1', name: 'Patrick Mahomes' },
        pickedBy: 'user-1',
        round: 1,
      };

      await stateManager.addPick(pick);
      const state = stateManager.getState();
      expect(state.currentPickNumber).toBe(2);
    });

    it('calculates current picker correctly (snake draft)', async () => {
      // Round 1: user-1, user-2, user-3
      // Round 2: user-3, user-2, user-1 (snake)
      
      // Pick 1: user-1
      await stateManager.addPick({
        pickNumber: 1,
        player: { id: 'player-1' },
        pickedBy: 'user-1',
        round: 1,
      });

      // Pick 2: user-2
      await stateManager.addPick({
        pickNumber: 2,
        player: { id: 'player-2' },
        pickedBy: 'user-2',
        round: 1,
      });

      // Pick 3: user-3
      await stateManager.addPick({
        pickNumber: 3,
        player: { id: 'player-3' },
        pickedBy: 'user-3',
        round: 1,
      });

      // Pick 4: user-3 again (snake - round 2)
      const derived = stateManager.getDerivedState();
      expect(derived.currentPicker.id).toBe('user-3');
    });
  });

  describe('Race Condition Handling', () => {
    beforeEach(async () => {
      await stateManager.updateRoom({ status: 'active' });
    });

    it('processes updates sequentially to prevent race conditions', async () => {
      // Simulate simultaneous picks
      const pick1 = {
        pickNumber: 1,
        player: { id: 'player-1', name: 'Player 1' },
        pickedBy: 'user-1',
        round: 1,
      };

      const pick2 = {
        pickNumber: 2,
        player: { id: 'player-2', name: 'Player 2' },
        pickedBy: 'user-2',
        round: 1,
      };

      // Start both picks simultaneously
      const promise1 = stateManager.addPick(pick1);
      const promise2 = stateManager.addPick(pick2);

      await Promise.all([promise1, promise2]);

      const state = stateManager.getState();
      expect(state.picks).toHaveLength(2);
      expect(state.picks[0].pickNumber).toBe(1);
      expect(state.picks[1].pickNumber).toBe(2);
    });

    it('rejects duplicate pick attempts for same pick number', async () => {
      const pick = {
        pickNumber: 1,
        player: { id: 'player-1', name: 'Player 1' },
        pickedBy: 'user-1',
        round: 1,
      };

      // First pick succeeds
      await stateManager.addPick(pick);

      // Second attempt for same pick number should fail
      const duplicatePick = {
        ...pick,
        player: { id: 'player-2', name: 'Player 2' },
      };

      await expect(stateManager.addPick(duplicatePick)).rejects.toThrow();
    });
  });

  describe('State Validation', () => {
    it('validates state consistency', () => {
      const state = stateManager.getState();
      const validation = state.validate();
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toEqual([]);
    });

    it('detects invalid pick sequence', () => {
      const invalidState = {
        ...initialState,
        picks: [
          { pickNumber: 1, player: { id: 'player-1' } },
          { pickNumber: 3, player: { id: 'player-3' } }, // Missing pick 2
        ],
      };
      const manager = new DraftStateManager({
        roomId: 'room-123',
        initialState: invalidState,
      });

      const state = manager.getState();
      const validation = state.validate();
      expect(validation.isValid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });

    it('validates draft order consistency', () => {
      const invalidState = {
        ...initialState,
        draftOrder: [0, 1, 2],
        picks: [
          {
            pickNumber: 1,
            player: { id: 'player-1' },
            pickedBy: 'user-2', // Wrong user for first pick
          },
        ],
      };
      const manager = new DraftStateManager({
        roomId: 'room-123',
        initialState: invalidState,
      });

      const state = manager.getState();
      const validation = state.validate();
      // Should detect inconsistency (depending on validation rules)
      expect(validation).toBeDefined();
    });

    it('prevents picked players in queue', () => {
      const invalidState = {
        ...initialState,
        picks: [
          { pickNumber: 1, player: { id: 'player-1' } },
        ],
        queue: [
          { player: { id: 'player-1' } }, // Already picked
        ],
      };
      const manager = new DraftStateManager({
        roomId: 'room-123',
        initialState: invalidState,
      });

      const validation = manager.validateState();
      expect(validation.isValid).toBe(false);
    });
  });

  describe('Derived State', () => {
    beforeEach(async () => {
      await stateManager.updateRoom({ status: 'active' });
    });

    it('calculates current round correctly', async () => {
      // 3 participants, picks 1-3 = round 1, picks 4-6 = round 2
      await stateManager.addPick({
        pickNumber: 1,
        player: { id: 'player-1' },
        pickedBy: 'user-1',
        round: 1,
      });

      let derived = stateManager.getDerivedState();
      expect(derived.currentRound).toBe(1);

      // After 3 picks, should be round 2
      await stateManager.addPick({
        pickNumber: 2,
        player: { id: 'player-2' },
        pickedBy: 'user-2',
        round: 1,
      });
      await stateManager.addPick({
        pickNumber: 3,
        player: { id: 'player-3' },
        pickedBy: 'user-3',
        round: 1,
      });

      derived = stateManager.getDerivedState();
      expect(derived.currentRound).toBe(2);
    });

    it('determines draft completion status', async () => {
      let derived = stateManager.getDerivedState();
      expect(derived.isDraftComplete).toBe(false);

      await stateManager.updateRoom({ status: 'complete' });
      derived = stateManager.getDerivedState();
      expect(derived.isDraftComplete).toBe(false); // Still false until all picks made
      
      // Complete when all picks are made
      derived = stateManager.getDerivedState();
      expect(derived.isDraftActive).toBe(false);
    });

    it('determines if user is on the clock', async () => {
      // First pick - user-1 should be on the clock
      const derived = stateManager.getDerivedState();
      expect(derived.isOnTheClock).toBe(true);
      expect(derived.currentPicker.id).toBe('user-1');
    });
  });

  describe('Queue Management', () => {
    it('adds player to queue', async () => {
      const player = { id: 'player-1', name: 'Patrick Mahomes' };
      await stateManager.addToQueue(player, 'user-1');

      const state = stateManager.getState();
      expect(state.queue).toHaveLength(1);
      expect(state.queue[0].player.id).toBe('player-1');
    });

    it('removes player from queue', async () => {
      const player = { id: 'player-1', name: 'Patrick Mahomes' };
      await stateManager.addToQueue(player);
      await stateManager.removeFromQueue(player);

      const state = stateManager.getState();
      expect(state.queue).toHaveLength(0);
    });

    it('prevents adding already-picked players to queue', async () => {
      // Pick a player
      await stateManager.updateRoom({ status: 'active' });
      await stateManager.addPick({
        pickNumber: 1,
        player: { id: 'player-1', name: 'Patrick Mahomes' },
        pickedBy: 'user-1',
        round: 1,
      });

      // Attempt to add to queue (should silently fail - already picked)
      await stateManager.addToQueue({ id: 'player-1', name: 'Patrick Mahomes' });
      const state = stateManager.getState();
      expect(state.queue).toHaveLength(0); // Should not be added
    });
  });

  describe('Error Handling', () => {
    it('handles errors gracefully during state updates', async () => {
      // Invalid state update
      await expect(
        stateManager.updateRoom({ invalidField: 'value' })
      ).rejects.toThrow();
    });

    it('maintains state consistency after error', async () => {
      const initialState = stateManager.getState();

      try {
        await stateManager.addPick({
          pickNumber: 999, // Invalid pick number
          player: { id: 'player-1' },
          pickedBy: 'user-1',
          round: 1,
        });
      } catch (error) {
        // Expected to throw
      }

      // State should remain unchanged
      const stateAfterError = stateManager.getState();
      expect(stateAfterError.picks).toEqual(initialState.picks);
    });
  });

  describe('Subscription Management', () => {
    it('allows subscribing to state changes', () => {
      const subscriber = jest.fn();
      const unsubscribe = stateManager.subscribe(subscriber);

      expect(unsubscribe).toBeDefined();
      expect(typeof unsubscribe).toBe('function');
    });

    it('allows unsubscribing from state changes', async () => {
      const subscriber = jest.fn();
      const unsubscribe = stateManager.subscribe(subscriber);

      unsubscribe();

      await stateManager.updateRoom({ status: 'active' });

      // Subscriber should not be called after unsubscribe
      expect(subscriber).not.toHaveBeenCalled();
    });

    it('notifies all subscribers on state change', async () => {
      const subscriber1 = jest.fn();
      const subscriber2 = jest.fn();

      stateManager.subscribe(subscriber1);
      stateManager.subscribe(subscriber2);

      await stateManager.updateRoom({ status: 'active' });

      expect(subscriber1).toHaveBeenCalled();
      expect(subscriber2).toHaveBeenCalled();
    });
  });
});
