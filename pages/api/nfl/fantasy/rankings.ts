/**
 * NFL Fantasy Rankings API
 * 
 * GET /api/nfl/fantasy/rankings
 * Query params:
 *   - position: Filter by position (QB, RB, WR, TE)
 *   - limit: Max results (default: 100)
 *   - refresh: Force cache refresh (true/false)
 * 
 * Returns fantasy player rankings with ADP, projections, and auction values.
 * Cache: 6 hours
 */

import type { NextApiRequest, NextApiResponse } from 'next';

import { 
  withErrorHandling, 
  validateMethod, 
  requireEnvVar,
  createSuccessResponse,
  createErrorResponse,
  ErrorType 
} from '../../../../lib/apiErrorHandler';
import { RateLimiter } from '../../../../lib/rateLimiter';
import { getFantasyPlayers } from '../../../../lib/sportsdataio';
import { logger } from '../../../../lib/structuredLogger';

// ============================================================================
// TYPES
// ============================================================================

export interface FantasyRankingsResponse {
  ok: boolean;
  count: number;
  data: Array<{
    [key: string]: unknown;
  }>;
}

// ============================================================================
// RATE LIMITER
// ============================================================================

// Rate limiter (60 per minute)
const rateLimiter = new RateLimiter({
  maxRequests: 60,
  windowMs: 60 * 1000,
  endpoint: 'nfl_fantasy_rankings',
});

// ============================================================================
// HANDLER
// ============================================================================

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<FantasyRankingsResponse>
): Promise<unknown> {
  return withErrorHandling(req, res, async (req, res, logger): Promise<unknown> => {
    // Validate HTTP method
    validateMethod(req, ['GET'], logger);
    
    // Check required environment variable
    const apiKey = requireEnvVar('SPORTSDATAIO_API_KEY', logger);
    
    // Rate limiting
    const rateLimitResult = await rateLimiter.check(req);
    if (!rateLimitResult.allowed) {
      const errorResponse = createErrorResponse(
        ErrorType.RATE_LIMIT,
        'Rate limit exceeded',
        { retryAfter: Math.ceil((rateLimitResult.retryAfterMs || 60) / 1000) },
        res.getHeader('X-Request-ID') as string | undefined
      );
      return res.status(errorResponse.statusCode).json({ error: errorResponse.body.error.message, ok: false, count: 0, data: [] } as FantasyRankingsResponse);
    }
    
    logger.info('Fetching fantasy rankings', {
      component: 'nfl-api',
      operation: 'fantasy-rankings',
      query: req.query,
    });
    const { position, limit = '100', refresh } = req.query;
    const forceRefresh = refresh === 'true';
    
    const data = await getFantasyPlayers(apiKey, {
      position: position as string | undefined,
      limit: parseInt(limit as string, 10),
      forceRefresh,
    });
    
    const response = createSuccessResponse({
      ok: true,
      count: data.length,
      data,
    }, 200, logger);
    
    return res.status(response.statusCode).json(response.body.data as unknown as FantasyRankingsResponse);
  });
}
