/**
 * Core Player Type Definitions
 * 
 * Canonical type definitions for player data used throughout the application.
 * All player data should conform to these types for consistency.
 */

// ============================================================================
// POSITION TYPES
// ============================================================================

/** Fantasy-relevant positions */
export type FantasyPosition = 'QB' | 'RB' | 'WR' | 'TE';

/** All positions including flex */
export type Position = FantasyPosition | 'FLEX' | 'K' | 'DEF';

/** Positions eligible for flex spot */
export type FlexPosition = 'RB' | 'WR' | 'TE';

/** NFL team abbreviations */
export type NFLTeam = 
  | 'ARI' | 'ATL' | 'BAL' | 'BUF' | 'CAR' | 'CHI' | 'CIN' | 'CLE'
  | 'DAL' | 'DEN' | 'DET' | 'GB' | 'HOU' | 'IND' | 'JAX' | 'KC'
  | 'LAC' | 'LAR' | 'LV' | 'MIA' | 'MIN' | 'NE' | 'NO' | 'NYG'
  | 'NYJ' | 'PHI' | 'PIT' | 'SEA' | 'SF' | 'TB' | 'TEN' | 'WAS';


// ============================================================================
// STAT TYPES
// ============================================================================

/** Passing statistics */
export interface PassingStats {
  attempts: number;
  completions: number;
  yards: number;
  touchdowns: number;
  interceptions: number;
  rating?: number;
  yardsPerAttempt?: number;
  completionPct?: number;
  sacks?: number;
  sackYards?: number;
}

/** Rushing statistics */
export interface RushingStats {
  attempts: number;
  yards: number;
  touchdowns: number;
  yardsPerAttempt?: number;
  long?: number;
  fumbles?: number;
}

/** Receiving statistics */
export interface ReceivingStats {
  targets: number;
  receptions: number;
  yards: number;
  touchdowns: number;
  yardsPerReception?: number;
  long?: number;
  catchPct?: number;
}

/** Fantasy point totals */
export interface FantasyPoints {
  ppr: number;
  halfPpr: number;
  standard: number;
  perGame?: number;
}

/** Complete stat line for a player */
export interface PlayerStats {
  games: number;
  fantasy: FantasyPoints;
  passing: PassingStats;
  rushing: RushingStats;
  receiving: ReceivingStats;
  fumbles?: number;
  fumblesLost?: number;
  offensiveSnaps?: number;
  offensiveSnapsPct?: number;
}


// ============================================================================
// PROJECTION TYPES
// ============================================================================

/** Full projection data for a player */
export interface Projections {
  fantasy: FantasyPoints;
  passing: PassingStats;
  rushing: RushingStats;
  receiving: ReceivingStats;
}

/** SportsDataIO projection format */
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


// ============================================================================
// ADP TYPES
// ============================================================================

/** Average Draft Position data */
export interface ADPData {
  overall: number | null;
  ppr: number | null;
  halfPpr: number | null;
  dynasty: number | null;
  positionRank: number | null;
  overallRank: number | null;
  source?: string | null;
}


// ============================================================================
// PLAYER TYPES
// ============================================================================

/** Basic player info - minimal required fields */
export interface PlayerBase {
  id: string;
  name: string;
  position: FantasyPosition;
  team: NFLTeam | string;
}

/** Player with headshot (deprecated - headshotUrl will always be null) */
export interface PlayerWithHeadshot extends PlayerBase {
  headshotUrl: string | null; // Always null - headshots removed
  number?: number;
}

/** Player info for dropdowns/lists */
export interface PlayerListItem extends PlayerBase {
  bye: number | null;
  adp: number | null;
  proj: string;
  headshotUrl?: string | null; // Deprecated - always null
}

/** Player from PLAYER_POOL (static data) */
export interface PlayerPoolEntry {
  name: string;
  position: FantasyPosition;
  team: string;
  bye: number | null;
  adp: number | null;
  proj: string;
  databaseId?: string;
  draftkingsRank?: number | null;
  draftkingsPositionRank?: string | null;
  sportsDataProjections?: SportsDataProjections;
}

/** Full player data with all fields */
export interface PlayerFull extends PlayerBase {
  bye: number | null;
  adp: number | null;
  proj: string;
  headshotUrl: string | null; // Deprecated - always null, headshots removed
  projections: Projections | null;
  stats: Record<string, PlayerStats>;
  adpData: ADPData | null;
  meta: PlayerMeta;
}

/** Player metadata */
export interface PlayerMeta {
  sportsDataId?: number | null;
  number?: number | null;
  height?: string | null;
  weight?: number | null;
  age?: number | null;
  college?: string | null;
  experience?: number | null;
  status?: string | null;
  injuryStatus?: string | null;
  injuryBodyPart?: string | null;
  lastUpdated?: string | null;
}


// ============================================================================
// INJURY TYPES
// ============================================================================

/** Injury report entry */
export interface InjuryReport {
  playerId: number;
  name: string;
  team: string;
  position: FantasyPosition;
  status: InjuryStatus;
  bodyPart: string;
  notes?: string;
  practiceStatus?: string;
  lastUpdated?: string;
}

/** Injury status values */
export type InjuryStatus = 
  | 'Healthy'
  | 'Questionable'
  | 'Doubtful'
  | 'Out'
  | 'IR'
  | 'PUP'
  | 'Suspended'
  | 'COVID-19';


// ============================================================================
// NEWS TYPES
// ============================================================================

/** Player news item */
export interface PlayerNews {
  newsId: number;
  playerId: number;
  playerName: string;
  team: string;
  position: FantasyPosition;
  title: string;
  content: string;
  source: string;
  url?: string;
  termsOfUse?: string;
  author?: string;
  categories?: string;
  timeAgo?: string;
  updated: string;
  originalSource?: string;
  originalSourceUrl?: string;
}


// ============================================================================
// TEAM TYPES
// ============================================================================

/** NFL Team info */
export interface NFLTeamInfo {
  teamId: number;
  key: NFLTeam;
  name: string;
  city: string;
  fullName: string;
  conference: 'AFC' | 'NFC';
  division: 'North' | 'South' | 'East' | 'West';
  primaryColor: string;
  secondaryColor: string;
  logoUrl?: string;
  byeWeek: number;
}


// ============================================================================
// DRAFT TYPES
// ============================================================================

/** Draft pick */
export interface DraftPick {
  pickNumber: number;
  round: number;
  pickInRound: number;
  player: PlayerListItem | null;
  teamId: string;
  teamName: string;
  timestamp?: string;
  isMyPick?: boolean;
}

/** Draft roster slot */
export interface RosterSlot {
  position: Position;
  player: PlayerListItem | null;
  isLocked: boolean;
}


// ============================================================================
// UTILITY TYPES
// ============================================================================

/** Map of player name to headshot URL */
export type HeadshotsMap = Record<string, string>;

/** Map of player name to injury report */
export type InjuriesMap = Record<string, InjuryReport>;

/** Map of team abbreviation to team info */
export type TeamsMap = Record<string, NFLTeamInfo>;

/** Map of team abbreviation to bye week */
export type ByeWeeksMap = Record<string, number>;

/** Position counts */
export interface PositionCounts {
  QB: number;
  RB: number;
  WR: number;
  TE: number;
  FLEX: number;
  ALL: number;
}


// ============================================================================
// FILTER/SORT TYPES
// ============================================================================

/** Sort direction */
export type SortDirection = 'asc' | 'desc';

/** Sort field options */
export type SortField = 'adp' | 'name' | 'proj' | 'projection' | 'position' | 'team';

/** Player filter options */
export interface PlayerFilterOptions {
  position?: FantasyPosition | 'ALL' | 'FLEX';
  team?: NFLTeam | 'ALL' | string;
  searchTerm?: string;
  sortBy?: SortField;
  sortDirection?: SortDirection;
}

/** Pool to filter from */
export type PlayerPool = 'all' | 'available';

