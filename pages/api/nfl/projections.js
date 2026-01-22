/**
 * NFL Player Season Projections API
 * 
 * GET /api/nfl/projections
 * Query params:
 *   - season: NFL season year (default: current year)
 *   - position: Filter by position (QB, RB, WR, TE)
 *   - limit: Max results (default: all)
 *   - refresh: Force cache refresh (true/false)
 * 
 * Uses data source abstraction layer - automatically uses ESPN or SportsDataIO
 * based on DATA_SOURCE_PROJECTIONS environment variable, with automatic fallback.
 */

import { getProjections } from '../../../lib/dataSources';
import { getProjectionsSource } from '../../../lib/dataSources/config';
import { 
  withErrorHandling, 
  validateMethod, 
  createSuccessResponse,
} from '../../../lib/apiErrorHandler';

export default async function handler(req, res) {
  return withErrorHandling(req, res, async (req, res, logger) => {
    // Validate HTTP method
    validateMethod(req, ['GET'], logger);

    const { season, position, limit, refresh } = req.query;
    const forceRefresh = refresh === 'true';
    const seasonYear = season ? parseInt(season, 10) : new Date().getFullYear();
    
    // Determine which source will be used (for logging)
    const source = getProjectionsSource();
    
    logger.info('Fetching projections', {
      source,
      filters: {
        season: seasonYear,
        position,
        limit,
        refresh: forceRefresh,
      }
    });
    
    try {
      // Use data source abstraction - automatically handles ESPN/SportsDataIO and fallback
      let projections = await getProjections(seasonYear, {
        position,
        limit: limit ? parseInt(limit, 10) : undefined,
        forceRefresh,
      });
      
      logger.debug('Projections fetched', { 
        count: projections.length,
        source: projections[0]?._source || source,
      });
      
      // Note: Filtering, sorting, and limiting are now handled by the data source abstraction
      // But we keep the response format consistent
      
      const response = createSuccessResponse({
        season: seasonYear,
        count: projections.length,
        source: projections[0]?._source || source, // Include source in response for debugging
        data: projections,
      }, 200, logger);
      
      return res.status(response.statusCode).json(response.body);
    } catch (error) {
      logger.error('Failed to fetch projections', { error: error.message, source });
      throw error; // Let error handler deal with it
    }
  });
}

