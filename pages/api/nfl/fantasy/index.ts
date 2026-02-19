/**
 * NFL Fantasy Overview API
 * 
 * GET /api/nfl/fantasy
 * 
 * Returns a summary of fantasy data including top players by position.
 */

import type { NextApiRequest, NextApiResponse } from 'next';

import { 
  withErrorHandling, 
  validateMethod, 
  requireEnvVar,
  createSuccessResponse,
} from '../../../../lib/apiErrorHandler';
import { POSITIONS } from '../../../../lib/constants/positions';
import { getFantasyPlayers } from '../../../../lib/sportsdataio';
import { fantasyPlayersResponseSchema } from '../../../../lib/validation/schemas';

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

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * SECURITY: Validate external API response structure using Zod
 * Prevents malformed or malicious data from propagating through the system
 */
function validateExternalApiResponse(data: unknown, logger: { error: (message: string, error: Error, context?: Record<string, unknown>) => void }): FantasyPlayer[] {
  // Validate using Zod schema
  const validationResult = fantasyPlayersResponseSchema.safeParse(data);
  
  if (!validationResult.success) {
    logger.error('External API response validation failed', new Error('Invalid response structure'), {
      errors: validationResult.error.issues,
    });
    throw new Error('Invalid response from external data provider');
  }
  
  // Transform validated data to FantasyPlayer format
  return validationResult.data.map((item) => ({
    position: item.Position || item.position,
    name: item.Name || item.name,
    team: item.Team || item.team,
    adpPPR: item.AverageDraftPositionPPR || item.adpPPR,
    adp: item.AverageDraftPosition || item.adp,
    projectedPointsPPR: item.ProjectedFantasyPointsPPR || item.projectedPointsPPR,
    projectedPoints: item.ProjectedFantasyPoints || item.projectedPoints,
    positionRank: item.PositionRank || item.positionRank,
    byeWeek: item.ByeWeek || item.byeWeek,
    overallRank: item.AverageDraftPositionRank || item.overallRank,
  }));
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

    // Fetch from external API
    const rawData = await getFantasyPlayers(apiKey, { limit: 500 });

    // SECURITY: Validate external API response before processing using Zod
    // This prevents malformed or malicious data from propagating
    let allPlayers: FantasyPlayer[];
    try {
      allPlayers = validateExternalApiResponse(rawData, logger);
    } catch (validationError) {
      logger.error('External API response validation failed', validationError as Error);
      throw new Error('Invalid response from external data provider');
    }

    logger.debug('Fantasy players fetched and validated', { count: allPlayers.length });
    
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
