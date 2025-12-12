/**
 * Static Player Data Module
 * 
 * Loads and provides access to static player data:
 * - Registry (biographical)
 * - Career Stats (historical)
 * - Rosters (current team assignments)
 * 
 * Usage:
 *   import { getRegistry, getRosters, getFullPlayer } from '@/lib/playerData';
 *   
 *   const registry = await getRegistry();
 *   const player = registry.players['chase_jamarr'];
 */

import type {
  RegistryData,
  CareerStatsData,
  RostersData,
  PlayerBio,
  SeasonStats,
  RosterEntry,
  FullPlayer,
  Position,
} from './types';

// ============================================================================
// CONSTANTS
// ============================================================================

const CURRENT_YEAR = '2025';
const DATA_PATH = '/data/players';

// ============================================================================
// CACHE
// ============================================================================

let registryCache: RegistryData | null = null;
let careerStatsCache: CareerStatsData | null = null;
let rostersCache: RostersData | null = null;

// ============================================================================
// LOADERS
// ============================================================================

/**
 * Load player registry (biographical data).
 * Cached after first load.
 */
export async function getRegistry(): Promise<RegistryData> {
  if (registryCache) return registryCache;
  
  const response = await fetch(`${DATA_PATH}/registry.json`);
  if (!response.ok) throw new Error('Failed to load player registry');
  
  registryCache = await response.json();
  return registryCache!;
}

/**
 * Load career stats (historical seasons).
 * Cached after first load.
 */
export async function getCareerStats(): Promise<CareerStatsData> {
  if (careerStatsCache) return careerStatsCache;
  
  const response = await fetch(`${DATA_PATH}/career-stats.json`);
  if (!response.ok) throw new Error('Failed to load career stats');
  
  careerStatsCache = await response.json();
  return careerStatsCache!;
}

/**
 * Load current rosters (team assignments).
 * Cached after first load.
 */
export async function getRosters(year: string = CURRENT_YEAR): Promise<RostersData> {
  if (rostersCache) return rostersCache;
  
  const response = await fetch(`${DATA_PATH}/rosters-${year}.json`);
  if (!response.ok) throw new Error('Failed to load rosters');
  
  rostersCache = await response.json();
  return rostersCache!;
}

/**
 * Preload all static data.
 * Call early in app lifecycle for best performance.
 */
export async function preloadAllPlayerData(): Promise<void> {
  await Promise.all([
    getRegistry(),
    getCareerStats(),
    getRosters(),
  ]);
}

// ============================================================================
// PLAYER LOOKUPS
// ============================================================================

/**
 * Get a player's biographical data.
 */
export async function getPlayerBio(playerId: string): Promise<PlayerBio | undefined> {
  const registry = await getRegistry();
  return registry.players[playerId];
}

/**
 * Get a player's career stats.
 */
export async function getPlayerCareerStats(
  playerId: string
): Promise<Record<string, SeasonStats> | undefined> {
  const stats = await getCareerStats();
  return stats.players[playerId];
}

/**
 * Get a player's current team assignment.
 */
export async function getPlayerRoster(playerId: string): Promise<RosterEntry | undefined> {
  const rosters = await getRosters();
  return rosters.players[playerId];
}

/**
 * Get a fully composed player object with all static data.
 */
export async function getFullPlayer(playerId: string): Promise<FullPlayer | undefined> {
  const [registry, careerStats, rosters] = await Promise.all([
    getRegistry(),
    getCareerStats(),
    getRosters(),
  ]);
  
  const bio = registry.players[playerId];
  if (!bio) return undefined;
  
  const roster = rosters.players[playerId];
  const stats = careerStats.players[playerId];
  
  return {
    ...bio,
    team: roster?.team ?? '',
    byeWeek: roster?.byeWeek ?? 0,
    careerStats: stats,
  };
}

/**
 * Get all players with full data.
 */
export async function getAllFullPlayers(): Promise<FullPlayer[]> {
  const [registry, careerStats, rosters] = await Promise.all([
    getRegistry(),
    getCareerStats(),
    getRosters(),
  ]);
  
  return Object.values(registry.players).map(bio => ({
    ...bio,
    team: rosters.players[bio.id]?.team ?? '',
    byeWeek: rosters.players[bio.id]?.byeWeek ?? 0,
    careerStats: careerStats.players[bio.id],
  }));
}

// ============================================================================
// FILTERING
// ============================================================================

/**
 * Get all players at a position.
 */
export async function getPlayersByPosition(position: Position): Promise<FullPlayer[]> {
  const players = await getAllFullPlayers();
  return players.filter(p => p.position === position);
}

/**
 * Get all players on a team.
 */
export async function getPlayersByTeam(team: string): Promise<FullPlayer[]> {
  const players = await getAllFullPlayers();
  return players.filter(p => p.team === team);
}

/**
 * Get all players from a college.
 */
export async function getPlayersByCollege(college: string): Promise<FullPlayer[]> {
  const players = await getAllFullPlayers();
  return players.filter(p => p.college.toLowerCase() === college.toLowerCase());
}

// ============================================================================
// STATS HELPERS
// ============================================================================

/**
 * Get a player's stats for a specific season.
 */
export async function getSeasonStats(
  playerId: string,
  season: string
): Promise<SeasonStats | undefined> {
  const stats = await getPlayerCareerStats(playerId);
  return stats?.[season];
}

/**
 * Get a player's career totals.
 */
export async function getCareerTotals(playerId: string): Promise<SeasonStats | undefined> {
  const stats = await getPlayerCareerStats(playerId);
  if (!stats) return undefined;
  
  const seasons = Object.values(stats);
  if (seasons.length === 0) return undefined;
  
  return seasons.reduce((totals, season) => ({
    games: totals.games + season.games,
    passYards: (totals.passYards ?? 0) + (season.passYards ?? 0),
    passTd: (totals.passTd ?? 0) + (season.passTd ?? 0),
    int: (totals.int ?? 0) + (season.int ?? 0),
    rushYards: (totals.rushYards ?? 0) + (season.rushYards ?? 0),
    rushTd: (totals.rushTd ?? 0) + (season.rushTd ?? 0),
    rec: (totals.rec ?? 0) + (season.rec ?? 0),
    recYards: (totals.recYards ?? 0) + (season.recYards ?? 0),
    recTd: (totals.recTd ?? 0) + (season.recTd ?? 0),
    fantasyPts: totals.fantasyPts + season.fantasyPts,
  }));
}

/**
 * Get a player's average fantasy points per season.
 */
export async function getAverageFantasyPoints(playerId: string): Promise<number | undefined> {
  const stats = await getPlayerCareerStats(playerId);
  if (!stats) return undefined;
  
  const seasons = Object.values(stats);
  if (seasons.length === 0) return undefined;
  
  const total = seasons.reduce((sum, s) => sum + s.fantasyPts, 0);
  return Math.round((total / seasons.length) * 10) / 10;
}

// ============================================================================
// EXPORTS
// ============================================================================

export type {
  RegistryData,
  CareerStatsData,
  RostersData,
  PlayerBio,
  SeasonStats,
  RosterEntry,
  FullPlayer,
  Position,
} from './types';

