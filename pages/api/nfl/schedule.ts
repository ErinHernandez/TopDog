/**
 * NFL Schedule API
 * 
 * GET /api/nfl/schedule
 * Query params:
 *   - season: NFL season year (default: current year)
 *   - week: Filter by week number
 *   - team: Filter by team abbreviation
 *   - refresh: Force cache refresh (true/false)
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { getSchedule } from '../../../lib/sportsdataio';
import {
  withErrorHandling,
  validateMethod,
  requireEnvVar,
  createSuccessResponse,
} from '../../../lib/apiErrorHandler';
import { setCacheHeaders } from '../../../lib/api/cacheHeaders';

// ============================================================================
// TYPES
// ============================================================================

export interface ScheduleGame {
  Week?: number;
  Date?: string;
  HomeTeam?: string;
  AwayTeam?: string;
  [key: string]: unknown;
}

export interface ScheduleResponse {
  season: number;
  count: number;
  data: ScheduleGame[];
}

// ============================================================================
// HANDLER
// ============================================================================

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ScheduleResponse>
): Promise<unknown> {
  return withErrorHandling(req, res, async (req, res, logger): Promise<unknown> => {
    validateMethod(req, ['GET'], logger);
    const apiKey = requireEnvVar('SPORTSDATAIO_API_KEY', logger);

    const { season, week, team, refresh } = req.query;
    const seasonYear = season ? parseInt(season as string, 10) : new Date().getFullYear();
    const forceRefresh = refresh === 'true';
    
    logger.info('Fetching schedule', { season: seasonYear, week, team, refresh: forceRefresh });
    
    let schedule = await getSchedule(apiKey, seasonYear, forceRefresh) as ScheduleGame[];
    
    // Filter by week
    if (week) {
      const weekNum = parseInt(week as string, 10);
      schedule = schedule.filter(g => g.Week === weekNum);
    }
    
    // Filter by team
    if (team) {
      const teamUpper = (team as string).toUpperCase();
      schedule = schedule.filter(g => 
        g.HomeTeam === teamUpper || g.AwayTeam === teamUpper
      );
    }
    
    // Sort by date
    schedule.sort((a, b) => {
      const aDate = a.Date ? new Date(a.Date).getTime() : 0;
      const bDate = b.Date ? new Date(b.Date).getTime() : 0;
      return aDate - bDate;
    });
    
    // Set cache headers - schedule data changes infrequently
    // Use public-long (1 hour) for general requests, no-cache if refresh=true
    if (forceRefresh) {
      setCacheHeaders(res, 'no-cache');
    } else {
      setCacheHeaders(res, 'public-long');
    }

    const response = createSuccessResponse({
      season: seasonYear,
      count: schedule.length,
      data: schedule,
    }, 200, logger);

    return res.status(response.statusCode).json(response.body.data as ScheduleResponse);
  });
}
