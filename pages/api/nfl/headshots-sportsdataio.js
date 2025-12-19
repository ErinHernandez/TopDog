/**
 * NFL Player Headshots API - SportsDataIO
 * 
 * GET /api/nfl/headshots-sportsdataio
 * 
 * Returns SportsDataIO headshot URLs mapped by player name.
 * This provides actual headshot images, not placeholder shadows.
 */

import { getPlayersMap } from '../../../lib/sportsdataio';
import { 
  withErrorHandling, 
  validateMethod,
  requireEnvVar,
  ErrorType,
  createSuccessResponse,
} from '../../../lib/apiErrorHandler';

export default async function handler(req, res) {
  return withErrorHandling(req, res, async (req, res, logger) => {
    // Validate HTTP method
    validateMethod(req, ['GET'], logger);

    // Check required environment variables
    const apiKey = requireEnvVar('SPORTSDATAIO_API_KEY', logger);

    logger.info('Fetching SportsDataIO headshots');

    try {
      // Fetch players from SportsDataIO (includes PhotoUrl)
      const playersMap = await getPlayersMap(apiKey, false);
      
      // Convert Map to plain object by player name for easy lookup
      const headshotsMap = {};
      
      playersMap.forEach((player, playerName) => {
        if (player.name && player.headshotUrl) {
          // Use player name as key for lookup
          headshotsMap[player.name] = player.headshotUrl;
        }
      });

      logger.info('SportsDataIO headshots fetched successfully', { 
        count: Object.keys(headshotsMap).length
      });

      const response = createSuccessResponse(
        {
          headshotsMap,
          count: Object.keys(headshotsMap).length,
        },
        200,
        logger
      );
      
      return res.status(response.statusCode).json(response.body);
    } catch (error) {
      logger.error('Error fetching SportsDataIO headshots', { error: error.message });
      return res.status(500).json({
        ok: false,
        error: {
          type: ErrorType.INTERNAL,
          message: 'Failed to fetch SportsDataIO headshots',
          details: { error: error.message },
          requestId: res.getHeader('X-Request-ID'),
          timestamp: new Date().toISOString(),
        },
      });
    }
  });
}

