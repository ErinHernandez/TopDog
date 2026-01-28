/**
 * NFL Fantasy ADP (Average Draft Position) API
 * 
 * GET /api/nfl/fantasy/adp
 * Query params:
 *   - position: Filter by position (QB, RB, WR, TE)
 *   - limit: Max results (default: 100)
 *   - scoring: Scoring type (ppr, standard) - default: ppr
 *   - name: Get ADP for specific player
 *   - refresh: Force cache refresh (true/false)
 * 
 * Returns ADP rankings for fantasy players.
 * Cache: 6 hours
 */

import { getADP, getPlayerADP, getADPByPosition, transformADP } from '../../../../lib/sportsdataio';
import { RateLimiter } from '../../../../lib/rateLimiter';
import { logger } from '../../../../lib/structuredLogger';
import { 
  withErrorHandling, 
  validateMethod, 
  requireEnvVar,
  createSuccessResponse,
  createErrorResponse,
  ErrorType 
} from '../../../../lib/apiErrorHandler';

// Rate limiter (60 per minute)
const rateLimiter = new RateLimiter({
  maxRequests: 60,
  windowMs: 60 * 1000,
  endpoint: 'nfl_fantasy_adp',
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
    
    logger.info('Fetching fantasy ADP', {
      component: 'nfl-api',
      operation: 'fantasy-adp',
      query: req.query,
    });
    const { position, limit = '100', scoring = 'ppr', name, refresh } = req.query;
    const forceRefresh = refresh === 'true';
    
    // Single player lookup
    if (name) {
      const player = await getPlayerADP(apiKey, name, forceRefresh);
      
      if (!player) {
        const errorResponse = createErrorResponse(
          ErrorType.NOT_FOUND,
          `Player "${name}" not found in ADP data`,
          { playerName: name },
          res.getHeader('X-Request-ID')
        );
        return res.status(errorResponse.statusCode).json({
          ok: false,
          error: errorResponse.body.message,
        });
      }
      
      const response = createSuccessResponse({
        ok: true,
        data: player,
      }, 200, logger);
      
      return res.status(response.statusCode).json(response.body);
    }
    
    // Get ADP by position
    const data = await getADPByPosition(apiKey, position, {
      limit: parseInt(limit),
      scoringType: scoring,
    });
    
    const response = createSuccessResponse({
      ok: true,
      scoringType: scoring,
      count: data.length,
      data,
    }, 200, logger);
    
    return res.status(response.statusCode).json(response.body);
  });
}

