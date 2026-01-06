import { 
  withErrorHandling, 
  validateMethod, 
  requireEnvVar,
  createSuccessResponse,
  createErrorResponse,
  ErrorType,
} from '../../lib/apiErrorHandler';

export default async function handler(req, res) {
  return withErrorHandling(req, res, async (req, res, logger) => {
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
        response.status, 
        logger
      );
      return res.status(error.statusCode).json({ ...error.body, details: text });
    }

    const data = await response.json();

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

    return res.status(successResponse.statusCode).json(successResponse.body);
  });
}
