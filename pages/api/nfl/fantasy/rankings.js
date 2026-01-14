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

import { getFantasyPlayers } from '../../../../lib/sportsdataio';
import { RateLimiter } from '../../../../lib/rateLimiter';
import { logger } from '../../../../lib/structuredLogger';
import { 
  withErrorHandling, 
  validateMethod, 
  requireEnvVar,
  createSuccessResponse,
  createErrorResponse,
  ErrorType 
} from '../../../../lib/apiErrorHandler.js';

// Rate limiter (60 per minute)
const rateLimiter = new RateLimiter({
  maxRequests: 60,
  windowMs: 60 * 1000,
  endpoint: 'nfl_fantasy_rankings',
});

export default async function handler(req, res) {
  return withErrorHandling(req, res, async (req, res, logger) => {
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
        { retryAfter: Math.ceil(rateLimitResult.retryAfterMs / 1000) },
        res.getHeader('X-Request-ID')
      );
      return res.status(errorResponse.statusCode).json({ error: errorResponse.body.message });
    }
    
    logger.info('Fetching fantasy rankings', {
      component: 'nfl-api',
      operation: 'fantasy-rankings',
      query: req.query,
    });
    const { position, limit = '100', refresh } = req.query;
    const forceRefresh = refresh === 'true';
    
    const data = await getFantasyPlayers(apiKey, {
      position,
      limit: parseInt(limit),
      forceRefresh,
    });
    
    const response = createSuccessResponse({
      ok: true,
      count: data.length,
      data,
    }, 200, logger);
    
    return res.status(response.statusCode).json(response.body);
  });
}

