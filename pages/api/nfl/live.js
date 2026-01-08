/**
 * NFL Live Games API
 * 
 * GET /api/nfl/live
 * 
 * Returns only games currently in progress with real-time game state.
 * Optimized for live updates during games.
 * Cache: 10 seconds
 */

import { getGamesInProgress, getCurrentWeek } from '../../../lib/sportsdataio';
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

    logger.info('Fetching live games');
    
    // Get current week
    const current = await getCurrentWeek(apiKey);
    
    if (!current) {
      const response = createSuccessResponse({
        message: 'No current NFL week',
        data: [],
      }, 200, logger);
      return res.status(response.statusCode).json(response.body);
    }
    
    const games = await getGamesInProgress(apiKey, current.season, current.week);
    
    const response = createSuccessResponse({
      season: current.season,
      week: current.week,
      weekName: current.name,
      gamesInProgress: games.length,
      data: games,
    }, 200, logger);
    
    return res.status(response.statusCode).json(response.body);
  });
}

