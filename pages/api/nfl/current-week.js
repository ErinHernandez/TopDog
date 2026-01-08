/**
 * NFL Current Week API
 * 
 * GET /api/nfl/current-week
 * 
 * Returns the current NFL week/season information.
 */

import { getCurrentWeek } from '../../../lib/sportsdataio';
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

    logger.info('Fetching current week');
    
    const current = await getCurrentWeek(apiKey);
    
    if (!current) {
      const response = createSuccessResponse({
        message: 'No current NFL week (offseason)',
        data: null,
      }, 200, logger);
      return res.status(response.statusCode).json(response.body);
    }
    
    const response = createSuccessResponse({ data: current }, 200, logger);
    return res.status(response.statusCode).json(response.body);
  });
}

