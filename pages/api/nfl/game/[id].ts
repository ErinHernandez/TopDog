/**
 * NFL Single Game / Box Score API
 *
 * GET /api/nfl/game/[id]?season=2025&week=1
 *
 * Returns detailed box score for a specific game.
 * Requires season and week query parameters as the underlying API needs them.
 *
 * The 'id' can be:
 * - A game ID (numeric)
 * - A team code (e.g., "KC", "PHI") to get that team's game for the specified week
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { fetchBoxScore, fetchBoxScoresByWeek } from '../../../../lib/sportsdataio';
import {
  withErrorHandling,
  validateMethod,
  requireEnvVar,
  ErrorType,
  createErrorResponse,
} from '../../../../lib/apiErrorHandler';

// ============================================================================
// TYPES
// ============================================================================

export interface GameScore {
  ScoreID?: number;
  GameKey?: string;
  Season?: number;
  Week?: number;
  Date?: string;
  DateTime?: string;
  HomeTeam?: string;
  AwayTeam?: string;
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
  Status?: string;
  Quarter?: string;
  TimeRemaining?: string;
  Possession?: string;
  Down?: number;
  Distance?: number;
  YardLine?: number;
  RedZone?: boolean;
  [key: string]: unknown;
}

export interface PlayerGame {
  PlayerID?: number;
  Name?: string;
  Team?: string;
  Position?: string;
  FantasyPointsPPR?: number;
  PassingYards?: number;
  PassingTouchdowns?: number;
  RushingYards?: number;
  RushingTouchdowns?: number;
  Receptions?: number;
  ReceivingYards?: number;
  ReceivingTouchdowns?: number;
  [key: string]: unknown;
}

export interface BoxScore {
  Score?: GameScore;
  PlayerGames?: PlayerGame[];
  ScoringPlays?: Array<{
    [key: string]: unknown;
  }>;
  [key: string]: unknown;
}

export interface GameBoxScoreResponse {
  gameId: number | undefined;
  gameKey: string | undefined;
  season: number | undefined;
  week: number | undefined;
  date: string | undefined;
  dateTime: string | undefined;
  homeTeam: string | undefined;
  awayTeam: string | undefined;
  homeScore: number | undefined;
  awayScore: number | undefined;
  scoring: {
    home: {
      q1: number | undefined;
      q2: number | undefined;
      q3: number | undefined;
      q4: number | undefined;
      ot: number | undefined;
      total: number | undefined;
    };
    away: {
      q1: number | undefined;
      q2: number | undefined;
      q3: number | undefined;
      q4: number | undefined;
      ot: number | undefined;
      total: number | undefined;
    };
  };
  status: string | undefined;
  quarter: string | undefined;
  timeRemaining: string | undefined;
  possession: string | undefined;
  down: number | undefined;
  distance: number | undefined;
  yardLine: number | undefined;
  redZone: boolean | undefined;
  playerStats: Array<{
    playerId: number | undefined;
    name: string | undefined;
    team: string | undefined;
    position: string | undefined;
    fantasyPointsPPR: number;
    passingYards: number;
    passingTDs: number;
    rushingYards: number;
    rushingTDs: number;
    receptions: number;
    receivingYards: number;
    receivingTDs: number;
  }>;
  scoringPlays: Array<{
    [key: string]: unknown;
  }>;
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Transform raw box score data to API response format
 */
function transformBoxScore(boxScore: BoxScore): GameBoxScoreResponse {
  const score = boxScore.Score || {};
  const playerGames = boxScore.PlayerGames || [];
  const scoringPlays = boxScore.ScoringPlays || [];

  return {
    gameId: score.ScoreID,
    gameKey: score.GameKey,
    season: score.Season,
    week: score.Week,
    date: score.Date,
    dateTime: score.DateTime,
    homeTeam: score.HomeTeam,
    awayTeam: score.AwayTeam,
    homeScore: score.HomeScore,
    awayScore: score.AwayScore,
    scoring: {
      home: {
        q1: score.HomeScoreQuarter1,
        q2: score.HomeScoreQuarter2,
        q3: score.HomeScoreQuarter3,
        q4: score.HomeScoreQuarter4,
        ot: score.HomeScoreOvertime,
        total: score.HomeScore,
      },
      away: {
        q1: score.AwayScoreQuarter1,
        q2: score.AwayScoreQuarter2,
        q3: score.AwayScoreQuarter3,
        q4: score.AwayScoreQuarter4,
        ot: score.AwayScoreOvertime,
        total: score.AwayScore,
      },
    },
    status: score.Status,
    quarter: score.Quarter,
    timeRemaining: score.TimeRemaining,
    possession: score.Possession,
    down: score.Down,
    distance: score.Distance,
    yardLine: score.YardLine,
    redZone: score.RedZone,
    playerStats: playerGames.map((player: PlayerGame) => ({
      playerId: player.PlayerID,
      name: player.Name,
      team: player.Team,
      position: player.Position,
      fantasyPointsPPR: player.FantasyPointsPPR || 0,
      passingYards: player.PassingYards || 0,
      passingTDs: player.PassingTouchdowns || 0,
      rushingYards: player.RushingYards || 0,
      rushingTDs: player.RushingTouchdowns || 0,
      receptions: player.Receptions || 0,
      receivingYards: player.ReceivingYards || 0,
      receivingTDs: player.ReceivingTouchdowns || 0,
    })),
    scoringPlays: scoringPlays,
  };
}

/**
 * Check if a string is a valid NFL team code
 */
function isTeamCode(str: string): boolean {
  const teamCodes = [
    'ARI', 'ATL', 'BAL', 'BUF', 'CAR', 'CHI', 'CIN', 'CLE',
    'DAL', 'DEN', 'DET', 'GB', 'HOU', 'IND', 'JAX', 'KC',
    'LAC', 'LAR', 'LV', 'MIA', 'MIN', 'NE', 'NO', 'NYG',
    'NYJ', 'PHI', 'PIT', 'SEA', 'SF', 'TB', 'TEN', 'WAS',
  ];
  return teamCodes.includes(str.toUpperCase());
}

// ============================================================================
// HANDLER
// ============================================================================

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GameBoxScoreResponse | { error: { code: string; message: string } }>
): Promise<unknown> {
  return withErrorHandling(req, res, async (req, res, logger): Promise<unknown> => {
    // Validate HTTP method
    validateMethod(req, ['GET'], logger);

    // Check required environment variables
    const apiKey = requireEnvVar('SPORTSDATAIO_API_KEY', logger);

    const { id, season, week } = req.query;

    if (!id) {
      const errorResponse = createErrorResponse(
        ErrorType.VALIDATION,
        'Game ID or team code is required',
        {},
        res.getHeader('X-Request-ID') as string | undefined
      );
      return res.status(errorResponse.statusCode).json(errorResponse.body);
    }

    // Validate season and week parameters
    if (!season || !week) {
      const errorResponse = createErrorResponse(
        ErrorType.VALIDATION,
        'Season and week query parameters are required. Example: /api/nfl/game/KC?season=2025&week=1',
        { id },
        res.getHeader('X-Request-ID') as string | undefined
      );
      return res.status(errorResponse.statusCode).json(errorResponse.body);
    }

    const seasonNum = parseInt(season as string, 10);
    const weekNum = parseInt(week as string, 10);

    if (isNaN(seasonNum) || seasonNum < 2000 || seasonNum > 2100) {
      const errorResponse = createErrorResponse(
        ErrorType.VALIDATION,
        'Invalid season parameter',
        { season },
        res.getHeader('X-Request-ID') as string | undefined
      );
      return res.status(errorResponse.statusCode).json(errorResponse.body);
    }

    if (isNaN(weekNum) || weekNum < 1 || weekNum > 22) {
      const errorResponse = createErrorResponse(
        ErrorType.VALIDATION,
        'Invalid week parameter (must be 1-22)',
        { week },
        res.getHeader('X-Request-ID') as string | undefined
      );
      return res.status(errorResponse.statusCode).json(errorResponse.body);
    }

    const idStr = id as string;

    // Check if the ID is a team code or a game ID
    if (isTeamCode(idStr)) {
      // Fetch box score by team code
      logger.info('Fetching box score by team', { team: idStr, season: seasonNum, week: weekNum });

      try {
        const boxScore = await fetchBoxScore(apiKey, seasonNum, weekNum, idStr.toUpperCase());
        const response = transformBoxScore(boxScore as BoxScore);
        return res.status(200).json(response);
      } catch (error) {
        logger.error('Failed to fetch box score', error instanceof Error ? error : new Error(String(error)));
        const errorResponse = createErrorResponse(
          ErrorType.NOT_FOUND,
          `No game found for ${idStr.toUpperCase()} in week ${weekNum} of ${seasonNum}`,
          { team: idStr, season: seasonNum, week: weekNum },
          res.getHeader('X-Request-ID') as string | undefined
        );
        return res.status(errorResponse.statusCode).json(errorResponse.body);
      }
    } else {
      // Assume it's a game ID - fetch all box scores for the week and find the matching one
      const gameIdNum = parseInt(idStr, 10);

      if (isNaN(gameIdNum)) {
        const errorResponse = createErrorResponse(
          ErrorType.VALIDATION,
          'Invalid game ID format. Must be a number or a team code (e.g., KC, PHI)',
          { gameId: id },
          res.getHeader('X-Request-ID') as string | undefined
        );
        return res.status(errorResponse.statusCode).json(errorResponse.body);
      }

      logger.info('Fetching box score by game ID', { gameId: gameIdNum, season: seasonNum, week: weekNum });

      try {
        const boxScores = await fetchBoxScoresByWeek(apiKey, seasonNum, weekNum);
        const matchingBoxScore = (boxScores as BoxScore[]).find(
          (bs) => bs.Score?.ScoreID === gameIdNum
        );

        if (!matchingBoxScore) {
          const errorResponse = createErrorResponse(
            ErrorType.NOT_FOUND,
            `Game ID ${gameIdNum} not found in week ${weekNum} of ${seasonNum}`,
            { gameId: gameIdNum, season: seasonNum, week: weekNum },
            res.getHeader('X-Request-ID') as string | undefined
          );
          return res.status(errorResponse.statusCode).json(errorResponse.body);
        }

        const response = transformBoxScore(matchingBoxScore);
        return res.status(200).json(response);
      } catch (error) {
        logger.error('Failed to fetch box scores', error instanceof Error ? error : new Error(String(error)));
        const errorResponse = createErrorResponse(
          ErrorType.INTERNAL,
          'Failed to fetch game data',
          { gameId: gameIdNum, season: seasonNum, week: weekNum },
          res.getHeader('X-Request-ID') as string | undefined
        );
        return res.status(errorResponse.statusCode).json(errorResponse.body);
      }
    }
  });
}
