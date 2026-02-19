/**
 * Custom Rankings Utility Functions
 * Manages user-defined player rankings stored in localStorage
 */

import { createScopedLogger } from './clientLogger';

const logger = createScopedLogger('[CustomRankings]');

// ============================================================================
// TYPES
// ============================================================================

export type CustomRankings = string[];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get custom ranking for a player
 * @param playerName - The name of the player
 * @param customRankings - Array of player names in ranking order
 * @returns The ranking number as a string, or '-' if not found
 */
export const getCustomPlayerRanking = (
  playerName: string,
  customRankings: CustomRankings = []
): string => {
  const index = customRankings.indexOf(playerName);
  const rank = index !== -1 ? index + 1 : null;
  return rank ? rank.toString() : '-';
};

/**
 * Load custom rankings from localStorage
 * @returns Array of player names in ranking order
 */
export const loadCustomRankings = (): CustomRankings => {
  try {
    if (typeof window === 'undefined') {
      return [];
    }
    const stored = localStorage.getItem('customRankings');
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    logger.error('Error loading custom rankings', error instanceof Error ? error : new Error(String(error)));
    // Clear corrupted data from localStorage to prevent future errors
    try {
      localStorage.removeItem('customRankings');
    } catch (clearError) {
      // Ignore errors when clearing (e.g., in private browsing mode)
      logger.warn('Could not clear corrupted customRankings from localStorage');
    }
    return [];
  }
};

/**
 * Save custom rankings to localStorage
 * @param rankings - Array of player names in ranking order
 */
export const saveCustomRankings = (rankings: CustomRankings): void => {
  try {
    if (typeof window === 'undefined') {
      return;
    }
    localStorage.setItem('customRankings', JSON.stringify(rankings));
  } catch (error) {
    logger.error('Error saving custom rankings', error instanceof Error ? error : new Error(String(error)));
  }
};

/**
 * Clear custom rankings from localStorage
 */
export const clearCustomRankings = (): void => {
  try {
    if (typeof window === 'undefined') {
      return;
    }
    localStorage.removeItem('customRankings');
  } catch (error) {
    logger.error('Error clearing custom rankings', error instanceof Error ? error : new Error(String(error)));
  }
};

/**
 * Add a player to custom rankings
 * @param playerName - The name of the player to add
 * @param currentRankings - Current rankings array
 * @returns Updated rankings array
 */
export const addPlayerToRankings = (
  playerName: string,
  currentRankings: CustomRankings = []
): CustomRankings => {
  if (!currentRankings.includes(playerName)) {
    return [...currentRankings, playerName];
  }
  return currentRankings;
};

/**
 * Remove a player from custom rankings
 * @param playerName - The name of the player to remove
 * @param currentRankings - Current rankings array
 * @returns Updated rankings array
 */
export const removePlayerFromRankings = (
  playerName: string,
  currentRankings: CustomRankings = []
): CustomRankings => {
  return currentRankings.filter(name => name !== playerName);
};

/**
 * Move a player up in rankings
 * @param playerName - The name of the player to move up
 * @param currentRankings - Current rankings array
 * @returns Updated rankings array
 */
export const movePlayerUp = (
  playerName: string,
  currentRankings: CustomRankings = []
): CustomRankings => {
  const index = currentRankings.indexOf(playerName);
  if (index > 0) {
    const newRankings = [...currentRankings];
    [newRankings[index], newRankings[index - 1]] = [newRankings[index - 1]!, newRankings[index]!];
    return newRankings;
  }
  return currentRankings;
};

/**
 * Move a player down in rankings
 * @param playerName - The name of the player to move down
 * @param currentRankings - Current rankings array
 * @returns Updated rankings array
 */
export const movePlayerDown = (
  playerName: string,
  currentRankings: CustomRankings = []
): CustomRankings => {
  const index = currentRankings.indexOf(playerName);
  if (index >= 0 && index < currentRankings.length - 1) {
    const newRankings = [...currentRankings];
    [newRankings[index], newRankings[index + 1]] = [newRankings[index + 1]!, newRankings[index]!];
    return newRankings;
  }
  return currentRankings;
};
