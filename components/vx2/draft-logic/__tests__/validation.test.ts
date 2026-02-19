/**
 * VX2 Draft Logic - Validation Tests
 *
 * Comprehensive unit tests for pick validation utilities.
 * Tests all exported validation functions with happy paths, edge cases, and error scenarios.
 */

import { DRAFT_CONFIG, DEFAULT_POSITION_LIMITS } from '../constants';
import type {
  DraftPlayer,
  DraftStatus,
  ValidationResult,
  PositionLimits,
} from '../types';
import {
  validateDraftActive,
  validateTurn,
  validatePlayerAvailable,
  validatePositionLimit,
  validateTimer,
  validatePlayer,
  validateManualPick,
  validateAutopick,
  isValidationSuccess,
  getValidationError,
  combineValidations,
  VALIDATION_ERROR_MESSAGES,
} from '../utils/validation';



// ============================================================================
// TEST FIXTURES
// ============================================================================

/**
 * Create a test player with defaults
 */
function createTestPlayer(overrides?: Partial<DraftPlayer>): DraftPlayer {
  return {
    id: 'player-1',
    name: 'Patrick Mahomes',
    position: 'QB',
    team: 'KC',
    adp: 1.05,
    projectedPoints: 25.5,
    byeWeek: 5,
    ...overrides,
  };
}

/**
 * Create multiple test players
 */
function createTestPlayers(count: number, overrides?: Partial<DraftPlayer>): DraftPlayer[] {
  return Array.from({ length: count }, (_, i) =>
    createTestPlayer({
      id: `player-${i + 1}`,
      name: `Test Player ${i + 1}`,
      ...overrides,
    })
  );
}

// ============================================================================
// validateDraftActive() TESTS
// ============================================================================

describe('validateDraftActive', () => {
  describe('happy path', () => {
    it('should pass when draft status is active', () => {
      const result = validateDraftActive('active');
      expect(result.valid).toBe(true);
      expect(result.errorCode).toBeUndefined();
      expect(result.errorMessage).toBeUndefined();
    });
  });

  describe('error cases', () => {
    it('should fail when draft status is loading', () => {
      const result = validateDraftActive('loading');
      expect(result.valid).toBe(false);
      expect(result.errorCode).toBe('DRAFT_NOT_ACTIVE');
      expect(result.errorMessage).toBe(VALIDATION_ERROR_MESSAGES.DRAFT_NOT_ACTIVE);
    });

    it('should fail when draft status is waiting', () => {
      const result = validateDraftActive('waiting');
      expect(result.valid).toBe(false);
      expect(result.errorCode).toBe('DRAFT_NOT_ACTIVE');
    });

    it('should fail when draft status is paused', () => {
      const result = validateDraftActive('paused');
      expect(result.valid).toBe(false);
      expect(result.errorCode).toBe('DRAFT_NOT_ACTIVE');
    });

    it('should fail when draft status is complete', () => {
      const result = validateDraftActive('complete');
      expect(result.valid).toBe(false);
      expect(result.errorCode).toBe('DRAFT_NOT_ACTIVE');
    });
  });

  describe('all draft statuses', () => {
    const statuses: DraftStatus[] = ['loading', 'waiting', 'active', 'paused', 'complete'];

    statuses.forEach(status => {
      it(`should validate status: ${status}`, () => {
        const result = validateDraftActive(status);
        if (status === 'active') {
          expect(result.valid).toBe(true);
        } else {
          expect(result.valid).toBe(false);
          expect(result.errorCode).toBe('DRAFT_NOT_ACTIVE');
        }
      });
    });
  });
});

// ============================================================================
// validateTurn() TESTS
// ============================================================================

describe('validateTurn', () => {
  describe('happy path', () => {
    it('should pass when it is the user\'s turn', () => {
      const result = validateTurn(1, 0, 12);
      expect(result.valid).toBe(true);
    });

    it('should pass for different pick numbers and user indices', () => {
      // Pick 1 belongs to participant 0
      expect(validateTurn(1, 0, 12).valid).toBe(true);
      // Pick 12 belongs to participant 11 (last pick of round 1)
      expect(validateTurn(12, 11, 12).valid).toBe(true);
      // Pick 13 belongs to participant 11 (snake - first pick of round 2)
      expect(validateTurn(13, 11, 12).valid).toBe(true);
    });
  });

  describe('error cases', () => {
    it('should fail when it is not the user\'s turn', () => {
      const result = validateTurn(1, 1, 12);
      expect(result.valid).toBe(false);
      expect(result.errorCode).toBe('NOT_YOUR_TURN');
      expect(result.errorMessage).toBe(VALIDATION_ERROR_MESSAGES.NOT_YOUR_TURN);
    });

    it('should fail for any pick not belonging to user', () => {
      // Pick 2 belongs to participant 1, not 0
      const result = validateTurn(2, 0, 12);
      expect(result.valid).toBe(false);
      expect(result.errorCode).toBe('NOT_YOUR_TURN');
    });
  });

  describe('edge cases', () => {
    it('should handle different team counts', () => {
      // 8 team draft
      expect(validateTurn(1, 0, 8).valid).toBe(true);
      expect(validateTurn(8, 7, 8).valid).toBe(true);
      expect(validateTurn(9, 7, 8).valid).toBe(true); // Snake

      // 16 team draft
      expect(validateTurn(1, 0, 16).valid).toBe(true);
      expect(validateTurn(16, 15, 16).valid).toBe(true);
    });

    it('should use default team count if not provided', () => {
      const result = validateTurn(1, 0);
      expect(result.valid).toBe(true);
    });

    it('should handle last pick of draft', () => {
      const totalPicks = DRAFT_CONFIG.teamCount * DRAFT_CONFIG.rosterSize;
      const result = validateTurn(totalPicks, 0, DRAFT_CONFIG.teamCount);
      expect(result.valid).toBe(true);
    });

    it('should handle snake draft transitions', () => {
      // Round 1 pick 12 -> Round 2 pick 1 (participant 11 stays)
      expect(validateTurn(12, 11, 12).valid).toBe(true); // Last of round 1
      expect(validateTurn(13, 11, 12).valid).toBe(true); // First of round 2 (snake)
    });
  });
});

// ============================================================================
// validatePlayerAvailable() TESTS
// ============================================================================

describe('validatePlayerAvailable', () => {
  describe('happy path', () => {
    it('should pass when player is not in picked set', () => {
      const player = createTestPlayer();
      const pickedIds = new Set<string>();
      const result = validatePlayerAvailable(player, pickedIds);
      expect(result.valid).toBe(true);
    });

    it('should pass when picked set is empty', () => {
      const player = createTestPlayer();
      const pickedIds = new Set<string>();
      const result = validatePlayerAvailable(player, pickedIds);
      expect(result.valid).toBe(true);
    });

    it('should pass when player is not among many picked players', () => {
      const player = createTestPlayer({ id: 'player-new' });
      const pickedIds = new Set(['player-1', 'player-2', 'player-3']);
      const result = validatePlayerAvailable(player, pickedIds);
      expect(result.valid).toBe(true);
    });
  });

  describe('error cases', () => {
    it('should fail when player is in picked set', () => {
      const player = createTestPlayer({ id: 'player-1' });
      const pickedIds = new Set(['player-1']);
      const result = validatePlayerAvailable(player, pickedIds);
      expect(result.valid).toBe(false);
      expect(result.errorCode).toBe('PLAYER_UNAVAILABLE');
      expect(result.errorMessage).toBe(VALIDATION_ERROR_MESSAGES.PLAYER_UNAVAILABLE);
    });

    it('should fail when player is among many picked players', () => {
      const player = createTestPlayer({ id: 'player-5' });
      const pickedIds = new Set(['player-1', 'player-2', 'player-3', 'player-4', 'player-5']);
      const result = validatePlayerAvailable(player, pickedIds);
      expect(result.valid).toBe(false);
      expect(result.errorCode).toBe('PLAYER_UNAVAILABLE');
    });

    it('should fail when player is first in picked set', () => {
      const player = createTestPlayer({ id: 'player-1' });
      const pickedIds = new Set(['player-1', 'player-2', 'player-3']);
      const result = validatePlayerAvailable(player, pickedIds);
      expect(result.valid).toBe(false);
    });

    it('should fail when player is last in picked set', () => {
      const player = createTestPlayer({ id: 'player-100' });
      const pickedIds = new Set(['player-1', 'player-50', 'player-100']);
      const result = validatePlayerAvailable(player, pickedIds);
      expect(result.valid).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle very large picked sets', () => {
      const pickedIds = new Set<string>();
      for (let i = 0; i < 1000; i++) {
        pickedIds.add(`player-${i}`);
      }
      const newPlayer = createTestPlayer({ id: 'player-new' });
      const result = validatePlayerAvailable(newPlayer, pickedIds);
      expect(result.valid).toBe(true);
    });

    it('should be case-sensitive for player IDs', () => {
      const player = createTestPlayer({ id: 'PLAYER-1' });
      const pickedIds = new Set(['player-1']);
      const result = validatePlayerAvailable(player, pickedIds);
      expect(result.valid).toBe(true); // Different case, so not found
    });
  });
});

// ============================================================================
// validatePositionLimit() TESTS
// ============================================================================

describe('validatePositionLimit', () => {
  describe('happy path', () => {
    it('should pass when roster is empty', () => {
      const player = createTestPlayer({ position: 'QB' });
      const roster: DraftPlayer[] = [];
      const limits = DEFAULT_POSITION_LIMITS;
      const result = validatePositionLimit(player, roster, limits);
      expect(result.valid).toBe(true);
    });

    it('should pass when position limit not reached', () => {
      const player = createTestPlayer({ position: 'QB' });
      const roster = [createTestPlayer({ position: 'QB' })];
      const limits = { QB: 3, RB: 6, WR: 8, TE: 3 };
      const result = validatePositionLimit(player, roster, limits);
      expect(result.valid).toBe(true);
    });

    it('should pass for each position type', () => {
      const positions = ['QB', 'RB', 'WR', 'TE'] as const;
      const limits = { QB: 3, RB: 6, WR: 8, TE: 3 };

      positions.forEach(position => {
        const player = createTestPlayer({ position });
        const roster: DraftPlayer[] = [];
        const result = validatePositionLimit(player, roster, limits);
        expect(result.valid).toBe(true);
      });
    });
  });

  describe('error cases', () => {
    it('should fail when position limit is reached', () => {
      const player = createTestPlayer({ position: 'QB' });
      const roster = createTestPlayers(3, { position: 'QB' });
      const limits = { QB: 3, RB: 6, WR: 8, TE: 3 };
      const result = validatePositionLimit(player, roster, limits);
      expect(result.valid).toBe(false);
      expect(result.errorCode).toBe('POSITION_LIMIT_REACHED');
      expect(result.errorMessage).toBe(VALIDATION_ERROR_MESSAGES.POSITION_LIMIT_REACHED);
    });

    it('should fail for RB position when limit reached', () => {
      const player = createTestPlayer({ position: 'RB' });
      const roster = createTestPlayers(6, { position: 'RB' });
      const limits = { QB: 3, RB: 6, WR: 8, TE: 3 };
      const result = validatePositionLimit(player, roster, limits);
      expect(result.valid).toBe(false);
    });

    it('should fail for WR position when limit reached', () => {
      const player = createTestPlayer({ position: 'WR' });
      const roster = createTestPlayers(8, { position: 'WR' });
      const limits = { QB: 3, RB: 6, WR: 8, TE: 3 };
      const result = validatePositionLimit(player, roster, limits);
      expect(result.valid).toBe(false);
    });

    it('should fail for TE position when limit reached', () => {
      const player = createTestPlayer({ position: 'TE' });
      const roster = createTestPlayers(3, { position: 'TE' });
      const limits = { QB: 3, RB: 6, WR: 8, TE: 3 };
      const result = validatePositionLimit(player, roster, limits);
      expect(result.valid).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should allow pick with zero limit and empty roster (graceful handling)', () => {
      const player = createTestPlayer({ position: 'QB' });
      const roster: DraftPlayer[] = [];
      const limits = { QB: 0, RB: 0, WR: 0, TE: 0 };
      const result = validatePositionLimit(player, roster, limits);
      expect(result.valid).toBe(false); // 0 limit means no picks allowed
    });

    it('should handle mixed roster with only one player of target position', () => {
      const player = createTestPlayer({ position: 'QB' });
      const roster = [
        createTestPlayer({ position: 'QB' }),
        createTestPlayer({ position: 'RB' }),
        createTestPlayer({ position: 'WR' }),
      ];
      const limits = { QB: 3, RB: 6, WR: 8, TE: 3 };
      const result = validatePositionLimit(player, roster, limits);
      expect(result.valid).toBe(true);
    });

    it('should handle high position limits', () => {
      const player = createTestPlayer({ position: 'WR' });
      const roster = createTestPlayers(10, { position: 'WR' });
      const limits = { QB: 5, RB: 10, WR: 15, TE: 5 };
      const result = validatePositionLimit(player, roster, limits);
      expect(result.valid).toBe(true);
    });

    it('should enforce limit at boundary (exactly at limit)', () => {
      const player = createTestPlayer({ position: 'QB' });
      const roster = createTestPlayers(3, { position: 'QB' });
      const limits = { QB: 3, RB: 6, WR: 8, TE: 3 };
      const result = validatePositionLimit(player, roster, limits);
      expect(result.valid).toBe(false); // At limit, can't add more
    });

    it('should allow pick one below limit', () => {
      const player = createTestPlayer({ position: 'QB' });
      const roster = createTestPlayers(2, { position: 'QB' });
      const limits = { QB: 3, RB: 6, WR: 8, TE: 3 };
      const result = validatePositionLimit(player, roster, limits);
      expect(result.valid).toBe(true);
    });
  });
});

// ============================================================================
// validateTimer() TESTS
// ============================================================================

describe('validateTimer', () => {
  describe('happy path - timer running normally', () => {
    it('should pass when timer has time remaining and not in grace period', () => {
      const result = validateTimer(20, false);
      expect(result.valid).toBe(true);
    });

    it('should pass with 1 second remaining', () => {
      const result = validateTimer(1, false);
      expect(result.valid).toBe(true);
    });

    it('should pass with many seconds remaining', () => {
      const result = validateTimer(100, false);
      expect(result.valid).toBe(true);
    });
  });

  describe('happy path - grace period', () => {
    it('should pass when in grace period even with negative time', () => {
      const result = validateTimer(-5, true);
      expect(result.valid).toBe(true);
    });

    it('should pass when in grace period with zero time', () => {
      const result = validateTimer(0, true);
      expect(result.valid).toBe(true);
    });

    it('should pass when in grace period with positive time', () => {
      const result = validateTimer(5, true);
      expect(result.valid).toBe(true);
    });
  });

  describe('error cases', () => {
    it('should fail when timer expired and not in grace period', () => {
      const result = validateTimer(0, false);
      expect(result.valid).toBe(false);
      expect(result.errorCode).toBe('TIMER_EXPIRED');
      expect(result.errorMessage).toBe(VALIDATION_ERROR_MESSAGES.TIMER_EXPIRED);
    });

    it('should fail with negative time outside grace period', () => {
      const result = validateTimer(-1, false);
      expect(result.valid).toBe(false);
      expect(result.errorCode).toBe('TIMER_EXPIRED');
    });

    it('should fail with very negative time', () => {
      const result = validateTimer(-100, false);
      expect(result.valid).toBe(false);
      expect(result.errorCode).toBe('TIMER_EXPIRED');
    });
  });

  describe('edge cases', () => {
    it('should handle zero seconds remaining exactly at boundary', () => {
      expect(validateTimer(0, false).valid).toBe(false); // Expired
      expect(validateTimer(0, true).valid).toBe(true);   // Grace period allows it
    });

    it('should be strict at expiration boundary', () => {
      expect(validateTimer(0.1, false).valid).toBe(true);
      expect(validateTimer(0, false).valid).toBe(false);
      expect(validateTimer(-0.1, false).valid).toBe(false);
    });

    it('should handle very small grace period times', () => {
      expect(validateTimer(0.001, true).valid).toBe(true);
      expect(validateTimer(-0.001, true).valid).toBe(true);
    });
  });
});

// ============================================================================
// validatePlayer() TESTS
// ============================================================================

describe('validatePlayer', () => {
  describe('happy path', () => {
    it('should pass with valid player object', () => {
      const player = createTestPlayer();
      const result = validatePlayer(player);
      expect(result.valid).toBe(true);
    });

    it('should pass with minimal valid player', () => {
      const player: DraftPlayer = {
        id: 'p1',
        name: 'Player Name',
        position: 'QB',
        team: 'KC',
        adp: 1,
      };
      const result = validatePlayer(player);
      expect(result.valid).toBe(true);
    });

    it('should pass with all fields populated', () => {
      const player = createTestPlayer({
        projectedPoints: 25.5,
        byeWeek: 5,
      });
      const result = validatePlayer(player);
      expect(result.valid).toBe(true);
    });
  });

  describe('error cases - null/undefined', () => {
    it('should fail when player is null', () => {
      const result = validatePlayer(null);
      expect(result.valid).toBe(false);
      expect(result.errorCode).toBe('INVALID_PLAYER');
      expect(result.errorMessage).toBe(VALIDATION_ERROR_MESSAGES.INVALID_PLAYER);
    });

    it('should fail when player is undefined', () => {
      const result = validatePlayer(undefined);
      expect(result.valid).toBe(false);
      expect(result.errorCode).toBe('INVALID_PLAYER');
    });
  });

  describe('error cases - missing required fields', () => {
    it('should fail when id is missing', () => {
      const player = createTestPlayer({ id: undefined as any });
      const result = validatePlayer(player);
      expect(result.valid).toBe(false);
      expect(result.errorCode).toBe('INVALID_PLAYER');
    });

    it('should fail when name is missing', () => {
      const player = createTestPlayer({ name: undefined as any });
      const result = validatePlayer(player);
      expect(result.valid).toBe(false);
      expect(result.errorCode).toBe('INVALID_PLAYER');
    });

    it('should fail when position is missing', () => {
      const player = createTestPlayer({ position: undefined as any });
      const result = validatePlayer(player);
      expect(result.valid).toBe(false);
      expect(result.errorCode).toBe('INVALID_PLAYER');
    });
  });

  describe('error cases - empty values', () => {
    it('should fail when id is empty string', () => {
      const player = createTestPlayer({ id: '' });
      const result = validatePlayer(player);
      expect(result.valid).toBe(false);
    });

    it('should fail when name is empty string', () => {
      const player = createTestPlayer({ name: '' });
      const result = validatePlayer(player);
      expect(result.valid).toBe(false);
    });

    it('should fail when position is empty string', () => {
      const player = createTestPlayer({ position: '' as any });
      const result = validatePlayer(player);
      expect(result.valid).toBe(false);
    });

    it('should pass when optional fields are empty/missing', () => {
      const player: DraftPlayer = {
        id: 'p1',
        name: 'Player',
        position: 'QB',
        team: '',
        adp: 1,
      };
      const result = validatePlayer(player);
      expect(result.valid).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle player with only required fields', () => {
      const minimal: DraftPlayer = {
        id: 'id1',
        name: 'Name',
        position: 'RB',
        team: 'TB',
        adp: 50,
      };
      expect(validatePlayer(minimal).valid).toBe(true);
    });

    it('should validate all valid positions', () => {
      const positions = ['QB', 'RB', 'WR', 'TE'] as const;
      positions.forEach(position => {
        const player = createTestPlayer({ position });
        expect(validatePlayer(player).valid).toBe(true);
      });
    });
  });
});

// ============================================================================
// validateManualPick() TESTS
// ============================================================================

describe('validateManualPick', () => {
  const defaultSetup = {
    player: createTestPlayer(),
    pickNumber: 1,
    userParticipantIndex: 0,
    teamCount: 12,
    pickedPlayerIds: new Set<string>(),
    currentRoster: [] as DraftPlayer[],
    positionLimits: DEFAULT_POSITION_LIMITS,
    draftStatus: 'active' as DraftStatus,
  };

  describe('happy path', () => {
    it('should pass with all valid inputs', () => {
      const result = validateManualPick(
        defaultSetup.player,
        defaultSetup.pickNumber,
        defaultSetup.userParticipantIndex,
        defaultSetup.teamCount,
        defaultSetup.pickedPlayerIds,
        defaultSetup.currentRoster,
        defaultSetup.positionLimits,
        defaultSetup.draftStatus
      );
      expect(result.valid).toBe(true);
    });

    it('should pass with complex roster and picked players', () => {
      const result = validateManualPick(
        createTestPlayer({ id: 'new-player' }),
        13,
        11,
        12,
        new Set(['player-1', 'player-2', 'player-3']),
        createTestPlayers(3, { position: 'QB' }),
        DEFAULT_POSITION_LIMITS,
        'active'
      );
      expect(result.valid).toBe(true);
    });
  });

  describe('validation order - returns first failure', () => {
    it('should fail on player validation before draft status', () => {
      const result = validateManualPick(
        null as any,
        1,
        0,
        12,
        new Set(),
        [],
        DEFAULT_POSITION_LIMITS,
        'loading'
      );
      expect(result.errorCode).toBe('INVALID_PLAYER');
    });

    it('should fail on draft status before turn check', () => {
      const result = validateManualPick(
        createTestPlayer(),
        1,
        1, // Not user's turn
        12,
        new Set(),
        [],
        DEFAULT_POSITION_LIMITS,
        'loading'
      );
      expect(result.errorCode).toBe('DRAFT_NOT_ACTIVE');
    });

    it('should fail on turn check before availability', () => {
      const result = validateManualPick(
        createTestPlayer(),
        2, // Not user's turn (user is 0)
        0,
        12,
        new Set(['player-1']), // Already picked
        [],
        DEFAULT_POSITION_LIMITS,
        'active'
      );
      expect(result.errorCode).toBe('NOT_YOUR_TURN');
    });

    it('should fail on availability before position limit', () => {
      const result = validateManualPick(
        createTestPlayer({ position: 'QB' }),
        1,
        0,
        12,
        new Set(['player-1']), // Already picked
        createTestPlayers(3, { position: 'QB' }), // At limit
        DEFAULT_POSITION_LIMITS,
        'active'
      );
      expect(result.errorCode).toBe('PLAYER_UNAVAILABLE');
    });

    it('should fail on position limit last', () => {
      const result = validateManualPick(
        createTestPlayer({ position: 'QB' }),
        1,
        0,
        12,
        new Set(), // Not picked
        createTestPlayers(3, { position: 'QB' }), // At limit
        DEFAULT_POSITION_LIMITS,
        'active'
      );
      expect(result.errorCode).toBe('POSITION_LIMIT_REACHED');
    });
  });

  describe('individual validation failures', () => {
    it('should fail when player is invalid', () => {
      const result = validateManualPick(
        undefined as any,
        1,
        0,
        12,
        new Set(),
        [],
        DEFAULT_POSITION_LIMITS,
        'active'
      );
      expect(result.valid).toBe(false);
      expect(result.errorCode).toBe('INVALID_PLAYER');
    });

    it('should fail when draft not active', () => {
      const result = validateManualPick(
        createTestPlayer(),
        1,
        0,
        12,
        new Set(),
        [],
        DEFAULT_POSITION_LIMITS,
        'paused'
      );
      expect(result.valid).toBe(false);
      expect(result.errorCode).toBe('DRAFT_NOT_ACTIVE');
    });

    it('should fail when not user\'s turn', () => {
      const result = validateManualPick(
        createTestPlayer(),
        2,
        0,
        12,
        new Set(),
        [],
        DEFAULT_POSITION_LIMITS,
        'active'
      );
      expect(result.valid).toBe(false);
      expect(result.errorCode).toBe('NOT_YOUR_TURN');
    });

    it('should fail when player already picked', () => {
      const result = validateManualPick(
        createTestPlayer({ id: 'player-1' }),
        1,
        0,
        12,
        new Set(['player-1']),
        [],
        DEFAULT_POSITION_LIMITS,
        'active'
      );
      expect(result.valid).toBe(false);
      expect(result.errorCode).toBe('PLAYER_UNAVAILABLE');
    });

    it('should fail when position limit reached', () => {
      const result = validateManualPick(
        createTestPlayer({ position: 'QB' }),
        1,
        0,
        12,
        new Set(),
        createTestPlayers(3, { position: 'QB' }),
        DEFAULT_POSITION_LIMITS,
        'active'
      );
      expect(result.valid).toBe(false);
      expect(result.errorCode).toBe('POSITION_LIMIT_REACHED');
    });
  });

  describe('edge cases', () => {
    it('should handle picks during snake round', () => {
      const result = validateManualPick(
        createTestPlayer(),
        13,
        11, // Last participant goes first in snake
        12,
        new Set(),
        [],
        DEFAULT_POSITION_LIMITS,
        'active'
      );
      expect(result.valid).toBe(true);
    });

    it('should allow different team counts', () => {
      const result = validateManualPick(
        createTestPlayer(),
        1,
        0,
        8, // 8-team draft
        new Set(),
        [],
        DEFAULT_POSITION_LIMITS,
        'active'
      );
      expect(result.valid).toBe(true);
    });

    it('should work with empty roster', () => {
      const result = validateManualPick(
        createTestPlayer(),
        1,
        0,
        12,
        new Set(),
        [],
        DEFAULT_POSITION_LIMITS,
        'active'
      );
      expect(result.valid).toBe(true);
    });
  });
});

// ============================================================================
// validateAutopick() TESTS
// ============================================================================

describe('validateAutopick', () => {
  const defaultSetup = {
    player: createTestPlayer(),
    pickedPlayerIds: new Set<string>(),
    currentRoster: [] as DraftPlayer[],
    positionLimits: DEFAULT_POSITION_LIMITS,
    draftStatus: 'active' as DraftStatus,
  };

  describe('happy path', () => {
    it('should pass with all valid inputs', () => {
      const result = validateAutopick(
        defaultSetup.player,
        defaultSetup.pickedPlayerIds,
        defaultSetup.currentRoster,
        defaultSetup.positionLimits,
        defaultSetup.draftStatus
      );
      expect(result.valid).toBe(true);
    });

    it('should pass with populated roster and picked set', () => {
      const result = validateAutopick(
        createTestPlayer({ id: 'new-player', position: 'RB' }),
        new Set(['player-1', 'player-2']),
        createTestPlayers(3, { position: 'QB' }),
        DEFAULT_POSITION_LIMITS,
        'active'
      );
      expect(result.valid).toBe(true);
    });
  });

  describe('differs from validateManualPick', () => {
    it('should not check turn (autopick does not require turn validation)', () => {
      // This would fail in validateManualPick but pass in validateAutopick
      const result = validateAutopick(
        createTestPlayer(),
        new Set(),
        [],
        DEFAULT_POSITION_LIMITS,
        'active'
      );
      expect(result.valid).toBe(true);
    });

    it('should still validate player', () => {
      const result = validateAutopick(
        null as any,
        new Set(),
        [],
        DEFAULT_POSITION_LIMITS,
        'active'
      );
      expect(result.valid).toBe(false);
      expect(result.errorCode).toBe('INVALID_PLAYER');
    });

    it('should still validate draft active', () => {
      const result = validateAutopick(
        createTestPlayer(),
        new Set(),
        [],
        DEFAULT_POSITION_LIMITS,
        'paused'
      );
      expect(result.valid).toBe(false);
      expect(result.errorCode).toBe('DRAFT_NOT_ACTIVE');
    });

    it('should still validate player available', () => {
      const result = validateAutopick(
        createTestPlayer({ id: 'player-1' }),
        new Set(['player-1']),
        [],
        DEFAULT_POSITION_LIMITS,
        'active'
      );
      expect(result.valid).toBe(false);
      expect(result.errorCode).toBe('PLAYER_UNAVAILABLE');
    });

    it('should still validate position limit', () => {
      const result = validateAutopick(
        createTestPlayer({ position: 'QB' }),
        new Set(),
        createTestPlayers(3, { position: 'QB' }),
        DEFAULT_POSITION_LIMITS,
        'active'
      );
      expect(result.valid).toBe(false);
      expect(result.errorCode).toBe('POSITION_LIMIT_REACHED');
    });
  });

  describe('validation order - returns first failure', () => {
    it('should fail on player validation first', () => {
      const result = validateAutopick(
        { id: '' } as any, // Invalid player
        new Set(),
        createTestPlayers(3, { position: 'QB' }), // Position limit reached
        DEFAULT_POSITION_LIMITS,
        'loading' // Draft not active
      );
      expect(result.errorCode).toBe('INVALID_PLAYER');
    });

    it('should fail on draft status before availability', () => {
      const result = validateAutopick(
        createTestPlayer({ id: 'new-player' }),
        new Set(['new-player']), // Already picked
        [],
        DEFAULT_POSITION_LIMITS,
        'waiting' // Not active
      );
      expect(result.errorCode).toBe('DRAFT_NOT_ACTIVE');
    });

    it('should fail on availability before position limit', () => {
      const result = validateAutopick(
        createTestPlayer({ id: 'picked', position: 'QB' }),
        new Set(['picked']), // Already picked
        createTestPlayers(3, { position: 'QB' }), // Position limit reached
        DEFAULT_POSITION_LIMITS,
        'active'
      );
      expect(result.errorCode).toBe('PLAYER_UNAVAILABLE');
    });
  });

  describe('edge cases', () => {
    it('should work with large roster', () => {
      const result = validateAutopick(
        createTestPlayer({ position: 'TE' }),
        new Set(),
        createTestPlayers(15),
        DEFAULT_POSITION_LIMITS,
        'active'
      );
      expect(result.valid).toBe(true);
    });

    it('should work with many picked players', () => {
      const pickedIds = new Set<string>();
      for (let i = 0; i < 100; i++) {
        pickedIds.add(`player-${i}`);
      }
      const result = validateAutopick(
        createTestPlayer({ id: 'new-player' }),
        pickedIds,
        [],
        DEFAULT_POSITION_LIMITS,
        'active'
      );
      expect(result.valid).toBe(true);
    });
  });
});

// ============================================================================
// isValidationSuccess() TESTS
// ============================================================================

describe('isValidationSuccess', () => {
  describe('happy path', () => {
    it('should return true for successful validation', () => {
      const result: ValidationResult = { valid: true };
      expect(isValidationSuccess(result)).toBe(true);
    });
  });

  describe('error cases', () => {
    it('should return false for failed validation', () => {
      const result: ValidationResult = {
        valid: false,
        errorCode: 'NOT_YOUR_TURN',
        errorMessage: 'It is not your turn',
      };
      expect(isValidationSuccess(result)).toBe(false);
    });

    it('should return false even with error details', () => {
      const result: ValidationResult = {
        valid: false,
        errorCode: 'INVALID_PLAYER',
      };
      expect(isValidationSuccess(result)).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should only check valid property', () => {
      const result: ValidationResult = { valid: true, errorCode: 'NOT_YOUR_TURN' as any };
      expect(isValidationSuccess(result)).toBe(true);
    });

    it('should handle result from all validators', () => {
      expect(isValidationSuccess(validateDraftActive('active'))).toBe(true);
      expect(isValidationSuccess(validateDraftActive('paused'))).toBe(false);
      expect(isValidationSuccess(validatePlayer(createTestPlayer()))).toBe(true);
      expect(isValidationSuccess(validatePlayer(null))).toBe(false);
    });
  });
});

// ============================================================================
// getValidationError() TESTS
// ============================================================================

describe('getValidationError', () => {
  describe('happy path', () => {
    it('should return error message for failed validation', () => {
      const result = validateDraftActive('paused');
      const error = getValidationError(result);
      expect(error).toBe('The draft is not currently active');
    });

    it('should return different messages for different errors', () => {
      const notYourTurn = validateTurn(2, 0, 12);
      const playerUnavailable = validatePlayerAvailable(
        createTestPlayer({ id: 'p1' }),
        new Set(['p1'])
      );

      expect(getValidationError(notYourTurn)).toBe('It is not your turn to pick');
      expect(getValidationError(playerUnavailable)).toBe('This player has already been drafted');
    });
  });

  describe('error cases', () => {
    it('should return empty string for successful validation', () => {
      const result = validateDraftActive('active');
      const error = getValidationError(result);
      expect(error).toBe('');
    });

    it('should return empty string if errorMessage is undefined', () => {
      const result: ValidationResult = { valid: false };
      const error = getValidationError(result);
      expect(error).toBe('');
    });
  });

  describe('edge cases', () => {
    it('should handle all error codes', () => {
      const errorCodes: Array<{ result: ValidationResult; expected: string }> = [
        { result: validateDraftActive('paused'), expected: 'The draft is not currently active' },
        { result: validateTurn(2, 0, 12), expected: 'It is not your turn to pick' },
        {
          result: validatePlayerAvailable(createTestPlayer({ id: 'p1' }), new Set(['p1'])),
          expected: 'This player has already been drafted',
        },
        {
          result: validatePositionLimit(
            createTestPlayer({ position: 'QB' }),
            createTestPlayers(3, { position: 'QB' }),
            DEFAULT_POSITION_LIMITS
          ),
          expected: 'You have reached the limit for this position',
        },
        { result: validateTimer(0, false), expected: 'The pick timer has expired' },
        { result: validatePlayer(null), expected: 'Invalid player selection' },
      ];

      errorCodes.forEach(({ result, expected }) => {
        expect(getValidationError(result)).toBe(expected);
      });
    });
  });
});

// ============================================================================
// combineValidations() TESTS
// ============================================================================

describe('combineValidations', () => {
  describe('happy path', () => {
    it('should return success when all validations pass', () => {
      const result = combineValidations(
        validateDraftActive('active'),
        validatePlayer(createTestPlayer()),
        validateTimer(10, false)
      );
      expect(result.valid).toBe(true);
    });

    it('should work with single validation', () => {
      const result = combineValidations(validateDraftActive('active'));
      expect(result.valid).toBe(true);
    });

    it('should work with no validations (empty)', () => {
      const result = combineValidations();
      expect(result.valid).toBe(true);
    });
  });

  describe('error cases', () => {
    it('should return first failure', () => {
      const result = combineValidations(
        validateDraftActive('active'),
        validateDraftActive('paused'),
        validateDraftActive('waiting')
      );
      expect(result.valid).toBe(false);
      expect(result.errorCode).toBe('DRAFT_NOT_ACTIVE');
    });

    it('should short-circuit on first failure', () => {
      const result = combineValidations(
        validatePlayer(null),
        validateDraftActive('paused'),
        validateTimer(0, false)
      );
      expect(result.valid).toBe(false);
      expect(result.errorCode).toBe('INVALID_PLAYER');
    });

    it('should preserve error message', () => {
      const result = combineValidations(
        validateDraftActive('active'),
        validateTurn(2, 0, 12)
      );
      expect(result.valid).toBe(false);
      expect(result.errorMessage).toBe('It is not your turn to pick');
    });
  });

  describe('complex scenarios', () => {
    it('should validate pick from manual pick components', () => {
      const player = createTestPlayer();
      const result = combineValidations(
        validateDraftActive('active'),
        validateTurn(1, 0, 12),
        validatePlayer(player),
        validatePlayerAvailable(player, new Set()),
        validatePositionLimit(player, [], DEFAULT_POSITION_LIMITS)
      );
      expect(result.valid).toBe(true);
    });

    it('should validate pick from autopick components', () => {
      const player = createTestPlayer();
      const result = combineValidations(
        validateDraftActive('active'),
        validatePlayer(player),
        validatePlayerAvailable(player, new Set()),
        validatePositionLimit(player, [], DEFAULT_POSITION_LIMITS)
      );
      expect(result.valid).toBe(true);
    });

    it('should fail fast with many validations', () => {
      const result = combineValidations(
        validateDraftActive('active'),
        validateTurn(1, 0, 12),
        validatePlayer(null), // Fails here
        validateTimer(10, false),
        validatePlayerAvailable(createTestPlayer(), new Set()),
        validatePositionLimit(createTestPlayer(), [], DEFAULT_POSITION_LIMITS)
      );
      expect(result.valid).toBe(false);
      expect(result.errorCode).toBe('INVALID_PLAYER');
    });
  });

  describe('edge cases', () => {
    it('should handle variadic arguments correctly', () => {
      const validations = [
        validateDraftActive('active'),
        validatePlayer(createTestPlayer()),
      ];
      const result = combineValidations(...validations);
      expect(result.valid).toBe(true);
    });

    it('should work with spread operator', () => {
      const validations = [
        validateDraftActive('active'),
        validateTurn(1, 0, 12),
      ];
      const result = combineValidations(...validations);
      expect(result.valid).toBe(true);
    });

    it('should handle many validations', () => {
      const validations = Array.from({ length: 50 }, () => validateDraftActive('active'));
      const result = combineValidations(...validations);
      expect(result.valid).toBe(true);
    });

    it('should still fail with first of many failures', () => {
      const validations = [
        validateDraftActive('active'),
        validateDraftActive('active'),
        validateDraftActive('paused'), // First failure
        validatePlayer(null),
      ];
      const result = combineValidations(...validations);
      expect(result.valid).toBe(false);
      expect(result.errorCode).toBe('DRAFT_NOT_ACTIVE');
    });
  });
});

// ============================================================================
// INTEGRATION TESTS
// ============================================================================

describe('integration - real-world scenarios', () => {
  describe('valid draft scenario', () => {
    it('should validate first pick of draft', () => {
      const player = createTestPlayer({ id: 'mahomes' });
      const result = validateManualPick(
        player,
        1,
        0,
        12,
        new Set(),
        [],
        DEFAULT_POSITION_LIMITS,
        'active'
      );
      expect(isValidationSuccess(result)).toBe(true);
    });

    it('should validate mid-draft pick with populated roster', () => {
      const roster = [
        createTestPlayer({ id: 'p1', position: 'QB' }),
        createTestPlayer({ id: 'p2', position: 'RB' }),
        createTestPlayer({ id: 'p3', position: 'RB' }),
        createTestPlayer({ id: 'p4', position: 'WR' }),
      ];
      const pickedIds = new Set<string>();
      for (let i = 1; i <= 50; i++) {
        pickedIds.add(`drafted-${i}`);
      }

      const result = validateManualPick(
        createTestPlayer({ id: 'new', position: 'WR' }),
        51,
        5,
        12,
        pickedIds,
        roster,
        DEFAULT_POSITION_LIMITS,
        'active'
      );
      expect(isValidationSuccess(result)).toBe(true);
    });
  });

  describe('invalid draft scenarios', () => {
    it('should reject already-drafted player', () => {
      const pickedIds = new Set(['player-1']);
      const result = validateManualPick(
        createTestPlayer({ id: 'player-1' }),
        25,
        0,
        12,
        pickedIds,
        [],
        DEFAULT_POSITION_LIMITS,
        'active'
      );
      expect(isValidationSuccess(result)).toBe(false);
      expect(result.errorCode).toBe('PLAYER_UNAVAILABLE');
    });

    it('should reject when not user\'s turn', () => {
      const result = validateManualPick(
        createTestPlayer(),
        2,
        0,
        12,
        new Set(),
        [],
        DEFAULT_POSITION_LIMITS,
        'active'
      );
      expect(isValidationSuccess(result)).toBe(false);
      expect(result.errorCode).toBe('NOT_YOUR_TURN');
    });

    it('should reject when at position limit', () => {
      const roster = createTestPlayers(6, { position: 'RB' });
      const result = validateManualPick(
        createTestPlayer({ position: 'RB' }),
        25,
        0,
        12,
        new Set(),
        roster,
        DEFAULT_POSITION_LIMITS,
        'active'
      );
      expect(isValidationSuccess(result)).toBe(false);
      expect(result.errorCode).toBe('POSITION_LIMIT_REACHED');
    });

    it('should reject when draft is not active', () => {
      const result = validateManualPick(
        createTestPlayer(),
        1,
        0,
        12,
        new Set(),
        [],
        DEFAULT_POSITION_LIMITS,
        'complete'
      );
      expect(isValidationSuccess(result)).toBe(false);
      expect(result.errorCode).toBe('DRAFT_NOT_ACTIVE');
    });
  });

  describe('autopick vs manual pick differences', () => {
    it('should allow autopick to proceed without turn check', () => {
      const player = createTestPlayer();
      const manualResult = validateManualPick(player, 2, 0, 12, new Set(), [], DEFAULT_POSITION_LIMITS, 'active');
      const autopickResult = validateAutopick(player, new Set(), [], DEFAULT_POSITION_LIMITS, 'active');

      expect(manualResult.valid).toBe(false); // Not user's turn
      expect(autopickResult.valid).toBe(true); // No turn check
    });

    it('should validate all other constraints for autopick', () => {
      const pickedIds = new Set(['player-1']);
      const autopickResult = validateAutopick(
        createTestPlayer({ id: 'player-1' }),
        pickedIds,
        [],
        DEFAULT_POSITION_LIMITS,
        'active'
      );
      expect(autopickResult.valid).toBe(false);
      expect(autopickResult.errorCode).toBe('PLAYER_UNAVAILABLE');
    });
  });

  describe('error message consistency', () => {
    it('should provide consistent error messages', () => {
      const errors = [
        getValidationError(validateDraftActive('paused')),
        getValidationError(validateDraftActive('loading')),
        getValidationError(validateDraftActive('waiting')),
      ];
      expect(new Set(errors).size).toBe(1); // All same message
      expect(errors[0]).toBe('The draft is not currently active');
    });

    it('should distinguish between different error types', () => {
      const errorMessages = [
        getValidationError(validateDraftActive('paused')),
        getValidationError(validateTurn(2, 0, 12)),
        getValidationError(validateTimer(0, false)),
        getValidationError(validatePlayer(null)),
      ];
      expect(new Set(errorMessages).size).toBe(4); // All different
    });
  });
});
