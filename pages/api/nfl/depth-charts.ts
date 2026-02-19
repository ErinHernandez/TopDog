/**
 * NFL Depth Charts API
 * 
 * GET /api/nfl/depth-charts
 * Query params:
 *   - team: Filter by team abbreviation
 *   - position: Filter by position
 *   - grouped: Return grouped by team (true/false, default: false)
 *   - refresh: Force cache refresh (true/false)
 */

import type { NextApiRequest, NextApiResponse } from 'next';

import { setCacheHeaders } from '../../../lib/api/cacheHeaders';
import {
  withErrorHandling,
  validateMethod,
  requireEnvVar,
  createSuccessResponse,
  createErrorResponse,
  ErrorType,
} from '../../../lib/apiErrorHandler';
import { getDepthCharts, getDepthChartsByTeam } from '../../../lib/sportsdataio';

// ============================================================================
// TYPES
// ============================================================================

export interface DepthChart {
  Team?: string;
  Position?: string;
  PositionCategory?: string;
  Name?: string;
  DepthOrder?: number;
  PlayerID?: number;
  [key: string]: unknown;
}

export interface TransformedDepthChart {
  team: string | undefined;
  position: string | undefined;
  positionCategory: string | undefined;
  name: string | undefined;
  depthOrder: number | undefined;
  playerId: number | undefined;
}

export interface DepthChartsResponse {
  team?: string;
  teamCount?: number;
  count?: number;
  data: TransformedDepthChart[] | Record<string, unknown>;
}

// ============================================================================
// HANDLER
// ============================================================================

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<DepthChartsResponse>
): Promise<unknown> {
  return withErrorHandling(req, res, async (req, res, logger): Promise<unknown> => {
    validateMethod(req, ['GET'], logger);
    const apiKey = requireEnvVar('SPORTSDATAIO_API_KEY', logger);

    const { team, position, grouped, refresh } = req.query;
    const forceRefresh = refresh === 'true';
    
    logger.info('Fetching depth charts', { 
      team: team as string | undefined, 
      position: position as string | undefined, 
      grouped: grouped as string | undefined, 
      refresh: forceRefresh 
    });
    
    // Set cache headers - depth charts change infrequently
    if (forceRefresh) {
      setCacheHeaders(res, 'no-cache');
    } else {
      setCacheHeaders(res, { profile: 'public-long', maxAge: 21600, staleWhileRevalidate: 86400 });
    }

    // Return grouped by team if requested
    if (grouped === 'true') {
      const byTeam = await getDepthChartsByTeam(apiKey, forceRefresh) as Record<string, unknown>;

      // Filter by team if specified
      if (team) {
        const teamUpper = (team as string).toUpperCase();
        const teamData = byTeam[teamUpper];
        if (!teamData) {
          const error = createErrorResponse(ErrorType.NOT_FOUND, `Team ${team} not found`);
          return res.status(error.statusCode).json(error.body as unknown as DepthChartsResponse);
        }
        const response = createSuccessResponse({
          team: teamUpper,
          data: teamData,
        }, 200, logger);
        return res.status(response.statusCode).json(response.body.data as DepthChartsResponse);
      }

      const response = createSuccessResponse({
        teamCount: Object.keys(byTeam).length,
        data: byTeam,
      }, 200, logger);
      return res.status(response.statusCode).json(response.body.data as DepthChartsResponse);
    }
    
    // Return flat list
    let charts = await getDepthCharts(apiKey, forceRefresh) as DepthChart[];
    
    // Filter by team
    if (team) {
      const teamUpper = (team as string).toUpperCase();
      charts = charts.filter(c => c.Team === teamUpper);
    }
    
    // Filter by position
    if (position) {
      const positionUpper = (position as string).toUpperCase();
      charts = charts.filter(c => c.Position === positionUpper);
    }
    
    // Sort by team, position, depth order
    charts.sort((a, b) => {
      const teamA = a.Team || '';
      const teamB = b.Team || '';
      const posA = a.Position || '';
      const posB = b.Position || '';
      const depthA = a.DepthOrder || 0;
      const depthB = b.DepthOrder || 0;
      
      if (teamA !== teamB) return teamA.localeCompare(teamB);
      if (posA !== posB) return posA.localeCompare(posB);
      return depthA - depthB;
    });
    
    // Transform for cleaner output
    const transformed: TransformedDepthChart[] = charts.map(c => ({
      team: c.Team,
      position: c.Position,
      positionCategory: c.PositionCategory,
      name: c.Name,
      depthOrder: c.DepthOrder,
      playerId: c.PlayerID,
    }));
    
    const response = createSuccessResponse({
      count: transformed.length,
      data: transformed,
    }, 200, logger);
    
    return res.status(response.statusCode).json(response.body.data as DepthChartsResponse);
  });
}
