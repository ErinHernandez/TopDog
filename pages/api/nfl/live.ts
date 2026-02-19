/**
 * NFL Live Games API
 * 
 * GET /api/nfl/live
 * 
 * Returns only games currently in progress with real-time game state.
 * Optimized for live updates during games.
 * Cache: 10 seconds
 */

import type { NextApiRequest, NextApiResponse } from 'next';

import { 
  withErrorHandling, 
  validateMethod, 
  requireEnvVar,
  createSuccessResponse,
} from '../../../lib/apiErrorHandler';
import { getGamesInProgress, getTimeframes } from '../../../lib/sportsdataio';

// ============================================================================
// TYPES
// ============================================================================

export interface LiveGamesResponse {
  message?: string;
  season?: number;
  week?: number;
  weekName?: string;
  gamesInProgress?: number;
  data: Array<{
    [key: string]: unknown;
  }>;
}

// ============================================================================
// HANDLER
// ============================================================================

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<LiveGamesResponse>
): Promise<unknown> {
  return withErrorHandling(req, res, async (req, res, logger): Promise<unknown> => {
    validateMethod(req, ['GET'], logger);
    const apiKey = requireEnvVar('SPORTSDATAIO_API_KEY', logger);

    logger.info('Fetching live games');
    
    // Get current week and season
    const timeframes = await getTimeframes(apiKey);
    const current = timeframes.find(tf => tf.SeasonType === 1); // Regular season
    
    if (!current) {
      const response = createSuccessResponse({
        message: 'No current NFL week',
        data: [],
      }, 200, logger);
      return res.status(response.statusCode).json(response.body.data as unknown as LiveGamesResponse);
    }
    
    const season = current.Season;
    const week = current.Week;
    
    const games = await getGamesInProgress(apiKey, season, week);
    
    const response = createSuccessResponse({
      season,
      week,
      weekName: `Week ${week}`,
      gamesInProgress: games.length,
      data: games,
    }, 200, logger);
    
    return res.status(response.statusCode).json(response.body.data as unknown as LiveGamesResponse);
  });
}
