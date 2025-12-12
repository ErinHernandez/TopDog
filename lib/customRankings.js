// Custom Rankings Utility Functions

/**
 * Get custom ranking for a player
 * @param {string} playerName - The name of the player
 * @param {Array} customRankings - Array of player names in ranking order
 * @returns {string} - The ranking number as a string, or '-' if not found
 */
export const getCustomPlayerRanking = (playerName, customRankings = []) => {
  const index = customRankings.indexOf(playerName);
  const rank = index !== -1 ? index + 1 : null;
  return rank ? rank.toString() : '-';
};

/**
 * Load custom rankings from localStorage
 * @returns {Array} - Array of player names in ranking order
 */
export const loadCustomRankings = () => {
  try {
    const stored = localStorage.getItem('customRankings');
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading custom rankings:', error);
    return [];
  }
};

/**
 * Save custom rankings to localStorage
 * @param {Array} rankings - Array of player names in ranking order
 */
export const saveCustomRankings = (rankings) => {
  try {
    localStorage.setItem('customRankings', JSON.stringify(rankings));
  } catch (error) {
    console.error('Error saving custom rankings:', error);
  }
};

/**
 * Clear custom rankings from localStorage
 */
export const clearCustomRankings = () => {
  try {
    localStorage.removeItem('customRankings');
  } catch (error) {
    console.error('Error clearing custom rankings:', error);
  }
};

/**
 * Add a player to custom rankings
 * @param {string} playerName - The name of the player to add
 * @param {Array} currentRankings - Current rankings array
 * @returns {Array} - Updated rankings array
 */
export const addPlayerToRankings = (playerName, currentRankings = []) => {
  if (!currentRankings.includes(playerName)) {
    return [...currentRankings, playerName];
  }
  return currentRankings;
};

/**
 * Remove a player from custom rankings
 * @param {string} playerName - The name of the player to remove
 * @param {Array} currentRankings - Current rankings array
 * @returns {Array} - Updated rankings array
 */
export const removePlayerFromRankings = (playerName, currentRankings = []) => {
  return currentRankings.filter(name => name !== playerName);
};

/**
 * Move a player up in rankings
 * @param {string} playerName - The name of the player to move up
 * @param {Array} currentRankings - Current rankings array
 * @returns {Array} - Updated rankings array
 */
export const movePlayerUp = (playerName, currentRankings = []) => {
  const index = currentRankings.indexOf(playerName);
  if (index > 0) {
    const newRankings = [...currentRankings];
    [newRankings[index], newRankings[index - 1]] = [newRankings[index - 1], newRankings[index]];
    return newRankings;
  }
  return currentRankings;
};

/**
 * Move a player down in rankings
 * @param {string} playerName - The name of the player to move down
 * @param {Array} currentRankings - Current rankings array
 * @returns {Array} - Updated rankings array
 */
export const movePlayerDown = (playerName, currentRankings = []) => {
  const index = currentRankings.indexOf(playerName);
  if (index >= 0 && index < currentRankings.length - 1) {
    const newRankings = [...currentRankings];
    [newRankings[index], newRankings[index + 1]] = [newRankings[index + 1], newRankings[index]];
    return newRankings;
  }
  return currentRankings;
}; 