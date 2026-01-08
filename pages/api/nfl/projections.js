/**
 * NFL Player Season Projections API
 * 
 * GET /api/nfl/projections
 * Query params:
 *   - season: NFL season year (default: current year)
 *   - position: Filter by position (QB, RB, WR, TE)
 *   - limit: Max results (default: all)
 *   - refresh: Force cache refresh (true/false)
 */

import { getProjections } from '../../../lib/sportsdataio';
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

    const { season, position, limit, refresh } = req.query;
    const forceRefresh = refresh === 'true';
    
    logger.info('Fetching projections', {
      filters: {
        season: season || 'default',
        position,
        limit,
        refresh: forceRefresh,
      }
    });
    
    let projections = await getProjections(apiKey, forceRefresh);
    logger.debug('Projections fetched', { count: projections.length });
    
    // Filter by position if specified
    if (position) {
      const beforeCount = projections.length;
      const positions = position.toUpperCase().split(',');
      projections = projections.filter(p => positions.includes(p.Position));
      logger.debug('Filtered by position', { 
        positions, 
        before: beforeCount, 
        after: projections.length 
      });
    }
    
    // Sort by PPR fantasy points
    projections.sort((a, b) => (b.FantasyPointsPPR || 0) - (a.FantasyPointsPPR || 0));
    
    // Limit results
    if (limit) {
      const limitNum = parseInt(limit);
      projections = projections.slice(0, limitNum);
      logger.debug('Limited results', { limit: limitNum });
    }
    
    const response = createSuccessResponse({
      season: season || new Date().getFullYear(),
      count: projections.length,
      data: projections,
    }, 200, logger);
    
    return res.status(response.statusCode).json(response.body);
  });
}

