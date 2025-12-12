/**
 * Static Player Data Types
 * 
 * Types for the immutable/semi-static player data files.
 */

export type Position = 'QB' | 'RB' | 'WR' | 'TE';

// ============================================================================
// REGISTRY (Eternal Biographical Data)
// ============================================================================

export interface PlayerBio {
  id: string;
  name: string;
  position: Position;
  birthDate: string;
  birthPlace: string;
  college: string;
  nflDraftYear: number;
  nflDraftRound: number;
  nflDraftPick: number;
  nflDraftTeam: string;
}

export interface RegistryData {
  metadata: {
    description: string;
    playerCount: number;
    lastUpdated: string;
  };
  players: Record<string, PlayerBio>;
}

// ============================================================================
// CAREER STATS (Historical, Append-Only)
// ============================================================================

export interface SeasonStats {
  games: number;
  // Passing (QB)
  passYards?: number;
  passTd?: number;
  int?: number;
  // Rushing (RB, QB)
  rushYards?: number;
  rushTd?: number;
  // Receiving (WR, RB, TE)
  rec?: number;
  recYards?: number;
  recTd?: number;
  // Fantasy
  fantasyPts: number;
}

export interface CareerStatsData {
  metadata: {
    description: string;
    playerCount: number;
    lastUpdated: string;
  };
  players: Record<string, Record<string, SeasonStats>>;
}

// ============================================================================
// ROSTERS (Semi-Static, Update on Trades)
// ============================================================================

export interface RosterEntry {
  team: string;
  byeWeek: number;
}

export interface RostersData {
  metadata: {
    description: string;
    season: string;
    playerCount: number;
    lastUpdated: string;
  };
  players: Record<string, RosterEntry>;
}

// ============================================================================
// COMPOSED PLAYER (Full Player Object)
// ============================================================================

export interface FullPlayer {
  // From registry
  id: string;
  name: string;
  position: Position;
  birthDate: string;
  birthPlace: string;
  college: string;
  nflDraftYear: number;
  nflDraftRound: number;
  nflDraftPick: number;
  nflDraftTeam: string;
  // From rosters
  team: string;
  byeWeek: number;
  // From career stats (optional)
  careerStats?: Record<string, SeasonStats>;
  // From dynamic sources (not in static files)
  adp?: number;
  projection?: number;
}

