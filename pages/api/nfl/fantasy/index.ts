/**
 * NFL Fantasy Overview API
 * 
 * GET /api/nfl/fantasy
 * 
 * Returns a summary of fantasy data including top players by position.
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { getFantasyPlayers } from '../../../../lib/sportsdataio';
import { POSITIONS } from '../../../../lib/constants/positions';
import { 
  withErrorHandling, 
  validateMethod, 
  requireEnvVar,
  createSuccessResponse,
} from '../../../../lib/apiErrorHandler';

// ============================================================================
// TYPES
// ============================================================================

export interface FantasyPlayer {
  position?: string;
  name?: string;
  team?: string;
  adpPPR?: number;
  adp?: number;
  projectedPointsPPR?: number;
  projectedPoints?: number;
  positionRank?: number;
  byeWeek?: number;
  overallRank?: number;
  [key: string]: unknown;
}

export interface TopPlayer {
  name?: string;
  team?: string;
  adp?: number;
  projectedPoints?: number;
  positionRank?: number;
  byeWeek?: number;
  position?: string;
  overallRank?: number;
}

export interface FantasyOverviewResponse {
  summary: {
    totalPlayers: number;
    byPosition: {
      QB: number;
      RB: number;
      WR: number;
      TE: number;
    };
  };
  top20: TopPlayer[];
  topByPosition: Record<string, TopPlayer[]>;
}

// ============================================================================
// HANDLER
// ============================================================================

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<FantasyOverviewResponse>
): Promise<unknown> {
  return withErrorHandling(req, res, async (req, res, logger): Promise<unknown> => {
    // Validate HTTP method
    validateMethod(req, ['GET'], logger);

    // Check required environment variables
    const apiKey = requireEnvVar('SPORTSDATAIO_API_KEY', logger);

    logger.info('Fetching fantasy overview');

    const allPlayers = await getFantasyPlayers(apiKey, { limit: 500 }) as unknown as FantasyPlayer[];
    logger.debug('Fantasy players fetched', { count: allPlayers.length });
    
    // Group by position and get top 10 each
    const byPosition: Record<string, TopPlayer[]> = {};
    
    POSITIONS.forEach((pos: string) => {
      byPosition[pos] = allPlayers
        .filter(p => p.position === pos)
        .slice(0, 10)
        .map(p => ({
          name: p.name,
          team: p.team,
          adp: p.adpPPR || p.adp,
          projectedPoints: p.projectedPointsPPR || p.projectedPoints,
          positionRank: p.positionRank,
          byeWeek: p.byeWeek,
        }));
    });
    
    logger.debug('Position breakdowns created', { 
      positions: Object.keys(byPosition) 
    });
    
    // Overall top 20
    const top20: TopPlayer[] = allPlayers.slice(0, 20).map(p => ({
      name: p.name,
      team: p.team,
      position: p.position,
      adp: p.adpPPR || p.adp,
      projectedPoints: p.projectedPointsPPR || p.projectedPoints,
      overallRank: p.overallRank,
    }));
    
    const positionCounts = {
      QB: allPlayers.filter(p => p.position === 'QB').length,
      RB: allPlayers.filter(p => p.position === 'RB').length,
      WR: allPlayers.filter(p => p.position === 'WR').length,
      TE: allPlayers.filter(p => p.position === 'TE').length,
    };
    
    const response = createSuccessResponse({
      summary: {
        totalPlayers: allPlayers.length,
        byPosition: positionCounts,
      },
      top20,
      topByPosition: byPosition,
    }, 200, logger);
    
    return res.status(response.statusCode).json(response.body.data as FantasyOverviewResponse);
  });
}
