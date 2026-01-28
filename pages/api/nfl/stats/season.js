/**
 * NFL Player Season Stats API
 * 
 * GET /api/nfl/stats/season
 * Query params:
 *   - season: NFL season year (default: current year)
 *   - position: Filter by position (QB, RB, WR, TE)
 *   - team: Filter by team abbreviation
 *   - limit: Max results (default: 50)
 *   - sort: Sort by field (ppr, half, standard, yards, tds)
 *   - refresh: Force cache refresh (true/false)
 * 
 * Returns cumulative season stats for all players.
 * Cache: 6 hours
 */

import { getPlayerSeasonStats } from '../../../../lib/sportsdataio';
import { transformPlayerStats, FANTASY_POSITIONS } from '../../../../lib/playerModel';
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

// Rate limiter for stats API (60 per minute)
const rateLimiter = new RateLimiter({
  maxRequests: 60,
  windowMs: 60 * 1000,
  endpoint: 'nfl_stats_season',
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
    
    logger.info('Fetching season stats', {
      component: 'nfl-api',
      operation: 'season-stats',
      query: req.query,
    });
    const { season, position, team, limit = '50', sort = 'ppr', refresh } = req.query;
    const seasonYear = parseInt(season) || new Date().getFullYear();
    const forceRefresh = refresh === 'true';
    
    let stats = await getPlayerSeasonStats(apiKey, seasonYear, forceRefresh);
    
    // Filter to fantasy-relevant positions by default
    stats = stats.filter(p => FANTASY_POSITIONS.includes(p.Position));
    
    // Filter by position
    if (position) {
      const positions = position.toUpperCase().split(',');
      stats = stats.filter(p => positions.includes(p.Position));
    }
    
    // Filter by team
    if (team) {
      stats = stats.filter(p => p.Team === team.toUpperCase());
    }
    
    // Sort
    const sortField = {
      ppr: 'FantasyPointsPPR',
      half: 'FantasyPointsHalfPPR',
      standard: 'FantasyPoints',
      yards: (p) => (p.PassingYards || 0) + (p.RushingYards || 0) + (p.ReceivingYards || 0),
      tds: (p) => (p.PassingTouchdowns || 0) + (p.RushingTouchdowns || 0) + (p.ReceivingTouchdowns || 0),
      receptions: 'Receptions',
    }[sort] || 'FantasyPointsPPR';
    
    if (typeof sortField === 'function') {
      stats.sort((a, b) => sortField(b) - sortField(a));
    } else {
      stats.sort((a, b) => (b[sortField] || 0) - (a[sortField] || 0));
    }
    
    // Limit and transform
    const limited = stats.slice(0, parseInt(limit));
    const transformed = limited.map(transformPlayerStats);
    
    const response = createSuccessResponse({
      ok: true,
      season: seasonYear,
      count: transformed.length,
      total: stats.length,
      data: transformed,
    }, 200, logger);
    
    return res.status(response.statusCode).json(response.body);
  });
}

