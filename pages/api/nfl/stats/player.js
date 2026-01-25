/**
 * NFL Single Player Stats API
 * 
 * GET /api/nfl/stats/player
 * Query params:
 *   - name: Player name (required)
 *   - season: NFL season year (default: current year)
 *   - refresh: Force cache refresh (true/false)
 * 
 * Returns season stats for a specific player.
 */

import { getPlayerStatsByName } from '../../../../lib/sportsdataio';
import { RateLimiter } from '../../../../lib/rateLimiter';
import { logger } from '../../../../lib/structuredLogger';
import { 
  withErrorHandling, 
  validateMethod, 
  validateQueryParams,
  requireEnvVar,
  createSuccessResponse,
  createErrorResponse,
  ErrorType 
} from '../../../../lib/apiErrorHandler.js';

// Rate limiter (60 per minute)
const rateLimiter = new RateLimiter({
  maxRequests: 60,
  windowMs: 60 * 1000,
  endpoint: 'nfl_stats_player',
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
    
    // Validate required query parameters
    validateQueryParams(req, ['name'], logger);
    
    const { name, season, refresh } = req.query;
    
    logger.info('Fetching player stats', {
      component: 'nfl-api',
      operation: 'player-stats',
      playerName: name,
      season,
    });
    
    const seasonYear = parseInt(season) || new Date().getFullYear();
    const forceRefresh = refresh === 'true';
    
    const stats = await getPlayerStatsByName(apiKey, name, seasonYear, forceRefresh);
    
    if (!stats) {
      const errorResponse = createErrorResponse(
        ErrorType.NOT_FOUND,
        `Player "${name}" not found in ${seasonYear} stats`,
        { playerName: name, season: seasonYear },
        res.getHeader('X-Request-ID')
      );
      return res.status(errorResponse.statusCode).json({
        ok: false,
        error: errorResponse.body.message,
      });
    }
    
    const response = createSuccessResponse({
      ok: true,
      season: seasonYear,
      data: stats,
    }, 200, logger);
    
    return res.status(response.statusCode).json(response.body);
  });
}

