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

import type { NextApiRequest, NextApiResponse } from 'next';
import { getWeeklyFantasyStats, getTimeframes } from '../../../../lib/sportsdataio';
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

// ============================================================================
// TYPES
// ============================================================================

export interface WeeklyStat {
  team?: string;
  [key: string]: unknown;
}

export interface WeeklyStatsResponse {
  ok: boolean;
  season: number;
  week: number;
  count: number;
  data: WeeklyStat[];
}

// ============================================================================
// RATE LIMITER
// ============================================================================

// Rate limiter (60 per minute)
const rateLimiter = new RateLimiter({
  maxRequests: 60,
  windowMs: 60 * 1000,
  endpoint: 'nfl_stats_weekly',
});

// ============================================================================
// HANDLER
// ============================================================================

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<WeeklyStatsResponse>
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
      return res.status(errorResponse.statusCode).json({ error: errorResponse.body.error.message } as unknown as WeeklyStatsResponse);
    }
    
    logger.info('Fetching weekly stats', {
      component: 'nfl-api',
      operation: 'weekly-stats',
      query: req.query,
    });
    const { season, week, position, team, limit = '50', refresh } = req.query;
    const forceRefresh = refresh === 'true';
    
    // Get current week if not specified
    let seasonYear = season ? parseInt(season as string, 10) : undefined;
    let weekNum = week ? parseInt(week as string, 10) : undefined;
    
    if (!seasonYear || !weekNum) {
      const timeframes = await getTimeframes(apiKey);
      const current = timeframes.find((tf: { SeasonType: number }) => tf.SeasonType === 1); // Regular season
      if (current) {
        seasonYear = seasonYear || current.Season;
        weekNum = weekNum || current.Week;
      } else {
        return res.status(400).json({ error: 'Week number required' } as unknown as WeeklyStatsResponse);
      }
    }
    let stats = await getWeeklyFantasyStats(apiKey, seasonYear!, weekNum!, forceRefresh) as WeeklyStat[];
    
    // Filter by position
    if (position) {
      const positions = (position as string).toUpperCase().split(',');
      stats = stats.filter((p: WeeklyStat) => p.position && typeof p.position === 'string' && positions.includes(p.position));
    }
    
    // Filter by team
    if (team) {
      const teamUpper = (team as string).toUpperCase();
      stats = stats.filter(p => p.team === teamUpper);
    }
    
    const response = createSuccessResponse({
      ok: true,
      season: seasonYear!,
      week: weekNum!,
      count: stats.length,
      data: stats,
    }, 200, logger);
    
    return res.status(response.statusCode).json(response.body.data as unknown as WeeklyStatsResponse);
  });
}
