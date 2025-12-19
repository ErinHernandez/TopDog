/**
 * Historical Statistics Service
 * 
 * Provides read-only access to historical NFL player statistics.
 * Data is served from static JSON files and is immutable during draft season.
 */

import type {
  HistoricalManifest,
  PlayerIndex,
  SeasonDataFile,
  SeasonStats,
  HistoricalPlayer,
} from './types';

const HISTORY_BASE_PATH = '/data/history';

// In-memory cache for loaded data (persists during session)
const cache = new Map<string, unknown>();

// =============================================================================
// CORE DATA LOADING
// =============================================================================

/**
 * Load a JSON file from the historical data directory
 */
async function loadFile<T>(path: string): Promise<T | null> {
  const fullPath = `${HISTORY_BASE_PATH}/${path}`;
  
  // Check cache first
  if (cache.has(fullPath)) {
    return cache.get(fullPath) as T;
  }
  
  try {
    const response = await fetch(fullPath);
    if (!response.ok) {
      console.warn(`[HistoricalStats] File not found: ${fullPath}`);
      return null;
    }
    
    const data = await response.json();
    cache.set(fullPath, data);
    return data as T;
  } catch (error) {
    console.error(`[HistoricalStats] Failed to load: ${fullPath}`, error);
    return null;
  }
}

/**
 * Load the manifest file
 */
export async function getManifest(): Promise<HistoricalManifest | null> {
  return loadFile<HistoricalManifest>('manifest.json');
}

/**
 * Load the player index
 */
export async function getPlayerIndex(): Promise<PlayerIndex | null> {
  return loadFile<PlayerIndex>('players/index.json');
}

/**
 * Load season data for a specific year
 */
export async function getSeasonData(season: number): Promise<SeasonDataFile | null> {
  return loadFile<SeasonDataFile>(`seasons/${season}.json`);
}

// =============================================================================
// PLAYER QUERIES
// =============================================================================

/**
 * Get a player by ID from the index
 */
export async function getPlayer(playerId: string): Promise<HistoricalPlayer | null> {
  const index = await getPlayerIndex();
  return index?.players[playerId] || null;
}

/**
 * Search players by name (case-insensitive partial match)
 */
export async function searchPlayers(query: string): Promise<HistoricalPlayer[]> {
  const index = await getPlayerIndex();
  if (!index) return [];
  
  const normalizedQuery = query.toLowerCase().trim();
  if (!normalizedQuery) return [];
  
  return Object.values(index.players).filter(player =>
    player.name.toLowerCase().includes(normalizedQuery)
  );
}

/**
 * Get all players for a position
 */
export async function getPlayersByPosition(
  position: 'QB' | 'RB' | 'WR' | 'TE'
): Promise<HistoricalPlayer[]> {
  const index = await getPlayerIndex();
  if (!index) return [];
  
  return Object.values(index.players).filter(player => 
    player.position === position
  );
}

// =============================================================================
// SEASON STATS QUERIES
// =============================================================================

/**
 * Get season statistics for a specific player and season
 */
export async function getPlayerSeasonStats(
  playerId: string,
  season: number
): Promise<SeasonStats | null> {
  const seasonData = await getSeasonData(season);
  return seasonData?.players[playerId] || null;
}

/**
 * Get all historical seasons for a player
 */
export async function getPlayerAllSeasons(
  playerId: string
): Promise<SeasonStats[]> {
  const manifest = await getManifest();
  if (!manifest) return [];
  
  const results: SeasonStats[] = [];
  
  for (const season of manifest.historicalSeasons) {
    const stats = await getPlayerSeasonStats(playerId, season);
    if (stats) {
      results.push(stats);
    }
  }
  
  // Sort by season descending (most recent first)
  return results.sort((a, b) => b.season - a.season);
}

/**
 * Get top performers for a position in a season (by half-PPR PPG)
 */
export async function getTopPerformers(
  position: 'QB' | 'RB' | 'WR' | 'TE',
  season: number,
  limit: number = 20
): Promise<SeasonStats[]> {
  const seasonData = await getSeasonData(season);
  if (!seasonData) return [];
  
  return Object.values(seasonData.players)
    .filter(p => p.position === position)
    .sort((a, b) => b.fantasy.halfPprPpg - a.fantasy.halfPprPpg)
    .slice(0, limit);
}

/**
 * Get all stats for a season
 */
export async function getAllSeasonStats(season: number): Promise<SeasonStats[]> {
  const seasonData = await getSeasonData(season);
  if (!seasonData) return [];
  
  return Object.values(seasonData.players);
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Check if historical data is available
 */
export async function isHistoricalDataAvailable(): Promise<boolean> {
  const manifest = await getManifest();
  return manifest !== null && manifest.historicalSeasons.length > 0;
}

/**
 * Get available seasons
 */
export async function getAvailableSeasons(): Promise<number[]> {
  const manifest = await getManifest();
  return manifest?.historicalSeasons || [];
}

/**
 * Preload commonly needed data for faster access
 * Call during app initialization
 */
export async function preloadHistoricalData(): Promise<void> {
  await Promise.all([
    getManifest(),
    getPlayerIndex(),
  ]);
  console.log('[HistoricalStats] Core data preloaded');
}

/**
 * Clear the cache (useful for testing)
 */
export function clearCache(): void {
  cache.clear();
}

/**
 * Calculate half-PPR fantasy points from stats
 */
export function calculateHalfPprPoints(stats: SeasonStats): number {
  let points = 0;
  
  // Passing: 0.04 per yard, 4 per TD, -2 per INT
  if (stats.passing) {
    points += stats.passing.yards * 0.04;
    points += stats.passing.touchdowns * 4;
    points -= stats.passing.interceptions * 2;
  }
  
  // Rushing: 0.1 per yard, 6 per TD, -2 per fumble lost
  if (stats.rushing) {
    points += stats.rushing.yards * 0.1;
    points += stats.rushing.touchdowns * 6;
    points -= stats.rushing.fumblesLost * 2;
  }
  
  // Receiving: 0.5 per reception (half-PPR), 0.1 per yard, 6 per TD
  if (stats.receiving) {
    points += stats.receiving.receptions * 0.5;
    points += stats.receiving.yards * 0.1;
    points += stats.receiving.touchdowns * 6;
  }
  
  return Math.round(points * 10) / 10; // Round to 1 decimal
}



