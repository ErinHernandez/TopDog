/**
 * NFL Injuries API
 * 
 * GET /api/nfl/injuries
 * Query params:
 *   - team: Filter by team abbreviation
 *   - position: Filter by position (QB, RB, WR, TE)
 *   - status: Filter by injury status (Out, Doubtful, Questionable, Probable)
 *   - refresh: Force cache refresh (true/false)
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { getInjuries } from '../../../lib/sportsdataio';
import { 
  withErrorHandling, 
  validateMethod, 
  requireEnvVar,
  createSuccessResponse,
} from '../../../lib/apiErrorHandler';

// ============================================================================
// TYPES
// ============================================================================

export interface Injury {
  Name?: string;
  Team?: string;
  Position?: string;
  Status?: string;
  BodyPart?: string;
  InjuryStartDate?: string;
  PracticeStatus?: string;
  PracticeDescription?: string;
  PlayerID?: number;
  [key: string]: unknown;
}

export interface TransformedInjury {
  name: string | undefined;
  team: string | undefined;
  position: string | undefined;
  status: string | undefined;
  bodyPart: string | undefined;
  injuryStartDate: string | undefined;
  practiceStatus: string | undefined;
  practiceDescription: string | undefined;
  playerId: number | undefined;
}

export interface InjuriesResponse {
  count: number;
  data: TransformedInjury[];
}

// ============================================================================
// HANDLER
// ============================================================================

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<InjuriesResponse>
): Promise<unknown> {
  return withErrorHandling(req, res, async (req, res, logger): Promise<unknown> => {
    // Validate HTTP method
    validateMethod(req, ['GET'], logger);

    // Check required environment variables
    const apiKey = requireEnvVar('SPORTSDATAIO_API_KEY', logger);

    const { team, position, status, refresh } = req.query;
    const forceRefresh = refresh === 'true';
    
    logger.info('Fetching injuries', {
      filters: {
        team: team as string | undefined,
        position: position as string | undefined,
        status: status as string | undefined,
        refresh: forceRefresh,
      }
    });
    
    let injuries = await getInjuries(apiKey, forceRefresh) as Injury[];
    logger.debug('Injuries fetched', { count: injuries.length });
    
    // Filter by team
    if (team) {
      const beforeCount = injuries.length;
      const teamUpper = (team as string).toUpperCase();
      injuries = injuries.filter(i => i.Team === teamUpper);
      logger.debug('Filtered by team', { 
        team: teamUpper, 
        before: beforeCount, 
        after: injuries.length 
      });
    }
    
    // Filter by position
    if (position) {
      const beforeCount = injuries.length;
      const positions = (position as string).toUpperCase().split(',');
      injuries = injuries.filter(i => i.Position && positions.includes(i.Position));
      logger.debug('Filtered by position', { 
        positions, 
        before: beforeCount, 
        after: injuries.length 
      });
    }
    
    // Filter by status
    if (status) {
      const beforeCount = injuries.length;
      const statuses = (status as string).split(',').map(s => s.toLowerCase());
      injuries = injuries.filter(i => 
        i.Status && statuses.includes(i.Status.toLowerCase())
      );
      logger.debug('Filtered by status', { 
        statuses, 
        before: beforeCount, 
        after: injuries.length 
      });
    }
    
    // Transform for cleaner output
    const transformed: TransformedInjury[] = injuries.map(i => ({
      name: i.Name,
      team: i.Team,
      position: i.Position,
      status: i.Status,
      bodyPart: i.BodyPart,
      injuryStartDate: i.InjuryStartDate,
      practiceStatus: i.PracticeStatus,
      practiceDescription: i.PracticeDescription,
      playerId: i.PlayerID,
    }));
    
    const response = createSuccessResponse({
      count: transformed.length,
      data: transformed,
    }, 200, logger);
    
    return res.status(response.statusCode).json(response.body.data as InjuriesResponse);
  });
}
