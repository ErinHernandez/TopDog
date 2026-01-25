/**
 * NFL Fantasy Overview API
 * 
 * GET /api/nfl/fantasy
 * 
 * Returns a summary of fantasy data including top players by position.
 */

import { getFantasyPlayers } from '../../../../lib/sportsdataio';
import { POSITIONS } from '../../../../components/draft/v3/constants/positions';
import { 
  withErrorHandling, 
  validateMethod, 
  requireEnvVar,
  createSuccessResponse,
} from '../../../../lib/apiErrorHandler';

export default async function handler(req, res) {
  return withErrorHandling(req, res, async (req, res, logger) => {
    // Validate HTTP method
    validateMethod(req, ['GET'], logger);

    // Check required environment variables
    const apiKey = requireEnvVar('SPORTSDATAIO_API_KEY', logger);

    logger.info('Fetching fantasy overview');

    const allPlayers = await getFantasyPlayers(apiKey, { limit: 500 });
    logger.debug('Fantasy players fetched', { count: allPlayers.length });
    
    // Group by position and get top 10 each
    const byPosition = {};
    
    POSITIONS.forEach(pos => {
      byPosition[pos] = allPlayers
        .filter(p => p.position === pos)
        .slice(0, 10)
        .map(p => ({
          name: p.name,
          team: p.team,
          adp: p.adpPPR || p.adp,
          projectedPoints: p.projectedPointsPPR || p.projectedPoints,
          positionRank: p.positionRank,
          byeWeek: p.byeWeek,
        }));
    });
    
    logger.debug('Position breakdowns created', { 
      positions: Object.keys(byPosition) 
    });
    
    // Overall top 20
    const top20 = allPlayers.slice(0, 20).map(p => ({
      name: p.name,
      team: p.team,
      position: p.position,
      adp: p.adpPPR || p.adp,
      projectedPoints: p.projectedPointsPPR || p.projectedPoints,
      overallRank: p.overallRank,
    }));
    
    const positionCounts = {
      QB: allPlayers.filter(p => p.position === 'QB').length,
      RB: allPlayers.filter(p => p.position === 'RB').length,
      WR: allPlayers.filter(p => p.position === 'WR').length,
      TE: allPlayers.filter(p => p.position === 'TE').length,
    };
    
    const response = createSuccessResponse({
      summary: {
        totalPlayers: allPlayers.length,
        byPosition: positionCounts,
      },
      top20,
      topByPosition: byPosition,
    }, 200, logger);
    
    return res.status(response.statusCode).json(response.body);
  });
}

