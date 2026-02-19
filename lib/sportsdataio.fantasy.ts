/**
 * Fantasy stats, ADP, and rankings service for SportsDataIO
 */

import * as fs from 'fs';
import * as path from 'path';

import { serverLogger } from './logger/serverLogger';
import { fetchWithCache, ensureCacheDir } from './sportsdataio.cache';
import {
  ADPData,
  TransformedADP,
  FantasyPlayer,
  FantasyPlayersOptions,
  ADPByPositionOptions,
  SportsDataIOPlayer,
} from './sportsdataio.types';

const playerModel = require('./playerModel');
const BASE_URL = 'https://api.sportsdata.io/v3/nfl';
const CACHE_DIR = path.join(process.cwd(), 'data/cache');

// ============================================================================
// PLAYER SEASON STATS
// ============================================================================

/**
 * Fetch player season stats
 */
export async function fetchPlayerSeasonStats(
  apiKey: string,
  season: number = new Date().getFullYear()
): Promise<unknown[]> {
  const url = `${BASE_URL}/stats/json/PlayerSeasonStats/${season}?key=${apiKey}`;
  serverLogger.debug('Fetching player season stats', { season });

  const response = await fetch(url);
  if (!response.ok) throw new Error(`Player Season Stats API error: ${response.status}`);

  const data = await response.json();
  serverLogger.debug('Fetched player season stats', { count: Array.isArray(data) ? data.length : 0 });
  return data as unknown[];
}

/**
 * Get player season stats with caching
 */
export async function getPlayerSeasonStats(
  apiKey: string,
  season: number = new Date().getFullYear(),
  forceRefresh: boolean = false
): Promise<unknown[]> {
  const cacheFile = path.join(CACHE_DIR, `sportsdataio_season_stats_${season}.json`);
  const ttl = 6 * 60 * 60 * 1000;

  if (!forceRefresh && fs.existsSync(cacheFile)) {
    try {
      const cache = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
      if (Date.now() - cache.timestamp < ttl) {
        serverLogger.debug('Using cached season stats', { season });
        return cache.data;
      }
    } catch {
      // Ignore cache read errors
    }
  }

  const data = await fetchPlayerSeasonStats(apiKey, season);

  ensureCacheDir();
  fs.writeFileSync(cacheFile, JSON.stringify({
    timestamp: Date.now(),
    updatedAt: new Date().toISOString(),
    season,
    data
  }, null, 2));

  return data;
}

/**
 * Fetch player game stats for a specific week
 */
export async function fetchPlayerGameStats(
  apiKey: string,
  season: number,
  week: number
): Promise<unknown[]> {
  const url = `${BASE_URL}/stats/json/PlayerGameStatsByWeek/${season}/${week}?key=${apiKey}`;
  serverLogger.debug('Fetching player game stats', { season, week });

  const response = await fetch(url);
  if (!response.ok) throw new Error(`Player Game Stats API error: ${response.status}`);

  const data = await response.json();
  serverLogger.debug('Fetched player game stats', { count: Array.isArray(data) ? data.length : 0 });
  return data as unknown[];
}

/**
 * Get player game stats with caching
 */
export async function getPlayerGameStats(
  apiKey: string,
  season: number,
  week: number,
  forceRefresh: boolean = false
): Promise<unknown[]> {
  const cacheFile = path.join(CACHE_DIR, `sportsdataio_game_stats_${season}_${week}.json`);
  const ttl = 1 * 60 * 60 * 1000;

  if (!forceRefresh && fs.existsSync(cacheFile)) {
    try {
      const cache = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
      if (Date.now() - cache.timestamp < ttl) {
        serverLogger.debug('Using cached game stats', { season, week });
        return cache.data;
      }
    } catch {
      // Ignore cache read errors
    }
  }

  const data = await fetchPlayerGameStats(apiKey, season, week);

  ensureCacheDir();
  fs.writeFileSync(cacheFile, JSON.stringify({
    timestamp: Date.now(),
    updatedAt: new Date().toISOString(),
    season,
    week,
    data
  }, null, 2));

  return data;
}

/**
 * Fetch player red zone stats
 */
export async function fetchPlayerRedZoneStats(
  apiKey: string,
  season: number = new Date().getFullYear()
): Promise<unknown[]> {
  const url = `${BASE_URL}/stats/json/PlayerSeasonRedZoneStats/${season}?key=${apiKey}`;
  serverLogger.debug('Fetching red zone stats', { season });

  const response = await fetch(url);
  if (!response.ok) throw new Error(`Red Zone Stats API error: ${response.status}`);

  const data = await response.json();
  serverLogger.debug('Fetched red zone stats', { count: Array.isArray(data) ? data.length : 0 });
  return data as unknown[];
}

/**
 * Get red zone stats with caching
 */
export async function getPlayerRedZoneStats(
  apiKey: string,
  season: number = new Date().getFullYear(),
  forceRefresh: boolean = false
): Promise<unknown[]> {
  const cacheFile = path.join(CACHE_DIR, `sportsdataio_redzone_stats_${season}.json`);
  const ttl = 6 * 60 * 60 * 1000;

  if (!forceRefresh && fs.existsSync(cacheFile)) {
    try {
      const cache = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
      if (Date.now() - cache.timestamp < ttl) {
        serverLogger.debug('Using cached red zone stats', { season });
        return cache.data;
      }
    } catch {
      // Ignore cache read errors
    }
  }

  const data = await fetchPlayerRedZoneStats(apiKey, season);

  ensureCacheDir();
  fs.writeFileSync(cacheFile, JSON.stringify({
    timestamp: Date.now(),
    updatedAt: new Date().toISOString(),
    season,
    data
  }, null, 2));

  return data;
}

// ============================================================================
// STAT TRANSFORMATIONS
// ============================================================================

/**
 * Transform player stats using unified playerModel
 */
export function transformPlayerStats(player: unknown): unknown {
  return playerModel.transformPlayerStats(player);
}

/**
 * Get player stats by name
 */
export async function getPlayerStatsByName(
  apiKey: string,
  playerName: string,
  season: number = new Date().getFullYear(),
  forceRefresh: boolean = false
): Promise<unknown | null> {
  const stats = await getPlayerSeasonStats(apiKey, season, forceRefresh);
  const nameLower = playerName.toLowerCase();

  const player = (stats as Array<{ Name?: string; [key: string]: unknown }>).find(p =>
    p.Name && p.Name.toLowerCase() === nameLower
  );

  return player ? transformPlayerStats(player) : null;
}

/**
 * Get top fantasy players by position
 */
export async function getTopFantasyPlayers(
  apiKey: string,
  position: string,
  limit: number = 20,
  season: number = new Date().getFullYear(),
  forceRefresh: boolean = false
): Promise<unknown[]> {
  const stats = await getPlayerSeasonStats(apiKey, season, forceRefresh);

  return (stats as Array<{
    Position?: string;
    FantasyPointsPPR?: number;
    [key: string]: unknown;
  }>)
    .filter(p => p.Position === position.toUpperCase())
    .sort((a, b) => (b.FantasyPointsPPR || 0) - (a.FantasyPointsPPR || 0))
    .slice(0, limit)
    .map(transformPlayerStats);
}

/**
 * Get weekly fantasy stats
 */
export async function getWeeklyFantasyStats(
  apiKey: string,
  season: number,
  week: number,
  forceRefresh: boolean = false
): Promise<unknown[]> {
  const stats = await getPlayerGameStats(apiKey, season, week, forceRefresh);

  return (stats as Array<{
    Position?: string;
    FantasyPointsPPR?: number;
    [key: string]: unknown;
  }>)
    .filter(p => ['QB', 'RB', 'WR', 'TE'].includes(p.Position || ''))
    .sort((a, b) => (b.FantasyPointsPPR || 0) - (a.FantasyPointsPPR || 0))
    .map(transformPlayerStats);
}

// ============================================================================
// ADP & RANKINGS
// ============================================================================

/**
 * Fetch ADP data
 */
export async function fetchADP(apiKey: string): Promise<ADPData[]> {
  const url = `${BASE_URL}/fantasy/json/DraftKings/DraftKingsADP?key=${apiKey}`;
  serverLogger.debug('Fetching ADP');

  const response = await fetch(url);
  if (!response.ok) throw new Error(`ADP API error: ${response.status}`);

  const data = await response.json();
  serverLogger.debug('Fetched ADP', { entryCount: Array.isArray(data) ? data.length : 0 });
  return data as ADPData[];
}

/**
 * Get ADP with caching
 */
export async function getADP(apiKey: string, forceRefresh: boolean = false): Promise<ADPData[]> {
  return fetchWithCache('adp', () => fetchADP(apiKey), forceRefresh) as Promise<ADPData[]>;
}

/**
 * Derive ADP from projections if ADP data unavailable
 */
export async function deriveADPFromProjections(apiKey: string): Promise<ADPData[]> {
  const { getProjections } = require('./sportsdataio.core');
  const projections = await getProjections(apiKey) as SportsDataIOPlayer[];

  return projections
    .filter(p => ['QB', 'RB', 'WR', 'TE'].includes(p.Position))
    .sort((a, b) => {
      const aProj = (a as { ProjectedFantasyPointsPPR?: number }).ProjectedFantasyPointsPPR || 0;
      const bProj = (b as { ProjectedFantasyPointsPPR?: number }).ProjectedFantasyPointsPPR || 0;
      return bProj - aProj;
    })
    .map((p, index) => ({
      PlayerID: p.PlayerID,
      Name: p.Name,
      Position: p.Position,
      Team: p.Team,
      AverageDraftPosition: index + 1,
      AverageDraftPositionPPR: index + 1,
      _derived: true
    })) as ADPData[];
}

/**
 * Fetch fantasy rankings
 */
export async function fetchFantasyRankings(apiKey: string): Promise<unknown[]> {
  const url = `${BASE_URL}/fantasy/json/DraftKings/DraftKingsPlayerOwnership?key=${apiKey}`;
  serverLogger.debug('Fetching fantasy rankings');

  const response = await fetch(url);
  if (!response.ok) throw new Error(`Fantasy Rankings API error: ${response.status}`);

  const data = await response.json();
  serverLogger.debug('Fetched fantasy rankings', { count: Array.isArray(data) ? data.length : 0 });
  return data as unknown[];
}

/**
 * Get fantasy rankings with caching
 */
export async function getFantasyRankings(
  apiKey: string,
  forceRefresh: boolean = false
): Promise<unknown[]> {
  return fetchWithCache('fantasyRankings', () => fetchFantasyRankings(apiKey), forceRefresh) as Promise<unknown[]>;
}

/**
 * Transform ADP using unified playerModel
 */
export function transformADP(adp: ADPData): TransformedADP {
  return playerModel.transformADP(adp);
}

/**
 * Get ADP as a map by player name
 */
export async function getADPMap(
  apiKey: string,
  forceRefresh: boolean = false
): Promise<Map<string, TransformedADP>> {
  const adp = await getADP(apiKey, forceRefresh);
  const map = new Map<string, TransformedADP>();

  adp.forEach(p => {
    if (p.Name) {
      map.set(p.Name, transformADP(p));
    }
  });

  return map;
}

/**
 * Get ADP for a specific player by name
 */
export async function getPlayerADP(
  apiKey: string,
  playerName: string,
  forceRefresh: boolean = false
): Promise<TransformedADP | null> {
  const adp = await getADP(apiKey, forceRefresh);

  const nameLower = playerName.toLowerCase();
  const player = adp.find(p =>
    p.Name && p.Name.toLowerCase() === nameLower
  );

  if (!player) return null;
  return transformADP(player);
}

/**
 * Get ADP rankings sorted by position
 */
export async function getADPByPosition(
  apiKey: string,
  position: string,
  options: ADPByPositionOptions = {}
): Promise<TransformedADP[]> {
  const { limit = 50, scoringType = 'ppr' } = options;

  let adp = await getADP(apiKey);

  // Filter to specified position(s)
  if (position) {
    const positions = position.toUpperCase().split(',');
    adp = adp.filter(p => positions.includes(p.Position));
  } else {
    // Default to fantasy-relevant positions
    adp = adp.filter(p => ['QB', 'RB', 'WR', 'TE'].includes(p.Position));
  }

  // Sort by ADP
  const adpField = scoringType.toLowerCase() === 'ppr' ? 'AverageDraftPositionPPR' : 'AverageDraftPosition';
  adp.sort((a, b) => {
    const aVal = (a as Record<string, unknown>)[adpField] as number || 999;
    const bVal = (b as Record<string, unknown>)[adpField] as number || 999;
    return aVal - bVal;
  });

  return adp.slice(0, limit).map(transformADP);
}

/**
 * Get fantasy player data (includes projections, ADP, rankings)
 */
export async function getFantasyPlayers(
  apiKey: string,
  options: FantasyPlayersOptions = {}
): Promise<FantasyPlayer[]> {
  const { position, limit = 100, forceRefresh = false } = options;

  let players = await getFantasyRankings(apiKey, forceRefresh) as Array<{
    PlayerID?: number;
    Name?: string;
    Team?: string;
    Position?: string;
    ByeWeek?: number;
    AverageDraftPosition?: number;
    AverageDraftPositionPPR?: number;
    ProjectedFantasyPoints?: number;
    FantasyPoints?: number;
    ProjectedFantasyPointsPPR?: number;
    FantasyPointsPPR?: number;
    OverallRank?: number;
    PositionRank?: number;
    AuctionValue?: number;
    AuctionValuePPR?: number;
    Status?: string;
    InjuryStatus?: string;
    _derived?: boolean;
    [key: string]: unknown;
  }>;

  // Filter to fantasy-relevant positions
  players = players.filter(p => ['QB', 'RB', 'WR', 'TE'].includes(p.Position || ''));

  // Filter by position if specified
  if (position) {
    const positions = position.toUpperCase().split(',');
    players = players.filter(p => positions.includes(p.Position || ''));
  }

  // Sort by ADP (or projected points if derived)
  players.sort((a, b) => {
    const aVal = a.AverageDraftPositionPPR || a.AverageDraftPosition || 999;
    const bVal = b.AverageDraftPositionPPR || b.AverageDraftPosition || 999;
    return aVal - bVal;
  });

  return players.slice(0, limit).map((p, index) => ({
    playerId: p.PlayerID || 0,
    name: p.Name || '',
    team: p.Team || '',
    position: p.Position || '',
    byeWeek: p.ByeWeek,

    // ADP
    adp: p.AverageDraftPosition || null,
    adpPPR: p.AverageDraftPositionPPR || null,

    // Projections
    projectedPoints: p.ProjectedFantasyPoints || p.FantasyPoints || null,
    projectedPointsPPR: p.ProjectedFantasyPointsPPR || p.FantasyPointsPPR || null,

    // Rankings (derive if not present)
    overallRank: p.OverallRank || index + 1,
    positionRank: p.PositionRank || null,

    // Auction values
    auctionValue: p.AuctionValue || null,
    auctionValuePPR: p.AuctionValuePPR || null,

    // Status
    status: p.Status || 'Active',
    injuryStatus: p.InjuryStatus || null,

    // Flag if derived
    isDerived: p._derived || false,
  }));
}
