/**
 * Core SportsDataIO API - Projections, Schedule, Injuries, Depth Charts, Stats
 */

import { serverLogger } from './logger/serverLogger';
import { fetchWithCache } from './sportsdataio.cache';
import {
  SportsDataIOPlayer,
  TransformedPlayer,
  Injury,
  DepthChart,
} from './sportsdataio.types';

const playerModel = require('./playerModel');
const BASE_URL = 'https://api.sportsdata.io/v3/nfl';

// ============================================================================
// PROJECTIONS
// ============================================================================

/**
 * Fetch player season projections from SportsDataIO
 */
export async function fetchProjections(
  apiKey: string,
  season: number = new Date().getFullYear()
): Promise<SportsDataIOPlayer[]> {
  const url = `https://api.sportsdata.io/v3/nfl/projections/json/PlayerSeasonProjectionStats/${season}?key=${apiKey}`;

  serverLogger.debug('Fetching projections', { season });

  const response = await fetch(url);

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`SportsDataIO API error: ${response.status} - ${text}`);
  }

  const data = await response.json() as SportsDataIOPlayer[];
  serverLogger.debug('Fetched projections', { playerCount: data.length });

  return data;
}

/**
 * Get projections (from cache if valid, otherwise fetch fresh)
 */
export async function getProjections(
  apiKey: string,
  forceRefresh: boolean = false
): Promise<unknown[]> {
  return fetchWithCache('projections', () => fetchProjections(apiKey), forceRefresh) as Promise<unknown[]>;
}

/**
 * Transform SportsDataIO player to match PLAYER_POOL format
 * Uses unified playerModel for consistent transformation
 */
export function transformPlayer(player: SportsDataIOPlayer): TransformedPlayer {
  const projections = playerModel.transformProjections(player);

  return {
    name: player.Name,
    position: player.Position,
    team: player.Team,
    sportsDataId: player.PlayerID,
    proj: playerModel.formatNumber(projections.fantasy.ppr),
    projections: {
      ppr: projections.fantasy.ppr,
      halfPpr: projections.fantasy.halfPpr,
      standard: projections.fantasy.standard,
      passing: projections.passing,
      rushing: projections.rushing,
      receiving: projections.receiving,
    }
  };
}

/**
 * Get projections as a map keyed by player name (normalized)
 */
export async function getProjectionsMap(
  apiKey: string,
  forceRefresh: boolean = false
): Promise<Map<string, TransformedPlayer>> {
  const projections = await getProjections(apiKey, forceRefresh) as SportsDataIOPlayer[];
  const map = new Map<string, TransformedPlayer>();

  projections.forEach(player => {
    if (player.Name && player.Position) {
      const normalizedName = player.Name.trim();
      map.set(normalizedName, transformPlayer(player));
    }
  });

  return map;
}

// ============================================================================
// NFL SCHEDULE
// ============================================================================

/**
 * Fetch NFL schedule for a season
 */
export async function fetchSchedule(
  apiKey: string,
  season: number = new Date().getFullYear()
): Promise<unknown[]> {
  const url = `${BASE_URL}/scores/json/Schedules/${season}?key=${apiKey}`;
  serverLogger.debug('Fetching schedule', { season });

  const response = await fetch(url);
  if (!response.ok) throw new Error(`Schedule API error: ${response.status}`);

  const data = await response.json();
  serverLogger.debug('Fetched schedule', { gameCount: Array.isArray(data) ? data.length : 0 });
  return data as unknown[];
}

/**
 * Get schedule with caching
 */
export async function getSchedule(
  apiKey: string,
  season: number = new Date().getFullYear(),
  forceRefresh: boolean = false
): Promise<unknown[]> {
  return fetchWithCache('schedule', () => fetchSchedule(apiKey, season), forceRefresh) as Promise<unknown[]>;
}

// ============================================================================
// INJURIES
// ============================================================================

/**
 * Fetch NFL injuries
 */
export async function fetchInjuries(apiKey: string): Promise<Injury[]> {
  const url = `${BASE_URL}/scores/json/Injuries?key=${apiKey}`;
  serverLogger.debug('Fetching injuries');

  const response = await fetch(url);
  if (!response.ok) throw new Error(`Injuries API error: ${response.status}`);

  const data = await response.json();
  serverLogger.debug('Fetched injuries', { count: Array.isArray(data) ? data.length : 0 });
  return data as Injury[];
}

/**
 * Get injuries with caching (1 hour TTL)
 */
export async function getInjuries(apiKey: string, forceRefresh: boolean = false): Promise<Injury[]> {
  return fetchWithCache('injuries', () => fetchInjuries(apiKey), forceRefresh) as Promise<Injury[]>;
}

/**
 * Get injuries as a map by player name
 */
export async function getInjuriesMap(
  apiKey: string,
  forceRefresh: boolean = false
): Promise<Map<string, Injury>> {
  const injuries = await getInjuries(apiKey, forceRefresh);
  const map = new Map<string, Injury>();

  injuries.forEach(injury => {
    if (injury.Name) {
      map.set(injury.Name.toLowerCase(), injury);
    }
  });

  return map;
}

// ============================================================================
// DEPTH CHARTS
// ============================================================================

/**
 * Fetch depth charts
 */
export async function fetchDepthCharts(apiKey: string): Promise<DepthChart[]> {
  const url = `${BASE_URL}/scores/json/DepthCharts?key=${apiKey}`;
  serverLogger.debug('Fetching depth charts');

  const response = await fetch(url);
  if (!response.ok) throw new Error(`Depth Charts API error: ${response.status}`);

  const data = await response.json();
  serverLogger.debug('Fetched depth charts', { entryCount: Array.isArray(data) ? data.length : 0 });
  return data as DepthChart[];
}

/**
 * Get depth charts with caching
 */
export async function getDepthCharts(apiKey: string, forceRefresh: boolean = false): Promise<DepthChart[]> {
  return fetchWithCache('depthCharts', () => fetchDepthCharts(apiKey), forceRefresh) as Promise<DepthChart[]>;
}

/**
 * Get depth charts organized by team
 */
export async function getDepthChartsByTeam(
  apiKey: string,
  forceRefresh: boolean = false
): Promise<Record<string, DepthChart[]>> {
  const charts = await getDepthCharts(apiKey, forceRefresh);
  const byTeam: Record<string, DepthChart[]> = {};

  charts.forEach(chart => {
    if (!byTeam[chart.Team]) {
      byTeam[chart.Team] = [];
    }
    byTeam[chart.Team]!.push(chart);
  });

  return byTeam;
}

// ============================================================================
// PLAYER STATS
// ============================================================================

/**
 * Fetch player stats (historical)
 */
export async function fetchPlayerStats(
  apiKey: string,
  season: number = new Date().getFullYear() - 1
): Promise<unknown[]> {
  const url = `${BASE_URL}/stats/json/PlayerSeasonStats/${season}?key=${apiKey}`;
  serverLogger.debug('Fetching player stats', { season });

  const response = await fetch(url);
  if (!response.ok) throw new Error(`Player Stats API error: ${response.status}`);

  const data = await response.json();
  serverLogger.debug('Fetched player stats', { count: Array.isArray(data) ? data.length : 0 });
  return data as unknown[];
}

/**
 * Get player stats with caching
 */
export async function getPlayerStats(
  apiKey: string,
  season: number = new Date().getFullYear() - 1,
  forceRefresh: boolean = false
): Promise<unknown[]> {
  return fetchWithCache('playerStats', () => fetchPlayerStats(apiKey, season), forceRefresh) as Promise<unknown[]>;
}

// ============================================================================
// WEEKLY PROJECTIONS (for in-season use)
// ============================================================================

/**
 * Fetch weekly player projections
 */
export async function fetchWeeklyProjections(
  apiKey: string,
  season: number,
  week: number
): Promise<unknown[]> {
  const url = `${BASE_URL}/projections/json/PlayerGameProjectionStatsByWeek/${season}/${week}?key=${apiKey}`;
  serverLogger.debug('Fetching weekly projections', { season, week });

  const response = await fetch(url);
  if (!response.ok) throw new Error(`Weekly Projections API error: ${response.status}`);

  const data = await response.json();
  serverLogger.debug('Fetched weekly projections', { count: Array.isArray(data) ? data.length : 0 });
  return data as unknown[];
}
