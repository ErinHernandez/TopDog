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

import type { NextApiRequest, NextApiResponse } from 'next';

import { 
  withErrorHandling, 
  validateMethod, 
  validateQueryParams,
  requireEnvVar,
  createSuccessResponse,
  createErrorResponse,
  ErrorType 
} from '../../../../lib/apiErrorHandler';
import { RateLimiter } from '../../../../lib/rateLimiter';
import { getPlayerStatsByName } from '../../../../lib/sportsdataio';
import { logger } from '../../../../lib/structuredLogger';

// ============================================================================
// TYPES
// ============================================================================

export interface PlayerStatsResponse {
  ok: boolean;
  season: number;
  data: {
    [key: string]: unknown;
  };
  error?: string;
}

// ============================================================================
// RATE LIMITER
// ============================================================================

// Rate limiter (60 per minute)
const rateLimiter = new RateLimiter({
  maxRequests: 60,
  windowMs: 60 * 1000,
  endpoint: 'nfl_stats_player',
});

// ============================================================================
// HANDLER
// ============================================================================

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PlayerStatsResponse>
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
      return res.status(errorResponse.statusCode).json({ error: errorResponse.body.error.message, ok: false, season: 0, data: {} } as unknown as PlayerStatsResponse);
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
    
    const seasonYear = season ? parseInt(season as string, 10) : new Date().getFullYear();
    const forceRefresh = refresh === 'true';
    
    const stats = await getPlayerStatsByName(apiKey, name as string, seasonYear, forceRefresh);
    
    if (!stats) {
      const errorResponse = createErrorResponse(
        ErrorType.NOT_FOUND,
        `Player "${name}" not found in ${seasonYear} stats`,
        { playerName: name, season: seasonYear },
        res.getHeader('X-Request-ID') as string | undefined
      );
      return res.status(errorResponse.statusCode).json({
        ok: false,
        error: errorResponse.body.error.message,
        season: seasonYear,
        data: {}
      } as PlayerStatsResponse);
    }
    
    const response = createSuccessResponse({
      ok: true,
      season: seasonYear,
      data: stats,
    }, 200, logger);
    
    return res.status(response.statusCode).json(response.body.data as PlayerStatsResponse);
  });
}
