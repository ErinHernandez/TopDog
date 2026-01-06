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

import { getInjuries } from '../../../lib/sportsdataio';
import { 
  withErrorHandling, 
  validateMethod, 
  requireEnvVar,
  createSuccessResponse,
} from '../../../lib/apiErrorHandler';

export default async function handler(req, res) {
  return withErrorHandling(req, res, async (req, res, logger) => {
    // Validate HTTP method
    validateMethod(req, ['GET'], logger);

    // Check required environment variables
    const apiKey = requireEnvVar('SPORTSDATAIO_API_KEY', logger);

    const { team, position, status, refresh } = req.query;
    const forceRefresh = refresh === 'true';
    
    logger.info('Fetching injuries', {
      filters: {
        team,
        position,
        status,
        refresh: forceRefresh,
      }
    });
    
    let injuries = await getInjuries(apiKey, forceRefresh);
    logger.debug('Injuries fetched', { count: injuries.length });
    
    // Filter by team
    if (team) {
      const beforeCount = injuries.length;
      injuries = injuries.filter(i => i.Team === team.toUpperCase());
      logger.debug('Filtered by team', { 
        team: team.toUpperCase(), 
        before: beforeCount, 
        after: injuries.length 
      });
    }
    
    // Filter by position
    if (position) {
      const beforeCount = injuries.length;
      const positions = position.toUpperCase().split(',');
      injuries = injuries.filter(i => positions.includes(i.Position));
      logger.debug('Filtered by position', { 
        positions, 
        before: beforeCount, 
        after: injuries.length 
      });
    }
    
    // Filter by status
    if (status) {
      const beforeCount = injuries.length;
      const statuses = status.split(',').map(s => s.toLowerCase());
      injuries = injuries.filter(i => 
        statuses.includes((i.Status || '').toLowerCase())
      );
      logger.debug('Filtered by status', { 
        statuses, 
        before: beforeCount, 
        after: injuries.length 
      });
    }
    
    // Transform for cleaner output
    const transformed = injuries.map(i => ({
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
    
    return res.status(response.statusCode).json(response.body);
  });
}

