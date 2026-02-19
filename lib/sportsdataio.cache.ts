/**
 * Cache management utilities for SportsDataIO
 */

import * as fs from 'fs';
import * as path from 'path';

import { serverLogger } from './logger/serverLogger';
import { DataType, CacheInfo, CacheConfig, CacheStatus } from './sportsdataio.types';

export const CACHE_DIR = path.join(process.cwd(), 'data/cache');

export const CACHE_CONFIG: Record<DataType, CacheConfig> = {
  projections: { file: 'sportsdataio_projections.json', ttl: 24 * 60 * 60 * 1000 },
  schedule: { file: 'sportsdataio_schedule.json', ttl: 24 * 60 * 60 * 1000 },
  injuries: { file: 'sportsdataio_injuries.json', ttl: 1 * 60 * 60 * 1000 },
  depthCharts: { file: 'sportsdataio_depth_charts.json', ttl: 6 * 60 * 60 * 1000 },
  playerStats: { file: 'sportsdataio_player_stats.json', ttl: 24 * 60 * 60 * 1000 },
  teams: { file: 'sportsdataio_teams.json', ttl: 24 * 60 * 60 * 1000 },
  news: { file: 'sportsdataio_news.json', ttl: 15 * 60 * 1000 },
  byeWeeks: { file: 'sportsdataio_bye_weeks.json', ttl: 24 * 60 * 60 * 1000 },
  players: { file: 'sportsdataio_players.json', ttl: 24 * 60 * 60 * 1000 },
  headshots: { file: 'sportsdataio_headshots.json', ttl: 7 * 24 * 60 * 60 * 1000 },
  liveScores: { file: 'sportsdataio_live_scores.json', ttl: 10 * 1000 },
  boxScores: { file: 'sportsdataio_box_scores.json', ttl: 30 * 1000 },
  timeframes: { file: 'sportsdataio_timeframes.json', ttl: 1 * 60 * 60 * 1000 },
  seasonStats: { file: 'sportsdataio_season_stats.json', ttl: 6 * 60 * 60 * 1000 },
  weeklyStats: { file: 'sportsdataio_weekly_stats.json', ttl: 1 * 60 * 60 * 1000 },
  redZoneStats: { file: 'sportsdataio_redzone_stats.json', ttl: 6 * 60 * 60 * 1000 },
  playerSeasonStats: { file: 'sportsdataio_player_season_stats.json', ttl: 6 * 60 * 60 * 1000 },
  adp: { file: 'sportsdataio_adp.json', ttl: 6 * 60 * 60 * 1000 },
  fantasyRankings: { file: 'sportsdataio_fantasy_rankings.json', ttl: 6 * 60 * 60 * 1000 },
};

// Legacy compatibility
export const CACHE_FILE = path.join(CACHE_DIR, 'sportsdataio_projections.json');
export const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * Ensure cache directory exists
 */
export function ensureCacheDir(): void {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
}

/**
 * Check if cache is valid (exists and not expired)
 */
export function isCacheValid(): boolean {
  if (!fs.existsSync(CACHE_FILE)) {
    return false;
  }

  try {
    const cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
    const cacheAge = Date.now() - cache.timestamp;
    return cacheAge < CACHE_TTL_MS;
  } catch (err) {
    return false;
  }
}

/**
 * Read projections from cache
 */
export function readCache(): unknown[] | null {
  try {
    const cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
    return cache.data;
  } catch (err) {
    return null;
  }
}

/**
 * Write projections to cache
 */
export function writeCache(data: unknown[]): void {
  ensureCacheDir();
  const cache = {
    timestamp: Date.now(),
    updatedAt: new Date().toISOString(),
    data: data
  };
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
  serverLogger.debug('Cache written', { playerCount: Array.isArray(data) ? data.length : 0 });
}

/**
 * Get cache info
 */
export function getCacheInfo(): CacheInfo | null {
  if (!fs.existsSync(CACHE_FILE)) {
    return null;
  }

  try {
    const cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
    const cacheAge = Date.now() - cache.timestamp;
    return {
      updatedAt: cache.updatedAt,
      ageMs: cacheAge,
      ageHours: (cacheAge / (1000 * 60 * 60)).toFixed(1),
      isValid: cacheAge < CACHE_TTL_MS,
      playerCount: Array.isArray(cache.data) ? cache.data.length : 0
    };
  } catch (err) {
    return null;
  }
}

/**
 * Get cache file path for a data type
 */
export function getCacheFilePath(dataType: DataType): string {
  const config = CACHE_CONFIG[dataType];
  if (!config) throw new Error(`Unknown data type: ${dataType}`);
  return path.join(CACHE_DIR, config.file);
}

/**
 * Check if cache is valid for a specific data type
 */
export function isCacheValidFor(dataType: DataType): boolean {
  const filePath = getCacheFilePath(dataType);
  const ttl = CACHE_CONFIG[dataType].ttl;

  if (!fs.existsSync(filePath)) return false;

  try {
    const cache = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return (Date.now() - cache.timestamp) < ttl;
  } catch {
    return false;
  }
}

/**
 * Read from cache
 */
export function readCacheFor(dataType: DataType): unknown {
  try {
    const filePath = getCacheFilePath(dataType);
    const cache = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return cache.data;
  } catch {
    return null;
  }
}

/**
 * Write to cache
 */
export function writeCacheFor(dataType: DataType, data: unknown): void {
  ensureCacheDir();
  const filePath = getCacheFilePath(dataType);
  const cache = {
    timestamp: Date.now(),
    updatedAt: new Date().toISOString(),
    dataType,
    data
  };
  fs.writeFileSync(filePath, JSON.stringify(cache, null, 2));
  serverLogger.debug('Cache written', { dataType, itemCount: Array.isArray(data) ? data.length : 1 });
}

/**
 * Generic fetch with caching
 */
export async function fetchWithCache<T>(
  dataType: DataType,
  fetchFn: () => Promise<T>,
  forceRefresh: boolean = false
): Promise<T> {
  if (!forceRefresh && isCacheValidFor(dataType)) {
    serverLogger.debug('Using cached data', { dataType });
    return readCacheFor(dataType) as T;
  }

  const data = await fetchFn();
  writeCacheFor(dataType, data);
  return data;
}

/**
 * Get status of all caches
 */
export function getAllCacheStatus(): Record<string, CacheStatus> {
  const status: Record<string, CacheStatus> = {};

  Object.entries(CACHE_CONFIG).forEach(([dataType, config]) => {
    const filePath = path.join(CACHE_DIR, config.file);

    if (!fs.existsSync(filePath)) {
      status[dataType] = { exists: false };
      return;
    }

    try {
      const cache = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      const ageMs = Date.now() - cache.timestamp;
      status[dataType] = {
        exists: true,
        updatedAt: cache.updatedAt,
        ageMinutes: Math.round(ageMs / 60000),
        isValid: ageMs < config.ttl,
        ttlMinutes: Math.round(config.ttl / 60000),
        itemCount: Array.isArray(cache.data) ? cache.data.length : 1,
      };
    } catch {
      status[dataType] = { exists: true, error: 'Failed to read' };
    }
  });

  return status;
}

/**
 * Clear all caches
 */
export function clearAllCaches(): void {
  Object.values(CACHE_CONFIG).forEach(config => {
    const filePath = path.join(CACHE_DIR, config.file);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  });
  serverLogger.info('All caches cleared');
}
