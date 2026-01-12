/**
 * NFL Player Weekly Stats API
 * 
 * GET /api/nfl/stats/weekly
 * Query params:
 *   - season: NFL season year (default: current year)
 *   - week: Week number (required)
 *   - position: Filter by position (QB, RB, WR, TE)
 *   - team: Filter by team abbreviation
 *   - limit: Max results (default: 50)
 *   - refresh: Force cache refresh (true/false)
 * 
 * Returns player stats for a specific week.
 * Cache: 1 hour
 */

import { getWeeklyFantasyStats, getCurrentWeek } from '../../../../lib/sportsdataio';
import { RateLimiter } from '../../../../lib/rateLimiter';
import { logger } from '../../../../lib/structuredLogger.js';
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
  endpoint: 'nfl_stats_weekly',
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
        res.getHeader('X-Request-ID') as string
      );
      return res.status(errorResponse.statusCode).json({ error: errorResponse.body.message });
    }
    
    logger.info('Fetching weekly stats', {
      component: 'nfl-api',
      operation: 'weekly-stats',
      query: req.query,
    });
    const { season, week, position, team, limit = '50', refresh } = req.query;
    const forceRefresh = refresh === 'true';
    
    // Get current week if not specified
    let seasonYear = parseInt(season);
    let weekNum = parseInt(week);
    
    if (!seasonYear || !weekNum) {
      const current = await getCurrentWeek(apiKey);
      if (current) {
        seasonYear = seasonYear || current.season;
        weekNum = weekNum || current.week;
      } else {
        return res.status(400).json({ error: 'Week number required' });
      }
    }
    
    let stats = await getWeeklyFantasyStats(apiKey, seasonYear, weekNum, {
      position,
      limit: parseInt(limit),
    });
    
    // Filter by team
    if (team) {
      stats = stats.filter(p => p.team === team.toUpperCase());
    }
    
    const response = createSuccessResponse({
      ok: true,
      season: seasonYear,
      week: weekNum,
      count: stats.length,
      data: stats,
    }, 200, logger);
    
    return res.status(response.statusCode).json(response.body);
  });
}

