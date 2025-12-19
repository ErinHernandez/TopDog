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

import { getPlayers } from '../../../lib/sportsdataio';
import { transformPlayerBasic } from '../../../lib/playerModel';
import { 
  withErrorHandling, 
  validateMethod, 
  requireEnvVar,
  createSuccessResponse,
  ErrorType,
} from '../../../lib/apiErrorHandler';

export default async function handler(req, res) {
  return withErrorHandling(req, res, async (req, res, logger) => {
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
    
    let players = await getPlayers(apiKey, forceRefresh);
    logger.debug('Players fetched', { count: players.length });
    
    // Filter by team
    if (team) {
      const beforeCount = players.length;
      players = players.filter(p => p.Team === team.toUpperCase());
      logger.debug('Filtered by team', { 
        team: team.toUpperCase(), 
        before: beforeCount, 
        after: players.length 
      });
    }
    
    // Filter by position
    if (position) {
      const positions = position.toUpperCase().split(',');
      const beforeCount = players.length;
      players = players.filter(p => positions.includes(p.Position));
      logger.debug('Filtered by position', { 
        positions, 
        before: beforeCount, 
        after: players.length 
      });
    }
    
    // Search by name
    if (search) {
      const searchLower = search.toLowerCase();
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
    const transformed = players.map(transformPlayerBasic).filter(Boolean);
    logger.debug('Players transformed', { 
      before: players.length, 
      after: transformed.length 
    });
    
    // Sort by name
    transformed.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    
    // Limit results
    const limited = limit ? transformed.slice(0, parseInt(limit)) : transformed;
    
    const response = createSuccessResponse({
      count: limited.length,
      total: transformed.length,
      data: limited,
    }, 200, logger);
    
    return res.status(response.statusCode).json(response.body);
  });
}

