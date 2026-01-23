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

import type { NextApiRequest, NextApiResponse } from 'next';
import { getTeams, getTeamByKey, transformTeam } from '../../../lib/sportsdataio';
import { 
  withErrorHandling, 
  validateMethod, 
  requireEnvVar,
  createSuccessResponse,
  ErrorType,
  createErrorResponse,
} from '../../../lib/apiErrorHandler';

// ============================================================================
// TYPES
// ============================================================================

export interface TeamsResponse {
  count?: number;
  data: Array<{
    conference?: string;
    division?: string;
    name?: string;
    [key: string]: unknown;
  }>;
  [key: string]: unknown;
}

// ============================================================================
// HANDLER
// ============================================================================

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<TeamsResponse>
): Promise<unknown> {
  return withErrorHandling(req, res, async (req, res, logger): Promise<unknown> => {
    // Validate HTTP method
    validateMethod(req, ['GET'], logger);

    // Check required environment variables
    const apiKey = requireEnvVar('SPORTSDATAIO_API_KEY', logger);

    const { conference, division, team, refresh } = req.query;
    const forceRefresh = refresh === 'true';
    
    logger.info('Fetching teams', {
      filters: {
        team: team as string | undefined,
        conference: conference as string | undefined,
        division: division as string | undefined,
        refresh: forceRefresh,
      }
    });
    
    // Single team lookup
    if (team) {
      const teamData = await getTeamByKey(apiKey, team as string, forceRefresh);
      
      if (!teamData) {
        logger.warn('Team not found', { team });
        const errorResponse = createErrorResponse(
          ErrorType.NOT_FOUND,
          `Team "${team}" not found`,
          { team },
          res.getHeader('X-Request-ID') as string | undefined
        );
        return res.status(errorResponse.statusCode).json(errorResponse.body as unknown as TeamsResponse);
      }
      
      logger.debug('Team found', { team });
      const response = createSuccessResponse(teamData, 200, logger);
      return res.status(response.statusCode).json(response.body.data as unknown as TeamsResponse);
    }
    
    // Get all teams
    let teams = await getTeams(apiKey, forceRefresh);
    logger.debug('Teams fetched', { count: teams.length });
    
    // Transform and filter out non-NFL teams
    let transformed = teams
      .map(transformTeam)
      .filter(t => t !== null) as unknown as Array<{
        conference?: string;
        division?: string;
        name?: string;
        [key: string]: unknown;
      }>;
    
    // Filter by conference
    if (conference) {
      const beforeCount = transformed.length;
      const conferenceUpper = (conference as string).toUpperCase();
      transformed = transformed.filter(t => 
        t.conference === conferenceUpper
      );
      logger.debug('Filtered by conference', { 
        conference: conferenceUpper, 
        before: beforeCount, 
        after: transformed.length 
      });
    }
    
    // Filter by division
    if (division) {
      const beforeCount = transformed.length;
      const divisionLower = (division as string).toLowerCase();
      transformed = transformed.filter(t => 
        t.division?.toLowerCase().includes(divisionLower)
      );
      logger.debug('Filtered by division', { 
        division, 
        before: beforeCount, 
        after: transformed.length 
      });
    }
    
    // Sort by conference, division, then name
    transformed.sort((a, b) => {
      const confA = a.conference || '';
      const confB = b.conference || '';
      const divA = a.division || '';
      const divB = b.division || '';
      const nameA = a.name || '';
      const nameB = b.name || '';
      
      if (confA !== confB) return confA.localeCompare(confB);
      if (divA !== divB) return divA.localeCompare(divB);
      return nameA.localeCompare(nameB);
    });
    
    const response = createSuccessResponse({
      count: transformed.length,
      data: transformed,
    }, 200, logger);
    
    return res.status(response.statusCode).json(response.body.data as TeamsResponse);
  });
}
