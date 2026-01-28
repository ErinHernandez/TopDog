/**
 * NFL Single Game / Box Score API
 * 
 * GET /api/nfl/game/[id]
 * 
 * Returns detailed box score for a specific game.
 * Includes player stats, scoring plays, etc.
 */

import { fetchBoxScore } from '../../../../lib/sportsdataio';
import { POSITIONS } from '../../../../components/draft/v3/constants/positions';
import { 
  withErrorHandling, 
  validateMethod, 
  requireEnvVar,
  createSuccessResponse,
  ErrorType,
  createErrorResponse,
} from '../../../../lib/apiErrorHandler';

export default async function handler(req, res) {
  return withErrorHandling(req, res, async (req, res, logger) => {
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
    
    const boxScore = await fetchBoxScore(apiKey, id);
    
    if (!boxScore || !boxScore.Score) {
      logger.warn('Game not found', { gameId: id });
      const errorResponse = createErrorResponse(
        ErrorType.NOT_FOUND,
        `Game with ID ${id} not found`,
        { gameId: id },
        res.getHeader('X-Request-ID')
      );
      return res.status(errorResponse.statusCode).json(errorResponse.body);
    }
    
    // Transform to cleaner format
    const game = boxScore.Score;
    const data = {
      gameId: game.ScoreID,
      gameKey: game.GameKey,
      season: game.Season,
      week: game.Week,
      date: game.Date,
      dateTime: game.DateTime,
      
      // Teams & Scores
      homeTeam: game.HomeTeam,
      awayTeam: game.AwayTeam,
      homeScore: game.HomeScore,
      awayScore: game.AwayScore,
      
      // Quarter scores
      scoring: {
        home: {
          q1: game.HomeScoreQuarter1,
          q2: game.HomeScoreQuarter2,
          q3: game.HomeScoreQuarter3,
          q4: game.HomeScoreQuarter4,
          ot: game.HomeScoreOvertime,
          total: game.HomeScore,
        },
        away: {
          q1: game.AwayScoreQuarter1,
          q2: game.AwayScoreQuarter2,
          q3: game.AwayScoreQuarter3,
          q4: game.AwayScoreQuarter4,
          ot: game.AwayScoreOvertime,
          total: game.AwayScore,
        },
      },
      
      // Game State
      status: game.Status,
      quarter: game.Quarter,
      timeRemaining: game.TimeRemaining,
      possession: game.Possession,
      down: game.Down,
      distance: game.Distance,
      yardLine: game.YardLine,
      redZone: game.RedZone,
      
      // Player Stats (fantasy-relevant only)
      playerStats: (boxScore.PlayerGames || [])
        .filter(p => POSITIONS.includes(p.Position))
        .map(p => ({
          playerId: p.PlayerID,
          name: p.Name,
          team: p.Team,
          position: p.Position,
          fantasyPointsPPR: p.FantasyPointsPPR || 0,
          passingYards: p.PassingYards || 0,
          passingTDs: p.PassingTouchdowns || 0,
          rushingYards: p.RushingYards || 0,
          rushingTDs: p.RushingTouchdowns || 0,
          receptions: p.Receptions || 0,
          receivingYards: p.ReceivingYards || 0,
          receivingTDs: p.ReceivingTouchdowns || 0,
        }))
        .sort((a, b) => b.fantasyPointsPPR - a.fantasyPointsPPR),
      
      // Scoring plays
      scoringPlays: boxScore.ScoringPlays || [],
    };
    
    logger.debug('Game box score fetched', { 
      gameId: id, 
      playerStatsCount: data.playerStats.length 
    });
    
    const response = createSuccessResponse(data, 200, logger);
    return res.status(response.statusCode).json(response.body);
  });
}

