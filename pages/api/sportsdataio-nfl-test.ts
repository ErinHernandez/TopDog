/**
 * SportsDataIO NFL Test API
 * 
 * GET /api/sportsdataio-nfl-test
 * 
 * Test endpoint for SportsDataIO NFL API integration.
 * Returns player season projection stats sorted by fantasy points.
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { 
  withErrorHandling, 
  validateMethod, 
  requireEnvVar,
  createSuccessResponse,
  createErrorResponse,
  ErrorType,
} from '../../lib/apiErrorHandler';

// ============================================================================
// TYPES
// ============================================================================

export interface SportsDataIOPlayer {
  FantasyPointsPPR?: number;
  [key: string]: unknown;
}

export interface SportsDataIOTestResponse {
  season: number;
  playerCount: number;
  sample: SportsDataIOPlayer[];
  allPlayers: SportsDataIOPlayer[];
  ok?: boolean;
  error?: {
    type: string;
    message: string;
    details?: string;
    requestId?: string;
    timestamp?: string;
  };
}

// ============================================================================
// HANDLER
// ============================================================================

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SportsDataIOTestResponse>
): Promise<unknown> {
  return withErrorHandling(req, res, async (req, res, logger): Promise<unknown> => {
    validateMethod(req, ['GET'], logger);
    const apiKey = requireEnvVar('SPORTSDATAIO_API_KEY', logger);

    // Player Season Projection Stats endpoint
    const season = new Date().getFullYear(); // e.g., 2025
    const url = `https://api.sportsdata.io/v3/nfl/projections/json/PlayerSeasonProjectionStats/${season}?key=${apiKey}`;

    logger.info('Testing SportsDataIO API', { season });

    const response = await fetch(url);

    if (!response.ok) {
      const text = await response.text();
      const error = createErrorResponse(
        ErrorType.EXTERNAL_API, 
        `SportsDataIO request failed: ${response.status}`, 
        { status: response.status }, 
        res.getHeader('X-Request-ID') as string | undefined
      );
      return res.status(error.statusCode).json({ 
        ...error.body, 
        details: text,
        season,
        playerCount: 0,
        sample: [],
        allPlayers: [],
      } as SportsDataIOTestResponse);
    }

    const data = await response.json() as SportsDataIOPlayer[];

    // Sort by projected fantasy points (descending) and return top players
    const sorted = Array.isArray(data) 
      ? data.sort((a, b) => (b.FantasyPointsPPR || 0) - (a.FantasyPointsPPR || 0))
      : [];

    const successResponse = createSuccessResponse({
      season,
      playerCount: sorted.length,
      sample: sorted.slice(0, 10), // Top 10 projected players
      allPlayers: sorted, // Full list for further use
    }, 200, logger);

    return res.status(successResponse.statusCode).json(successResponse.body.data as SportsDataIOTestResponse);
  });
}
