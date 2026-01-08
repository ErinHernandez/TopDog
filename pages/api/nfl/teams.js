/**
 * NFL Teams API
 * 
 * GET /api/nfl/teams
 * Query params:
 *   - conference: Filter by conference (AFC, NFC)
 *   - division: Filter by division (North, South, East, West)
 *   - team: Get single team by abbreviation (e.g., KC, BUF)
 *   - refresh: Force cache refresh (true/false)
 * 
 * Returns full team data including:
 * - Coaching staff
 * - Team colors (hex)
 * - Stadium details
 * - DFS platform IDs/names
 * - Upcoming game salaries
 */

import { getTeams, getTeamByKey, transformTeam } from '../../../lib/sportsdataio';
import { 
  withErrorHandling, 
  validateMethod, 
  requireEnvVar,
  createSuccessResponse,
  ErrorType,
  createErrorResponse,
} from '../../../lib/apiErrorHandler';

export default async function handler(req, res) {
  return withErrorHandling(req, res, async (req, res, logger) => {
    // Validate HTTP method
    validateMethod(req, ['GET'], logger);

    // Check required environment variables
    const apiKey = requireEnvVar('SPORTSDATAIO_API_KEY', logger);

    const { conference, division, team, refresh } = req.query;
    const forceRefresh = refresh === 'true';
    
    logger.info('Fetching teams', {
      filters: {
        team,
        conference,
        division,
        refresh: forceRefresh,
      }
    });
    
    // Single team lookup
    if (team) {
      const teamData = await getTeamByKey(apiKey, team, forceRefresh);
      
      if (!teamData) {
        logger.warn('Team not found', { team });
        const errorResponse = createErrorResponse(
          ErrorType.NOT_FOUND,
          `Team "${team}" not found`,
          { team },
          res.getHeader('X-Request-ID')
        );
        return res.status(errorResponse.statusCode).json(errorResponse.body);
      }
      
      logger.debug('Team found', { team });
      const response = createSuccessResponse(teamData, 200, logger);
      return res.status(response.statusCode).json(response.body);
    }
    
    // Get all teams
    let teams = await getTeams(apiKey, forceRefresh);
    logger.debug('Teams fetched', { count: teams.length });
    
    // Transform and filter out non-NFL teams
    let transformed = teams
      .map(transformTeam)
      .filter(t => t !== null);
    
    // Filter by conference
    if (conference) {
      const beforeCount = transformed.length;
      transformed = transformed.filter(t => 
        t.conference === conference.toUpperCase()
      );
      logger.debug('Filtered by conference', { 
        conference: conference.toUpperCase(), 
        before: beforeCount, 
        after: transformed.length 
      });
    }
    
    // Filter by division
    if (division) {
      const beforeCount = transformed.length;
      transformed = transformed.filter(t => 
        t.division.toLowerCase().includes(division.toLowerCase())
      );
      logger.debug('Filtered by division', { 
        division, 
        before: beforeCount, 
        after: transformed.length 
      });
    }
    
    // Sort by conference, division, then name
    transformed.sort((a, b) => {
      if (a.conference !== b.conference) return a.conference.localeCompare(b.conference);
      if (a.division !== b.division) return a.division.localeCompare(b.division);
      return a.name.localeCompare(b.name);
    });
    
    const response = createSuccessResponse({
      count: transformed.length,
      data: transformed,
    }, 200, logger);
    
    return res.status(response.statusCode).json(response.body);
  });
}

