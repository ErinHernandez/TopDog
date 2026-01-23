/**
 * Updated Static Player Stats Data
 * 
 * Pre-downloaded player statistics with Clay projections from the integrated database.
 * This data is used for instant loading in the draft room modal.
 * 
 * Generated: 2025-08-17T06:58:58.208Z
 * Total Players: 244
 * Source: Integrated Player Database (DraftKings + Clay Projections)
 */

// ============================================================================
// TYPES
// ============================================================================

export interface PassingStats {
  attempts: number | null;
  completions: number | null;
  yards: number;
  touchdowns: number;
  interceptions: number | null;
  sacks: number | null;
}

export interface RushingStats {
  attempts: number | null;
  yards: number;
  touchdowns: number;
  fumbles: number | null;
  yardsPerAttempt: number | null;
}

export interface ReceivingStats {
  targets: number | null;
  receptions: number | null;
  yards: number;
  touchdowns: number;
  fumbles: number | null;
  yardsPerReception: number | null;
}

export interface ScrimmageStats {
  touches: number | null;
  yards: number;
  touchdowns: number;
}

export interface FantasyStats {
  points: number;
  ppr_points: number;
}

export interface SeasonStats {
  year: number;
  games: number;
  passing: PassingStats;
  rushing: RushingStats;
  receiving: ReceivingStats;
  scrimmage: ScrimmageStats;
  fantasy: FantasyStats;
}

export interface CareerStats {
  games: number;
  passing: PassingStats;
  rushing: RushingStats;
  receiving: ReceivingStats;
  scrimmage: ScrimmageStats;
  fantasy: FantasyStats;
}

export interface PlayerStats {
  name: string;
  position: string;
  team: string;
  seasons: SeasonStats[];
  career: CareerStats;
  databaseId?: string;
  draftkingsRank?: number;
  draftkingsADP?: number;
  clayRank?: number;
  clayLastUpdated?: string;
  [key: string]: unknown;
}

export interface StatsMetadata {
  generatedAt: string;
  totalPlayers: number;
  successfulFetches: number;
  failedFetches: number;
  version: string;
  source: string;
}

export interface StaticPlayerStatsData {
  metadata: StatsMetadata;
  players: Record<string, PlayerStats>;
}

export interface PositionCounts {
  QB: number;
  RB: number;
  WR: number;
  TE: number;
  [key: string]: number;
}

// ============================================================================
// DATA IMPORT
// ============================================================================

// Import the large data object from the backup file
// eslint-disable-next-line @typescript-eslint/no-var-requires
const staticPlayerStatsModule = require('./staticPlayerStats.js.bak');
export const STATIC_PLAYER_STATS: StaticPlayerStatsData = staticPlayerStatsModule.STATIC_PLAYER_STATS || {
  metadata: {
    generatedAt: new Date().toISOString(),
    totalPlayers: 0,
    successfulFetches: 0,
    failedFetches: 0,
    version: '4.0',
    source: 'Integrated Player Database with Clay Projections'
  },
  players: {}
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get player stats by name
 */
export function getPlayerStats(playerName: string): PlayerStats | null {
  return STATIC_PLAYER_STATS.players[playerName] || null;
}

/**
 * Check if player stats are available
 */
export function hasPlayerStats(): boolean {
  return STATIC_PLAYER_STATS.metadata.totalPlayers > 0;
}

/**
 * Get stats metadata
 */
export function getStatsMetadata(): StatsMetadata {
  return STATIC_PLAYER_STATS.metadata;
}

/**
 * Get player count by position
 */
export function getPlayerCountByPosition(): PositionCounts {
  const counts: PositionCounts = {
    QB: 0,
    RB: 0,
    WR: 0,
    TE: 0
  };
  
  Object.values(STATIC_PLAYER_STATS.players).forEach(player => {
    const pos = player.position;
    if (pos in counts) {
      counts[pos as keyof PositionCounts]++;
    } else {
      counts[pos] = (counts[pos] || 0) + 1;
    }
  });
  
  return counts;
}

// CommonJS exports for backward compatibility
module.exports = {
  STATIC_PLAYER_STATS,
  getPlayerStats,
  hasPlayerStats,
  getStatsMetadata,
  getPlayerCountByPosition
};
