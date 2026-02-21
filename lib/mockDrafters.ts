/**
 * Mock Drafter Names Index
 * This file contains an array of mock drafter names that can be randomly selected from
 * for creating mock drafts with simulated participants
 */

import { serverLogger } from './logger/serverLogger';

// ============================================================================
// DATA
// ============================================================================

export const MOCK_DRAFTER_NAMES: readonly string[] = [
  // NATO Phonetic Alphabet - First Set (1-26)
  'Alpha',
  'Bravo',
  'Charlie',
  'Delta',
  'Echo',
  'Foxtrot',
  'Golf',
  'Hotel',
  'India',
  'Juliet',
  'Kilo',
  'Lima',
  'Mike',
  'November',
  'Oscar',
  'Papa',
  'Quebec',
  'Romeo',
  'Sierra',
  'Tango',
  'Uniform',
  'Victor',
  'Whiskey',
  'X-Ray',
  'Yankee',
  'Zulu',

  // NATO Phonetic Alphabet - Second Set (27-52)
  'Alpha-2',
  'Bravo-2',
  'Charlie-2',
  'Delta-2',
  'Echo-2',
  'Foxtrot-2',
  'Golf-2',
  'Hotel-2',
  'India-2',
  'Juliet-2',
  'Kilo-2',
  'Lima-2',
  'Mike-2',
  'November-2',
  'Oscar-2',
  'Papa-2',
  'Quebec-2',
  'Romeo-2',
  'Sierra-2',
  'Tango-2',
  'Uniform-2',
  'Victor-2',
  'Whiskey-2',
  'X-Ray-2',
  'Yankee-2',
  'Zulu-2',
] as const;

// ============================================================================
// FUNCTIONS
// ============================================================================

/**
 * Fisher-Yates shuffle algorithm for unbiased random array shuffling.
 * @param {any[]} array - Array to shuffle in place
 * @returns {any[]} The shuffled array
 */
function fisherYatesShuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i]!, result[j]!] = [result[j]!, result[i]!];
  }
  return result;
}

/**
 * Get a random subset of mock drafter names.
 * Returns a shuffled array of mock drafter names limited to the requested count.
 * Uses Fisher-Yates shuffle for unbiased randomization.
 *
 * @param {number} [count=11] - Number of mock drafter names to return
 * @returns {string[]} Array of randomly selected mock drafter names
 * @throws Logs warning if no mock drafter names are available
 * @example
 * const drafters = getRandomMockDrafters(8);
 * // Returns: ['Alpha', 'Charlie', 'Delta', ...]
 */
export const getRandomMockDrafters = (count: number = 11): string[] => {
  if (MOCK_DRAFTER_NAMES.length === 0) {
    serverLogger.warn('No mock drafter names available in index');
    return [];
  }

  // Use Fisher-Yates shuffle for unbiased randomization
  const shuffled = fisherYatesShuffle([...MOCK_DRAFTER_NAMES]);
  return shuffled.slice(0, Math.min(count, MOCK_DRAFTER_NAMES.length));
};

/**
 * Get all available mock drafter names.
 * Returns a copy of the complete list of mock drafter names.
 *
 * @returns {string[]} Array of all mock drafter names
 * @example
 * const allDrafters = getAllMockDrafters();
 * // Returns: ['Alpha', 'Bravo', 'Charlie', ..., 'Zulu-2']
 */
export const getAllMockDrafters = (): string[] => {
  return [...MOCK_DRAFTER_NAMES];
};
