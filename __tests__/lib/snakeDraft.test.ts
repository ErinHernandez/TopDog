/**
 * Comprehensive Unit Tests for Snake Draft Calculations
 *
 * Tests all functions in components/vx2/draft-logic/utils/snakeDraft.ts
 * Target: 100% coverage
 *
 * Snake Draft Pattern:
 * - Odd rounds (1, 3, 5...): forward order 0 → 11
 * - Even rounds (2, 4, 6...): reverse order 11 → 0 (snake back)
 */

import {
  getParticipantForPick,
  getRoundForPick,
  getPickInRound,
  isSnakeRound,
  getPickNumbersForParticipant,
  isPickForParticipant,
  getPicksUntilTurn,
  getNextPickForParticipant,
  formatPickNumber,
  parsePickNumber,
  isValidPickNumber,
  getTotalPicks,
} from '../../components/vx2/draft-logic/utils/snakeDraft';

describe('Snake Draft Calculations', () => {
  // Standard configuration
  const DEFAULT_TEAM_COUNT = 12;
  const DEFAULT_ROUNDS = 18;
  const TOTAL_PICKS = 216; // 12 × 18

  // =========================================================================
  // getParticipantForPick
  // =========================================================================
  describe('getParticipantForPick', () => {
    describe('Round 1 (forward order: 0 → 11)', () => {
      it.each([
        [1, 0, 'First pick goes to participant 0'],
        [2, 1, 'Second pick goes to participant 1'],
        [6, 5, 'Middle of round'],
        [11, 10, 'Second to last pick'],
        [12, 11, 'Last pick of round 1 goes to participant 11'],
      ])('pick %i → participant %i (%s)', (pick, expected) => {
        expect(getParticipantForPick(pick, 12)).toBe(expected);
      });
    });

    describe('Round 2 (snake order: 11 → 0)', () => {
      it.each([
        [13, 11, 'First pick of round 2 stays with participant 11'],
        [14, 10, 'Snake reversal'],
        [18, 6, 'Middle of round 2'],
        [23, 1, 'Near end of round 2'],
        [24, 0, 'Last pick of round 2 goes to participant 0'],
      ])('pick %i → participant %i (%s)', (pick, expected) => {
        expect(getParticipantForPick(pick, 12)).toBe(expected);
      });
    });

    describe('Round 3 (forward order again)', () => {
      it.each([
        [25, 0, 'First pick of round 3 goes to participant 0'],
        [30, 5, 'Middle of round 3'],
        [36, 11, 'Last pick of round 3'],
      ])('pick %i → participant %i (%s)', (pick, expected) => {
        expect(getParticipantForPick(pick, 12)).toBe(expected);
      });
    });

    describe('Round 4 (snake order)', () => {
      it.each([
        [37, 11, 'First pick of round 4'],
        [48, 0, 'Last pick of round 4'],
      ])('pick %i → participant %i (%s)', (pick, expected) => {
        expect(getParticipantForPick(pick, 12)).toBe(expected);
      });
    });

    describe('final rounds', () => {
      it('pick 205 (round 18, first pick) → participant 11', () => {
        // Round 18 is even, so snake order
        expect(getParticipantForPick(205, 12)).toBe(11);
      });

      it('pick 216 (final pick) → participant 0', () => {
        // Last pick goes to participant 0 (snake back in round 18)
        expect(getParticipantForPick(216, 12)).toBe(0);
      });
    });

    describe('edge cases', () => {
      it('returns 0 for pick number 0', () => {
        expect(getParticipantForPick(0, 12)).toBe(0);
      });

      it('returns 0 for negative pick numbers', () => {
        expect(getParticipantForPick(-1, 12)).toBe(0);
        expect(getParticipantForPick(-100, 12)).toBe(0);
      });

      it('returns 0 for team count 0', () => {
        expect(getParticipantForPick(1, 0)).toBe(0);
      });

      it('returns 0 for negative team count', () => {
        expect(getParticipantForPick(1, -5)).toBe(0);
      });

      it('handles single team (team count = 1)', () => {
        expect(getParticipantForPick(1, 1)).toBe(0);
        expect(getParticipantForPick(5, 1)).toBe(0);
      });
    });

    describe('non-standard team counts', () => {
      it('works with 10 teams', () => {
        expect(getParticipantForPick(1, 10)).toBe(0);
        expect(getParticipantForPick(10, 10)).toBe(9);
        expect(getParticipantForPick(11, 10)).toBe(9); // Snake
        expect(getParticipantForPick(20, 10)).toBe(0);
      });

      it('works with 8 teams', () => {
        expect(getParticipantForPick(1, 8)).toBe(0);
        expect(getParticipantForPick(8, 8)).toBe(7);
        expect(getParticipantForPick(9, 8)).toBe(7); // Snake
        expect(getParticipantForPick(16, 8)).toBe(0);
      });

      it('works with 14 teams', () => {
        expect(getParticipantForPick(1, 14)).toBe(0);
        expect(getParticipantForPick(14, 14)).toBe(13);
        expect(getParticipantForPick(15, 14)).toBe(13); // Snake
        expect(getParticipantForPick(28, 14)).toBe(0);
      });
    });

    describe('uses default team count', () => {
      it('defaults to 12 teams when not specified', () => {
        expect(getParticipantForPick(1)).toBe(0);
        expect(getParticipantForPick(12)).toBe(11);
        expect(getParticipantForPick(13)).toBe(11);
      });
    });
  });

  // =========================================================================
  // getRoundForPick
  // =========================================================================
  describe('getRoundForPick', () => {
    it.each([
      [1, 1, 'First pick is round 1'],
      [12, 1, 'Last pick of round 1'],
      [13, 2, 'First pick of round 2'],
      [24, 2, 'Last pick of round 2'],
      [25, 3, 'First pick of round 3'],
      [36, 3, 'Last pick of round 3'],
      [100, 9, 'Pick 100 is round 9'],
      [216, 18, 'Final pick is round 18'],
    ])('pick %i → round %i (%s)', (pick, expectedRound) => {
      expect(getRoundForPick(pick, 12)).toBe(expectedRound);
    });

    describe('edge cases', () => {
      it('returns 1 for pick 0', () => {
        expect(getRoundForPick(0, 12)).toBe(1);
      });

      it('returns 1 for negative pick numbers', () => {
        expect(getRoundForPick(-5, 12)).toBe(1);
      });

      it('returns 1 for team count 0', () => {
        expect(getRoundForPick(10, 0)).toBe(1);
      });
    });

    describe('non-standard team counts', () => {
      it('works with 10 teams', () => {
        expect(getRoundForPick(10, 10)).toBe(1);
        expect(getRoundForPick(11, 10)).toBe(2);
        expect(getRoundForPick(20, 10)).toBe(2);
        expect(getRoundForPick(21, 10)).toBe(3);
      });
    });
  });

  // =========================================================================
  // getPickInRound
  // =========================================================================
  describe('getPickInRound', () => {
    it.each([
      [1, 1, 'First pick is position 1 in round'],
      [6, 6, 'Middle of round 1'],
      [12, 12, 'Last pick in round 1'],
      [13, 1, 'First pick in round 2'],
      [15, 3, 'Third pick in round 2'],
      [24, 12, 'Last pick in round 2'],
      [25, 1, 'First pick in round 3'],
    ])('pick %i → position %i in round (%s)', (pick, expectedPosition) => {
      expect(getPickInRound(pick, 12)).toBe(expectedPosition);
    });

    describe('edge cases', () => {
      it('returns 1 for pick 0', () => {
        expect(getPickInRound(0, 12)).toBe(1);
      });

      it('returns 1 for negative picks', () => {
        expect(getPickInRound(-5, 12)).toBe(1);
      });

      it('returns 1 for team count 0', () => {
        expect(getPickInRound(5, 0)).toBe(1);
      });
    });

    describe('non-standard team counts', () => {
      it('works with 10 teams', () => {
        expect(getPickInRound(1, 10)).toBe(1);
        expect(getPickInRound(10, 10)).toBe(10);
        expect(getPickInRound(11, 10)).toBe(1);
        expect(getPickInRound(15, 10)).toBe(5);
      });
    });
  });

  // =========================================================================
  // isSnakeRound
  // =========================================================================
  describe('isSnakeRound', () => {
    describe('odd rounds are NOT snake rounds (forward order)', () => {
      it.each([1, 3, 5, 7, 9, 11, 13, 15, 17])(
        'round %i is NOT a snake round',
        (round) => {
          expect(isSnakeRound(round)).toBe(false);
        }
      );
    });

    describe('even rounds ARE snake rounds (reverse order)', () => {
      it.each([2, 4, 6, 8, 10, 12, 14, 16, 18])(
        'round %i IS a snake round',
        (round) => {
          expect(isSnakeRound(round)).toBe(true);
        }
      );
    });

    it('round 0 is considered even (snake)', () => {
      expect(isSnakeRound(0)).toBe(true);
    });

    it('negative rounds follow even/odd pattern', () => {
      expect(isSnakeRound(-1)).toBe(false); // -1 is odd
      expect(isSnakeRound(-2)).toBe(true);  // -2 is even
    });
  });

  // =========================================================================
  // getPickNumbersForParticipant
  // =========================================================================
  describe('getPickNumbersForParticipant', () => {
    it('returns 18 picks for each participant in standard draft', () => {
      for (let p = 0; p < 12; p++) {
        const picks = getPickNumbersForParticipant(p, 12, 18);
        expect(picks).toHaveLength(18);
      }
    });

    it('participant 0 gets correct picks', () => {
      const picks = getPickNumbersForParticipant(0, 12, 18);

      // Round 1: pick 1 (forward)
      expect(picks[0]).toBe(1);
      // Round 2: pick 24 (snake back to 0)
      expect(picks[1]).toBe(24);
      // Round 3: pick 25 (forward)
      expect(picks[2]).toBe(25);
      // Round 4: pick 48 (snake)
      expect(picks[3]).toBe(48);
      // Final pick
      expect(picks[17]).toBe(216);
    });

    it('participant 11 gets correct picks', () => {
      const picks = getPickNumbersForParticipant(11, 12, 18);

      // Round 1: pick 12 (last in forward)
      expect(picks[0]).toBe(12);
      // Round 2: pick 13 (first in snake)
      expect(picks[1]).toBe(13);
      // Round 3: pick 36 (last in forward)
      expect(picks[2]).toBe(36);
      // Round 4: pick 37 (first in snake)
      expect(picks[3]).toBe(37);
    });

    it('participant 5 (middle) gets correct picks', () => {
      const picks = getPickNumbersForParticipant(5, 12, 18);

      // Round 1: pick 6
      expect(picks[0]).toBe(6);
      // Round 2: participant 5 is at position 6 from end = pick 19
      expect(picks[1]).toBe(19);
    });

    it('each pick appears exactly once across all participants', () => {
      const allPicks = new Set<number>();

      for (let p = 0; p < 12; p++) {
        const participantPicks = getPickNumbersForParticipant(p, 12, 18);
        for (const pick of participantPicks) {
          expect(allPicks.has(pick)).toBe(false);
          allPicks.add(pick);
        }
      }

      expect(allPicks.size).toBe(216);
    });

    it('handles different team counts', () => {
      const picks = getPickNumbersForParticipant(0, 10, 5);
      expect(picks).toHaveLength(5);
      expect(picks[0]).toBe(1);
      expect(picks[1]).toBe(20); // Snake back in round 2
    });

    it('uses default values', () => {
      const picks = getPickNumbersForParticipant(0);
      expect(picks).toHaveLength(18);
    });
  });

  // =========================================================================
  // isPickForParticipant
  // =========================================================================
  describe('isPickForParticipant', () => {
    it('returns true when pick belongs to participant', () => {
      expect(isPickForParticipant(1, 0, 12)).toBe(true);
      expect(isPickForParticipant(12, 11, 12)).toBe(true);
      expect(isPickForParticipant(13, 11, 12)).toBe(true); // Snake
      expect(isPickForParticipant(24, 0, 12)).toBe(true);  // Snake back
    });

    it('returns false when pick does not belong to participant', () => {
      expect(isPickForParticipant(1, 1, 12)).toBe(false);
      expect(isPickForParticipant(1, 11, 12)).toBe(false);
      expect(isPickForParticipant(12, 0, 12)).toBe(false);
      expect(isPickForParticipant(13, 0, 12)).toBe(false);
    });

    it('is consistent with getPickNumbersForParticipant', () => {
      for (let p = 0; p < 12; p++) {
        const myPicks = getPickNumbersForParticipant(p, 12, 18);

        for (let pick = 1; pick <= 216; pick++) {
          const expected = myPicks.includes(pick);
          expect(isPickForParticipant(pick, p, 12)).toBe(expected);
        }
      }
    });
  });

  // =========================================================================
  // getPicksUntilTurn
  // =========================================================================
  describe('getPicksUntilTurn', () => {
    it('returns 0 when it is already their turn', () => {
      expect(getPicksUntilTurn(1, 0, 12, 18)).toBe(0);
      expect(getPicksUntilTurn(12, 11, 12, 18)).toBe(0);
      expect(getPicksUntilTurn(13, 11, 12, 18)).toBe(0); // Snake
    });

    it('calculates distance to next pick correctly', () => {
      // Current pick 1, participant 1 picks next at 2
      expect(getPicksUntilTurn(1, 1, 12, 18)).toBe(1);

      // Current pick 1, participant 11 picks at 12
      expect(getPicksUntilTurn(1, 11, 12, 18)).toBe(11);

      // Current pick 5, participant 0's next pick is 24
      expect(getPicksUntilTurn(5, 0, 12, 18)).toBe(19);

      // Current pick 13, participant 0 picks at 24
      expect(getPicksUntilTurn(13, 0, 12, 18)).toBe(11);
    });

    it('returns -1 when no more picks remaining', () => {
      // After pick 216, no more picks
      expect(getPicksUntilTurn(217, 0, 12, 18)).toBe(-1);
      expect(getPicksUntilTurn(300, 5, 12, 18)).toBe(-1);
    });

    it('returns -1 when at final pick for that participant', () => {
      // Participant 0's last pick is 216
      // After pick 216, participant 0 has no more picks
      const picks = getPickNumbersForParticipant(0, 12, 18);
      const lastPick = picks[picks.length - 1];
      expect(getPicksUntilTurn(lastPick + 1, 0, 12, 18)).toBe(-1);
    });
  });

  // =========================================================================
  // getNextPickForParticipant
  // =========================================================================
  describe('getNextPickForParticipant', () => {
    it('returns next pick number after given pick', () => {
      // Participant 0: picks at 1, 24, 25, ...
      expect(getNextPickForParticipant(1, 0, 12, 18)).toBe(24);
      expect(getNextPickForParticipant(24, 0, 12, 18)).toBe(25);
      expect(getNextPickForParticipant(25, 0, 12, 18)).toBe(48);

      // Participant 11: picks at 12, 13, 36, 37, ...
      expect(getNextPickForParticipant(12, 11, 12, 18)).toBe(13);
      expect(getNextPickForParticipant(13, 11, 12, 18)).toBe(36);
    });

    it('returns null when no more picks', () => {
      // Participant 0's last pick is 216
      expect(getNextPickForParticipant(216, 0, 12, 18)).toBe(null);

      // Way past the draft
      expect(getNextPickForParticipant(300, 5, 12, 18)).toBe(null);
    });

    it('returns first pick when called with 0', () => {
      expect(getNextPickForParticipant(0, 0, 12, 18)).toBe(1);
      expect(getNextPickForParticipant(0, 11, 12, 18)).toBe(12);
    });
  });

  // =========================================================================
  // formatPickNumber
  // =========================================================================
  describe('formatPickNumber', () => {
    it.each([
      [1, '1.01'],
      [12, '1.12'],
      [13, '2.01'],
      [24, '2.12'],
      [25, '3.01'],
      [100, '9.04'],
      [145, '13.01'],
      [216, '18.12'],
    ])('pick %i → "%s"', (pick, expected) => {
      expect(formatPickNumber(pick, 12)).toBe(expected);
    });

    it('pads single digit pick positions with leading zero', () => {
      expect(formatPickNumber(1, 12)).toBe('1.01');
      expect(formatPickNumber(9, 12)).toBe('1.09');
      expect(formatPickNumber(10, 12)).toBe('1.10');
    });

    it('handles non-standard team counts', () => {
      expect(formatPickNumber(1, 10)).toBe('1.01');
      expect(formatPickNumber(10, 10)).toBe('1.10');
      expect(formatPickNumber(11, 10)).toBe('2.01');
    });

    it('uses default team count', () => {
      expect(formatPickNumber(1)).toBe('1.01');
      expect(formatPickNumber(13)).toBe('2.01');
    });
  });

  // =========================================================================
  // parsePickNumber
  // =========================================================================
  describe('parsePickNumber', () => {
    it.each([
      ['1.01', 1],
      ['1.12', 12],
      ['2.01', 13],
      ['2.12', 24],
      ['3.01', 25],
      ['9.04', 100],
      ['13.01', 145],
      ['18.12', 216],
    ])('"%s" → pick %i', (formatted, expected) => {
      expect(parsePickNumber(formatted, 12)).toBe(expected);
    });

    describe('invalid formats', () => {
      it('returns null for non-matching format', () => {
        expect(parsePickNumber('invalid', 12)).toBe(null);
        expect(parsePickNumber('1-01', 12)).toBe(null);
        expect(parsePickNumber('1/01', 12)).toBe(null);
        expect(parsePickNumber('1_01', 12)).toBe(null);
        expect(parsePickNumber('round1pick1', 12)).toBe(null);
      });

      it('returns null for empty string', () => {
        expect(parsePickNumber('', 12)).toBe(null);
      });

      it('returns null for whitespace', () => {
        expect(parsePickNumber('  ', 12)).toBe(null);
        expect(parsePickNumber(' 1.01 ', 12)).toBe(null);
      });
    });

    describe('out of range values', () => {
      it('returns null for round 0', () => {
        expect(parsePickNumber('0.01', 12)).toBe(null);
      });

      it('returns null for pick 0 in round', () => {
        expect(parsePickNumber('1.00', 12)).toBe(null);
      });

      it('returns null for pick greater than team count', () => {
        expect(parsePickNumber('1.13', 12)).toBe(null);
        expect(parsePickNumber('1.99', 12)).toBe(null);
      });

      it('returns null for negative values', () => {
        expect(parsePickNumber('-1.01', 12)).toBe(null);
        expect(parsePickNumber('1.-01', 12)).toBe(null);
      });
    });

    describe('round-trip consistency', () => {
      it('format then parse returns original pick number', () => {
        for (let pick = 1; pick <= 216; pick++) {
          const formatted = formatPickNumber(pick, 12);
          const parsed = parsePickNumber(formatted, 12);
          expect(parsed).toBe(pick);
        }
      });
    });
  });

  // =========================================================================
  // isValidPickNumber
  // =========================================================================
  describe('isValidPickNumber', () => {
    it('returns true for valid pick numbers', () => {
      expect(isValidPickNumber(1, 12, 18)).toBe(true);
      expect(isValidPickNumber(100, 12, 18)).toBe(true);
      expect(isValidPickNumber(216, 12, 18)).toBe(true);
    });

    it('returns false for pick 0', () => {
      expect(isValidPickNumber(0, 12, 18)).toBe(false);
    });

    it('returns false for negative picks', () => {
      expect(isValidPickNumber(-1, 12, 18)).toBe(false);
      expect(isValidPickNumber(-100, 12, 18)).toBe(false);
    });

    it('returns false for picks beyond total', () => {
      expect(isValidPickNumber(217, 12, 18)).toBe(false);
      expect(isValidPickNumber(1000, 12, 18)).toBe(false);
    });

    it('handles different configurations', () => {
      expect(isValidPickNumber(100, 10, 10)).toBe(true);  // 10 × 10 = 100
      expect(isValidPickNumber(101, 10, 10)).toBe(false);

      expect(isValidPickNumber(64, 8, 8)).toBe(true);   // 8 × 8 = 64
      expect(isValidPickNumber(65, 8, 8)).toBe(false);
    });

    it('uses default values', () => {
      expect(isValidPickNumber(1)).toBe(true);
      expect(isValidPickNumber(216)).toBe(true);
      expect(isValidPickNumber(217)).toBe(false);
    });
  });

  // =========================================================================
  // getTotalPicks
  // =========================================================================
  describe('getTotalPicks', () => {
    it('calculates total picks correctly', () => {
      expect(getTotalPicks(12, 18)).toBe(216);
      expect(getTotalPicks(10, 20)).toBe(200);
      expect(getTotalPicks(8, 15)).toBe(120);
      expect(getTotalPicks(14, 16)).toBe(224);
    });

    it('uses default values', () => {
      expect(getTotalPicks()).toBe(216);
    });

    it('handles edge cases', () => {
      expect(getTotalPicks(1, 1)).toBe(1);
      expect(getTotalPicks(100, 1)).toBe(100);
      expect(getTotalPicks(1, 100)).toBe(100);
    });
  });

  // =========================================================================
  // Integration / Consistency Tests
  // =========================================================================
  describe('Integration Tests', () => {
    describe('all picks map to exactly one participant', () => {
      it('every pick 1-216 belongs to exactly one participant', () => {
        const participantCounts = new Map<number, number>();

        for (let pick = 1; pick <= 216; pick++) {
          const participant = getParticipantForPick(pick, 12);
          participantCounts.set(
            participant,
            (participantCounts.get(participant) || 0) + 1
          );
        }

        // Each of 12 participants should have exactly 18 picks
        expect(participantCounts.size).toBe(12);
        for (let p = 0; p < 12; p++) {
          expect(participantCounts.get(p)).toBe(18);
        }
      });
    });

    describe('snake pattern verification', () => {
      it('round 1 goes 0 → 11 (forward)', () => {
        const round1 = [];
        for (let pick = 1; pick <= 12; pick++) {
          round1.push(getParticipantForPick(pick, 12));
        }
        expect(round1).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
      });

      it('round 2 goes 11 → 0 (snake back)', () => {
        const round2 = [];
        for (let pick = 13; pick <= 24; pick++) {
          round2.push(getParticipantForPick(pick, 12));
        }
        expect(round2).toEqual([11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0]);
      });

      it('participant at end of round gets back-to-back picks', () => {
        // Participant 11 picks at 12 and 13 (round 1 end, round 2 start)
        expect(getParticipantForPick(12, 12)).toBe(11);
        expect(getParticipantForPick(13, 12)).toBe(11);

        // Participant 0 picks at 24 and 25 (round 2 end, round 3 start)
        expect(getParticipantForPick(24, 12)).toBe(0);
        expect(getParticipantForPick(25, 12)).toBe(0);
      });
    });

    describe('function consistency', () => {
      it('getRoundForPick and getPickInRound are consistent', () => {
        for (let pick = 1; pick <= 216; pick++) {
          const round = getRoundForPick(pick, 12);
          const posInRound = getPickInRound(pick, 12);

          // Reconstruct pick number
          const reconstructed = (round - 1) * 12 + posInRound;
          expect(reconstructed).toBe(pick);
        }
      });

      it('isPickForParticipant matches getParticipantForPick', () => {
        for (let pick = 1; pick <= 216; pick++) {
          const participant = getParticipantForPick(pick, 12);

          // This participant should own this pick
          expect(isPickForParticipant(pick, participant, 12)).toBe(true);

          // No other participant should own this pick
          for (let p = 0; p < 12; p++) {
            if (p !== participant) {
              expect(isPickForParticipant(pick, p, 12)).toBe(false);
            }
          }
        }
      });
    });
  });
});
