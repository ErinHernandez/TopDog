/**
 * NFL Player Headshots API - SportsDataIO
 * 
 * GET /api/nfl/headshots-sportsdataio
 * 
 * Returns SportsDataIO headshot URLs mapped by player name.
 * This provides actual headshot images, not placeholder shadows.
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { getPlayersMap } from '../../../lib/sportsdataio';
import { 
  withErrorHandling, 
  validateMethod,
  requireEnvVar,
  ErrorType,
  createSuccessResponse,
} from '../../../lib/apiErrorHandler';

// ============================================================================
// TYPES
// ============================================================================

export interface HeadshotsMapResponse {
  headshotsMap: Record<string, string>;
  count: number;
  ok?: boolean;
  error?: {
    type: string;
    message: string;
    details: {
      error: string;
    };
    requestId: string | undefined;
    timestamp: string;
  };
}

// ============================================================================
// HANDLER
// ============================================================================

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<HeadshotsMapResponse>
): Promise<unknown> {
  return withErrorHandling(req, res, async (req, res, logger): Promise<unknown> => {
    // Validate HTTP method
    validateMethod(req, ['GET'], logger);

    // Check required environment variables
    const apiKey = requireEnvVar('SPORTSDATAIO_API_KEY', logger);

    logger.info('Fetching SportsDataIO headshots');

    try {
      // Fetch players from SportsDataIO (includes PhotoUrl)
      const playersMap = await getPlayersMap(apiKey, false);
      
      // Convert Map to plain object by player name for easy lookup
      const headshotsMap: Record<string, string> = {};
      
      playersMap.forEach((player, playerName) => {
        if (player.name && typeof player.name === 'string' && player.headshotUrl && typeof player.headshotUrl === 'string') {
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
      
      return res.status(response.statusCode).json(response.body.data as HeadshotsMapResponse);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Error fetching SportsDataIO headshots', error instanceof Error ? error : new Error(errorMessage));
      return res.status(500).json({
        ok: false,
        error: {
          type: ErrorType.INTERNAL,
          message: 'Failed to fetch SportsDataIO headshots',
          details: { error: errorMessage },
          requestId: res.getHeader('X-Request-ID') as string | undefined,
          timestamp: new Date().toISOString(),
        },
      } as HeadshotsMapResponse);
    }
  });
}
