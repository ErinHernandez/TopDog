/**
 * Live scores and game state service for SportsDataIO
 */

import { serverLogger } from './logger/serverLogger';
import { fetchWithCache } from './sportsdataio.cache';
import { GameScore, TransformedGameScore, LiveFantasyScore } from './sportsdataio.types';

const BASE_URL = 'https://api.sportsdata.io/v3/nfl';

// ============================================================================
// TIMEFRAMES
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
  return fetchWithCache('timeframes', () => fetchTimeframes(apiKey), forceRefresh) as Promise<Array<{
    Season: number;
    SeasonType: number;
    Week: number;
    Name: string;
    StartDate: string;
    EndDate: string;
    [key: string]: unknown;
  }>>;
}

/**
 * Get current week number
 */
export async function getCurrentWeek(apiKey: string): Promise<number | null> {
  const timeframes = await getTimeframes(apiKey);
  const current = timeframes.find(tf => tf.SeasonType === 1); // Regular season
  return current ? current.Week : null;
}

// ============================================================================
// LIVE SCORES
// ============================================================================

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
  return fetchWithCache('liveScores', () => fetchScoresByWeek(apiKey, season, week), forceRefresh) as Promise<GameScore[]>;
}

// ============================================================================
// BOX SCORES
// ============================================================================

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

// ============================================================================
// GAME TRANSFORMATIONS
// ============================================================================

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
    status: game.Status,
    quarter: game.Quarter,
    timeRemaining: game.TimeRemaining,
    possession: game.Possession,
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

// ============================================================================
// LIVE PLAYER STATS
// ============================================================================

/**
 * Fetch live player stats for games in progress
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
