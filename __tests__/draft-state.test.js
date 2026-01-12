/**
 * Draft Room State Machine Tests
 * 
 * Tests critical state transitions and validations to prevent:
 * - Duplicate picks
 * - Invalid turn advances
 * - Race conditions
 * - Invalid player selections
 * 
 * Focus: State machine logic only (not UI rendering)
 */

// Mock the validation utilities
jest.mock('../../components/vx2/draft-logic/utils/validation', () => {
  const actual = jest.requireActual('../../components/vx2/draft-logic/utils/validation');
  return actual;
});

jest.mock('../../components/vx2/draft-logic/utils/snakeDraft', () => {
  const actual = jest.requireActual('../../components/vx2/draft-logic/utils/snakeDraft');
  return actual;
});

jest.mock('../../components/vx2/draft-logic/utils/autodraft', () => {
  const actual = jest.requireActual('../../components/vx2/draft-logic/utils/autodraft');
  return actual;
});

// Import the functions we're testing
const {
  validateDraftActive,
  validateTurn,
  validatePlayerAvailable,
  validatePositionLimit,
  validatePlayer,
  validateManualPick,
  validateAutopick,
} = require('../../components/vx2/draft-logic/utils/validation');

const {
  getParticipantForPick,
  getRoundForPick,
  getPickInRound,
  isSnakeRound,
} = require('../../components/vx2/draft-logic/utils/snakeDraft');

const {
  canDraftPlayer,
  calculatePositionCounts,
} = require('../../components/vx2/draft-logic/utils/autodraft');

describe('Draft Room State Machine', () => {
  // Test data helpers
  const createMockPlayer = (id, name, position) => ({
    id,
    name,
    position,
    adp: 50,
    team: 'KC',
  });

  const createMockRoster = (players) => players.map(p => createMockPlayer(p.id, p.name, p.position));

  const DEFAULT_POSITION_LIMITS = {
    QB: 1,
    RB: 2,
    WR: 3,
    TE: 1,
  };

  describe('Pick Validation', () => {
    describe('validateDraftActive', () => {
      test('should allow picks when draft is active', () => {
        const result = validateDraftActive('active');
        expect(result.valid).toBe(true);
      });

      test('should prevent picks when draft is loading', () => {
        const result = validateDraftActive('loading');
        expect(result.valid).toBe(false);
        expect(result.errorCode).toBe('DRAFT_NOT_ACTIVE');
      });

      test('should prevent picks when draft is waiting', () => {
        const result = validateDraftActive('waiting');
        expect(result.valid).toBe(false);
        expect(result.errorCode).toBe('DRAFT_NOT_ACTIVE');
      });

      test('should prevent picks when draft is paused', () => {
        const result = validateDraftActive('paused');
        expect(result.valid).toBe(false);
        expect(result.errorCode).toBe('DRAFT_NOT_ACTIVE');
      });

      test('should prevent picks when draft is complete', () => {
        const result = validateDraftActive('complete');
        expect(result.valid).toBe(false);
        expect(result.errorCode).toBe('DRAFT_NOT_ACTIVE');
      });
    });

    describe('validateTurn', () => {
      test('should allow pick when it is user\'s turn', () => {
        // Pick 1 in 12-team draft = participant 0
        const result = validateTurn(1, 0, 12);
        expect(result.valid).toBe(true);
      });

      test('should prevent pick when it is not user\'s turn', () => {
        // Pick 1 in 12-team draft = participant 0, but user is participant 1
        const result = validateTurn(1, 1, 12);
        expect(result.valid).toBe(false);
        expect(result.errorCode).toBe('NOT_YOUR_TURN');
      });

      test('should handle snake draft correctly - round 1', () => {
        // Round 1: picks 1-12 go to participants 0-11
        expect(validateTurn(1, 0, 12).valid).toBe(true);
        expect(validateTurn(12, 11, 12).valid).toBe(true);
        expect(validateTurn(1, 1, 12).valid).toBe(false);
      });

      test('should handle snake draft correctly - round 2', () => {
        // Round 2: picks 13-24 go to participants 11-0 (snake back)
        expect(validateTurn(13, 11, 12).valid).toBe(true);
        expect(validateTurn(24, 0, 12).valid).toBe(true);
        expect(validateTurn(13, 0, 12).valid).toBe(false);
      });
    });

    describe('validatePlayerAvailable', () => {
      test('should allow picking available players', () => {
        const player = createMockPlayer('player1', 'Player 1', 'QB');
        const pickedIds = new Set(['player2', 'player3']);
        const result = validatePlayerAvailable(player, pickedIds);
        expect(result.valid).toBe(true);
      });

      test('should prevent picking already-drafted players', () => {
        const player = createMockPlayer('player1', 'Player 1', 'QB');
        const pickedIds = new Set(['player1', 'player2']);
        const result = validatePlayerAvailable(player, pickedIds);
        expect(result.valid).toBe(false);
        expect(result.errorCode).toBe('PLAYER_UNAVAILABLE');
      });
    });

    describe('validatePositionLimit', () => {
      test('should allow pick when position limit not reached', () => {
        const player = createMockPlayer('qb1', 'QB 1', 'QB');
        const roster = []; // Empty roster
        const result = validatePositionLimit(player, roster, DEFAULT_POSITION_LIMITS);
        expect(result.valid).toBe(true);
      });

      test('should prevent pick when QB limit reached', () => {
        const player = createMockPlayer('qb2', 'QB 2', 'QB');
        const roster = createMockRoster([{ id: 'qb1', name: 'QB 1', position: 'QB' }]);
        const result = validatePositionLimit(player, roster, DEFAULT_POSITION_LIMITS);
        expect(result.valid).toBe(false);
        expect(result.errorCode).toBe('POSITION_LIMIT_REACHED');
      });

      test('should prevent pick when RB limit reached', () => {
        const player = createMockPlayer('rb3', 'RB 3', 'RB');
        const roster = createMockRoster([
          { id: 'rb1', name: 'RB 1', position: 'RB' },
          { id: 'rb2', name: 'RB 2', position: 'RB' },
        ]);
        const result = validatePositionLimit(player, roster, DEFAULT_POSITION_LIMITS);
        expect(result.valid).toBe(false);
        expect(result.errorCode).toBe('POSITION_LIMIT_REACHED');
      });

      test('should prevent pick when WR limit reached', () => {
        const player = createMockPlayer('wr4', 'WR 4', 'WR');
        const roster = createMockRoster([
          { id: 'wr1', name: 'WR 1', position: 'WR' },
          { id: 'wr2', name: 'WR 2', position: 'WR' },
          { id: 'wr3', name: 'WR 3', position: 'WR' },
        ]);
        const result = validatePositionLimit(player, roster, DEFAULT_POSITION_LIMITS);
        expect(result.valid).toBe(false);
        expect(result.errorCode).toBe('POSITION_LIMIT_REACHED');
      });

      test('should allow pick when position limit not reached', () => {
        const player = createMockPlayer('rb2', 'RB 2', 'RB');
        const roster = createMockRoster([
          { id: 'rb1', name: 'RB 1', position: 'RB' },
        ]);
        const result = validatePositionLimit(player, roster, DEFAULT_POSITION_LIMITS);
        expect(result.valid).toBe(true);
      });
    });

    describe('validatePlayer', () => {
      test('should validate valid player object', () => {
        const player = createMockPlayer('player1', 'Player 1', 'QB');
        const result = validatePlayer(player);
        expect(result.valid).toBe(true);
      });

      test('should reject null player', () => {
        const result = validatePlayer(null);
        expect(result.valid).toBe(false);
        expect(result.errorCode).toBe('INVALID_PLAYER');
      });

      test('should reject undefined player', () => {
        const result = validatePlayer(undefined);
        expect(result.valid).toBe(false);
        expect(result.errorCode).toBe('INVALID_PLAYER');
      });

      test('should reject player without id', () => {
        const player = { name: 'Player 1', position: 'QB' };
        const result = validatePlayer(player);
        expect(result.valid).toBe(false);
        expect(result.errorCode).toBe('INVALID_PLAYER');
      });

      test('should reject player without name', () => {
        const player = { id: 'player1', position: 'QB' };
        const result = validatePlayer(player);
        expect(result.valid).toBe(false);
        expect(result.errorCode).toBe('INVALID_PLAYER');
      });

      test('should reject player without position', () => {
        const player = { id: 'player1', name: 'Player 1' };
        const result = validatePlayer(player);
        expect(result.valid).toBe(false);
        expect(result.errorCode).toBe('INVALID_PLAYER');
      });
    });

    describe('validateManualPick', () => {
      test('should validate a complete valid pick', () => {
        const player = createMockPlayer('player1', 'Player 1', 'QB');
        const result = validateManualPick(
          player,
          1, // pickNumber
          0, // userParticipantIndex
          12, // teamCount
          new Set(), // pickedPlayerIds
          [], // currentRoster
          DEFAULT_POSITION_LIMITS,
          'active' // draftStatus
        );
        expect(result.valid).toBe(true);
      });

      test('should reject pick when draft not active', () => {
        const player = createMockPlayer('player1', 'Player 1', 'QB');
        const result = validateManualPick(
          player,
          1,
          0,
          12,
          new Set(),
          [],
          DEFAULT_POSITION_LIMITS,
          'paused' // draftStatus
        );
        expect(result.valid).toBe(false);
        expect(result.errorCode).toBe('DRAFT_NOT_ACTIVE');
      });

      test('should reject pick when not user\'s turn', () => {
        const player = createMockPlayer('player1', 'Player 1', 'QB');
        const result = validateManualPick(
          player,
          1, // pickNumber (participant 0's turn)
          1, // userParticipantIndex (but user is participant 1)
          12,
          new Set(),
          [],
          DEFAULT_POSITION_LIMITS,
          'active'
        );
        expect(result.valid).toBe(false);
        expect(result.errorCode).toBe('NOT_YOUR_TURN');
      });

      test('should reject pick when player already drafted', () => {
        const player = createMockPlayer('player1', 'Player 1', 'QB');
        const result = validateManualPick(
          player,
          1,
          0,
          12,
          new Set(['player1']), // Already picked
          [],
          DEFAULT_POSITION_LIMITS,
          'active'
        );
        expect(result.valid).toBe(false);
        expect(result.errorCode).toBe('PLAYER_UNAVAILABLE');
      });

      test('should reject pick when position limit reached', () => {
        const player = createMockPlayer('qb2', 'QB 2', 'QB');
        const roster = createMockRoster([{ id: 'qb1', name: 'QB 1', position: 'QB' }]);
        const result = validateManualPick(
          player,
          1,
          0,
          12,
          new Set(),
          roster,
          DEFAULT_POSITION_LIMITS,
          'active'
        );
        expect(result.valid).toBe(false);
        expect(result.errorCode).toBe('POSITION_LIMIT_REACHED');
      });
    });

    describe('validateAutopick', () => {
      test('should validate autopick (skips turn check)', () => {
        const player = createMockPlayer('player1', 'Player 1', 'QB');
        const result = validateAutopick(
          player,
          new Set(), // pickedPlayerIds
          [], // currentRoster
          DEFAULT_POSITION_LIMITS,
          'active' // draftStatus
        );
        expect(result.valid).toBe(true);
      });

      test('should reject autopick when draft not active', () => {
        const player = createMockPlayer('player1', 'Player 1', 'QB');
        const result = validateAutopick(
          player,
          new Set(),
          [],
          DEFAULT_POSITION_LIMITS,
          'paused'
        );
        expect(result.valid).toBe(false);
        expect(result.errorCode).toBe('DRAFT_NOT_ACTIVE');
      });

      test('should reject autopick when player already drafted', () => {
        const player = createMockPlayer('player1', 'Player 1', 'QB');
        const result = validateAutopick(
          player,
          new Set(['player1']),
          [],
          DEFAULT_POSITION_LIMITS,
          'active'
        );
        expect(result.valid).toBe(false);
        expect(result.errorCode).toBe('PLAYER_UNAVAILABLE');
      });
    });
  });

  describe('Turn Advancement (Snake Draft)', () => {
    describe('getParticipantForPick', () => {
      test('should return correct participant for round 1 picks', () => {
        expect(getParticipantForPick(1, 12)).toBe(0);  // First pick
        expect(getParticipantForPick(12, 12)).toBe(11); // Last pick of round 1
      });

      test('should return correct participant for round 2 (snake)', () => {
        expect(getParticipantForPick(13, 12)).toBe(11); // First pick of round 2 (snake back)
        expect(getParticipantForPick(24, 12)).toBe(0);  // Last pick of round 2
      });

      test('should return correct participant for round 3', () => {
        expect(getParticipantForPick(25, 12)).toBe(0);  // First pick of round 3
        expect(getParticipantForPick(36, 12)).toBe(11); // Last pick of round 3
      });
    });

    describe('getRoundForPick', () => {
      test('should return correct round number', () => {
        expect(getRoundForPick(1, 12)).toBe(1);
        expect(getRoundForPick(12, 12)).toBe(1);
        expect(getRoundForPick(13, 12)).toBe(2);
        expect(getRoundForPick(24, 12)).toBe(2);
        expect(getRoundForPick(25, 12)).toBe(3);
      });
    });

    describe('getPickInRound', () => {
      test('should return correct pick position in round', () => {
        expect(getPickInRound(1, 12)).toBe(1);
        expect(getPickInRound(12, 12)).toBe(12);
        expect(getPickInRound(13, 12)).toBe(1);
        expect(getPickInRound(15, 12)).toBe(3);
      });
    });

    describe('isSnakeRound', () => {
      test('should identify snake rounds correctly', () => {
        expect(isSnakeRound(1)).toBe(false); // Odd round
        expect(isSnakeRound(2)).toBe(true);  // Even round (snake)
        expect(isSnakeRound(3)).toBe(false); // Odd round
        expect(isSnakeRound(4)).toBe(true);  // Even round (snake)
      });
    });
  });

  describe('Position Limit Logic', () => {
    describe('canDraftPlayer', () => {
      test('should allow drafting when under limit', () => {
        const player = createMockPlayer('rb1', 'RB 1', 'RB');
        const roster = createMockRoster([{ id: 'qb1', name: 'QB 1', position: 'QB' }]);
        const result = canDraftPlayer(player, roster, DEFAULT_POSITION_LIMITS);
        expect(result).toBe(true);
      });

      test('should prevent drafting when at limit', () => {
        const player = createMockPlayer('qb2', 'QB 2', 'QB');
        const roster = createMockRoster([{ id: 'qb1', name: 'QB 1', position: 'QB' }]);
        const result = canDraftPlayer(player, roster, DEFAULT_POSITION_LIMITS);
        expect(result).toBe(false);
      });

      test('should allow drafting when under limit for RB', () => {
        const player = createMockPlayer('rb2', 'RB 2', 'RB');
        const roster = createMockRoster([{ id: 'rb1', name: 'RB 1', position: 'RB' }]);
        const result = canDraftPlayer(player, roster, DEFAULT_POSITION_LIMITS);
        expect(result).toBe(true);
      });

      test('should prevent drafting when at limit for RB', () => {
        const player = createMockPlayer('rb3', 'RB 3', 'RB');
        const roster = createMockRoster([
          { id: 'rb1', name: 'RB 1', position: 'RB' },
          { id: 'rb2', name: 'RB 2', position: 'RB' },
        ]);
        const result = canDraftPlayer(player, roster, DEFAULT_POSITION_LIMITS);
        expect(result).toBe(false);
      });
    });

    describe('calculatePositionCounts', () => {
      test('should count positions correctly', () => {
        const roster = createMockRoster([
          { id: 'qb1', name: 'QB 1', position: 'QB' },
          { id: 'rb1', name: 'RB 1', position: 'RB' },
          { id: 'rb2', name: 'RB 2', position: 'RB' },
          { id: 'wr1', name: 'WR 1', position: 'WR' },
        ]);
        const counts = calculatePositionCounts(roster);
        expect(counts.QB).toBe(1);
        expect(counts.RB).toBe(2);
        expect(counts.WR).toBe(1);
        expect(counts.TE).toBe(0);
      });

      test('should return zeros for empty roster', () => {
        const counts = calculatePositionCounts([]);
        expect(counts.QB).toBe(0);
        expect(counts.RB).toBe(0);
        expect(counts.WR).toBe(0);
        expect(counts.TE).toBe(0);
      });
    });
  });

  describe('Edge Cases', () => {
    test('should handle invalid pick numbers gracefully', () => {
      // getParticipantForPick should handle edge cases
      expect(getParticipantForPick(0, 12)).toBe(0); // Edge case: returns 0
      expect(getParticipantForPick(-1, 12)).toBe(0); // Edge case: returns 0
    });

    test('should handle empty picked player set', () => {
      const player = createMockPlayer('player1', 'Player 1', 'QB');
      const result = validatePlayerAvailable(player, new Set());
      expect(result.valid).toBe(true);
    });

    test('should handle empty roster for position limits', () => {
      const player = createMockPlayer('player1', 'Player 1', 'QB');
      const result = validatePositionLimit(player, [], DEFAULT_POSITION_LIMITS);
      expect(result.valid).toBe(true);
    });
  });
});

/**
 * Implementation Notes:
 * 
 * These tests focus on the pure state machine logic:
 * 1. Validation functions (validateDraftActive, validateTurn, etc.)
 * 2. Snake draft calculations (getParticipantForPick, etc.)
 * 3. Position limit logic (canDraftPlayer, calculatePositionCounts)
 * 
 * Future tests (not yet implemented):
 * - Firestore transaction mocks for integration tests
 * - Race condition tests with concurrent picks
 * - Auto-pick algorithm tests
 * - Draft completion logic
 */
