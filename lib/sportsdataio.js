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

const fs = require('fs');
const path = require('path');

// Import unified player model transformers
const playerModel = require('./playerModel');

const CACHE_DIR = path.join(process.cwd(), 'data/cache');
const BASE_URL = 'https://api.sportsdata.io/v3/nfl';

// Cache configuration by data type
const CACHE_CONFIG = {
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
const CACHE_FILE = path.join(CACHE_DIR, 'sportsdataio_projections.json');
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Ensure cache directory exists
 */
function ensureCacheDir() {
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }
}

/**
 * Check if cache is valid (exists and not expired)
 */
function isCacheValid() {
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
function readCache() {
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
function writeCache(data) {
  ensureCacheDir();
  const cache = {
    timestamp: Date.now(),
    updatedAt: new Date().toISOString(),
    data: data
  };
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
  console.log(`[SportsDataIO] Cache written: ${data.length} players`);
}

/**
 * Fetch player season projections from SportsDataIO
 * @param {string} apiKey - SportsDataIO API key
 * @param {number} season - NFL season year (defaults to current year)
 * @returns {Promise<Array>} Array of player projections
 */
async function fetchProjections(apiKey, season = new Date().getFullYear()) {
  const url = `https://api.sportsdata.io/v3/nfl/projections/json/PlayerSeasonProjectionStats/${season}?key=${apiKey}`;
  
  console.log(`[SportsDataIO] Fetching projections for ${season} season...`);
  
  const response = await fetch(url);
  
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`SportsDataIO API error: ${response.status} - ${text}`);
  }
  
  const data = await response.json();
  console.log(`[SportsDataIO] Fetched ${data.length} player projections`);
  
  return data;
}

/**
 * Get projections (from cache if valid, otherwise fetch fresh)
 * @param {string} apiKey - SportsDataIO API key
 * @param {boolean} forceRefresh - Skip cache and fetch fresh data
 * @returns {Promise<Array>} Array of player projections
 */
async function getProjections(apiKey, forceRefresh = false) {
  if (!forceRefresh && isCacheValid()) {
    console.log('[SportsDataIO] Using cached projections');
    return readCache();
  }
  
  const data = await fetchProjections(apiKey);
  writeCache(data);
  return data;
}

/**
 * Transform SportsDataIO player to match PLAYER_POOL format
 * Uses unified playerModel for consistent transformation
 * @param {Object} player - SportsDataIO player object
 * @returns {Object} Transformed player object
 */
function transformPlayer(player) {
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
 * @param {string} apiKey - SportsDataIO API key
 * @param {boolean} forceRefresh - Skip cache and fetch fresh data
 * @returns {Promise<Map>} Map of player name -> projection data
 */
async function getProjectionsMap(apiKey, forceRefresh = false) {
  const projections = await getProjections(apiKey, forceRefresh);
  const map = new Map();
  
  projections.forEach(player => {
    if (player.Name && player.Position) {
      // Normalize name for matching
      const normalizedName = player.Name.trim();
      map.set(normalizedName, transformPlayer(player));
    }
  });
  
  return map;
}

/**
 * Get cache info
 * @returns {Object|null} Cache metadata or null if no cache
 */
function getCacheInfo() {
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
      playerCount: cache.data?.length || 0
    };
  } catch (err) {
    return null;
  }
}

// ============================================================================
// GENERIC CACHE HELPERS
// ============================================================================

/**
 * Get cache file path for a data type
 */
function getCacheFilePath(dataType) {
  const config = CACHE_CONFIG[dataType];
  if (!config) throw new Error(`Unknown data type: ${dataType}`);
  return path.join(CACHE_DIR, config.file);
}

/**
 * Check if cache is valid for a specific data type
 */
function isCacheValidFor(dataType) {
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
function readCacheFor(dataType) {
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
function writeCacheFor(dataType, data) {
  ensureCacheDir();
  const filePath = getCacheFilePath(dataType);
  const cache = {
    timestamp: Date.now(),
    updatedAt: new Date().toISOString(),
    dataType,
    data
  };
  fs.writeFileSync(filePath, JSON.stringify(cache, null, 2));
  console.log(`[SportsDataIO] Cache written for ${dataType}: ${Array.isArray(data) ? data.length + ' items' : 'object'}`);
}

/**
 * Generic fetch with caching
 */
async function fetchWithCache(dataType, fetchFn, forceRefresh = false) {
  if (!forceRefresh && isCacheValidFor(dataType)) {
    console.log(`[SportsDataIO] Using cached ${dataType}`);
    return readCacheFor(dataType);
  }
  
  const data = await fetchFn();
  writeCacheFor(dataType, data);
  return data;
}

// ============================================================================
// NFL SCHEDULE
// ============================================================================

/**
 * Fetch NFL schedule for a season
 * @param {string} apiKey 
 * @param {number} season 
 * @returns {Promise<Array>} Array of games
 */
async function fetchSchedule(apiKey, season = new Date().getFullYear()) {
  const url = `${BASE_URL}/scores/json/Schedules/${season}?key=${apiKey}`;
  console.log(`[SportsDataIO] Fetching schedule for ${season}...`);
  
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Schedule API error: ${response.status}`);
  
  const data = await response.json();
  console.log(`[SportsDataIO] Fetched ${data.length} games`);
  return data;
}

/**
 * Get schedule with caching
 */
async function getSchedule(apiKey, season = new Date().getFullYear(), forceRefresh = false) {
  return fetchWithCache('schedule', () => fetchSchedule(apiKey, season), forceRefresh);
}

// ============================================================================
// INJURIES
// ============================================================================

/**
 * Fetch current injuries
 * @param {string} apiKey 
 * @returns {Promise<Array>} Array of injuries
 */
async function fetchInjuries(apiKey) {
  const url = `${BASE_URL}/scores/json/Injuries?key=${apiKey}`;
  console.log(`[SportsDataIO] Fetching injuries...`);
  
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Injuries API error: ${response.status}`);
  
  const data = await response.json();
  console.log(`[SportsDataIO] Fetched ${data.length} injury reports`);
  return data;
}

/**
 * Get injuries with caching (1 hour TTL)
 */
async function getInjuries(apiKey, forceRefresh = false) {
  return fetchWithCache('injuries', () => fetchInjuries(apiKey), forceRefresh);
}

/**
 * Get injuries as a map by player name
 */
async function getInjuriesMap(apiKey, forceRefresh = false) {
  const injuries = await getInjuries(apiKey, forceRefresh);
  const map = new Map();
  
  injuries.forEach(injury => {
    if (injury.Name) {
      map.set(injury.Name, {
        name: injury.Name,
        team: injury.Team,
        position: injury.Position,
        status: injury.Status,
        bodyPart: injury.BodyPart,
        injuryStartDate: injury.InjuryStartDate,
        practiceStatus: injury.PracticeStatus,
        practiceDescription: injury.PracticeDescription,
      });
    }
  });
  
  return map;
}

// ============================================================================
// DEPTH CHARTS
// ============================================================================

/**
 * Fetch depth charts for all teams
 * @param {string} apiKey 
 * @returns {Promise<Array>} Array of depth chart entries
 */
async function fetchDepthCharts(apiKey) {
  const url = `${BASE_URL}/scores/json/DepthCharts?key=${apiKey}`;
  console.log(`[SportsDataIO] Fetching depth charts...`);
  
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Depth Charts API error: ${response.status}`);
  
  const data = await response.json();
  console.log(`[SportsDataIO] Fetched ${data.length} depth chart entries`);
  return data;
}

/**
 * Get depth charts with caching (6 hour TTL)
 */
async function getDepthCharts(apiKey, forceRefresh = false) {
  return fetchWithCache('depthCharts', () => fetchDepthCharts(apiKey), forceRefresh);
}

/**
 * Get depth charts organized by team
 */
async function getDepthChartsByTeam(apiKey, forceRefresh = false) {
  const charts = await getDepthCharts(apiKey, forceRefresh);
  const byTeam = {};
  
  charts.forEach(entry => {
    if (!byTeam[entry.Team]) {
      byTeam[entry.Team] = { offense: {}, defense: {}, specialTeams: {} };
    }
    
    const category = entry.PositionCategory === 'OFF' ? 'offense' 
      : entry.PositionCategory === 'DEF' ? 'defense' 
      : 'specialTeams';
    
    if (!byTeam[entry.Team][category][entry.Position]) {
      byTeam[entry.Team][category][entry.Position] = [];
    }
    
    byTeam[entry.Team][category][entry.Position].push({
      name: entry.Name,
      depthOrder: entry.DepthOrder,
      playerId: entry.PlayerID,
    });
  });
  
  // Sort each position by depth order
  Object.values(byTeam).forEach(team => {
    Object.values(team).forEach(category => {
      Object.values(category).forEach(players => {
        players.sort((a, b) => a.depthOrder - b.depthOrder);
      });
    });
  });
  
  return byTeam;
}

// ============================================================================
// PLAYER SEASON STATS (Historical)
// ============================================================================

/**
 * Fetch player season stats
 * @param {string} apiKey 
 * @param {number} season 
 * @returns {Promise<Array>} Array of player stats
 */
async function fetchPlayerStats(apiKey, season = new Date().getFullYear() - 1) {
  const url = `${BASE_URL}/stats/json/PlayerSeasonStats/${season}?key=${apiKey}`;
  console.log(`[SportsDataIO] Fetching player stats for ${season}...`);
  
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Player Stats API error: ${response.status}`);
  
  const data = await response.json();
  console.log(`[SportsDataIO] Fetched ${data.length} player stat records`);
  return data;
}

/**
 * Get player stats with caching
 */
async function getPlayerStats(apiKey, season, forceRefresh = false) {
  return fetchWithCache('playerStats', () => fetchPlayerStats(apiKey, season), forceRefresh);
}

// ============================================================================
// TEAMS
// ============================================================================

/**
 * Fetch all NFL teams (basic endpoint)
 * @param {string} apiKey 
 * @returns {Promise<Array>} Array of teams
 */
async function fetchTeams(apiKey) {
  const url = `${BASE_URL}/scores/json/Teams?key=${apiKey}`;
  console.log(`[SportsDataIO] Fetching teams...`);
  
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Teams API error: ${response.status}`);
  
  const data = await response.json();
  console.log(`[SportsDataIO] Fetched ${data.length} teams`);
  return data;
}

/**
 * Fetch all NFL teams with full details (AllTeams endpoint)
 * Includes coaching staff, colors, stadium, DFS salaries
 * @param {string} apiKey 
 * @returns {Promise<Array>} Array of teams with full details
 */
async function fetchAllTeams(apiKey) {
  const url = `${BASE_URL}/scores/json/AllTeams?key=${apiKey}`;
  console.log(`[SportsDataIO] Fetching all teams with full details...`);
  
  const response = await fetch(url);
  if (!response.ok) throw new Error(`AllTeams API error: ${response.status}`);
  
  const data = await response.json();
  console.log(`[SportsDataIO] Fetched ${data.length} teams with full details`);
  return data;
}

/**
 * Get teams with caching
 */
async function getTeams(apiKey, forceRefresh = false) {
  return fetchWithCache('teams', () => fetchAllTeams(apiKey), forceRefresh);
}

/**
 * Transform team data to clean format
 */
function transformTeam(team) {
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
async function getTeamsMap(apiKey, forceRefresh = false) {
  const teams = await getTeams(apiKey, forceRefresh);
  const map = new Map();
  
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
async function getTeamByKey(apiKey, teamKey, forceRefresh = false) {
  const teams = await getTeams(apiKey, forceRefresh);
  const team = teams.find(t => t.Key === teamKey.toUpperCase());
  return team ? transformTeam(team) : null;
}

// ============================================================================
// NEWS
// ============================================================================

/**
 * Fetch latest NFL news
 * @param {string} apiKey 
 * @returns {Promise<Array>} Array of news items
 */
async function fetchNews(apiKey) {
  const url = `${BASE_URL}/scores/json/News?key=${apiKey}`;
  console.log(`[SportsDataIO] Fetching news...`);
  
  const response = await fetch(url);
  if (!response.ok) throw new Error(`News API error: ${response.status}`);
  
  const data = await response.json();
  console.log(`[SportsDataIO] Fetched ${data.length} news items`);
  return data;
}

/**
 * Get news with caching (15 min TTL)
 */
async function getNews(apiKey, forceRefresh = false) {
  return fetchWithCache('news', () => fetchNews(apiKey), forceRefresh);
}

/**
 * Get player-specific news
 */
async function getPlayerNews(apiKey, playerName, forceRefresh = false) {
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
 * @param {string} apiKey 
 * @param {number} season 
 * @returns {Promise<Array>} Array of bye week data
 */
async function fetchByeWeeks(apiKey, season = new Date().getFullYear()) {
  const url = `${BASE_URL}/scores/json/Byes/${season}?key=${apiKey}`;
  console.log(`[SportsDataIO] Fetching bye weeks for ${season}...`);
  
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Bye Weeks API error: ${response.status}`);
  
  const data = await response.json();
  console.log(`[SportsDataIO] Fetched ${data.length} bye week entries`);
  return data;
}

/**
 * Get bye weeks with caching
 */
async function getByeWeeks(apiKey, season = new Date().getFullYear(), forceRefresh = false) {
  return fetchWithCache('byeWeeks', () => fetchByeWeeks(apiKey, season), forceRefresh);
}

/**
 * Get bye weeks as a map by team
 */
async function getByeWeeksMap(apiKey, season, forceRefresh = false) {
  const byes = await getByeWeeks(apiKey, season, forceRefresh);
  const map = new Map();
  
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
 * @param {string} apiKey 
 * @param {number} season 
 * @param {number} week 
 * @returns {Promise<Array>} Array of weekly projections
 */
async function fetchWeeklyProjections(apiKey, season, week) {
  const url = `${BASE_URL}/projections/json/PlayerGameProjectionStatsByWeek/${season}/${week}?key=${apiKey}`;
  console.log(`[SportsDataIO] Fetching week ${week} projections for ${season}...`);
  
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Weekly Projections API error: ${response.status}`);
  
  const data = await response.json();
  console.log(`[SportsDataIO] Fetched ${data.length} weekly projections`);
  return data;
}

// ============================================================================
// PLAYERS & HEADSHOTS
// ============================================================================

/**
 * Fetch all NFL players
 * @param {string} apiKey 
 * @returns {Promise<Array>} Array of players with headshot URLs
 */
async function fetchPlayers(apiKey) {
  const url = `${BASE_URL}/scores/json/Players?key=${apiKey}`;
  console.log(`[SportsDataIO] Fetching all players...`);
  
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Players API error: ${response.status}`);
  
  const data = await response.json();
  console.log(`[SportsDataIO] Fetched ${data.length} players`);
  return data;
}

/**
 * Get all players with caching
 */
async function getPlayers(apiKey, forceRefresh = false) {
  return fetchWithCache('players', () => fetchPlayers(apiKey), forceRefresh);
}

/**
 * Fetch player headshots (dedicated headshot endpoint)
 * @param {string} apiKey 
 * @returns {Promise<Array>} Array of headshot data
 */
async function fetchHeadshots(apiKey) {
  const url = `${BASE_URL}/scores/json/Headshots?key=${apiKey}`;
  console.log(`[SportsDataIO] Fetching headshots...`);
  
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Headshots API error: ${response.status}`);
  
  const data = await response.json();
  console.log(`[SportsDataIO] Fetched ${data.length} headshots`);
  return data;
}

/**
 * Get headshots with caching (7 day TTL - headshots rarely change)
 */
async function getHeadshots(apiKey, forceRefresh = false) {
  return fetchWithCache('headshots', () => fetchHeadshots(apiKey), forceRefresh);
}

/**
 * Get headshots as a map by player ID
 */
async function getHeadshotsMap(apiKey, forceRefresh = false) {
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
 * Get players as a map by name (for matching with PLAYER_POOL)
 */
async function getPlayersMap(apiKey, forceRefresh = false) {
  const players = await getPlayers(apiKey, forceRefresh);
  const map = new Map();
  
  players.forEach(p => {
    if (p.Name) {
      map.set(p.Name, {
        playerId: p.PlayerID,
        name: p.Name,
        team: p.Team,
        position: p.Position,
        number: p.Number,
        height: p.Height,
        weight: p.Weight,
        college: p.College,
        experience: p.Experience,
        age: p.Age,
        birthDate: p.BirthDate,
        headshotUrl: p.PhotoUrl,
        status: p.Status,
        injuryStatus: p.InjuryStatus,
        injuryBodyPart: p.InjuryBodyPart,
        injuryNotes: p.InjuryNotes,
      });
    }
  });
  
  return map;
}

/**
 * Get a single player's headshot URL by name
 */
async function getPlayerHeadshot(apiKey, playerName, forceRefresh = false) {
  const players = await getPlayers(apiKey, forceRefresh);
  
  // Try exact match first
  let player = players.find(p => p.Name === playerName);
  
  // Try case-insensitive match
  if (!player) {
    const nameLower = playerName.toLowerCase();
    player = players.find(p => p.Name && p.Name.toLowerCase() === nameLower);
  }
  
  // Try partial match (last name)
  if (!player) {
    const lastName = playerName.split(' ').pop().toLowerCase();
    player = players.find(p => p.Name && p.Name.toLowerCase().includes(lastName));
  }
  
  if (!player) {
    return null;
  }
  
  return {
    playerId: player.PlayerID,
    name: player.Name,
    team: player.Team,
    position: player.Position,
    headshotUrl: player.PhotoUrl,
  };
}

/**
 * Get player by ID
 */
async function getPlayerById(apiKey, playerId, forceRefresh = false) {
  const players = await getPlayers(apiKey, forceRefresh);
  return players.find(p => p.PlayerID === parseInt(playerId));
}

// ============================================================================
// LIVE SCORES & GAME STATE
// ============================================================================

/**
 * Fetch current NFL timeframes (to determine current week)
 * @param {string} apiKey 
 * @returns {Promise<Array>} Array of timeframes
 */
async function fetchTimeframes(apiKey) {
  const url = `${BASE_URL}/scores/json/Timeframes/current?key=${apiKey}`;
  console.log(`[SportsDataIO] Fetching current timeframes...`);
  
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Timeframes API error: ${response.status}`);
  
  const data = await response.json();
  console.log(`[SportsDataIO] Fetched ${data.length} timeframes`);
  return data;
}

/**
 * Get timeframes with caching
 */
async function getTimeframes(apiKey, forceRefresh = false) {
  return fetchWithCache('timeframes', () => fetchTimeframes(apiKey), forceRefresh);
}

/**
 * Get current NFL week
 */
async function getCurrentWeek(apiKey) {
  const timeframes = await getTimeframes(apiKey);
  const current = timeframes.find(t => t.HasGames && t.ApiWeek);
  return current ? {
    season: current.ApiSeason,
    week: current.ApiWeek,
    seasonType: current.SeasonType,
    name: current.Name,
    shortName: current.ShortName,
    startDate: current.StartDate,
    endDate: current.EndDate,
  } : null;
}

/**
 * Fetch live scores for current week
 * @param {string} apiKey 
 * @param {number} season 
 * @param {number} week 
 * @returns {Promise<Array>} Array of games with scores
 */
async function fetchScoresByWeek(apiKey, season, week) {
  const url = `${BASE_URL}/scores/json/ScoresByWeek/${season}/${week}?key=${apiKey}`;
  console.log(`[SportsDataIO] Fetching scores for ${season} week ${week}...`);
  
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Scores API error: ${response.status}`);
  
  const data = await response.json();
  console.log(`[SportsDataIO] Fetched ${data.length} game scores`);
  return data;
}

/**
 * Fetch live scores (uses short cache for real-time updates)
 */
async function getLiveScores(apiKey, season, week, forceRefresh = false) {
  // For live scores, we always want fresh data during games
  // But we'll still use a short cache to prevent hammering the API
  const cacheKey = `liveScores_${season}_${week}`;
  
  // Check if we have recent data
  const cacheFile = path.join(CACHE_DIR, `sportsdataio_scores_${season}_${week}.json`);
  
  if (!forceRefresh && fs.existsSync(cacheFile)) {
    try {
      const cache = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
      const age = Date.now() - cache.timestamp;
      
      // Use 10-second cache during games
      if (age < 10000) {
        return cache.data;
      }
    } catch (e) {
      // Cache read failed, fetch fresh
    }
  }
  
  const data = await fetchScoresByWeek(apiKey, season, week);
  
  // Write to cache
  ensureCacheDir();
  fs.writeFileSync(cacheFile, JSON.stringify({
    timestamp: Date.now(),
    updatedAt: new Date().toISOString(),
    data
  }, null, 2));
  
  return data;
}

/**
 * Fetch box score for a specific game
 * @param {string} apiKey 
 * @param {number} scoreId - Game score ID
 * @returns {Promise<Object>} Box score data
 */
async function fetchBoxScore(apiKey, scoreId) {
  const url = `${BASE_URL}/stats/json/BoxScore/${scoreId}?key=${apiKey}`;
  console.log(`[SportsDataIO] Fetching box score for game ${scoreId}...`);
  
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Box Score API error: ${response.status}`);
  
  const data = await response.json();
  return data;
}

/**
 * Fetch box scores for all games in a week
 * @param {string} apiKey 
 * @param {number} season 
 * @param {number} week 
 * @returns {Promise<Array>} Array of box scores
 */
async function fetchBoxScoresByWeek(apiKey, season, week) {
  const url = `${BASE_URL}/stats/json/BoxScores/${season}/${week}?key=${apiKey}`;
  console.log(`[SportsDataIO] Fetching box scores for ${season} week ${week}...`);
  
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Box Scores API error: ${response.status}`);
  
  const data = await response.json();
  console.log(`[SportsDataIO] Fetched ${data.length} box scores`);
  return data;
}

/**
 * Transform game score to clean format
 */
function transformGameScore(game) {
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
async function getGamesInProgress(apiKey, season, week) {
  const scores = await getLiveScores(apiKey, season, week, true);
  return scores
    .filter(g => g.Status === 'InProgress')
    .map(transformGameScore);
}

/**
 * Get final games
 */
async function getFinalGames(apiKey, season, week) {
  const scores = await getLiveScores(apiKey, season, week);
  return scores
    .filter(g => g.Status === 'Final' || g.Status === 'F/OT')
    .map(transformGameScore);
}

/**
 * Get all games for a week with scores
 */
async function getWeekScores(apiKey, season, week, forceRefresh = false) {
  const scores = await getLiveScores(apiKey, season, week, forceRefresh);
  return scores.map(transformGameScore);
}

/**
 * Get live player stats for games in progress
 * @param {string} apiKey 
 * @param {number} season 
 * @param {number} week 
 * @returns {Promise<Array>} Array of player game stats
 */
async function fetchLivePlayerStats(apiKey, season, week) {
  const url = `${BASE_URL}/stats/json/PlayerGameStatsByWeek/${season}/${week}?key=${apiKey}`;
  console.log(`[SportsDataIO] Fetching live player stats for ${season} week ${week}...`);
  
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Live Player Stats API error: ${response.status}`);
  
  const data = await response.json();
  console.log(`[SportsDataIO] Fetched ${data.length} player game stats`);
  return data;
}

/**
 * Get live fantasy scores for a week
 */
async function getLiveFantasyScores(apiKey, season, week) {
  const stats = await fetchLivePlayerStats(apiKey, season, week);
  
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
 * @param {string} apiKey 
 * @param {number} season 
 * @returns {Promise<Array>} Array of player season stats
 */
async function fetchPlayerSeasonStats(apiKey, season = new Date().getFullYear()) {
  const url = `${BASE_URL}/stats/json/PlayerSeasonStats/${season}?key=${apiKey}`;
  console.log(`[SportsDataIO] Fetching player season stats for ${season}...`);
  
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Player Season Stats API error: ${response.status}`);
  
  const data = await response.json();
  console.log(`[SportsDataIO] Fetched ${data.length} player season stats`);
  return data;
}

/**
 * Get player season stats with caching
 */
async function getPlayerSeasonStats(apiKey, season = new Date().getFullYear(), forceRefresh = false) {
  const cacheFile = path.join(CACHE_DIR, `sportsdataio_season_stats_${season}.json`);
  const ttl = CACHE_CONFIG.seasonStats.ttl;
  
  if (!forceRefresh && fs.existsSync(cacheFile)) {
    try {
      const cache = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
      if (Date.now() - cache.timestamp < ttl) {
        console.log(`[SportsDataIO] Using cached season stats for ${season}`);
        return cache.data;
      }
    } catch (e) {}
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
 * @param {string} apiKey 
 * @param {number} season 
 * @param {number} week 
 * @returns {Promise<Array>} Array of player game stats
 */
async function fetchPlayerGameStats(apiKey, season, week) {
  const url = `${BASE_URL}/stats/json/PlayerGameStatsByWeek/${season}/${week}?key=${apiKey}`;
  console.log(`[SportsDataIO] Fetching player game stats for ${season} week ${week}...`);
  
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Player Game Stats API error: ${response.status}`);
  
  const data = await response.json();
  console.log(`[SportsDataIO] Fetched ${data.length} player game stats`);
  return data;
}

/**
 * Get player game stats with caching
 */
async function getPlayerGameStats(apiKey, season, week, forceRefresh = false) {
  const cacheFile = path.join(CACHE_DIR, `sportsdataio_game_stats_${season}_${week}.json`);
  const ttl = CACHE_CONFIG.weeklyStats.ttl;
  
  if (!forceRefresh && fs.existsSync(cacheFile)) {
    try {
      const cache = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
      if (Date.now() - cache.timestamp < ttl) {
        console.log(`[SportsDataIO] Using cached game stats for ${season} week ${week}`);
        return cache.data;
      }
    } catch (e) {}
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
 * @param {string} apiKey 
 * @param {number} season 
 * @returns {Promise<Array>} Array of red zone stats
 */
async function fetchPlayerRedZoneStats(apiKey, season = new Date().getFullYear()) {
  const url = `${BASE_URL}/stats/json/PlayerSeasonRedZoneStats/${season}?key=${apiKey}`;
  console.log(`[SportsDataIO] Fetching red zone stats for ${season}...`);
  
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Red Zone Stats API error: ${response.status}`);
  
  const data = await response.json();
  console.log(`[SportsDataIO] Fetched ${data.length} red zone stats`);
  return data;
}

/**
 * Get red zone stats with caching
 */
async function getPlayerRedZoneStats(apiKey, season = new Date().getFullYear(), forceRefresh = false) {
  const cacheFile = path.join(CACHE_DIR, `sportsdataio_redzone_stats_${season}.json`);
  const ttl = CACHE_CONFIG.redZoneStats.ttl;
  
  if (!forceRefresh && fs.existsSync(cacheFile)) {
    try {
      const cache = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
      if (Date.now() - cache.timestamp < ttl) {
        console.log(`[SportsDataIO] Using cached red zone stats for ${season}`);
        return cache.data;
      }
    } catch (e) {}
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
 * Transform player stats to clean format
 * Uses unified playerModel for consistent transformation
 */
function transformPlayerStats(p) {
  // Delegate to unified player model
  return playerModel.transformPlayerStats(p);
}

/**
 * Get season stats for a specific player by name
 */
async function getPlayerStatsByName(apiKey, playerName, season, forceRefresh = false) {
  const stats = await getPlayerSeasonStats(apiKey, season, forceRefresh);
  
  const nameLower = playerName.toLowerCase();
  const player = stats.find(p => 
    p.Name && p.Name.toLowerCase() === nameLower
  );
  
  if (!player) return null;
  return transformPlayerStats(player);
}

/**
 * Get top fantasy performers for a season
 */
async function getTopFantasyPlayers(apiKey, season, options = {}) {
  const { position, limit = 50, scoringType = 'ppr' } = options;
  
  let stats = await getPlayerSeasonStats(apiKey, season);
  
  // Filter to fantasy-relevant positions
  stats = stats.filter(p => ['QB', 'RB', 'WR', 'TE'].includes(p.Position));
  
  // Filter by position if specified
  if (position) {
    const positions = position.toUpperCase().split(',');
    stats = stats.filter(p => positions.includes(p.Position));
  }
  
  // Sort by fantasy points
  const pointsField = scoringType === 'ppr' ? 'FantasyPointsPPR' 
    : scoringType === 'half' ? 'FantasyPointsHalfPPR' 
    : 'FantasyPoints';
  
  stats.sort((a, b) => (b[pointsField] || 0) - (a[pointsField] || 0));
  
  return stats.slice(0, limit).map(transformPlayerStats);
}

/**
 * Get weekly stats for all players in a week
 */
async function getWeeklyFantasyStats(apiKey, season, week, options = {}) {
  const { position, limit = 50 } = options;
  
  let stats = await getPlayerGameStats(apiKey, season, week);
  
  // Filter to fantasy-relevant positions
  stats = stats.filter(p => ['QB', 'RB', 'WR', 'TE'].includes(p.Position));
  
  // Filter by position if specified
  if (position) {
    const positions = position.toUpperCase().split(',');
    stats = stats.filter(p => positions.includes(p.Position));
  }
  
  // Sort by PPR fantasy points
  stats.sort((a, b) => (b.FantasyPointsPPR || 0) - (a.FantasyPointsPPR || 0));
  
  return stats.slice(0, limit).map(p => ({
    ...transformPlayerStats(p),
    week,
    opponent: p.Opponent,
    homeOrAway: p.HomeOrAway,
    gameId: p.ScoreID,
  }));
}

// ============================================================================
// FANTASY ADP & RANKINGS
// ============================================================================

/**
 * Fetch Average Draft Position data
 * Note: ADP endpoint may not be available in sandbox tier.
 * Falls back to projections-based ranking if unavailable.
 * @param {string} apiKey 
 * @returns {Promise<Array>} Array of ADP data
 */
async function fetchADP(apiKey) {
  // Try the official ADP endpoint first
  const url = `${BASE_URL}/stats/json/AverageDraftPosition?key=${apiKey}`;
  console.log(`[SportsDataIO] Fetching ADP data...`);
  
  const response = await fetch(url);
  
  // If ADP endpoint not available (404), derive from projections
  if (response.status === 404) {
    console.log(`[SportsDataIO] ADP endpoint not available, deriving from projections...`);
    return await deriveADPFromProjections(apiKey);
  }
  
  if (!response.ok) throw new Error(`ADP API error: ${response.status}`);
  
  const data = await response.json();
  console.log(`[SportsDataIO] Fetched ${data.length} ADP records`);
  return data;
}

/**
 * Derive ADP-like rankings from season projections
 * Used as fallback when ADP endpoint is not available
 */
async function deriveADPFromProjections(apiKey) {
  const season = new Date().getFullYear();
  const url = `${BASE_URL}/projections/json/PlayerSeasonProjectionStats/${season}?key=${apiKey}`;
  
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Projections API error: ${response.status}`);
  
  const projections = await response.json();
  
  // Filter to fantasy-relevant positions and sort by PPR points
  const fantasyPlayers = projections
    .filter(p => ['QB', 'RB', 'WR', 'TE'].includes(p.Position))
    .sort((a, b) => (b.FantasyPointsPPR || 0) - (a.FantasyPointsPPR || 0));
  
  // Assign ADP based on ranking
  return fantasyPlayers.map((p, index) => ({
    PlayerID: p.PlayerID,
    Name: p.Name,
    Team: p.Team,
    Position: p.Position,
    AverageDraftPosition: index + 1,
    AverageDraftPositionPPR: index + 1,
    ByeWeek: p.ByeWeek || null,
    // Include projection data for reference
    ProjectedFantasyPoints: p.FantasyPoints,
    ProjectedFantasyPointsPPR: p.FantasyPointsPPR,
    LastUpdated: new Date().toISOString(),
    _derived: true, // Flag that this is derived, not official ADP
  }));
}

/**
 * Get ADP with caching
 */
async function getADP(apiKey, forceRefresh = false) {
  return fetchWithCache('adp', () => fetchADP(apiKey), forceRefresh);
}

/**
 * Fetch Fantasy Players data
 * Note: May not be available in sandbox tier, falls back to projections
 * @param {string} apiKey 
 * @returns {Promise<Array>} Array of fantasy player data
 */
async function fetchFantasyRankings(apiKey) {
  const url = `${BASE_URL}/stats/json/FantasyPlayers?key=${apiKey}`;
  console.log(`[SportsDataIO] Fetching fantasy players...`);
  
  const response = await fetch(url);
  
  // If endpoint not available, derive from projections
  if (response.status === 404) {
    console.log(`[SportsDataIO] FantasyPlayers endpoint not available, deriving from projections...`);
    return await deriveADPFromProjections(apiKey);
  }
  
  if (!response.ok) throw new Error(`Fantasy Rankings API error: ${response.status}`);
  
  const data = await response.json();
  console.log(`[SportsDataIO] Fetched ${data.length} fantasy player records`);
  return data;
}

/**
 * Get fantasy rankings with caching
 */
async function getFantasyRankings(apiKey, forceRefresh = false) {
  return fetchWithCache('fantasyRankings', () => fetchFantasyRankings(apiKey), forceRefresh);
}

/**
 * Transform ADP data to clean format
 * Uses unified playerModel for consistent transformation
 */
function transformADP(p) {
  // Delegate to unified player model
  return playerModel.transformADP(p);
}

/**
 * Get ADP as a map by player name
 */
async function getADPMap(apiKey, forceRefresh = false) {
  const adp = await getADP(apiKey, forceRefresh);
  const map = new Map();
  
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
async function getPlayerADP(apiKey, playerName, forceRefresh = false) {
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
async function getADPByPosition(apiKey, position, options = {}) {
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
    const aVal = a[adpField] || 999;
    const bVal = b[adpField] || 999;
    return aVal - bVal;
  });
  
  return adp.slice(0, limit).map(transformADP);
}

/**
 * Get fantasy player data (includes projections, ADP, rankings)
 */
async function getFantasyPlayers(apiKey, options = {}) {
  const { position, limit = 100, forceRefresh = false } = options;
  
  let players = await getFantasyRankings(apiKey, forceRefresh);
  
  // Filter to fantasy-relevant positions
  players = players.filter(p => ['QB', 'RB', 'WR', 'TE'].includes(p.Position));
  
  // Filter by position if specified
  if (position) {
    const positions = position.toUpperCase().split(',');
    players = players.filter(p => positions.includes(p.Position));
  }
  
  // Sort by ADP (or projected points if derived)
  players.sort((a, b) => {
    const aVal = a.AverageDraftPositionPPR || a.AverageDraftPosition || 999;
    const bVal = b.AverageDraftPositionPPR || b.AverageDraftPosition || 999;
    return aVal - bVal;
  });
  
  return players.slice(0, limit).map((p, index) => ({
    playerId: p.PlayerID,
    name: p.Name,
    team: p.Team,
    position: p.Position,
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
function getAllCacheStatus() {
  const status = {};
  
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
function clearAllCaches() {
  Object.values(CACHE_CONFIG).forEach(config => {
    const filePath = path.join(CACHE_DIR, config.file);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  });
  console.log('[SportsDataIO] All caches cleared');
}

// ============================================================================
// EXPORTS
// ============================================================================

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
