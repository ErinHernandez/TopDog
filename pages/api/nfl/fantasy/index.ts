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

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * SECURITY: Validate external API response structure
 * Prevents malformed or malicious data from propagating through the system
 */
function validateExternalApiResponse(data: unknown): FantasyPlayer[] {
  // Ensure response is an array
  if (!Array.isArray(data)) {
    throw new Error('External API response is not an array');
  }

  // Validate and sanitize each player
  return data.map((item: unknown, index: number) => {
    if (typeof item !== 'object' || item === null) {
      throw new Error(`Invalid player data at index ${index}`);
    }

    const player = item as Record<string, unknown>;

    // Validate required string fields (allow undefined but not wrong types)
    const validateOptionalString = (field: string): string | undefined => {
      const value = player[field];
      if (value === undefined || value === null) return undefined;
      if (typeof value !== 'string') {
        throw new Error(`Field ${field} at index ${index} is not a string`);
      }
      // Sanitize: limit length and remove control characters
      return value.slice(0, 200).replace(/[\x00-\x1F\x7F]/g, '');
    };

    // Validate optional number fields
    const validateOptionalNumber = (field: string): number | undefined => {
      const value = player[field];
      if (value === undefined || value === null) return undefined;
      if (typeof value !== 'number' || !Number.isFinite(value)) {
        // Try to parse if it's a numeric string
        if (typeof value === 'string') {
          const parsed = parseFloat(value);
          if (Number.isFinite(parsed)) return parsed;
        }
        throw new Error(`Field ${field} at index ${index} is not a valid number`);
      }
      return value;
    };

    // Build validated player object
    const validatedPlayer: FantasyPlayer = {
      position: validateOptionalString('Position') || validateOptionalString('position'),
      name: validateOptionalString('Name') || validateOptionalString('name'),
      team: validateOptionalString('Team') || validateOptionalString('team'),
      adpPPR: validateOptionalNumber('AverageDraftPositionPPR') || validateOptionalNumber('adpPPR'),
      adp: validateOptionalNumber('AverageDraftPosition') || validateOptionalNumber('adp'),
      projectedPointsPPR: validateOptionalNumber('ProjectedFantasyPointsPPR') || validateOptionalNumber('projectedPointsPPR'),
      projectedPoints: validateOptionalNumber('ProjectedFantasyPoints') || validateOptionalNumber('projectedPoints'),
      positionRank: validateOptionalNumber('PositionRank') || validateOptionalNumber('positionRank'),
      byeWeek: validateOptionalNumber('ByeWeek') || validateOptionalNumber('byeWeek'),
      overallRank: validateOptionalNumber('AverageDraftPositionRank') || validateOptionalNumber('overallRank'),
    };

    return validatedPlayer;
  });
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

    // SECURITY: Validate external API response before processing
    // This prevents malformed or malicious data from propagating
    let allPlayers: FantasyPlayer[];
    try {
      allPlayers = validateExternalApiResponse(rawData);
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
