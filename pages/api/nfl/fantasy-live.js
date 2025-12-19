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

import { getLiveFantasyScores, getCurrentWeek } from '../../../lib/sportsdataio';
import { 
  withErrorHandling, 
  validateMethod, 
  requireEnvVar,
  createSuccessResponse,
} from '../../../lib/apiErrorHandler';

export default async function handler(req, res) {
  return withErrorHandling(req, res, async (req, res, logger) => {
    // Validate HTTP method
    validateMethod(req, ['GET'], logger);

    // Check required environment variables
    const apiKey = requireEnvVar('SPORTSDATAIO_API_KEY', logger);

    const { season, week, position, team, limit = '50' } = req.query;
    
    logger.info('Fetching live fantasy scores', {
      season: season || 'default',
      week: week || 'default',
      position,
      team,
      limit,
    });
    
    // Get current week if not specified
    let seasonYear = parseInt(season);
    let weekNum = parseInt(week);
    
    if (!seasonYear || !weekNum) {
      logger.debug('Week/season not provided, fetching current week');
      const current = await getCurrentWeek(apiKey);
      if (current) {
        seasonYear = seasonYear || current.season;
        weekNum = weekNum || current.week;
        logger.debug('Using current week from API', { season: seasonYear, week: weekNum });
      } else {
        logger.warn('No current NFL week available');
        const response = createSuccessResponse({
          message: 'No current NFL week',
          data: [],
        }, 200, logger);
        return res.status(response.statusCode).json(response.body);
      }
    }
    
    let stats = await getLiveFantasyScores(apiKey, seasonYear, weekNum);
    logger.debug('Live fantasy scores fetched', { count: stats.length });
    
    // Filter by position
    if (position) {
      const positions = position.toUpperCase().split(',');
      const beforeCount = stats.length;
      stats = stats.filter(p => positions.includes(p.position));
      logger.debug('Filtered by position', { 
        positions, 
        before: beforeCount, 
        after: stats.length 
      });
    }
    
    // Filter by team
    if (team) {
      const beforeCount = stats.length;
      stats = stats.filter(p => p.team === team.toUpperCase());
      logger.debug('Filtered by team', { 
        team: team.toUpperCase(), 
        before: beforeCount, 
        after: stats.length 
      });
    }
    
    // Limit results
    const limitNum = parseInt(limit);
    stats = stats.slice(0, limitNum);
    
    const response = createSuccessResponse({
      season: seasonYear,
      week: weekNum,
      count: stats.length,
      data: stats,
    }, 200, logger);
    
    return res.status(response.statusCode).json(response.body);
  });
}

