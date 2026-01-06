/**
 * NFL Bye Weeks API
 * 
 * GET /api/nfl/bye-weeks
 * Query params:
 *   - season: NFL season year (default: current year)
 *   - week: Filter by specific bye week
 *   - refresh: Force cache refresh (true/false)
 */

import { getByeWeeks } from '../../../lib/sportsdataio';
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

    const { season, week, refresh } = req.query;
    const seasonYear = parseInt(season) || new Date().getFullYear();
    const forceRefresh = refresh === 'true';
    
    logger.info('Fetching bye weeks', { season: seasonYear, week, refresh: forceRefresh });
    
    let byes = await getByeWeeks(apiKey, seasonYear, forceRefresh);
    
    // Filter by week
    if (week) {
      byes = byes.filter(b => b.Week === parseInt(week));
    }
    
    // Sort by week then team
    byes.sort((a, b) => {
      if (a.Week !== b.Week) return a.Week - b.Week;
      return a.Team.localeCompare(b.Team);
    });
    
    // Group by week for easier consumption
    const byWeek = {};
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
    
    return res.status(response.statusCode).json(response.body);
  });
}

