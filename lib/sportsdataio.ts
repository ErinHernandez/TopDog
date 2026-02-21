/**
 * SportsDataIO API Integration - Facade
 *
 * This is the main entry point. It re-exports all functionality from specialized modules.
 *
 * Comprehensive NFL data API with file-based caching.
 * Supports: Projections, Schedules, Injuries, Depth Charts, Player Stats, News, Teams, etc.
 *
 * Cache TTLs vary by data type:
 * - Projections: 24 hours
 * - Schedules: 24 hours
 * - Injuries: 1 hour (changes frequently during season)
 * - Depth Charts: 6 hours
 * - Player Stats: 24 hours
 * - News: 15 minutes
 */

// ============================================================================
// TYPES & CONSTANTS
// ============================================================================

export type { DataType, CacheConfig, CacheInfo, CacheStatus } from './sportsdataio.types';
export type { SportsDataIOPlayer, TransformedPlayer } from './sportsdataio.types';
export type { Team, TransformedTeam } from './sportsdataio.types';
export type { NewsItem, Injury, DepthChart } from './sportsdataio.types';
export type { GameScore, TransformedGameScore, LiveFantasyScore } from './sportsdataio.types';
export type { ADPData, TransformedADP, FantasyPlayer } from './sportsdataio.types';
export type { ADPByPositionOptions, FantasyPlayersOptions } from './sportsdataio.types';

export {
  CACHE_CONFIG,
  CACHE_DIR,
  CACHE_FILE,
  CACHE_TTL_MS,
  ensureCacheDir,
  isCacheValid,
  readCache,
  writeCache,
  getCacheInfo,
  getCacheFilePath,
  isCacheValidFor,
  readCacheFor,
  writeCacheFor,
  fetchWithCache,
  getAllCacheStatus,
  clearAllCaches,
} from './sportsdataio.cache';

export {
  fetchProjections,
  getProjections,
  transformPlayer,
  getProjectionsMap,
  fetchSchedule,
  getSchedule,
  fetchInjuries,
  getInjuries,
  getInjuriesMap,
  fetchDepthCharts,
  getDepthCharts,
  getDepthChartsByTeam,
  fetchPlayerStats,
  getPlayerStats,
  fetchWeeklyProjections,
} from './sportsdataio.core';

export {
  fetchTeams,
  fetchAllTeams,
  getTeams,
  transformTeam,
  getTeamsMap,
  getTeamByKey,
} from './sportsdataio.teams';

export {
  fetchNews,
  getNews,
  getPlayerNews,
  fetchByeWeeks,
  getByeWeeks,
  getByeWeeksMap,
} from './sportsdataio.meta';

export {
  fetchPlayers,
  getPlayers,
  getPlayersMap,
  fetchHeadshots,
  getHeadshots,
  getHeadshotsMap,
  getPlayerHeadshot,
  getPlayerById,
} from './sportsdataio.players';

export {
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
} from './sportsdataio.scores';

export {
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
} from './sportsdataio.fantasy';

// ============================================================================
// COMMONJS EXPORTS FOR BACKWARD COMPATIBILITY
// ============================================================================

// Import all functions for CommonJS module.exports
import * as cache from './sportsdataio.cache';
import * as core from './sportsdataio.core';
import * as fantasy from './sportsdataio.fantasy';
import * as meta from './sportsdataio.meta';
import * as players from './sportsdataio.players';
import * as scores from './sportsdataio.scores';
import * as teams from './sportsdataio.teams';
