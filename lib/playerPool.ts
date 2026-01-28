/**
 * Updated Player Pool with SportsDataIO Projections
 * 
 * This file contains all players with their projections, rankings, and statistics.
 * Projections sourced from SportsDataIO NFL API.
 * 
 * Generated: 2025-12-02T07:05:12.185Z
 * Total Players: 244
 * Matched Projections: 238
 * Source: SportsDataIO Player Season Projection Stats
 */

// ============================================================================
// TYPES
// ============================================================================

export interface SportsDataProjections {
  ppr: number;
  halfPpr: number;
  standard: number;
  passingYards: number;
  passingTDs: number;
  rushingYards: number;
  rushingTDs: number;
  receivingYards: number;
  receivingTDs: number;
  receptions: number;
}

export interface PlayerPoolEntry {
  name: string;
  position: string;
  team: string;
  bye: number | null;
  adp: number | null;
  proj: string | number;
  databaseId?: string;
  draftkingsRank?: number | null;
  draftkingsPositionRank?: string | null;
  sportsDataProjections?: SportsDataProjections;
  [key: string]: unknown; // Allow additional properties
}

export interface Pick {
  player?: string;
  name?: string;
  [key: string]: unknown;
}

export interface GroupedPicks {
  QB: PlayerPoolEntry[];
  RB: PlayerPoolEntry[];
  WR: PlayerPoolEntry[];
  TE: PlayerPoolEntry[];
}

// ============================================================================
// DATA
// ============================================================================

// Note: The actual PLAYER_POOL data array is very large (6700+ lines)
// Import from JSON file in public/data directory
 
const playerPoolData = require('../public/data/player-pool-2025.json');

// Handle both array format and {players: []} format
const playersArray = Array.isArray(playerPoolData) 
  ? playerPoolData 
  : (playerPoolData as { players?: PlayerPoolEntry[] })?.players || [];

export const PLAYER_POOL: PlayerPoolEntry[] = playersArray as PlayerPoolEntry[];

// ============================================================================
// FUNCTIONS
// ============================================================================

/**
 * Group picks by position
 * @param picks - Array of picks (can be strings or objects with player/name)
 * @param pool - Player pool to search (defaults to PLAYER_POOL)
 * @returns Grouped picks by position
 */
export function groupPicksByPosition(
  picks: (string | Pick)[] | null | undefined,
  pool: PlayerPoolEntry[] = PLAYER_POOL
): GroupedPicks {
  const grouped: GroupedPicks = { QB: [], RB: [], WR: [], TE: [] };

  if (!Array.isArray(picks)) return grouped;

  picks.forEach((pick) => {
    const playerName = typeof pick === 'string' 
      ? pick 
      : (pick && (pick.player || pick.name));
    
    if (!playerName || typeof playerName !== 'string') return;
    
    const player = pool.find((p) => p.name === playerName);
    if (player && player.position && grouped[player.position as keyof GroupedPicks]) {
      (grouped[player.position as keyof GroupedPicks] as PlayerPoolEntry[]).push(player);
    }
  });

  return grouped;
}
