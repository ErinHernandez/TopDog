/**
 * Historical Player Statistics Type Definitions
 * 
 * These types define the structure of immutable historical NFL player data.
 * Data covers seasons 2020-2024 and is frozen during draft season.
 */

// =============================================================================
// CORE PLAYER TYPES
// =============================================================================

export interface HistoricalPlayer {
  /** Universal identifier (internal) */
  id: string;
  
  /** Display name */
  name: string;
  firstName: string;
  lastName: string;
  
  /** Primary position */
  position: 'QB' | 'RB' | 'WR' | 'TE';
  
  /** External ID mappings for data ingestion */
  externalIds: {
    espn?: string;
  };
  
  /** Seasons with data available */
  seasonsAvailable: number[];
}

// =============================================================================
// STATISTICAL CATEGORIES
// =============================================================================

export interface PassingStats {
  attempts: number;
  completions: number;
  completionPct: number;
  yards: number;
  yardsPerAttempt: number;
  touchdowns: number;
  interceptions: number;
  sacks: number;
  sackYards: number;
  rating: number;
  longPass: number;
}

export interface RushingStats {
  attempts: number;
  yards: number;
  yardsPerAttempt: number;
  touchdowns: number;
  longRush: number;
  fumbles: number;
  fumblesLost: number;
  twentyPlusRuns: number;
}

export interface ReceivingStats {
  targets: number;
  receptions: number;
  yards: number;
  yardsPerReception: number;
  yardsPerTarget: number;
  touchdowns: number;
  longReception: number;
  twentyPlusReceptions: number;
  catchRate: number;
}

export interface FantasyStats {
  /** Half-PPR total points for the season */
  halfPprPoints: number;
  /** Half-PPR points per game */
  halfPprPpg: number;
}

// =============================================================================
// SEASON DATA
// =============================================================================

export interface SeasonStats {
  /** Player identifier */
  playerId: string;
  
  /** Season year */
  season: number;
  
  /** Team(s) played for */
  team: string;
  teams: string[];
  
  /** Games context */
  gamesPlayed: number;
  gamesStarted: number;
  
  /** Position */
  position: 'QB' | 'RB' | 'WR' | 'TE';
  
  /** Statistical categories (null if not applicable to position) */
  passing: PassingStats | null;
  rushing: RushingStats | null;
  receiving: ReceivingStats | null;
  
  /** Fantasy points */
  fantasy: FantasyStats;
}

// =============================================================================
// FILE STRUCTURES
// =============================================================================

export interface HistoricalManifest {
  /** Version identifier (e.g., "2025.1") */
  version: string;
  
  /** When data was generated */
  generatedAt: string;
  
  /** When data was locked for draft season */
  lockedAt: string | null;
  
  /** Current NFL season (not included in historical) */
  currentSeason: number;
  
  /** Seasons included in historical data */
  historicalSeasons: number[];
  
  /** Total player count */
  playerCount: number;
  
  /** File checksums for integrity verification */
  checksums: Record<string, string>;
}

export interface PlayerIndex {
  /** When index was generated */
  generatedAt: string;
  
  /** Player lookup by ID */
  players: Record<string, HistoricalPlayer>;
}

export interface SeasonDataFile {
  /** Season year */
  season: number;
  
  /** When file was generated */
  generatedAt: string;
  
  /** Player stats keyed by player ID */
  players: Record<string, SeasonStats>;
}

// =============================================================================
// API RESPONSE TYPES (for ingestion)
// =============================================================================

export interface ESPNAthlete {
  id: string;
  displayName: string;
  firstName: string;
  lastName: string;
  position?: {
    abbreviation: string;
  };
}

export interface ESPNStatCategory {
  name: string;
  displayName: string;
  leaders?: Array<{
    athlete: ESPNAthlete;
    value: string;
    displayValue: string;
  }>;
}

export interface ESPNStatsResponse {
  stats?: {
    categories?: ESPNStatCategory[];
  };
}

// =============================================================================
// SERVICE TYPES
// =============================================================================

export interface HistoricalStatsQuery {
  playerId?: string;
  season?: number;
  position?: 'QB' | 'RB' | 'WR' | 'TE';
  team?: string;
  limit?: number;
}

export interface HistoricalStatsResult {
  data: SeasonStats | SeasonStats[] | null;
  loading: boolean;
  error: Error | null;
}



