/**
 * NFL Live Fantasy Scores API
 * 
 * GET /api/nfl/fantasy-live
 * Query params:
 *   - season: NFL season year (default: current)
 *   - week: Week number (default: current week)
 *   - position: Filter by position (QB, RB, WR, TE)
 *   - team: Filter by team
 *   - limit: Max results (default: 50)
 * 
 * Returns live fantasy scores for players during games.
 * Sorted by PPR fantasy points (highest first).
 */

import type { NextApiRequest, NextApiResponse } from 'next';

import { 
  withErrorHandling, 
  validateMethod, 
  requireEnvVar,
  createSuccessResponse,
} from '../../../lib/apiErrorHandler';
import { getLiveFantasyScores, getCurrentWeek } from '../../../lib/sportsdataio';

// ============================================================================
// TYPES
// ============================================================================

export interface LiveFantasyStat {
  position?: string;
  team?: string;
  [key: string]: unknown;
}

export interface LiveFantasyScoresResponse {
  message?: string;
  season: number;
  week: number;
  count: number;
  data: LiveFantasyStat[];
}

// ============================================================================
// HANDLER
// ============================================================================

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<LiveFantasyScoresResponse>
): Promise<unknown> {
  return withErrorHandling(req, res, async (req, res, logger): Promise<unknown> => {
    // Validate HTTP method
    validateMethod(req, ['GET'], logger);

    // Check required environment variables
    const apiKey = requireEnvVar('SPORTSDATAIO_API_KEY', logger);

    const { season, week, position, team, limit = '50' } = req.query;
    
    logger.info('Fetching live fantasy scores', {
      season: (season as string) || 'default',
      week: (week as string) || 'default',
      position: position as string | undefined,
      team: team as string | undefined,
      limit: limit as string | undefined,
    });
    
    // Get current week if not specified
    let seasonYear = season ? parseInt(season as string, 10) : undefined;
    let weekNum = week ? parseInt(week as string, 10) : undefined;
    
    if (!seasonYear || !weekNum) {
      logger.debug('Week/season not provided, fetching current week');
      const current = await getCurrentWeek(apiKey);
      if (current) {
        // getCurrentWeek returns a number (week number), not an object
        // We need to get season separately or use a different approach
        // For now, use the provided values or defaults
        if (!seasonYear) {
          // Default to current year if not provided
          seasonYear = new Date().getFullYear();
        }
        if (!weekNum) {
          weekNum = current;
        }
        logger.debug('Using current week from API', { season: seasonYear, week: weekNum });
      } else {
        logger.warn('No current NFL week available');
        const response = createSuccessResponse({
          message: 'No current NFL week',
          data: [],
        }, 200, logger);
        return res.status(response.statusCode).json({
          message: 'No current NFL week',
          season: 0,
          week: 0,
          count: 0,
          data: []
        } as LiveFantasyScoresResponse);
      }
    }
    
    let stats = await getLiveFantasyScores(apiKey, seasonYear!, weekNum!) as unknown as LiveFantasyStat[];
    logger.debug('Live fantasy scores fetched', { count: stats.length });
    
    // Filter by position
    if (position) {
      const positions = (position as string).toUpperCase().split(',');
      const beforeCount = stats.length;
      stats = stats.filter(p => p.position && positions.includes(p.position));
      logger.debug('Filtered by position', { 
        positions, 
        before: beforeCount, 
        after: stats.length 
      });
    }
    
    // Filter by team
    if (team) {
      const beforeCount = stats.length;
      const teamUpper = (team as string).toUpperCase();
      stats = stats.filter(p => p.team === teamUpper);
      logger.debug('Filtered by team', { 
        team: teamUpper, 
        before: beforeCount, 
        after: stats.length 
      });
    }
    
    // Limit results
    const limitNum = parseInt(limit as string, 10);
    stats = stats.slice(0, limitNum);
    
    const response = createSuccessResponse({
      season: seasonYear!,
      week: weekNum!,
      count: stats.length,
      data: stats,
    }, 200, logger);
    
    return res.status(response.statusCode).json(response.body.data as LiveFantasyScoresResponse);
  });
}
