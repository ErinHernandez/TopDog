/**
 * NFL Single Game / Box Score API
 * 
 * GET /api/nfl/game/[id]
 * 
 * Returns detailed box score for a specific game.
 * Includes player stats, scoring plays, etc.
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { fetchBoxScore } from '../../../../lib/sportsdataio';
import { POSITIONS } from '../../../../lib/constants/positions';
import { 
  withErrorHandling, 
  validateMethod, 
  requireEnvVar,
  createSuccessResponse,
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
// HANDLER
// ============================================================================

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GameBoxScoreResponse>
): Promise<unknown> {
  return withErrorHandling(req, res, async (req, res, logger): Promise<unknown> => {
    // Validate HTTP method
    validateMethod(req, ['GET'], logger);

    // Check required environment variables
    const apiKey = requireEnvVar('SPORTSDATAIO_API_KEY', logger);

    const { id } = req.query;
    
    if (!id) {
      const error = new Error('Game ID required');
      error.name = 'ValidationError';
      throw error;
    }
    
    logger.info('Fetching game box score', { gameId: id });
    
    // fetchBoxScore requires season, week, team - we need to use fetchBoxScoresByWeek and filter
    // For now, we'll need to get season/week from query params or use a different approach
    // This is a placeholder - the actual implementation should parse the game ID or get season/week
    const gameIdNum = parseInt(id as string, 10);
    if (isNaN(gameIdNum)) {
      const errorResponse = createErrorResponse(
        ErrorType.VALIDATION,
        'Invalid game ID format',
        { gameId: id },
        res.getHeader('X-Request-ID') as string | undefined
      );
      return res.status(errorResponse.statusCode).json(errorResponse.body as unknown as GameBoxScoreResponse);
    }
    
    // TODO: This needs proper implementation - fetchBoxScore requires season, week, team
    // For now, return an error indicating this endpoint needs refactoring
    const errorResponse = createErrorResponse(
      ErrorType.NOT_FOUND,
      'Game box score by ID not yet implemented - requires season, week, and team parameters',
      { gameId: id },
      res.getHeader('X-Request-ID') as string | undefined
    );
    return res.status(errorResponse.statusCode).json(errorResponse.body as unknown as GameBoxScoreResponse);
  });
}
