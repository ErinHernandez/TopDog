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

import { getSchedule } from '../../../lib/sportsdataio';
import { 
  withErrorHandling, 
  validateMethod, 
  requireEnvVar,
  createSuccessResponse,
} from '../../../lib/apiErrorHandler';

export default async function handler(req, res) {
  return withErrorHandling(req, res, async (req, res, logger) => {
    validateMethod(req, ['GET'], logger);
    const apiKey = requireEnvVar('SPORTSDATAIO_API_KEY', logger);

    const { season, week, team, refresh } = req.query;
    const seasonYear = parseInt(season) || new Date().getFullYear();
    const forceRefresh = refresh === 'true';
    
    logger.info('Fetching schedule', { season: seasonYear, week, team, refresh: forceRefresh });
    
    let schedule = await getSchedule(apiKey, seasonYear, forceRefresh);
    
    // Filter by week
    if (week) {
      schedule = schedule.filter(g => g.Week === parseInt(week));
    }
    
    // Filter by team
    if (team) {
      const teamUpper = team.toUpperCase();
      schedule = schedule.filter(g => 
        g.HomeTeam === teamUpper || g.AwayTeam === teamUpper
      );
    }
    
    // Sort by date
    schedule.sort((a, b) => new Date(a.Date) - new Date(b.Date));
    
    const response = createSuccessResponse({
      season: seasonYear,
      count: schedule.length,
      data: schedule,
    }, 200, logger);
    
    return res.status(response.statusCode).json(response.body);
  });
}

