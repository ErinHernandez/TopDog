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

import { getDepthCharts, getDepthChartsByTeam } from '../../../lib/sportsdataio';
import { 
  withErrorHandling, 
  validateMethod, 
  requireEnvVar,
  createSuccessResponse,
  createErrorResponse,
  ErrorType,
} from '../../../lib/apiErrorHandler';

export default async function handler(req, res) {
  return withErrorHandling(req, res, async (req, res, logger) => {
    validateMethod(req, ['GET'], logger);
    const apiKey = requireEnvVar('SPORTSDATAIO_API_KEY', logger);

    const { team, position, grouped, refresh } = req.query;
    const forceRefresh = refresh === 'true';
    
    logger.info('Fetching depth charts', { team, position, grouped, refresh: forceRefresh });
    
    // Return grouped by team if requested
    if (grouped === 'true') {
      const byTeam = await getDepthChartsByTeam(apiKey, forceRefresh);
      
      // Filter by team if specified
      if (team) {
        const teamData = byTeam[team.toUpperCase()];
        if (!teamData) {
          const error = createErrorResponse(ErrorType.NOT_FOUND, `Team ${team} not found`, 404, logger);
          return res.status(error.statusCode).json(error.body);
        }
        const response = createSuccessResponse({
          team: team.toUpperCase(),
          data: teamData,
        }, 200, logger);
        return res.status(response.statusCode).json(response.body);
      }
      
      const response = createSuccessResponse({
        teamCount: Object.keys(byTeam).length,
        data: byTeam,
      }, 200, logger);
      return res.status(response.statusCode).json(response.body);
    }
    
    // Return flat list
    let charts = await getDepthCharts(apiKey, forceRefresh);
    
    // Filter by team
    if (team) {
      charts = charts.filter(c => c.Team === team.toUpperCase());
    }
    
    // Filter by position
    if (position) {
      charts = charts.filter(c => c.Position === position.toUpperCase());
    }
    
    // Sort by team, position, depth order
    charts.sort((a, b) => {
      if (a.Team !== b.Team) return a.Team.localeCompare(b.Team);
      if (a.Position !== b.Position) return a.Position.localeCompare(b.Position);
      return a.DepthOrder - b.DepthOrder;
    });
    
    // Transform for cleaner output
    const transformed = charts.map(c => ({
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
    
    return res.status(response.statusCode).json(response.body);
  });
}

