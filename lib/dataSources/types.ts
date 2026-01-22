/**
 * Data Source Types
 * 
 * Shared types and interfaces for data source abstraction layer.
 * Ensures consistent data format regardless of source (ESPN, SportsDataIO, etc.)
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

export type DataSource = 'espn' | 'sportsdataio';
export type HistoricalDataSource = 'espn_fantasy' | 'espn_core' | 'sportsdataio';

export interface DataSourceConfig {
  projections: DataSource;
  historical: HistoricalDataSource;
  espn?: {
    s2Cookie: string;
    swidCookie: string;
    leagueId?: number;
  };
  sportsdataio?: {
    apiKey: string;
  };
}

// ============================================================================
// PROJECTION DATA
// ============================================================================

/**
 * Unified projection format (matches SportsDataIO format for compatibility)
 * This ensures the API response format remains consistent regardless of source
 */
export interface ProjectionData {
  PlayerID: number;           // ESPN player ID or SportsDataIO ID
  Name: string;
  Position: string;           // 'QB', 'RB', 'WR', 'TE'
  Team: string;              // Team abbreviation
  FantasyPointsPPR: number;   // PPR projected points
  FantasyPoints: number;      // Standard projected points
  FantasyPointsHalfPPR?: number;
  
  // Passing stats (QB)
  PassingAttempts?: number;
  PassingCompletions?: number;
  PassingYards?: number;
  PassingTouchdowns?: number;
  PassingInterceptions?: number;
  
  // Rushing stats
  RushingAttempts?: number;
  RushingYards?: number;
  RushingTouchdowns?: number;
  
  // Receiving stats
  Receptions?: number;
  ReceivingTargets?: number;
  ReceivingYards?: number;
  ReceivingTouchdowns?: number;
  
  // Additional fields
  ByeWeek?: number;
  AverageDraftPosition?: number;
  AverageDraftPositionPPR?: number;
  
  // Source tracking (internal)
  _source?: 'espn' | 'sportsdataio';
}

// ============================================================================
// HISTORICAL STATS
// ============================================================================

/**
 * Historical stats format (matches SeasonStats from lib/historicalStats/types.ts)
 */
export interface PassingStats {
  attempts: number;
  completions: number;
  completionPct: number;
  yards: number;
  yardsPerAttempt: number;
  touchdowns: number;
  interceptions: number;
  sacks?: number;
  sackYards?: number;
  rating?: number;
  longPass?: number;
}

export interface RushingStats {
  attempts: number;
  yards: number;
  yardsPerAttempt: number;
  touchdowns: number;
  longRush: number;
  fumbles?: number;
  fumblesLost?: number;
  twentyPlusRuns?: number;
}

export interface ReceivingStats {
  targets: number;
  receptions: number;
  yards: number;
  yardsPerReception: number;
  yardsPerTarget: number;
  touchdowns: number;
  longReception: number;
  twentyPlusReceptions?: number;
  catchRate?: number;
}

export interface FantasyStats {
  halfPprPoints: number;
  halfPprPpg: number;
}

export interface HistoricalStats {
  playerId: string;
  season: number;
  position: 'QB' | 'RB' | 'WR' | 'TE';
  team: string;
  teams?: string[];
  gamesPlayed: number;
  gamesStarted?: number;
  passing: PassingStats | null;
  rushing: RushingStats | null;
  receiving: ReceivingStats | null;
  fantasy: FantasyStats;
}

// ============================================================================
// ADVANCED METRICS (ESPN Only)
// ============================================================================

export interface AdvancedMetrics {
  xFP: number;              // Expected fantasy points
  EPA: number;               // Expected points added
  consistencyRating: number; // 0-10 scale
  usageMetrics?: {
    targets?: number;
    touches?: number;
    snapCount?: number;
  };
}

// ============================================================================
// ESPN FANTASY API TYPES
// ============================================================================

export interface ESPNPlayer {
  id: number;
  fullName: string;
  firstName: string;
  lastName: string;
  defaultPositionId: number;  // 1=QB, 2=RB, 3=WR, 4=TE
  proTeamId: number;
  injured?: boolean;
  injuryStatus?: string;
  byeWeek?: number;
}

export interface ESPNProjection {
  player: ESPNPlayer;
  projectedPoints?: number;
  projectedPointsPPR?: number;
  projectedPointsHalfPPR?: number;
  stats?: {
    passing?: {
      attempts?: number;
      completions?: number;
      yards?: number;
      touchdowns?: number;
      interceptions?: number;
    };
    rushing?: {
      attempts?: number;
      yards?: number;
      touchdowns?: number;
    };
    receiving?: {
      targets?: number;
      receptions?: number;
      yards?: number;
      touchdowns?: number;
    };
  };
}

export interface ESPNSeasonStats {
  playerId: number;
  season: number;
  gamesPlayed: number;
  stats?: {
    passing?: ESPNStatCategory;
    rushing?: ESPNStatCategory;
    receiving?: ESPNStatCategory;
  };
}

export interface ESPNStatCategory {
  attempts?: number;
  completions?: number;
  yards?: number;
  touchdowns?: number;
  interceptions?: number;
  targets?: number;
  receptions?: number;
  fumbles?: number;
  fumblesLost?: number;
}

// ============================================================================
// OPTIONS
// ============================================================================

export interface GetProjectionsOptions {
  position?: string;
  limit?: number;
  forceRefresh?: boolean;
}
