/**
 * Player Photo Utilities
 * Handles player image generation and fallbacks for the draft board
 */

import { getNflLogoUrl } from './nflLogos';
import { POSITION_COLORS } from '../components/draft/v3/constants/positions';

// NFL team code mapping for player photos
const nflTeamMapping = {
  'ARI': 'ari', 'ATL': 'atl', 'BAL': 'bal', 'BUF': 'buf', 'CAR': 'car', 'CHI': 'chi',
  'CIN': 'cin', 'CLE': 'cle', 'DAL': 'dal', 'DEN': 'den', 'DET': 'det', 'GB': 'gb',
  'HOU': 'hou', 'IND': 'ind', 'JAX': 'jax', 'KC': 'kc', 'LV': 'lv', 'LAC': 'lac',
  'LAR': 'lar', 'MIA': 'mia', 'MIN': 'min', 'NE': 'ne', 'NO': 'no', 'NYG': 'nyg',
  'NYJ': 'nyj', 'PHI': 'phi', 'PIT': 'pit', 'SF': 'sf', 'SEA': 'sea', 'TB': 'tb',
  'TEN': 'ten', 'WAS': 'was'
};

/**
 * Generate a player photo URL with multiple fallback options
 * @param {string} playerName - The player's name
 * @param {string} teamCode - The player's team code (e.g., 'BUF', 'KC')
 * @param {string} position - The player's position (QB, RB, WR, TE)
 * @param {number} size - Image size (default: 40)
 * @returns {string} - URL for the player image
 */
export const getPlayerPhotoUrl = (playerName, teamCode, position, size = 40) => {
  // For now, we'll use a combination of approaches:
  // 1. Try to use a generic player avatar service
  // 2. Fallback to team logo if available
  // 3. Final fallback to initials-based avatar
  
  if (!playerName) return null;
  
  // Clean player name for URL encoding
  const cleanName = playerName.trim();
  const encodedName = encodeURIComponent(cleanName);
  
  // Use established position colors from constants
  const positionColor = POSITION_COLORS[position]?.primary || '#6b7280';
  const bgColor = positionColor.replace('#', ''); // Remove # for URL
  
  // Generate avatar with player initials and position-based colors
  return `https://ui-avatars.com/api/?name=${encodedName}&background=${bgColor}&color=fff&size=${size}&rounded=true&bold=true&font-size=0.4`;
};

/**
 * Get team logo URL as fallback for player photos
 * @param {string} teamCode - The team code
 * @returns {string|null} - Team logo URL or null
 */
export const getTeamLogoUrl = (teamCode) => {
  if (!teamCode || !nflTeamMapping[teamCode]) return null;
  
  try {
    return getNflLogoUrl(teamCode);
  } catch (error) {
    console.warn(`Failed to get team logo for ${teamCode}:`, error);
    return null;
  }
};

/**
 * Generate player initials from name
 * @param {string} playerName - The player's name
 * @returns {string} - Player initials (max 2 characters)
 */
export const getPlayerInitials = (playerName) => {
  if (!playerName) return '??';
  
  const nameParts = playerName.trim().split(' ');
  if (nameParts.length === 1) {
    return nameParts[0].substring(0, 2).toUpperCase();
  }
  
  return nameParts
    .slice(0, 2)
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase();
};

/**
 * Get position-based background color using established constants
 * @param {string} position - Player position
 * @returns {string} - Hex color code
 */
export const getPositionColor = (position) => {
  return POSITION_COLORS[position]?.primary || '#6b7280'; // default gray
};
