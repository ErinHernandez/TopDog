/**
 * NFL Player Red Zone Stats API
 * 
 * GET /api/nfl/stats/redzone
 * Query params:
 *   - season: NFL season year (default: current year)
 *   - position: Filter by position (QB, RB, WR, TE)
 *   - team: Filter by team abbreviation
 *   - limit: Max results (default: 50)
 *   - refresh: Force cache refresh (true/false)
 * 
 * Returns red zone stats (inside the 20) for players.
 * Cache: 6 hours
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { getPlayerRedZoneStats } from '../../../../lib/sportsdataio';
import { POSITIONS } from '../../../../lib/constants/positions';
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

export interface RedZoneStat {
  PlayerID?: number;
  Name?: string;
  Team?: string;
  Position?: string;
  Played?: number;
  RushingAttempts?: number;
  RushingTouchdowns?: number;
  RushingYards?: number;
  ReceivingTargets?: number;
  Receptions?: number;
  ReceivingTouchdowns?: number;
  ReceivingYards?: number;
  PassingAttempts?: number;
  PassingCompletions?: number;
  PassingTouchdowns?: number;
  PassingInterceptions?: number;
  FantasyPoints?: number;
  FantasyPointsPPR?: number;
  [key: string]: unknown;
}

export interface TransformedRedZoneStat {
  playerId: number | undefined;
  name: string | undefined;
  team: string | undefined;
  position: string | undefined;
  games: number;
  rushAttempts: number;
  rushTouchdowns: number;
  rushYards: number;
  targets: number;
  receptions: number;
  recTouchdowns: number;
  recYards: number;
  passAttempts: number;
  passCompletions: number;
  passTouchdowns: number;
  passInterceptions: number;
  totalOpportunities: number;
  totalTouchdowns: number;
  fantasyPoints: number;
  fantasyPointsPPR: number;
}

export interface RedZoneStatsResponse {
  ok: boolean;
  season: number;
  count: number;
  data: TransformedRedZoneStat[];
}

// ============================================================================
// RATE LIMITER
// ============================================================================

// Rate limiter (60 per minute)
const rateLimiter = new RateLimiter({
  maxRequests: 60,
  windowMs: 60 * 1000,
  endpoint: 'nfl_stats_redzone',
});

// ============================================================================
// HANDLER
// ============================================================================

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<RedZoneStatsResponse>
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
      return res.status(errorResponse.statusCode).json({ error: errorResponse.body.error.message, ok: false, season: 0, count: 0, data: [] } as RedZoneStatsResponse);
    }
    
    logger.info('Fetching red zone stats', {
      component: 'nfl-api',
      operation: 'redzone-stats',
      query: req.query,
    });
    const { season, position, team, limit = '50', refresh } = req.query;
    const seasonYear = season ? parseInt(season as string, 10) : new Date().getFullYear();
    const forceRefresh = refresh === 'true';
    
    let stats = await getPlayerRedZoneStats(apiKey, seasonYear, forceRefresh) as RedZoneStat[];
    
    // Filter to fantasy-relevant positions
    stats = stats.filter(p => p.Position && POSITIONS.includes(p.Position));
    
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
    
    // Sort by red zone opportunities (touches + targets)
    stats.sort((a, b) => {
      const aOpps = (a.RushingAttempts || 0) + (a.ReceivingTargets || 0);
      const bOpps = (b.RushingAttempts || 0) + (b.ReceivingTargets || 0);
      return bOpps - aOpps;
    });
    
    // Transform and limit
    const limitNum = parseInt(limit as string, 10);
    const limited = stats.slice(0, limitNum);
    const transformed: TransformedRedZoneStat[] = limited.map(p => ({
      playerId: p.PlayerID,
      name: p.Name,
      team: p.Team,
      position: p.Position,
      games: p.Played || 0,
      
      // Red Zone Rushing
      rushAttempts: p.RushingAttempts || 0,
      rushTouchdowns: p.RushingTouchdowns || 0,
      rushYards: p.RushingYards || 0,
      
      // Red Zone Receiving
      targets: p.ReceivingTargets || 0,
      receptions: p.Receptions || 0,
      recTouchdowns: p.ReceivingTouchdowns || 0,
      recYards: p.ReceivingYards || 0,
      
      // Red Zone Passing
      passAttempts: p.PassingAttempts || 0,
      passCompletions: p.PassingCompletions || 0,
      passTouchdowns: p.PassingTouchdowns || 0,
      passInterceptions: p.PassingInterceptions || 0,
      
      // Totals
      totalOpportunities: (p.RushingAttempts || 0) + (p.ReceivingTargets || 0),
      totalTouchdowns: (p.RushingTouchdowns || 0) + (p.ReceivingTouchdowns || 0),
      
      // Fantasy Points (red zone only)
      fantasyPoints: p.FantasyPoints || 0,
      fantasyPointsPPR: p.FantasyPointsPPR || 0,
    }));
    
    const response = createSuccessResponse({
      ok: true,
      season: seasonYear,
      count: transformed.length,
      data: transformed,
    }, 200, logger);
    
    return res.status(response.statusCode).json(response.body.data as RedZoneStatsResponse);
  });
}
