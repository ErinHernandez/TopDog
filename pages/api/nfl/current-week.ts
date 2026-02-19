/**
 * NFL Current Week API
 * 
 * GET /api/nfl/current-week
 * 
 * Returns the current NFL week/season information.
 */

import type { NextApiRequest, NextApiResponse } from 'next';

import { setCacheHeaders } from '../../../lib/api/cacheHeaders';
import {
  withErrorHandling,
  validateMethod,
  requireEnvVar,
  createSuccessResponse,
} from '../../../lib/apiErrorHandler';
import { getCurrentWeek } from '../../../lib/sportsdataio';

// ============================================================================
// TYPES
// ============================================================================

export interface CurrentWeekResponse {
  message?: string;
  data: {
    season?: number;
    week?: number;
    [key: string]: unknown;
  } | null;
}

// ============================================================================
// HANDLER
// ============================================================================

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CurrentWeekResponse>
): Promise<unknown> {
  return withErrorHandling(req, res, async (req, res, logger): Promise<unknown> => {
    validateMethod(req, ['GET'], logger);
    const apiKey = requireEnvVar('SPORTSDATAIO_API_KEY', logger);

    logger.info('Fetching current week');

    const current = await getCurrentWeek(apiKey);

    // Set cache headers - current week changes at most once per week
    setCacheHeaders(res, { profile: 'public-short', maxAge: 3600, staleWhileRevalidate: 7200 });

    if (!current) {
      const response = createSuccessResponse({
        message: 'No current NFL week (offseason)',
        data: null,
      }, 200, logger);
      return res.status(response.statusCode).json(response.body.data as CurrentWeekResponse);
    }

    const response = createSuccessResponse({ data: current }, 200, logger);
    return res.status(response.statusCode).json(response.body.data as unknown as CurrentWeekResponse);
  });
}
