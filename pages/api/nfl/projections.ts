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

import type { NextApiRequest, NextApiResponse } from 'next';

import { setCacheHeaders } from '../../../lib/api/cacheHeaders';
import {
  withErrorHandling,
  validateMethod,
  createSuccessResponse,
} from '../../../lib/apiErrorHandler';
import { getProjections } from '../../../lib/dataSources';
import { getProjectionsSource } from '../../../lib/dataSources/config';

// ============================================================================
// TYPES
// ============================================================================

export interface ProjectionsResponse {
  season: number;
  count: number;
  source: string;
  data: Array<{
    _source?: string;
    [key: string]: unknown;
  }>;
}

// ============================================================================
// HANDLER
// ============================================================================

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ProjectionsResponse>
): Promise<unknown> {
  return withErrorHandling(req, res, async (req, res, logger): Promise<unknown> => {
    // Validate HTTP method
    validateMethod(req, ['GET'], logger);

    const { season, position, limit, refresh } = req.query;
    const forceRefresh = refresh === 'true';
    const seasonYear = season ? parseInt(season as string, 10) : new Date().getFullYear();
    
    // Determine which source will be used (for logging)
    const source = getProjectionsSource();
    
    logger.info('Fetching projections', {
      source,
      filters: {
        season: seasonYear,
        position: position as string | undefined,
        limit: limit as string | undefined,
        refresh: forceRefresh,
      }
    });
    
    try {
      // Use data source abstraction - automatically handles ESPN/SportsDataIO and fallback
      const projections = await getProjections(seasonYear, {
        position: position as string | undefined,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        forceRefresh,
      });
      
      logger.debug('Projections fetched', {
        count: projections.length,
        source: (projections[0] as { _source?: string })?. _source || source,
      });

      // Set cache headers - projections data changes periodically
      if (forceRefresh) {
        setCacheHeaders(res, 'no-cache');
      } else {
        setCacheHeaders(res, 'public-medium');
      }

      // Note: Filtering, sorting, and limiting are now handled by the data source abstraction
      // But we keep the response format consistent

      const response = createSuccessResponse({
        season: seasonYear,
        count: projections.length,
        source: (projections[0] as { _source?: string })?. _source || source, // Include source in response for debugging
        data: projections,
      }, 200, logger);

      return res.status(response.statusCode).json(response.body.data as unknown as ProjectionsResponse);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      logger.error('Failed to fetch projections', error instanceof Error ? error : new Error(errorMessage), {
        stack: errorStack,
        source 
      });
      // Re-throw to let error handler deal with it, but log full details
      throw error;
    }
  });
}
