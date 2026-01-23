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

import type { NextApiRequest, NextApiResponse } from 'next';
import { getPlayerSeasonStats } from '../../../../lib/sportsdataio';
import { transformPlayerStats, FANTASY_POSITIONS } from '../../../../lib/playerModel';
import type { SportsDataIOSeasonStats } from '../../../../types/api';
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

export interface PlayerStat {
  Position?: string;
  Team?: string;
  FantasyPointsPPR?: number;
  FantasyPointsHalfPPR?: number;
  FantasyPoints?: number;
  PassingYards?: number;
  RushingYards?: number;
  ReceivingYards?: number;
  PassingTouchdowns?: number;
  RushingTouchdowns?: number;
  ReceivingTouchdowns?: number;
  Receptions?: number;
  [key: string]: unknown;
}

export interface SeasonStatsResponse {
  ok: boolean;
  season: number;
  count: number;
  total: number;
  data: Array<{
    [key: string]: unknown;
  }>;
}

// ============================================================================
// RATE LIMITER
// ============================================================================

// Rate limiter for stats API (60 per minute)
const rateLimiter = new RateLimiter({
  maxRequests: 60,
  windowMs: 60 * 1000,
  endpoint: 'nfl_stats_season',
});

// ============================================================================
// HANDLER
// ============================================================================

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SeasonStatsResponse>
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
      return res.status(errorResponse.statusCode).json({ error: errorResponse.body.error.message } as unknown as SeasonStatsResponse);
    }
    
    logger.info('Fetching season stats', {
      component: 'nfl-api',
      operation: 'season-stats',
      query: req.query,
    });
    const { season, position, team, limit = '50', sort = 'ppr', refresh } = req.query;
    const seasonYear = season ? parseInt(season as string, 10) : new Date().getFullYear();
    const forceRefresh = refresh === 'true';
    
    let stats = await getPlayerSeasonStats(apiKey, seasonYear, forceRefresh) as PlayerStat[];
    
    // Filter to fantasy-relevant positions by default
    stats = stats.filter(p => p.Position && typeof p.Position === 'string' && (FANTASY_POSITIONS as readonly string[]).includes(p.Position));
    
    // Filter by position
    if (position) {
      const positions = (position as string).toUpperCase().split(',');
      stats = stats.filter(p => p.Position && positions.includes(p.Position));
    }
    
    // Filter by team
    if (team) {
      const teamUpper = (team as string).toUpperCase();
      stats = stats.filter(p => p.Team === teamUpper);
    }
    
    // Sort
    const sortField = {
      ppr: 'FantasyPointsPPR',
      half: 'FantasyPointsHalfPPR',
      standard: 'FantasyPoints',
      yards: (p: PlayerStat) => (p.PassingYards || 0) + (p.RushingYards || 0) + (p.ReceivingYards || 0),
      tds: (p: PlayerStat) => (p.PassingTouchdowns || 0) + (p.RushingTouchdowns || 0) + (p.ReceivingTouchdowns || 0),
      receptions: 'Receptions',
    }[sort as string] || 'FantasyPointsPPR';
    
    if (typeof sortField === 'function') {
      stats.sort((a, b) => sortField(b) - sortField(a));
    } else {
      stats.sort((a, b) => ((b[sortField] as number) || 0) - ((a[sortField] as number) || 0));
    }
    
    // Limit and transform
    const limitNum = parseInt(limit as string, 10);
    const limited = stats.slice(0, limitNum);
    const transformed = limited.map((stat: PlayerStat) => transformPlayerStats(stat as unknown as SportsDataIOSeasonStats | null));
    
    const response = createSuccessResponse({
      ok: true,
      season: seasonYear,
      count: transformed.length,
      total: stats.length,
      data: transformed,
    }, 200, logger);
    
    return res.status(response.statusCode).json(response.body.data as unknown as SeasonStatsResponse);
  });
}
