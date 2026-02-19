/**
 * NFL Players API
 * 
 * GET /api/nfl/players
 * Query params:
 *   - team: Filter by team abbreviation
 *   - position: Filter by position (QB, RB, WR, TE)
 *   - search: Search by player name
 *   - limit: Max results (default: all)
 *   - refresh: Force cache refresh (true/false)
 */

import type { NextApiRequest, NextApiResponse } from 'next';

import { setCacheHeaders } from '../../../lib/api/cacheHeaders';
import {
  withErrorHandling,
  validateMethod,
  requireEnvVar,
  createSuccessResponse,
  ErrorType,
} from '../../../lib/apiErrorHandler';
import { transformPlayerBasic } from '../../../lib/playerModel';
import { getPlayers } from '../../../lib/sportsdataio';
import type { SportsDataIOPlayer } from '../../../types/api';

// ============================================================================
// TYPES
// ============================================================================

export interface Player {
  Team?: string;
  Position?: string;
  Name?: string;
  [key: string]: unknown;
}

export interface TransformedPlayer {
  name?: string;
  [key: string]: unknown;
}

export interface PlayersResponse {
  count: number;
  total: number;
  data: TransformedPlayer[];
}

// ============================================================================
// HANDLER
// ============================================================================

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PlayersResponse>
): Promise<unknown> {
  return withErrorHandling(req, res, async (req, res, logger): Promise<unknown> => {
    // Validate HTTP method
    validateMethod(req, ['GET'], logger);

    // Check required environment variables
    const apiKey = requireEnvVar('SPORTSDATAIO_API_KEY', logger);

    logger.info('Fetching players', { 
      filters: {
        team: req.query.team,
        position: req.query.position,
        search: req.query.search ? '***' : undefined, // Don't log full search terms
        limit: req.query.limit,
        refresh: req.query.refresh,
      }
    });

    const { team, position, search, limit, refresh } = req.query;
    const forceRefresh = refresh === 'true';
    
    let players = await getPlayers(apiKey, forceRefresh) as Player[];
    logger.debug('Players fetched', { count: players.length });
    
    // Filter by team
    if (team) {
      const beforeCount = players.length;
      const teamUpper = (team as string).toUpperCase();
      players = players.filter(p => p.Team === teamUpper);
      logger.debug('Filtered by team', { 
        team: teamUpper, 
        before: beforeCount, 
        after: players.length 
      });
    }
    
    // Filter by position
    if (position) {
      const positions = (position as string).toUpperCase().split(',');
      const beforeCount = players.length;
      players = players.filter(p => positions.includes(p.Position || ''));
      logger.debug('Filtered by position', { 
        positions, 
        before: beforeCount, 
        after: players.length 
      });
    }
    
    // Search by name
    if (search) {
      const searchLower = (search as string).toLowerCase();
      const beforeCount = players.length;
      players = players.filter(p => 
        p.Name && p.Name.toLowerCase().includes(searchLower)
      );
      logger.debug('Filtered by search', { 
        before: beforeCount, 
        after: players.length 
      });
    }
    
    // Transform using unified player model
    const transformed = players
      .map((player: Player) => transformPlayerBasic(player as unknown as SportsDataIOPlayer | null))
      .filter(Boolean) as TransformedPlayer[];
    logger.debug('Players transformed', { 
      before: players.length, 
      after: transformed.length 
    });
    
    // Sort by name
    transformed.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    
    // Limit results
    const limited = limit ? transformed.slice(0, parseInt(limit as string, 10)) : transformed;
    
    // Set cache headers - player data changes infrequently
    // Use public-long (1 hour) for general requests, no-cache if refresh=true
    if (forceRefresh) {
      setCacheHeaders(res, 'no-cache');
    } else {
      setCacheHeaders(res, 'public-long');
    }

    const response = createSuccessResponse({
      count: limited.length,
      total: transformed.length,
      data: limited,
    }, 200, logger);

    return res.status(response.statusCode).json(response.body.data as PlayersResponse);
  });
}
