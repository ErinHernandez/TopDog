/**
 * SportsDataIO API Integration
 * 
 * Comprehensive NFL data API with file-based caching.
 * Supports: Projections, Schedules, Injuries, Depth Charts, Player Stats, News
 * 
 * Cache TTLs vary by data type:
 * - Projections: 24 hours
 * - Schedules: 24 hours  
 * - Injuries: 1 hour (changes frequently during season)
 * - Depth Charts: 6 hours
 * - Player Stats: 24 hours
 * - News: 15 minutes
 */

import * as fs from 'fs';
import * as path from 'path';
import { serverLogger } from './logger/serverLogger';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const playerModel = require('./playerModel');

// ============================================================================
// TYPES
// ============================================================================

export type DataType = 
  | 'projections' 
  | 'schedule' 
  | 'injuries' 
  | 'depthCharts' 
  | 'playerStats' 
  | 'teams' 
  | 'news' 
  | 'byeWeeks' 
  | 'players' 
  | 'headshots' 
  | 'liveScores' 
  | 'boxScores' 
  | 'timeframes' 
  | 'seasonStats' 
  | 'weeklyStats' 
  | 'redZoneStats' 
  | 'playerSeasonStats' 
  | 'adp' 
  | 'fantasyRankings';

export interface CacheConfig {
  file: string;
  ttl: number;
}

export interface CacheInfo {
  updatedAt: string;
  ageMs: number;
  ageHours: string;
  isValid: boolean;
  playerCount: number;
}

export interface CacheStatus {
  exists: boolean;
  updatedAt?: string;
  ageMinutes?: number;
  isValid?: boolean;
  ttlMinutes?: number;
  itemCount?: number;
  error?: string;
}

export interface SportsDataIOPlayer {
  PlayerID: number;
  Name: string;
  Position: string;
  Team: string;
  [key: string]: unknown;
}

export interface TransformedPlayer {
  name: string;
  position: string;
  team: string;
  sportsDataId: number;
  proj: string;
  projections: {
    ppr: number;
    halfPpr: number;
    standard: number;
    passing: unknown;
    rushing: unknown;
    receiving: unknown;
  };
}

export interface Team {
  Key: string;
  TeamID: number;
  City: string;
  Name: string;
  FullName: string;
  Conference: string;
  Division: string;
  ByeWeek: number;
  HeadCoach?: string;
  OffensiveCoordinator?: string;
  DefensiveCoordinator?: string;
  SpecialTeamsCoach?: string;
  OffensiveScheme?: string;
  DefensiveScheme?: string;
  PrimaryColor?: string;
  SecondaryColor?: string;
  TertiaryColor?: string;
  QuaternaryColor?: string;
  WikipediaLogoUrl?: string;
  WikipediaWordMarkUrl?: string;
  StadiumDetails?: {
    StadiumID: number;
    Name: string;
    City: string;
    State: string;
    Capacity: number;
    PlayingSurface: string;
    Type: string;
    GeoLat: number;
    GeoLong: number;
  };
  DraftKingsName?: string;
  DraftKingsPlayerID?: number;
  FanDuelName?: string;
  FanDuelPlayerID?: number;
  YahooName?: string;
  YahooPlayerID?: number;
  UpcomingDraftKingsSalary?: number;
  UpcomingFanDuelSalary?: number;
  UpcomingYahooSalary?: number;
  AverageDraftPosition?: number;
  AverageDraftPositionPPR?: number;
  [key: string]: unknown;
}

export interface TransformedTeam {
  key: string;
  teamId: number;
  city: string;
  name: string;
  fullName: string;
  conference: string;
  division: string;
  byeWeek: number;
  headCoach?: string;
  offensiveCoordinator?: string;
  defensiveCoordinator?: string;
  specialTeamsCoach?: string;
  offensiveScheme?: string;
  defensiveScheme?: string;
  colors: {
    primary: string | null;
    secondary: string | null;
    tertiary: string | null;
    quaternary: string | null;
  };
  logoUrl?: string;
  wordmarkUrl?: string;
  stadium: {
    id: number;
    name: string;
    city: string;
    state: string;
    capacity: number;
    surface: string;
    type: string;
    lat: number;
    lng: number;
  } | null;
  dfs: {
    draftKingsName?: string;
    draftKingsId?: number;
    fanDuelName?: string;
    fanDuelId?: number;
    yahooName?: string;
    yahooId?: number;
  };
  upcomingSalaries: {
    draftKings?: number;
    fanDuel?: number;
    yahoo?: number;
  };
  adp?: number;
  adpPPR?: number;
}

export interface NewsItem {
  NewsID: number;
  Source: string;
  Updated: string;
  TimeAgo: string;
  Title: string;
  Content: string;
  Url: string;
  TermsOfUse: string;
  Author: string;
  Categories: string;
  PlayerID?: number;
  TeamID?: number;
  Team?: string;
  PlayerID2?: number;
  TeamID2?: number;
  Team2?: string;
  [key: string]: unknown;
}

export interface Injury {
  InjuryID: number;
  PlayerID: number;
  Name: string;
  Position: string;
  Team: string;
  Opponent: string;
  BodyPart: string;
  Status: string;
  Practice: string;
  PracticeStatus: string;
  Updated: string;
  DeclaredInactive: boolean;
  [key: string]: unknown;
}

export interface DepthChart {
  PlayerID: number;
  Name: string;
  Position: string;
  DepthOrder: number;
  Team: string;
  [key: string]: unknown;
}

export interface GameScore {
  ScoreID: number;
  GameKey: string;
  Season: number;
  SeasonType: number;
  Week: number;
  Date: string;
  DateTime?: string;
  HomeTeam: string;
  AwayTeam: string;
  HomeTeamName: string;
  AwayTeamName: string;
  HomeScore?: number;
  AwayScore?: number;
  HomeScoreQuarter1?: number;
  HomeScoreQuarter2?: number;
  HomeScoreQuarter3?: number;
  HomeScoreQuarter4?: number;
  HomeScoreOvertime?: number;
  AwayScoreQuarter1?: number;
  AwayScoreQuarter2?: number;
  AwayScoreQuarter3?: number;
  AwayScoreQuarter4?: number;
  AwayScoreOvertime?: number;
  Status: string;
  Quarter?: string;
  TimeRemaining?: string;
  Possession?: string;
  Down?: number;
  Distance?: number;
  YardLine?: number;
  YardLineTerritory?: string;
  RedZone?: boolean;
  Channel?: string;
  StadiumDetails?: {
    Name: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface TransformedGameScore {
  gameId: number;
  gameKey: string;
  season: number;
  seasonType: number;
  week: number;
  date: string;
  dateTime?: string;
  homeTeam: string;
  awayTeam: string;
  homeTeamName: string;
  awayTeamName: string;
  homeScore?: number;
  awayScore?: number;
  homeScoreQuarter1?: number;
  homeScoreQuarter2?: number;
  homeScoreQuarter3?: number;
  homeScoreQuarter4?: number;
  homeScoreOvertime?: number;
  awayScoreQuarter1?: number;
  awayScoreQuarter2?: number;
  awayScoreQuarter3?: number;
  awayScoreQuarter4?: number;
  awayScoreOvertime?: number;
  status: string;
  quarter?: string;
  timeRemaining?: string;
  possession?: string;
  down?: number;
  distance?: number;
  yardLine?: number;
  yardLineTerritory?: string;
  redZone?: boolean;
  channel?: string;
  stadium?: string;
  isLive: boolean;
  isFinal: boolean;
  isScheduled: boolean;
  isOvertime: boolean;
}

export interface LiveFantasyScore {
  playerId: number;
  name: string;
  team: string;
  position: string;
  opponent: string;
  homeOrAway: string;
  gameId: number;
  fantasyPoints: number;
  fantasyPointsPPR: number;
  fantasyPointsHalfPPR: number;
  passingYards: number;
  passingTouchdowns: number;
  passingInterceptions: number;
  rushingYards: number;
  rushingTouchdowns: number;
  receptions: number;
  receivingYards: number;
  receivingTouchdowns: number;
  fumbles: number;
}

export interface ADPData {
  PlayerID: number;
  Name: string;
  Position: string;
  Team: string;
  AverageDraftPosition?: number;
  AverageDraftPositionPPR?: number;
  AuctionValue?: number;
  AuctionValuePPR?: number;
  [key: string]: unknown;
}

export interface TransformedADP {
  playerId: number;
  name: string;
  position: string;
  team: string;
  adp?: number;
  adpPPR?: number;
  auctionValue?: number;
  auctionValuePPR?: number;
}

export interface FantasyPlayer {
  playerId: number;
  name: string;
  team: string;
  position: string;
  byeWeek?: number;
  adp?: number | null;
  adpPPR?: number | null;
  projectedPoints?: number | null;
  projectedPointsPPR?: number | null;
  overallRank: number;
  positionRank?: number | null;
  auctionValue?: number | null;
  auctionValuePPR?: number | null;
  status?: string;
  injuryStatus?: string | null;
  isDerived: boolean;
}

export interface ADPByPositionOptions {
  limit?: number;
  scoringType?: string;
}

export interface FantasyPlayersOptions {
  position?: string;
  limit?: number;
  forceRefresh?: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const CACHE_DIR = path.join(process.cwd(), 'data/cache');
const BASE_URL = 'https://api.sportsdata.io/v3/nfl';

// Cache configuration by data type
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
  headshots: { file: 'sportsdataio_headshots.json', ttl: 7 * 24 * 60 * 60 * 1000 }, // 7 days - headshots rarely change
  liveScores: { file: 'sportsdataio_live_scores.json', ttl: 10 * 1000 }, // 10 seconds - live data
  boxScores: { file: 'sportsdataio_box_scores.json', ttl: 30 * 1000 }, // 30 seconds during games
  timeframes: { file: 'sportsdataio_timeframes.json', ttl: 1 * 60 * 60 * 1000 }, // 1 hour
  seasonStats: { file: 'sportsdataio_season_stats.json', ttl: 6 * 60 * 60 * 1000 }, // 6 hours
  weeklyStats: { file: 'sportsdataio_weekly_stats.json', ttl: 1 * 60 * 60 * 1000 }, // 1 hour
  redZoneStats: { file: 'sportsdataio_redzone_stats.json', ttl: 6 * 60 * 60 * 1000 }, // 6 hours
  playerSeasonStats: { file: 'sportsdataio_player_season_stats.json', ttl: 6 * 60 * 60 * 1000 }, // 6 hours
  adp: { file: 'sportsdataio_adp.json', ttl: 6 * 60 * 60 * 1000 }, // 6 hours
  fantasyRankings: { file: 'sportsdataio_fantasy_rankings.json', ttl: 6 * 60 * 60 * 1000 }, // 6 hours
};

// Legacy compatibility
export const CACHE_FILE = path.join(CACHE_DIR, 'sportsdataio_projections.json');
export const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// ============================================================================
// CACHE HELPERS
// ============================================================================

/**
 * Ensure cache directory exists
 */
function ensureCacheDir(): void {
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
function readCache(): unknown[] | null {
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
function writeCache(data: unknown[]): void {
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
function getCacheFilePath(dataType: DataType): string {
  const config = CACHE_CONFIG[dataType];
  if (!config) throw new Error(`Unknown data type: ${dataType}`);
  return path.join(CACHE_DIR, config.file);
}

/**
 * Check if cache is valid for a specific data type
 */
function isCacheValidFor(dataType: DataType): boolean {
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
function readCacheFor(dataType: DataType): unknown {
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
function writeCacheFor(dataType: DataType, data: unknown): void {
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
async function fetchWithCache<T>(
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
  if (!forceRefresh && isCacheValid()) {
    serverLogger.debug('Using cached projections');
    return readCache() || [];
  }
  
  const data = await fetchProjections(apiKey);
  writeCache(data);
  return data;
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
      // Normalize name for matching
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
  return fetchWithCache('schedule', () => fetchSchedule(apiKey, season), forceRefresh);
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
  return fetchWithCache('injuries', () => fetchInjuries(apiKey), forceRefresh);
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
  return fetchWithCache('depthCharts', () => fetchDepthCharts(apiKey), forceRefresh);
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
    byTeam[chart.Team].push(chart);
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
  return fetchWithCache('playerStats', () => fetchPlayerStats(apiKey, season), forceRefresh);
}

// ============================================================================
// TEAMS
// ============================================================================

/**
 * Fetch teams (basic)
 */
export async function fetchTeams(apiKey: string): Promise<Team[]> {
  const url = `${BASE_URL}/scores/json/Teams?key=${apiKey}`;
  serverLogger.debug('Fetching teams');

  const response = await fetch(url);
  if (!response.ok) throw new Error(`Teams API error: ${response.status}`);

  const data = await response.json();
  serverLogger.debug('Fetched teams', { count: Array.isArray(data) ? data.length : 0 });
  return data as Team[];
}

/**
 * Fetch all teams with full details
 */
export async function fetchAllTeams(apiKey: string): Promise<Team[]> {
  const url = `${BASE_URL}/scores/json/TeamsBasic?key=${apiKey}`;
  serverLogger.debug('Fetching all teams with full details');

  const response = await fetch(url);
  if (!response.ok) throw new Error(`All Teams API error: ${response.status}`);

  const data = await response.json();
  serverLogger.debug('Fetched all teams', { count: Array.isArray(data) ? data.length : 0 });
  return data as Team[];
}

/**
 * Get teams with caching
 */
export async function getTeams(apiKey: string, forceRefresh: boolean = false): Promise<Team[]> {
  return fetchWithCache('teams', () => fetchAllTeams(apiKey), forceRefresh);
}

/**
 * Transform team data to clean format
 */
export function transformTeam(team: Team): TransformedTeam | null {
  // Skip non-NFL teams (like AFC/NFC All-Pros)
  if (!team.Conference || team.Conference === 'None' || team.Division === 'None') {
    return null;
  }
  
  return {
    key: team.Key,
    teamId: team.TeamID,
    city: team.City,
    name: team.Name,
    fullName: team.FullName,
    conference: team.Conference,
    division: team.Division,
    byeWeek: team.ByeWeek,
    
    // Coaching staff
    headCoach: team.HeadCoach,
    offensiveCoordinator: team.OffensiveCoordinator,
    defensiveCoordinator: team.DefensiveCoordinator,
    specialTeamsCoach: team.SpecialTeamsCoach,
    
    // Schemes
    offensiveScheme: team.OffensiveScheme,
    defensiveScheme: team.DefensiveScheme,
    
    // Colors
    colors: {
      primary: team.PrimaryColor ? `#${team.PrimaryColor}` : null,
      secondary: team.SecondaryColor ? `#${team.SecondaryColor}` : null,
      tertiary: team.TertiaryColor ? `#${team.TertiaryColor}` : null,
      quaternary: team.QuaternaryColor ? `#${team.QuaternaryColor}` : null,
    },
    
    // Logos
    logoUrl: team.WikipediaLogoUrl,
    wordmarkUrl: team.WikipediaWordMarkUrl,
    
    // Stadium
    stadium: team.StadiumDetails ? {
      id: team.StadiumDetails.StadiumID,
      name: team.StadiumDetails.Name,
      city: team.StadiumDetails.City,
      state: team.StadiumDetails.State,
      capacity: team.StadiumDetails.Capacity,
      surface: team.StadiumDetails.PlayingSurface,
      type: team.StadiumDetails.Type,
      lat: team.StadiumDetails.GeoLat,
      lng: team.StadiumDetails.GeoLong,
    } : null,
    
    // DFS Info
    dfs: {
      draftKingsName: team.DraftKingsName?.trim(),
      draftKingsId: team.DraftKingsPlayerID,
      fanDuelName: team.FanDuelName,
      fanDuelId: team.FanDuelPlayerID,
      yahooName: team.YahooName,
      yahooId: team.YahooPlayerID,
    },
    
    // Upcoming game salaries
    upcomingSalaries: {
      draftKings: team.UpcomingDraftKingsSalary,
      fanDuel: team.UpcomingFanDuelSalary,
      yahoo: team.UpcomingYahooSalary,
    },
    
    // ADP (for team defense)
    adp: team.AverageDraftPosition,
    adpPPR: team.AverageDraftPositionPPR,
  };
}

/**
 * Get teams as a map by abbreviation
 */
export async function getTeamsMap(
  apiKey: string,
  forceRefresh: boolean = false
): Promise<Map<string, TransformedTeam>> {
  const teams = await getTeams(apiKey, forceRefresh);
  const map = new Map<string, TransformedTeam>();
  
  teams.forEach(team => {
    const transformed = transformTeam(team);
    if (transformed) {
      map.set(team.Key, transformed);
    }
  });
  
  return map;
}

/**
 * Get a single team by abbreviation
 */
export async function getTeamByKey(
  apiKey: string,
  teamKey: string,
  forceRefresh: boolean = false
): Promise<TransformedTeam | null> {
  const teams = await getTeams(apiKey, forceRefresh);
  const team = teams.find(t => t.Key === teamKey.toUpperCase());
  return team ? transformTeam(team) : null;
}

// ============================================================================
// NEWS
// ============================================================================

/**
 * Fetch latest NFL news
 */
export async function fetchNews(apiKey: string): Promise<NewsItem[]> {
  const url = `${BASE_URL}/scores/json/News?key=${apiKey}`;
  serverLogger.debug('Fetching news');

  const response = await fetch(url);
  if (!response.ok) throw new Error(`News API error: ${response.status}`);

  const data = await response.json();
  serverLogger.debug('Fetched news', { itemCount: Array.isArray(data) ? data.length : 0 });
  return data as NewsItem[];
}

/**
 * Get news with caching (15 min TTL)
 */
export async function getNews(apiKey: string, forceRefresh: boolean = false): Promise<NewsItem[]> {
  return fetchWithCache('news', () => fetchNews(apiKey), forceRefresh);
}

/**
 * Get player-specific news
 */
export async function getPlayerNews(
  apiKey: string,
  playerName: string,
  forceRefresh: boolean = false
): Promise<NewsItem[]> {
  const news = await getNews(apiKey, forceRefresh);
  const normalizedName = playerName.toLowerCase();
  
  return news.filter(item => {
    const title = (item.Title || '').toLowerCase();
    const content = (item.Content || '').toLowerCase();
    return title.includes(normalizedName) || content.includes(normalizedName);
  });
}

// ============================================================================
// BYE WEEKS
// ============================================================================

/**
 * Fetch bye weeks for a season
 */
export async function fetchByeWeeks(
  apiKey: string,
  season: number = new Date().getFullYear()
): Promise<Array<{ Team: string; Week: number }>> {
  const url = `${BASE_URL}/scores/json/Byes/${season}?key=${apiKey}`;
  serverLogger.debug('Fetching bye weeks', { season });

  const response = await fetch(url);
  if (!response.ok) throw new Error(`Bye Weeks API error: ${response.status}`);

  const data = await response.json();
  serverLogger.debug('Fetched bye weeks', { entryCount: Array.isArray(data) ? data.length : 0 });
  return data as Array<{ Team: string; Week: number }>;
}

/**
 * Get bye weeks with caching
 */
export async function getByeWeeks(
  apiKey: string,
  season: number = new Date().getFullYear(),
  forceRefresh: boolean = false
): Promise<Array<{ Team: string; Week: number }>> {
  return fetchWithCache('byeWeeks', () => fetchByeWeeks(apiKey, season), forceRefresh);
}

/**
 * Get bye weeks as a map by team
 */
export async function getByeWeeksMap(
  apiKey: string,
  season: number = new Date().getFullYear(),
  forceRefresh: boolean = false
): Promise<Map<string, number>> {
  const byes = await getByeWeeks(apiKey, season, forceRefresh);
  const map = new Map<string, number>();
  
  byes.forEach(bye => {
    map.set(bye.Team, bye.Week);
  });
  
  return map;
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

// ============================================================================
// PLAYERS & HEADSHOTS
// ============================================================================

/**
 * Fetch all NFL players
 */
export async function fetchPlayers(apiKey: string): Promise<SportsDataIOPlayer[]> {
  const url = `${BASE_URL}/scores/json/Players?key=${apiKey}`;
  serverLogger.debug('Fetching all players');

  const response = await fetch(url);
  if (!response.ok) throw new Error(`Players API error: ${response.status}`);

  const data = await response.json();
  serverLogger.debug('Fetched all players', { count: Array.isArray(data) ? data.length : 0 });
  return data as SportsDataIOPlayer[];
}

/**
 * Get all players with caching
 */
export async function getPlayers(apiKey: string, forceRefresh: boolean = false): Promise<SportsDataIOPlayer[]> {
  return fetchWithCache('players', () => fetchPlayers(apiKey), forceRefresh);
}

/**
 * Fetch player headshots (dedicated headshot endpoint)
 */
export async function fetchHeadshots(apiKey: string): Promise<Array<{
  PlayerID: number;
  Name: string;
  Team: string;
  Position: string;
  PreferredHostedHeadshotUrl?: string;
  HeadshotUrl?: string;
  PreferredHostedHeadshotBackgroundUrl?: string;
  Updated?: string;
  [key: string]: unknown;
}>> {
  const url = `${BASE_URL}/scores/json/Headshots?key=${apiKey}`;
  serverLogger.debug('Fetching headshots');

  const response = await fetch(url);
  if (!response.ok) throw new Error(`Headshots API error: ${response.status}`);

  const data = await response.json();
  serverLogger.debug('Fetched headshots', { count: Array.isArray(data) ? data.length : 0 });
  return data as Array<{
    PlayerID: number;
    Name: string;
    Team: string;
    Position: string;
    PreferredHostedHeadshotUrl?: string;
    HeadshotUrl?: string;
    PreferredHostedHeadshotBackgroundUrl?: string;
    Updated?: string;
    [key: string]: unknown;
  }>;
}

/**
 * Get headshots with caching (7 day TTL - headshots rarely change)
 */
export async function getHeadshots(
  apiKey: string,
  forceRefresh: boolean = false
): Promise<Array<{
  PlayerID: number;
  Name: string;
  Team: string;
  Position: string;
  PreferredHostedHeadshotUrl?: string;
  HeadshotUrl?: string;
  PreferredHostedHeadshotBackgroundUrl?: string;
  Updated?: string;
  [key: string]: unknown;
}>> {
  return fetchWithCache('headshots', () => fetchHeadshots(apiKey), forceRefresh);
}

/**
 * Get headshots as a map by player ID
 */
export async function getHeadshotsMap(
  apiKey: string,
  forceRefresh: boolean = false
): Promise<Map<number, {
  playerId: number;
  name: string;
  team: string;
  position: string;
  headshotUrl?: string;
  backgroundUrl?: string;
  updatedAt?: string;
}>> {
  const headshots = await getHeadshots(apiKey, forceRefresh);
  const map = new Map();
  
  headshots.forEach(h => {
    if (h.PlayerID) {
      map.set(h.PlayerID, {
        playerId: h.PlayerID,
        name: h.Name,
        team: h.Team,
        position: h.Position,
        headshotUrl: h.PreferredHostedHeadshotUrl || h.HeadshotUrl,
        backgroundUrl: h.PreferredHostedHeadshotBackgroundUrl,
        updatedAt: h.Updated,
      });
    }
  });
  
  return map;
}

/**
 * Get players as a map by player ID
 */
export async function getPlayersMap(
  apiKey: string,
  forceRefresh: boolean = false
): Promise<Map<number, SportsDataIOPlayer>> {
  const players = await getPlayers(apiKey, forceRefresh);
  const map = new Map<number, SportsDataIOPlayer>();
  
  players.forEach(player => {
    if (player.PlayerID) {
      map.set(player.PlayerID, player);
    }
  });
  
  return map;
}

/**
 * Get player headshot URL by name
 */
export async function getPlayerHeadshot(
  apiKey: string,
  playerName: string,
  forceRefresh: boolean = false
): Promise<string | null> {
  const headshots = await getHeadshots(apiKey, forceRefresh);
  const normalizedName = playerName.toLowerCase();
  
  const headshot = headshots.find(h => 
    h.Name && h.Name.toLowerCase() === normalizedName
  );
  
  return headshot ? (headshot.PreferredHostedHeadshotUrl || headshot.HeadshotUrl || null) : null;
}

/**
 * Get player by ID
 */
export async function getPlayerById(
  apiKey: string,
  playerId: number,
  forceRefresh: boolean = false
): Promise<SportsDataIOPlayer | null> {
  const players = await getPlayers(apiKey, forceRefresh);
  return players.find(p => p.PlayerID === playerId) || null;
}

// ============================================================================
// LIVE SCORES & GAME STATE
// ============================================================================

/**
 * Fetch timeframes (current season/week info)
 */
export async function fetchTimeframes(apiKey: string): Promise<Array<{
  Season: number;
  SeasonType: number;
  Week: number;
  Name: string;
  StartDate: string;
  EndDate: string;
  [key: string]: unknown;
}>> {
  const url = `${BASE_URL}/scores/json/Timeframes/current?key=${apiKey}`;
  serverLogger.debug('Fetching timeframes');

  const response = await fetch(url);
  if (!response.ok) throw new Error(`Timeframes API error: ${response.status}`);
  
  const data = await response.json();
  return data as Array<{
    Season: number;
    SeasonType: number;
    Week: number;
    Name: string;
    StartDate: string;
    EndDate: string;
    [key: string]: unknown;
  }>;
}

/**
 * Get timeframes with caching
 */
export async function getTimeframes(
  apiKey: string,
  forceRefresh: boolean = false
): Promise<Array<{
  Season: number;
  SeasonType: number;
  Week: number;
  Name: string;
  StartDate: string;
  EndDate: string;
  [key: string]: unknown;
}>> {
  return fetchWithCache('timeframes', () => fetchTimeframes(apiKey), forceRefresh);
}

/**
 * Get current week number
 */
export async function getCurrentWeek(apiKey: string): Promise<number | null> {
  const timeframes = await getTimeframes(apiKey);
  const current = timeframes.find(tf => tf.SeasonType === 1); // Regular season
  return current ? current.Week : null;
}

/**
 * Fetch scores for a specific week
 */
export async function fetchScoresByWeek(
  apiKey: string,
  season: number,
  week: number
): Promise<GameScore[]> {
  const url = `${BASE_URL}/scores/json/ScoresByWeek/${season}/${week}?key=${apiKey}`;
  serverLogger.debug('Fetching scores', { season, week });

  const response = await fetch(url);
  if (!response.ok) throw new Error(`Scores API error: ${response.status}`);

  const data = await response.json();
  serverLogger.debug('Fetched scores', { count: Array.isArray(data) ? data.length : 0 });
  return data as GameScore[];
}

/**
 * Get live scores with caching (10 second TTL)
 */
export async function getLiveScores(
  apiKey: string,
  season: number,
  week: number,
  forceRefresh: boolean = false
): Promise<GameScore[]> {
  return fetchWithCache('liveScores', () => fetchScoresByWeek(apiKey, season, week), forceRefresh);
}

/**
 * Fetch box score for a specific game
 */
export async function fetchBoxScore(
  apiKey: string,
  season: number,
  week: number,
  team: string
): Promise<unknown> {
  const url = `${BASE_URL}/stats/json/BoxScore/${season}/${week}/${team}?key=${apiKey}`;
  serverLogger.debug('Fetching box score', { team, season, week });

  const response = await fetch(url);
  if (!response.ok) throw new Error(`Box Score API error: ${response.status}`);
  
  const data = await response.json();
  return data;
}

/**
 * Fetch box scores for a week
 */
export async function fetchBoxScoresByWeek(
  apiKey: string,
  season: number,
  week: number
): Promise<unknown[]> {
  const url = `${BASE_URL}/stats/json/BoxScores/${season}/${week}?key=${apiKey}`;
  serverLogger.debug('Fetching box scores', { season, week });

  const response = await fetch(url);
  if (!response.ok) throw new Error(`Box Scores API error: ${response.status}`);

  const data = await response.json();
  serverLogger.debug('Fetched box scores', { count: Array.isArray(data) ? data.length : 0 });
  return data as unknown[];
}

/**
 * Transform game score to clean format
 */
export function transformGameScore(game: GameScore): TransformedGameScore {
  return {
    gameId: game.ScoreID,
    gameKey: game.GameKey,
    season: game.Season,
    seasonType: game.SeasonType,
    week: game.Week,
    date: game.Date,
    dateTime: game.DateTime,
    
    // Teams
    homeTeam: game.HomeTeam,
    awayTeam: game.AwayTeam,
    homeTeamName: game.HomeTeamName,
    awayTeamName: game.AwayTeamName,
    
    // Scores
    homeScore: game.HomeScore,
    awayScore: game.AwayScore,
    homeScoreQuarter1: game.HomeScoreQuarter1,
    homeScoreQuarter2: game.HomeScoreQuarter2,
    homeScoreQuarter3: game.HomeScoreQuarter3,
    homeScoreQuarter4: game.HomeScoreQuarter4,
    homeScoreOvertime: game.HomeScoreOvertime,
    awayScoreQuarter1: game.AwayScoreQuarter1,
    awayScoreQuarter2: game.AwayScoreQuarter2,
    awayScoreQuarter3: game.AwayScoreQuarter3,
    awayScoreQuarter4: game.AwayScoreQuarter4,
    awayScoreOvertime: game.AwayScoreOvertime,
    
    // Game State
    status: game.Status, // Scheduled, InProgress, Final, F/OT, Suspended, Postponed, Delayed, Canceled
    quarter: game.Quarter, // 1, 2, 3, 4, Half, OT, F/OT, or null
    timeRemaining: game.TimeRemaining,
    possession: game.Possession, // Team abbreviation or null
    down: game.Down,
    distance: game.Distance,
    yardLine: game.YardLine,
    yardLineTerritory: game.YardLineTerritory,
    redZone: game.RedZone,
    
    // Game Info
    channel: game.Channel,
    stadium: game.StadiumDetails?.Name,
    
    // Computed
    isLive: game.Status === 'InProgress',
    isFinal: game.Status === 'Final' || game.Status === 'F/OT',
    isScheduled: game.Status === 'Scheduled',
    isOvertime: game.Quarter === 'OT' || game.Status === 'F/OT',
  };
}

/**
 * Get games in progress
 */
export async function getGamesInProgress(
  apiKey: string,
  season: number,
  week: number
): Promise<TransformedGameScore[]> {
  const scores = await getLiveScores(apiKey, season, week, true);
  return scores
    .filter(g => g.Status === 'InProgress')
    .map(transformGameScore);
}

/**
 * Get final games
 */
export async function getFinalGames(
  apiKey: string,
  season: number,
  week: number
): Promise<TransformedGameScore[]> {
  const scores = await getLiveScores(apiKey, season, week);
  return scores
    .filter(g => g.Status === 'Final' || g.Status === 'F/OT')
    .map(transformGameScore);
}

/**
 * Get all games for a week with scores
 */
export async function getWeekScores(
  apiKey: string,
  season: number,
  week: number,
  forceRefresh: boolean = false
): Promise<TransformedGameScore[]> {
  const scores = await getLiveScores(apiKey, season, week, forceRefresh);
  return scores.map(transformGameScore);
}

/**
 * Get live player stats for games in progress
 */
export async function fetchLivePlayerStats(
  apiKey: string,
  season: number,
  week: number
): Promise<unknown[]> {
  const url = `${BASE_URL}/stats/json/PlayerGameStatsByWeek/${season}/${week}?key=${apiKey}`;
  serverLogger.debug('Fetching live player stats', { season, week });

  const response = await fetch(url);
  if (!response.ok) throw new Error(`Live Player Stats API error: ${response.status}`);

  const data = await response.json();
  serverLogger.debug('Fetched player game stats', { count: Array.isArray(data) ? data.length : 0 });
  return data as unknown[];
}

/**
 * Get live fantasy scores for a week
 */
export async function getLiveFantasyScores(
  apiKey: string,
  season: number,
  week: number
): Promise<LiveFantasyScore[]> {
  const stats = await fetchLivePlayerStats(apiKey, season, week) as Array<{
    PlayerID: number;
    Name: string;
    Team: string;
    Position: string;
    Opponent: string;
    HomeOrAway: string;
    ScoreID: number;
    FantasyPoints?: number;
    FantasyPointsPPR?: number;
    FantasyPointsHalfPPR?: number;
    PassingYards?: number;
    PassingTouchdowns?: number;
    PassingInterceptions?: number;
    RushingYards?: number;
    RushingTouchdowns?: number;
    Receptions?: number;
    ReceivingYards?: number;
    ReceivingTouchdowns?: number;
    FumblesLost?: number;
    [key: string]: unknown;
  }>;
  
  // Transform to fantasy-relevant format
  return stats
    .filter(p => ['QB', 'RB', 'WR', 'TE'].includes(p.Position))
    .map(p => ({
      playerId: p.PlayerID,
      name: p.Name,
      team: p.Team,
      position: p.Position,
      opponent: p.Opponent,
      homeOrAway: p.HomeOrAway,
      gameId: p.ScoreID,
      
      // Fantasy Points
      fantasyPoints: p.FantasyPoints || 0,
      fantasyPointsPPR: p.FantasyPointsPPR || 0,
      fantasyPointsHalfPPR: p.FantasyPointsHalfPPR || 0,
      
      // Key Stats
      passingYards: p.PassingYards || 0,
      passingTouchdowns: p.PassingTouchdowns || 0,
      passingInterceptions: p.PassingInterceptions || 0,
      rushingYards: p.RushingYards || 0,
      rushingTouchdowns: p.RushingTouchdowns || 0,
      receptions: p.Receptions || 0,
      receivingYards: p.ReceivingYards || 0,
      receivingTouchdowns: p.ReceivingTouchdowns || 0,
      fumbles: p.FumblesLost || 0,
    }))
    .sort((a, b) => (b.fantasyPointsPPR || 0) - (a.fantasyPointsPPR || 0));
}

// ============================================================================
// PLAYER STATS (Season & Weekly)
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
  const ttl = CACHE_CONFIG.seasonStats.ttl;
  
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
  const ttl = CACHE_CONFIG.weeklyStats.ttl;
  
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
  const ttl = CACHE_CONFIG.redZoneStats.ttl;
  
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

/**
 * Transform player stats using unified playerModel
 */
export function transformPlayerStats(player: unknown): unknown {
  // Uses unified playerModel for consistent transformation
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
// FANTASY ADP & RANKINGS
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
  return fetchWithCache('adp', () => fetchADP(apiKey), forceRefresh);
}

/**
 * Derive ADP from projections if ADP data unavailable
 */
export async function deriveADPFromProjections(apiKey: string): Promise<ADPData[]> {
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
  return fetchWithCache('fantasyRankings', () => fetchFantasyRankings(apiKey), forceRefresh);
}

/**
 * Transform ADP using unified playerModel
 */
export function transformADP(adp: ADPData): TransformedADP {
  // Uses unified playerModel for consistent transformation
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

// ============================================================================
// CACHE STATUS
// ============================================================================

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

// ============================================================================
// EXPORTS
// ============================================================================

// CommonJS exports for backward compatibility
module.exports = {
  // Projections (original)
  fetchProjections,
  getProjections,
  getProjectionsMap,
  transformPlayer,
  getCacheInfo,
  isCacheValid,
  
  // Schedule
  fetchSchedule,
  getSchedule,
  
  // Injuries
  fetchInjuries,
  getInjuries,
  getInjuriesMap,
  
  // Depth Charts
  fetchDepthCharts,
  getDepthCharts,
  getDepthChartsByTeam,
  
  // Player Stats
  fetchPlayerStats,
  getPlayerStats,
  
  // Teams
  fetchTeams,
  fetchAllTeams,
  getTeams,
  transformTeam,
  getTeamsMap,
  getTeamByKey,
  
  // News
  fetchNews,
  getNews,
  getPlayerNews,
  
  // Bye Weeks
  fetchByeWeeks,
  getByeWeeks,
  getByeWeeksMap,
  
  // Weekly Projections
  fetchWeeklyProjections,
  
  // Players & Headshots
  fetchPlayers,
  getPlayers,
  getPlayersMap,
  fetchHeadshots,
  getHeadshots,
  getHeadshotsMap,
  getPlayerHeadshot,
  getPlayerById,
  
  // Live Scores & Game State
  fetchTimeframes,
  getTimeframes,
  getCurrentWeek,
  fetchScoresByWeek,
  getLiveScores,
  fetchBoxScore,
  fetchBoxScoresByWeek,
  transformGameScore,
  getGamesInProgress,
  getFinalGames,
  getWeekScores,
  fetchLivePlayerStats,
  getLiveFantasyScores,
  
  // Player Stats
  fetchPlayerSeasonStats,
  getPlayerSeasonStats,
  fetchPlayerGameStats,
  getPlayerGameStats,
  fetchPlayerRedZoneStats,
  getPlayerRedZoneStats,
  transformPlayerStats,
  getPlayerStatsByName,
  getTopFantasyPlayers,
  getWeeklyFantasyStats,
  
  // Fantasy ADP & Rankings
  fetchADP,
  getADP,
  deriveADPFromProjections,
  fetchFantasyRankings,
  getFantasyRankings,
  transformADP,
  getADPMap,
  getPlayerADP,
  getADPByPosition,
  getFantasyPlayers,
  
  // Cache management
  getAllCacheStatus,
  clearAllCaches,
  
  // Config
  CACHE_CONFIG,
  CACHE_DIR,
  CACHE_FILE,
  CACHE_TTL_MS,
  BASE_URL,
};
