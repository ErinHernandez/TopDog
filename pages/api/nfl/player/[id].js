/**
 * NFL Single Player API
 * 
 * GET /api/nfl/player/[id]
 * 
 * Returns detailed player info including headshot URL
 */

import { getPlayerById } from '../../../../lib/sportsdataio';
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
      const error = new Error('Player ID required');
      error.name = 'ValidationError';
      throw error;
    }

    logger.info('Fetching player', { playerId: id });
    
    const player = await getPlayerById(apiKey, id);
    
    if (!player) {
      logger.warn('Player not found', { playerId: id });
      const errorResponse = createErrorResponse(
        ErrorType.NOT_FOUND,
        `Player with ID ${id} not found`,
        { playerId: id },
        res.getHeader('X-Request-ID')
      );
      return res.status(errorResponse.statusCode).json(errorResponse.body);
    }
    
    logger.debug('Player found', { 
      playerId: id, 
      name: player.Name,
      position: player.Position 
    });
    
    // Transform to clean output
    const data = {
      playerId: player.PlayerID,
      name: player.Name,
      firstName: player.FirstName,
      lastName: player.LastName,
      team: player.Team,
      position: player.Position,
      number: player.Number,
      height: player.Height,
      weight: player.Weight,
      age: player.Age,
      birthDate: player.BirthDate,
      college: player.College,
      experience: player.Experience,
      status: player.Status,
      headshotUrl: player.PhotoUrl,
      // Injury info
      injuryStatus: player.InjuryStatus,
      injuryBodyPart: player.InjuryBodyPart,
      injuryStartDate: player.InjuryStartDate,
      injuryNotes: player.InjuryNotes,
      // Contract/draft info
      draftYear: player.CollegeDraftYear,
      draftRound: player.CollegeDraftRound,
      draftPick: player.CollegeDraftPick,
      // Fantasy relevant
      fantasyPosition: player.FantasyPosition,
      averageDraftPosition: player.AverageDraftPosition,
      averageDraftPositionPPR: player.AverageDraftPositionPPR,
      byeWeek: player.ByeWeek,
    };
    
    const response = createSuccessResponse(data, 200, logger);
    return res.status(response.statusCode).json(response.body);
  });
}

