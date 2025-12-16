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
 * Generate player ID from name (matches player pool format)
 * @param {string} playerName - The player's name
 * @returns {string} - Player ID (e.g., "chase_jamarr")
 */
export const getPlayerId = (playerName) => {
  if (!playerName) return null;
  
  const cleanedName = playerName
    .trim()
    .replace(/\s+(jr\.?|sr\.?|ii|iii|iv|v)$/i, '')
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .trim();
  
  const parts = cleanedName.split(' ');
  if (parts.length >= 2) {
    // Format: lastname_firstname (matches player pool format)
    const lastName = parts[parts.length - 1];
    const firstName = parts[0];
    return `${lastName}_${firstName}`.replace(/[^a-z_]/g, '');
  }
  return cleanedName.replace(/[^a-z]/g, '');
};

/**
 * Generate a player photo URL with enhanced fallback chain
 * Fallback order:
 * 1. SportsDataIO headshot from headshotsMap (highest quality, official)
 * 2. Provided photoUrl from player pool
 * 3. Local player image (WebP) - /players/{playerId}.webp
 * 4. Local player image (PNG) - /players/{playerId}.png
 * 5. Team logo - /logos/nfl/{team}.png
 * 6. Initials-based avatar (ui-avatars.com)
 * 
 * @param {string} playerName - The player's name
 * @param {string} teamCode - The player's team code (e.g., 'BUF', 'KC')
 * @param {string} position - The player's position (QB, RB, WR, TE)
 * @param {number} size - Image size (default: 40)
 * @param {string} playerId - Optional player ID (will be generated from name if not provided)
 * @param {string} photoUrl - Optional direct photo URL from player pool
 * @param {Object} headshotsMap - Optional map of player names to SportsDataIO headshot URLs
 * @returns {string} - URL for the player image
 */
export const getPlayerPhotoUrl = (playerName, teamCode, position, size = 40, playerId = null, photoUrl = null, headshotsMap = null) => {
  if (!playerName) return null;
  
  // Priority 1: SportsDataIO headshot (highest quality, official source)
  if (headshotsMap && headshotsMap[playerName]) {
    return headshotsMap[playerName];
  }
  
  // Priority 2: Use provided photoUrl from player pool (if available)
  if (photoUrl) {
    return photoUrl;
  }
  
  // Priority 2: Try local player image (WebP)
  const id = playerId || getPlayerId(playerName);
  if (id) {
    // Check if WebP exists (browser will handle fallback to PNG automatically)
    // Return WebP URL - browser will fallback to PNG if WebP not supported
    const webpUrl = `/players/${id}.webp`;
    // Note: In actual implementation, you'd check if file exists server-side
    // For client-side, we return the URL and let the browser handle 404s
    return webpUrl;
  }
  
  // Priority 3: Team logo fallback
  const teamLogoUrl = getTeamLogoUrl(teamCode);
  if (teamLogoUrl) {
    return teamLogoUrl;
  }
  
  // Priority 4: Initials-based avatar (final fallback)
  const cleanName = playerName.trim();
  const encodedName = encodeURIComponent(cleanName);
  const positionColor = POSITION_COLORS[position]?.primary || '#6b7280';
  const bgColor = positionColor.replace('#', ''); // Remove # for URL
  
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
