/**
 * NFL Bye Weeks API
 * 
 * GET /api/nfl/bye-weeks
 * Query params:
 *   - season: NFL season year (default: current year)
 *   - week: Filter by specific bye week
 *   - refresh: Force cache refresh (true/false)
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { getByeWeeks } from '../../../lib/sportsdataio';
import { 
  withErrorHandling, 
  validateMethod, 
  requireEnvVar,
  createSuccessResponse,
} from '../../../lib/apiErrorHandler';

// ============================================================================
// TYPES
// ============================================================================

export interface ByeWeek {
  Week: number;
  Team: string;
  [key: string]: unknown;
}

export interface ByeWeeksResponse {
  season: number;
  count: number;
  byWeek: Record<number, string[]>;
  data: Array<{
    team: string;
    week: number;
  }>;
}

// ============================================================================
// HANDLER
// ============================================================================

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ByeWeeksResponse>
): Promise<unknown> {
  return withErrorHandling(req, res, async (req, res, logger): Promise<unknown> => {
    validateMethod(req, ['GET'], logger);
    const apiKey = requireEnvVar('SPORTSDATAIO_API_KEY', logger);

    const { season, week, refresh } = req.query;
    const seasonYear = season ? parseInt(season as string, 10) : new Date().getFullYear();
    const forceRefresh = refresh === 'true';
    
    logger.info('Fetching bye weeks', { season: seasonYear, week, refresh: forceRefresh });
    
    let byes = await getByeWeeks(apiKey, seasonYear, forceRefresh) as ByeWeek[];
    
    // Filter by week
    if (week) {
      const weekNum = parseInt(week as string, 10);
      byes = byes.filter(b => b.Week === weekNum);
    }
    
    // Sort by week then team
    byes.sort((a, b) => {
      if (a.Week !== b.Week) return a.Week - b.Week;
      return a.Team.localeCompare(b.Team);
    });
    
    // Group by week for easier consumption
    const byWeek: Record<number, string[]> = {};
    byes.forEach(b => {
      if (!byWeek[b.Week]) byWeek[b.Week] = [];
      byWeek[b.Week].push(b.Team);
    });
    
    const response = createSuccessResponse({
      season: seasonYear,
      count: byes.length,
      byWeek,
      data: byes.map(b => ({ team: b.Team, week: b.Week })),
    }, 200, logger);
    
    return res.status(response.statusCode).json(response.body.data as ByeWeeksResponse);
  });
}
