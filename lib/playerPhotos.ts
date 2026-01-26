/**
 * Player Photo Utilities
 * Handles player image generation and fallbacks for the draft board
 */

import { getNflLogoUrl } from './nflLogos';
import { POSITION_COLORS } from './constants/positions';
import { createScopedLogger } from './clientLogger';

const logger = createScopedLogger('[PlayerPhotos]');

// ============================================================================
// TYPES
// ============================================================================

export type NFLTeamCode = 
  | 'ARI' | 'ATL' | 'BAL' | 'BUF' | 'CAR' | 'CHI'
  | 'CIN' | 'CLE' | 'DAL' | 'DEN' | 'DET' | 'GB'
  | 'HOU' | 'IND' | 'JAX' | 'KC' | 'LV' | 'LAC'
  | 'LAR' | 'MIA' | 'MIN' | 'NE' | 'NO' | 'NYG'
  | 'NYJ' | 'PHI' | 'PIT' | 'SF' | 'SEA' | 'TB'
  | 'TEN' | 'WAS';

export type PlayerPosition = 'QB' | 'RB' | 'WR' | 'TE' | 'K' | 'DEF';


// ============================================================================
// CONSTANTS
// ============================================================================

// NFL team code mapping for player photos
const nflTeamMapping: Record<NFLTeamCode, string> = {
  'ARI': 'ari', 'ATL': 'atl', 'BAL': 'bal', 'BUF': 'buf', 'CAR': 'car', 'CHI': 'chi',
  'CIN': 'cin', 'CLE': 'cle', 'DAL': 'dal', 'DEN': 'den', 'DET': 'det', 'GB': 'gb',
  'HOU': 'hou', 'IND': 'ind', 'JAX': 'jax', 'KC': 'kc', 'LV': 'lv', 'LAC': 'lac',
  'LAR': 'lar', 'MIA': 'mia', 'MIN': 'min', 'NE': 'ne', 'NO': 'no', 'NYG': 'nyg',
  'NYJ': 'nyj', 'PHI': 'phi', 'PIT': 'pit', 'SF': 'sf', 'SEA': 'sea', 'TB': 'tb',
  'TEN': 'ten', 'WAS': 'was'
};

// ============================================================================
// FUNCTIONS
// ============================================================================

/**
 * Generate player ID from name (matches player pool format)
 * @param playerName - The player's name
 * @returns Player ID (e.g., "chase_jamarr") or null
 */
export const getPlayerId = (playerName: string | null | undefined): string | null => {
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
 * Generate a player photo URL with fallback chain
 * Fallback order:
 * 1. Team logo - /logos/nfl/{team}.png
 * 2. Initials-based avatar (ui-avatars.com)
 * 
 * @param playerName - The player's name
 * @param teamCode - The player's team code (e.g., 'BUF', 'KC')
 * @param position - The player's position (QB, RB, WR, TE)
 * @param size - Image size (default: 40)
 * @returns URL for the player image or null
 */
export const getPlayerPhotoUrl = (
  playerName: string | null | undefined,
  teamCode: NFLTeamCode | string | null | undefined,
  position: PlayerPosition | string | null | undefined,
  size: number = 40
): string | null => {
  if (!playerName) return null;
  
  // Priority 1: Team logo fallback
  const teamLogoUrl = getTeamLogoUrl(teamCode);
  if (teamLogoUrl) {
    return teamLogoUrl;
  }
  
  // Priority 2: Initials-based avatar (final fallback)
  const cleanName = playerName.trim();
  const encodedName = encodeURIComponent(cleanName);
  const positionColor = (POSITION_COLORS as Record<string, { primary?: string }>)[position || '']?.primary || '#6b7280';
  const bgColor = positionColor.replace('#', ''); // Remove # for URL
  
  return `https://ui-avatars.com/api/?name=${encodedName}&background=${bgColor}&color=fff&size=${size}&rounded=true&bold=true&font-size=0.4`;
};

/**
 * Get team logo URL as fallback for player photos
 * @param teamCode - The team code
 * @returns Team logo URL or null
 */
export const getTeamLogoUrl = (teamCode: NFLTeamCode | string | null | undefined): string | null => {
  if (!teamCode || !nflTeamMapping[teamCode as NFLTeamCode]) return null;
  
  try {
    return getNflLogoUrl(teamCode as NFLTeamCode);
  } catch (error) {
    logger.warn(`Failed to get team logo for ${teamCode}`);
    return null;
  }
};

/**
 * Generate player initials from name
 * @param playerName - The player's name
 * @returns Player initials (max 2 characters)
 */
export const getPlayerInitials = (playerName: string | null | undefined): string => {
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
 * @param position - Player position
 * @returns Hex color code
 */
export const getPositionColor = (position: PlayerPosition | string | null | undefined): string => {
  return (POSITION_COLORS as Record<string, { primary?: string }>)[position || '']?.primary || '#6b7280'; // default gray
};
