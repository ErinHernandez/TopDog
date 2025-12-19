/**
 * NFL Live & Final Scores API
 * 
 * GET /api/nfl/scores
 * Query params:
 *   - season: NFL season year (default: current)
 *   - week: Week number (default: current week)
 *   - status: Filter by status (live, final, scheduled, all)
 *   - team: Filter by team abbreviation
 *   - refresh: Force cache refresh (true/false)
 * 
 * Returns game scores with live game state (quarter, time, possession, etc.)
 * Cache: 10 seconds during live games
 */

import { getWeekScores, getCurrentWeek } from '../../../lib/sportsdataio';
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

    const { season, week, status, team, refresh } = req.query;
    const forceRefresh = refresh === 'true';
    
    logger.info('Fetching scores', {
      season: season || 'default',
      week: week || 'default',
      status,
      team,
      refresh: forceRefresh,
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
        seasonYear = seasonYear || new Date().getFullYear();
        weekNum = weekNum || 1;
        logger.warn('Could not get current week, using defaults', { season: seasonYear, week: weekNum });
      }
    }
    
    let scores = await getWeekScores(apiKey, seasonYear, weekNum, forceRefresh);
    logger.debug('Scores fetched', { count: scores.length });
    
    // Filter by status
    if (status) {
      const statusLower = status.toLowerCase();
      const beforeCount = scores.length;
      if (statusLower === 'live') {
        scores = scores.filter(g => g.isLive);
      } else if (statusLower === 'final') {
        scores = scores.filter(g => g.isFinal);
      } else if (statusLower === 'scheduled') {
        scores = scores.filter(g => g.isScheduled);
      }
      logger.debug('Filtered by status', { 
        status: statusLower, 
        before: beforeCount, 
        after: scores.length 
      });
    }
    
    // Filter by team
    if (team) {
      const teamUpper = team.toUpperCase();
      const beforeCount = scores.length;
      scores = scores.filter(g => 
        g.homeTeam === teamUpper || g.awayTeam === teamUpper
      );
      logger.debug('Filtered by team', { 
        team: teamUpper, 
        before: beforeCount, 
        after: scores.length 
      });
    }
    
    // Sort: live games first, then by date
    scores.sort((a, b) => {
      if (a.isLive && !b.isLive) return -1;
      if (!a.isLive && b.isLive) return 1;
      return new Date(a.dateTime) - new Date(b.dateTime);
    });
    
    // Summary stats
    const liveCount = scores.filter(g => g.isLive).length;
    const finalCount = scores.filter(g => g.isFinal).length;
    const scheduledCount = scores.filter(g => g.isScheduled).length;
    
    const response = createSuccessResponse({
      season: seasonYear,
      week: weekNum,
      summary: {
        total: scores.length,
        live: liveCount,
        final: finalCount,
        scheduled: scheduledCount,
      },
      data: scores,
    }, 200, logger);
    
    return res.status(response.statusCode).json(response.body);
  });
}

