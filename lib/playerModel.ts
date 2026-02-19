/**
 * Unified Player Model - Single Source of Truth for Player Data Transformation
 * 
 * This module defines the canonical player data structure and provides
 * transformation functions for normalizing data from various sources.
 * 
 * All player data should flow through these transformers to ensure
 * consistent data shape throughout the application.
 * 
 * Usage:
 *   import { transformFromSportsDataIO, mergePlayerData } from '@/lib/playerModel';
 */

import type { ProjectionData } from '@/lib/dataSources/types';
import type {
  SportsDataIOPlayer,
  SportsDataIOProjection,
  SportsDataIOSeasonStats,
  SportsDataIOADP,
  TransformedPlayerStats,
  TransformedADP,
} from '@/types/api';
import type {
  PassingStats,
  RushingStats,
  ReceivingStats,
  FantasyPoints,
  PlayerStats,
  Projections,
  ADPData,
  PlayerFull,
  PlayerMeta,
  PlayerPoolEntry,
  PlayerBase,
  FantasyPosition,
} from '@/types/player';



// ============================================================================
// CONSTANTS
// ============================================================================

export const FANTASY_POSITIONS: readonly FantasyPosition[] = ['QB', 'RB', 'WR', 'TE'] as const;
export const FLEX_POSITIONS: readonly FantasyPosition[] = ['RB', 'WR', 'TE'] as const;


// ============================================================================
// RAW DATA TYPES (for input handling)
// ============================================================================

/** Generic raw stats input - handles both SportsDataIO and internal formats */
interface RawStatsInput {
  // SportsDataIO format
  PassingAttempts?: number | null;
  PassingCompletions?: number | null;
  PassingYards?: number | null;
  PassingTouchdowns?: number | null;
  PassingInterceptions?: number | null;
  PassingRating?: number | null;
  PassingYardsPerAttempt?: number | null;
  PassingCompletionPercentage?: number | null;
  RushingAttempts?: number | null;
  RushingYards?: number | null;
  RushingTouchdowns?: number | null;
  RushingYardsPerAttempt?: number | null;
  RushingLong?: number | null;
  ReceivingTargets?: number | null;
  Receptions?: number | null;
  ReceivingYards?: number | null;
  ReceivingTouchdowns?: number | null;
  ReceivingYardsPerReception?: number | null;
  ReceivingLong?: number | null;
  FantasyPoints?: number | null;
  FantasyPointsPPR?: number | null;
  FantasyPointsHalfPPR?: number | null;
  Played?: number | null;
  Fumbles?: number | null;
  FumblesLost?: number | null;
  OffensiveSnapsPlayed?: number | null;
  OffensiveTeamSnaps?: number | null;
  
  // Internal format
  attempts?: number | null;
  completions?: number | null;
  yards?: number | null;
  touchdowns?: number | null;
  tds?: number | null;
  interceptions?: number | null;
  ints?: number | null;
  rating?: number | null;
  yardsPerAttempt?: number | null;
  ypa?: number | null;
  completionPct?: number | null;
  compPct?: number | null;
  carries?: number | null;
  ypc?: number | null;
  long?: number | null;
  targets?: number | null;
  receptions?: number | null;
  rec?: number | null;
  ypr?: number | null;
  catchPct?: number | null;
  ppr?: number | null;
  halfPpr?: number | null;
  standard?: number | null;
  fantasyPointsPPR?: number | null;
  fantasyPointsHalfPPR?: number | null;
  fantasyPoints?: number | null;
  games?: number | null;
  gamesPlayed?: number | null;
  fumbles?: number | null;
  fumblesLost?: number | null;
  offensiveSnaps?: number | null;
  offensiveSnapsPct?: number | null;
}

/** Raw ADP input */
interface RawADPInput {
  AverageDraftPosition?: number | null;
  AverageDraftPositionPPR?: number | null;
  AverageDraftPosition2QB?: number | null;
  AverageDraftPositionDynasty?: number | null;
  PositionRank?: number | null;
  OverallRank?: number | null;
  adp?: number | null;
  adpPPR?: number | null;
  adpHalfPPR?: number | null;
  adpDynasty?: number | null;
  positionRank?: number | null;
  overallRank?: number | null;
  source?: string | null;
  _source?: string | null;
}

/** Raw player input for PLAYER_POOL transformation */
interface RawPlayerPoolInput extends RawStatsInput, RawADPInput {
  PlayerID?: number | null;
  Name?: string | null;
  Team?: string | null;
  Position?: string | null;
  ByeWeek?: number | null;
  name?: string | null;
  team?: string | null;
  position?: string | null;
  bye?: number | null;
  databaseId?: string | null;
  id?: string | null;
  draftkingsRank?: number | null;
  draftkingsPositionRank?: string | null;
}


// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Safely parse a number, returning fallback for invalid values
 */
export function safeNumber(value: unknown, fallback: number = 0): number {
  if (value === null || value === undefined) return fallback;
  const num = typeof value === 'string' ? parseFloat(value) : Number(value);
  return isNaN(num) ? fallback : num;
}

/**
 * Format number to fixed decimal string
 */
export function formatNumber(value: unknown, decimals: number = 1): string {
  return safeNumber(value).toFixed(decimals);
}

/**
 * Calculate percentage safely
 */
function safePct(numerator: number, denominator: number): number {
  if (!denominator || denominator === 0) return 0;
  return ((numerator || 0) / denominator) * 100;
}

/**
 * Normalize player name for matching
 */
export function normalizeName(name: string | null | undefined): string {
  if (!name) return '';
  return name.trim().toLowerCase().replace(/[.']/g, '').replace(/\s+/g, ' ');
}


// ============================================================================
// PASSING STATS TRANSFORMER
// ============================================================================

/**
 * Transform passing stats from any source
 */
export function transformPassingStats(raw: RawStatsInput = {}): PassingStats {
  return {
    attempts: safeNumber(raw.PassingAttempts ?? raw.attempts),
    completions: safeNumber(raw.PassingCompletions ?? raw.completions),
    yards: safeNumber(raw.PassingYards ?? raw.yards),
    touchdowns: safeNumber(raw.PassingTouchdowns ?? raw.touchdowns ?? raw.tds),
    interceptions: safeNumber(raw.PassingInterceptions ?? raw.interceptions ?? raw.ints),
    rating: safeNumber(raw.PassingRating ?? raw.rating),
    yardsPerAttempt: safeNumber(raw.PassingYardsPerAttempt ?? raw.yardsPerAttempt ?? raw.ypa),
    completionPct: safeNumber(raw.PassingCompletionPercentage ?? raw.completionPct ?? raw.compPct),
  };
}


// ============================================================================
// RUSHING STATS TRANSFORMER
// ============================================================================

/**
 * Transform rushing stats from any source
 */
export function transformRushingStats(raw: RawStatsInput = {}): RushingStats {
  return {
    attempts: safeNumber(raw.RushingAttempts ?? raw.attempts ?? raw.carries),
    yards: safeNumber(raw.RushingYards ?? raw.yards),
    touchdowns: safeNumber(raw.RushingTouchdowns ?? raw.touchdowns ?? raw.tds),
    yardsPerAttempt: safeNumber(raw.RushingYardsPerAttempt ?? raw.yardsPerAttempt ?? raw.ypc),
    long: safeNumber(raw.RushingLong ?? raw.long),
  };
}


// ============================================================================
// RECEIVING STATS TRANSFORMER
// ============================================================================

/**
 * Transform receiving stats from any source
 */
export function transformReceivingStats(raw: RawStatsInput = {}): ReceivingStats {
  const targets = safeNumber(raw.ReceivingTargets ?? raw.targets);
  const receptions = safeNumber(raw.Receptions ?? raw.receptions ?? raw.rec);
  
  return {
    targets,
    receptions,
    yards: safeNumber(raw.ReceivingYards ?? raw.yards),
    touchdowns: safeNumber(raw.ReceivingTouchdowns ?? raw.touchdowns ?? raw.tds),
    yardsPerReception: safeNumber(raw.ReceivingYardsPerReception ?? raw.ypr),
    long: safeNumber(raw.ReceivingLong ?? raw.long),
    catchPct: raw.catchPct ?? (targets > 0 ? safePct(receptions, targets) : 0),
  };
}


// ============================================================================
// FANTASY POINTS TRANSFORMER
// ============================================================================

/**
 * Transform fantasy points from any source
 */
export function transformFantasyPoints(raw: RawStatsInput = {}, games: number = 0): FantasyPoints {
  const ppr = safeNumber(raw.FantasyPointsPPR ?? raw.ppr ?? raw.fantasyPointsPPR);
  const halfPpr = safeNumber(raw.FantasyPointsHalfPPR ?? raw.halfPpr ?? raw.fantasyPointsHalfPPR);
  const standard = safeNumber(raw.FantasyPoints ?? raw.standard ?? raw.fantasyPoints);
  
  return {
    ppr,
    halfPpr,
    standard,
    perGame: games > 0 ? safeNumber(ppr / games) : 0,
  };
}


// ============================================================================
// FULL SEASON STATS TRANSFORMER
// ============================================================================

/**
 * Transform complete season stats
 */
export function transformSeasonStats(raw: RawStatsInput = {}): PlayerStats {
  const games = safeNumber(raw.Played ?? raw.games ?? raw.gamesPlayed);
  
  return {
    games,
    fantasy: transformFantasyPoints(raw, games),
    passing: transformPassingStats(raw),
    rushing: transformRushingStats(raw),
    receiving: transformReceivingStats(raw),
    fumbles: safeNumber(raw.Fumbles ?? raw.fumbles),
    fumblesLost: safeNumber(raw.FumblesLost ?? raw.fumblesLost),
    offensiveSnaps: safeNumber(raw.OffensiveSnapsPlayed ?? raw.offensiveSnaps),
    offensiveSnapsPct: raw.OffensiveTeamSnaps 
      ? safePct(safeNumber(raw.OffensiveSnapsPlayed), safeNumber(raw.OffensiveTeamSnaps))
      : safeNumber(raw.offensiveSnapsPct),
  };
}


// ============================================================================
// ADP TRANSFORMER
// ============================================================================

/**
 * Transform ADP data from any source
 */
export function transformADPData(raw: RawADPInput = {}): ADPData {
  return {
    overall: raw.AverageDraftPosition ?? raw.adp ?? null,
    ppr: raw.AverageDraftPositionPPR ?? raw.adpPPR ?? null,
    halfPpr: raw.AverageDraftPosition2QB ?? raw.adpHalfPPR ?? null,
    dynasty: raw.AverageDraftPositionDynasty ?? raw.adpDynasty ?? null,
    positionRank: raw.PositionRank ?? raw.positionRank ?? null,
    overallRank: raw.OverallRank ?? raw.overallRank ?? null,
    source: raw.source ?? raw._source ?? null,
  };
}


// ============================================================================
// PROJECTIONS TRANSFORMER
// ============================================================================

/**
 * Transform full projections object
 */
export function transformProjections(raw: RawStatsInput = {}): Projections {
  return {
    fantasy: transformFantasyPoints(raw),
    passing: transformPassingStats(raw),
    rushing: transformRushingStats(raw),
    receiving: transformReceivingStats(raw),
  };
}


// ============================================================================
// SPORTSDATAIO TRANSFORMERS
// ============================================================================

/**
 * Transform SportsDataIO player data to canonical format
 */
export function transformFromSportsDataIO(raw: SportsDataIOPlayer | SportsDataIOProjection | null): PlayerFull | null {
  if (!raw) return null;
  
  const fantasy = transformFantasyPoints(raw as RawStatsInput);
  
  // Type guard to check if raw is a full player object
  const isPlayer = (obj: unknown): obj is SportsDataIOPlayer => 
    obj !== null && typeof obj === 'object' && 'Number' in obj;
  
  const playerRaw = isPlayer(raw) ? raw : null;
  
  const meta: PlayerMeta = {
    sportsDataId: raw.PlayerID,
    number: playerRaw?.Number ?? null,
    height: playerRaw?.Height ?? null,
    weight: playerRaw?.Weight ?? null,
    age: playerRaw?.Age ?? null,
    college: playerRaw?.College ?? null,
    experience: playerRaw?.Experience ?? null,
    status: playerRaw?.Status ?? null,
    injuryStatus: playerRaw?.InjuryStatus ?? null,
    injuryBodyPart: playerRaw?.InjuryBodyPart ?? null,
    lastUpdated: playerRaw?.LastUpdated ?? null,
  };
  
  return {
    id: String(raw.PlayerID || ''),
    name: raw.Name || '',
    position: (raw.Position || '') as FantasyPosition,
    team: raw.Team || '',
    bye: playerRaw?.ByeWeek ?? null,
    proj: formatNumber(fantasy.ppr),
    adp: playerRaw?.AverageDraftPositionPPR ?? playerRaw?.AverageDraftPosition ?? null,
    projections: transformProjections(raw as RawStatsInput),
    stats: {},
    adpData: transformADPData(raw as RawADPInput),
    meta,
  };
}

/**
 * Transform SportsDataIO player for basic info endpoint
 */
export function transformPlayerBasic(raw: SportsDataIOPlayer | null): {
  playerId: number;
  name: string;
  team: string;
  position: string;
  number: number | null;
  height: string | null;
  weight: number | null;
  age: number | null;
  college: string | null;
  experience: number | null;
  status: string;
  headshotUrl: string | null;
  injuryStatus: string | null;
  injuryBodyPart: string | null;
} | null {
  if (!raw) return null;
  
  return {
    playerId: raw.PlayerID,
    name: raw.Name,
    team: raw.Team,
    position: raw.Position,
    number: raw.Number,
    height: raw.Height,
    weight: raw.Weight,
    age: raw.Age,
    college: raw.College,
    experience: raw.Experience,
    status: raw.Status,
    headshotUrl: raw.PhotoUrl,
    injuryStatus: raw.InjuryStatus,
    injuryBodyPart: raw.InjuryBodyPart,
  };
}

/**
 * Transform SportsDataIO player for headshot endpoint
 */
export function transformPlayerHeadshot(raw: SportsDataIOPlayer | null): {
  playerId: number;
  name: string;
  team: string;
  position: string;
  headshotUrl: string | null;
  number: number | null;
} | null {
  if (!raw) return null;
  
  return {
    playerId: raw.PlayerID,
    name: raw.Name,
    team: raw.Team,
    position: raw.Position,
    headshotUrl: raw.PhotoUrl,
    number: raw.Number,
  };
}

// ============================================================================
// ESPN FANTASY API TRANSFORMERS
// ============================================================================

/**
 * Transform ESPN Fantasy API projection data to canonical format
 * ESPN ProjectionData format is compatible with SportsDataIO format,
 * so we can reuse most of the transformation logic
 */
export function transformFromESPN(raw: ProjectionData | null): PlayerFull | null {
  if (!raw) return null;
  
  // Convert ProjectionData to SportsDataIO-like format for transformation
  // Use RawPlayerPoolInput which includes PlayerID, Name, etc.
  const sportsdataioLike: RawPlayerPoolInput = {
    PlayerID: raw.PlayerID,
    Name: raw.Name,
    Position: raw.Position,
    Team: raw.Team,
    FantasyPointsPPR: raw.FantasyPointsPPR,
    FantasyPoints: raw.FantasyPoints,
    FantasyPointsHalfPPR: raw.FantasyPointsHalfPPR,
    PassingAttempts: raw.PassingAttempts,
    PassingCompletions: raw.PassingCompletions,
    PassingYards: raw.PassingYards,
    PassingTouchdowns: raw.PassingTouchdowns,
    PassingInterceptions: raw.PassingInterceptions,
    RushingAttempts: raw.RushingAttempts,
    RushingYards: raw.RushingYards,
    RushingTouchdowns: raw.RushingTouchdowns,
    Receptions: raw.Receptions,
    ReceivingTargets: raw.ReceivingTargets,
    ReceivingYards: raw.ReceivingYards,
    ReceivingTouchdowns: raw.ReceivingTouchdowns,
    ByeWeek: raw.ByeWeek,
    AverageDraftPosition: raw.AverageDraftPosition,
    AverageDraftPositionPPR: raw.AverageDraftPositionPPR,
  };

  const fantasy = transformFantasyPoints(sportsdataioLike);
  
  const meta: PlayerMeta = {
    // ESPN doesn't provide these fields in projections, so they're null
    number: null,
    height: null,
    weight: null,
    age: null,
    college: null,
    experience: null,
    status: null,
    injuryStatus: null,
    injuryBodyPart: null,
    lastUpdated: null,
  };
  
  return {
    id: String(raw.PlayerID || ''),
    name: raw.Name || '',
    position: (raw.Position || '') as FantasyPosition,
    team: raw.Team || '',
    bye: raw.ByeWeek ?? null,
    proj: formatNumber(fantasy.ppr),
    adp: raw.AverageDraftPositionPPR ?? raw.AverageDraftPosition ?? null,
    projections: transformProjections(sportsdataioLike),
    stats: {},
    adpData: transformADPData(sportsdataioLike),
    meta,
  };
}

/**
 * Transform SportsDataIO stats to clean format
 */
export function transformPlayerStats(raw: SportsDataIOSeasonStats | null): TransformedPlayerStats | null {
  if (!raw) return null;
  
  const seasonStats = transformSeasonStats(raw as RawStatsInput);
  
  return {
    playerId: raw.PlayerID,
    name: raw.Name,
    team: raw.Team,
    position: raw.Position as FantasyPosition,
    games: seasonStats.games,
    fantasyPoints: seasonStats.fantasy.standard,
    fantasyPointsPPR: seasonStats.fantasy.ppr,
    fantasyPointsHalfPPR: seasonStats.fantasy.halfPpr,
    fantasyPointsPerGame: formatNumber(seasonStats.fantasy.perGame),
    passing: {
      attempts: seasonStats.passing.attempts,
      completions: seasonStats.passing.completions,
      yards: seasonStats.passing.yards,
      touchdowns: seasonStats.passing.touchdowns,
      interceptions: seasonStats.passing.interceptions,
      rating: seasonStats.passing.rating ?? 0,
      yardsPerAttempt: seasonStats.passing.yardsPerAttempt ?? 0,
      completionPct: seasonStats.passing.completionPct ?? 0,
    },
    rushing: {
      attempts: seasonStats.rushing.attempts,
      yards: seasonStats.rushing.yards,
      touchdowns: seasonStats.rushing.touchdowns,
      yardsPerAttempt: seasonStats.rushing.yardsPerAttempt ?? 0,
      long: seasonStats.rushing.long ?? 0,
    },
    receiving: {
      targets: seasonStats.receiving.targets,
      receptions: seasonStats.receiving.receptions,
      yards: seasonStats.receiving.yards,
      touchdowns: seasonStats.receiving.touchdowns,
      yardsPerReception: seasonStats.receiving.yardsPerReception ?? 0,
      long: seasonStats.receiving.long ?? 0,
      catchPct: seasonStats.receiving.catchPct ?? 0,
    },
    fumbles: seasonStats.fumbles ?? 0,
    fumblesLost: seasonStats.fumblesLost ?? 0,
    offensiveSnaps: seasonStats.offensiveSnaps ?? 0,
    offensiveSnapsPct: formatNumber(seasonStats.offensiveSnapsPct ?? 0),
  };
}

/**
 * Transform SportsDataIO ADP to clean format
 */
export function transformADP(raw: SportsDataIOADP | null): TransformedADP | null {
  if (!raw) return null;
  
  const adpData = transformADPData(raw);
  
  return {
    playerId: raw.PlayerID,
    name: raw.Name,
    team: raw.Team,
    position: raw.Position as FantasyPosition,
    adp: adpData.overall,
    adpPPR: adpData.ppr,
    adpHalfPPR: adpData.halfPpr,
    adpDynasty: adpData.dynasty,
    adpRookie: raw.AverageDraftPositionRookie || null,
    positionRank: adpData.positionRank,
    overallRank: adpData.overallRank,
    byeWeek: raw.ByeWeek || null,
    projectedPoints: raw.ProjectedFantasyPoints || null,
    projectedPointsPPR: raw.ProjectedFantasyPointsPPR || null,
    lastUpdated: raw.LastUpdated || null,
    isDerived: raw._derived || false,
  };
}


// ============================================================================
// PLAYER POOL FORMAT TRANSFORMER
// ============================================================================

/**
 * Transform player data to PLAYER_POOL format
 */
export function transformToPlayerPool(raw: RawPlayerPoolInput | null): PlayerPoolEntry | null {
  if (!raw) return null;
  
  const projections = transformProjections(raw);
  
  return {
    name: raw.Name ?? raw.name ?? '',
    position: (raw.Position ?? raw.position ?? '') as FantasyPosition,
    team: raw.Team ?? raw.team ?? '',
    bye: raw.ByeWeek ?? raw.bye ?? null,
    adp: raw.AverageDraftPositionPPR ?? raw.AverageDraftPosition ?? raw.adp ?? null,
    proj: formatNumber(projections.fantasy.ppr),
    databaseId: String(raw.PlayerID ?? raw.databaseId ?? raw.id ?? ''),
    draftkingsRank: raw.draftkingsRank ?? null,
    draftkingsPositionRank: raw.draftkingsPositionRank ?? null,
    sportsDataProjections: {
      ppr: projections.fantasy.ppr,
      halfPpr: projections.fantasy.halfPpr,
      standard: projections.fantasy.standard,
      passingYards: projections.passing.yards,
      passingTDs: projections.passing.touchdowns,
      rushingYards: projections.rushing.yards,
      rushingTDs: projections.rushing.touchdowns,
      receivingYards: projections.receiving.yards,
      receivingTDs: projections.receiving.touchdowns,
      receptions: projections.receiving.receptions,
    },
  };
}


// ============================================================================
// MERGE UTILITIES
// ============================================================================

type MergeableObject = Record<string, unknown>;

/**
 * Merge two player objects, preferring non-null values from updates
 */
export function mergePlayerData<T extends MergeableObject>(base: T | null, updates: Partial<T> | null): T | Partial<T> | null {
  if (!base) return updates;
  if (!updates) return base;
  
  const merged = { ...base } as T;
  
  for (const [key, value] of Object.entries(updates)) {
    if (value !== null && value !== undefined) {
      const typedKey = key as keyof T;
      if (typeof value === 'object' && !Array.isArray(value) && merged[typedKey]) {
        // Recursively merge nested objects
        merged[typedKey] = mergePlayerData(
          merged[typedKey] as MergeableObject, 
          value as MergeableObject
        ) as T[keyof T];
      } else {
        merged[typedKey] = value as T[keyof T];
      }
    }
  }
  
  return merged;
}

/**
 * Create a player lookup map by name
 */
export function createPlayerMap<T extends { name?: string | null }>(players: T[]): Map<string, T> {
  const map = new Map<string, T>();
  
  for (const player of players) {
    if (player.name) {
      map.set(normalizeName(player.name), player);
    }
  }
  
  return map;
}

/**
 * Find player by name with fuzzy matching
 */
export function findPlayerByName<T extends { name?: string | null }>(
  players: T[] | null | undefined, 
  name: string | null | undefined
): T | null {
  if (!name || !players?.length) return null;
  
  const normalized = normalizeName(name);
  
  // Exact match
  let found = players.find(p => normalizeName(p.name) === normalized);
  if (found) return found;
  
  // Partial match
  found = players.find(p => normalizeName(p.name).includes(normalized));
  if (found) return found;
  
  // Last name match
  const lastName = normalized.split(' ').pop() || '';
  found = players.find(p => normalizeName(p.name).includes(lastName));
  
  return found || null;
}


// ============================================================================
// DEFAULT EXPORT
// ============================================================================

const playerModel = {
  // Utility
  normalizeName,
  safeNumber,
  formatNumber,
  
  // Individual stat transformers
  transformPassingStats,
  transformRushingStats,
  transformReceivingStats,
  transformFantasyPoints,
  transformSeasonStats,
  transformADPData,
  transformProjections,
  
  // SportsDataIO transformers
  transformFromSportsDataIO,
  transformPlayerBasic,
  transformPlayerHeadshot,
  transformPlayerStats,
  transformADP,
  
  // PLAYER_POOL format
  transformToPlayerPool,
  
  // Merge utilities
  mergePlayerData,
  createPlayerMap,
  findPlayerByName,
  
  // Constants
  FANTASY_POSITIONS,
  FLEX_POSITIONS,
};

export default playerModel;

