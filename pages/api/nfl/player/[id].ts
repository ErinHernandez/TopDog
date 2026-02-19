/**
 * NFL Single Player API
 * 
 * GET /api/nfl/player/[id]
 * 
 * Returns detailed player info including headshot URL
 */

import type { NextApiRequest, NextApiResponse } from 'next';

import { 
  withErrorHandling, 
  validateMethod, 
  requireEnvVar,
  createSuccessResponse,
  ErrorType,
  createErrorResponse,
} from '../../../../lib/apiErrorHandler';
import { getPlayerById } from '../../../../lib/sportsdataio';

// ============================================================================
// TYPES
// ============================================================================

export interface Player {
  PlayerID?: number;
  Name?: string;
  FirstName?: string;
  LastName?: string;
  Team?: string;
  Position?: string;
  Number?: number;
  Height?: string;
  Weight?: number;
  Age?: number;
  BirthDate?: string;
  College?: string;
  Experience?: number;
  Status?: string;
  PhotoUrl?: string;
  InjuryStatus?: string;
  InjuryBodyPart?: string;
  InjuryStartDate?: string;
  InjuryNotes?: string;
  CollegeDraftYear?: number;
  CollegeDraftRound?: number;
  CollegeDraftPick?: number;
  FantasyPosition?: string;
  AverageDraftPosition?: number;
  AverageDraftPositionPPR?: number;
  ByeWeek?: number;
  [key: string]: unknown;
}

export interface PlayerResponse {
  playerId: number | undefined;
  name: string | undefined;
  firstName: string | undefined;
  lastName: string | undefined;
  team: string | undefined;
  position: string | undefined;
  number: number | undefined;
  height: string | undefined;
  weight: number | undefined;
  age: number | undefined;
  birthDate: string | undefined;
  college: string | undefined;
  experience: number | undefined;
  status: string | undefined;
  headshotUrl: string | undefined;
  injuryStatus: string | undefined;
  injuryBodyPart: string | undefined;
  injuryStartDate: string | undefined;
  injuryNotes: string | undefined;
  draftYear: number | undefined;
  draftRound: number | undefined;
  draftPick: number | undefined;
  fantasyPosition: string | undefined;
  averageDraftPosition: number | undefined;
  averageDraftPositionPPR: number | undefined;
  byeWeek: number | undefined;
}

// ============================================================================
// HANDLER
// ============================================================================

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PlayerResponse>
): Promise<unknown> {
  return withErrorHandling(req, res, async (req, res, logger): Promise<unknown> => {
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
    
    const playerIdNum = parseInt(id as string, 10);
    if (isNaN(playerIdNum)) {
      const errorResponse = createErrorResponse(
        ErrorType.VALIDATION,
        'Invalid player ID format',
        { playerId: id },
        res.getHeader('X-Request-ID') as string | undefined
      );
      return res.status(errorResponse.statusCode).json(errorResponse.body as unknown as PlayerResponse);
    }
    const player = await getPlayerById(apiKey, playerIdNum) as Player | null;
    
    if (!player) {
      logger.warn('Player not found', { playerId: id });
      const errorResponse = createErrorResponse(
        ErrorType.NOT_FOUND,
        `Player with ID ${id} not found`,
        { playerId: id },
        res.getHeader('X-Request-ID') as string | undefined
      );
      return res.status(errorResponse.statusCode).json(errorResponse.body as unknown as PlayerResponse);
    }
    
    logger.debug('Player found', { 
      playerId: id, 
      name: player.Name,
      position: player.Position 
    });
    
    // Transform to clean output
    const data: PlayerResponse = {
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
    return res.status(response.statusCode).json(response.body.data as PlayerResponse);
  });
}
