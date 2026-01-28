/**
 * Player Stats API - Get Players by Position
 *
 * GET /api/players/stats/position/[pos]
 *
 * Returns all players for a specific position.
 * Cache-Control: s-maxage=3600, stale-while-revalidate (1 hour cache)
 *
 * Path Parameters:
 *   pos: 'QB' | 'RB' | 'WR' | 'TE' - Position to filter by
 *
 * Response:
 * {
 *   position: string,
 *   count: number,
 *   players: PlayerStatsResponse[]
 * }
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../../../../../lib/firebase';
import {
  withErrorHandling,
  validateMethod,
  createErrorResponse,
  ErrorType,
} from '../../../../../lib/apiErrorHandler';
import type {
  PlayerStatsResponse,
  PlayerStatsDocument,
  PlayersByPositionResponse,
  PlayerPosition,
} from '../../../../../lib/playerStats/types';

// ============================================================================
// CACHE CONFIGURATION
// ============================================================================

const CACHE_CONTROL = 's-maxage=3600, stale-while-revalidate=86400';

// ============================================================================
// CONSTANTS
// ============================================================================

const VALID_POSITIONS: PlayerPosition[] = ['QB', 'RB', 'WR', 'TE'];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Convert Firestore document to API response format
 */
function documentToResponse(data: PlayerStatsDocument): PlayerStatsResponse {
  return {
    id: data.id,
    name: data.name,
    position: data.position,
    team: data.team,
    seasons: data.seasons || [],
    career: data.career,
    draftkingsRank: data.draftkingsRank,
    draftkingsADP: data.draftkingsADP,
    clayRank: data.clayRank,
    projectedPoints: data.projectedPoints,
    updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
    databaseId: data.databaseId,
    clayLastUpdated: data.clayLastUpdated,
  };
}

/**
 * Validate position parameter
 */
function isValidPosition(pos: string): pos is PlayerPosition {
  return VALID_POSITIONS.includes(pos.toUpperCase() as PlayerPosition);
}

// ============================================================================
// HANDLER
// ============================================================================

/**
 * GET /api/players/stats/position/[pos]
 *
 * Returns all players for a specific position, sorted by projected points.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  return withErrorHandling(req, res, async (req, res, logger) => {
    // 1. Validate HTTP method
    validateMethod(req, ['GET'], logger);

    // 2. Get and validate position
    const { pos } = req.query;

    if (!pos || typeof pos !== 'string') {
      const errorResponse = createErrorResponse(
        ErrorType.VALIDATION,
        'Position is required'
      );
      return res.status(errorResponse.statusCode).json(errorResponse.body);
    }

    const position = pos.toUpperCase();

    if (!isValidPosition(position)) {
      const errorResponse = createErrorResponse(
        ErrorType.VALIDATION,
        `Invalid position: ${pos}. Valid positions are: ${VALID_POSITIONS.join(', ')}`
      );
      return res.status(errorResponse.statusCode).json(errorResponse.body);
    }

    // 3. Check if Firestore is available
    if (!db) {
      logger.warn('Firestore not available');
      const errorResponse = createErrorResponse(
        ErrorType.DATABASE,
        'Database not available'
      );
      return res.status(errorResponse.statusCode).json(errorResponse.body);
    }

    logger.info('Fetching players by position', { position });

    try {
      // 4. Query Firestore for players with this position
      const statsRef = collection(db, 'playerStats');
      const positionQuery = query(
        statsRef,
        where('position', '==', position),
        orderBy('projectedPoints', 'desc'),
        limit(100)
      );

      const querySnap = await getDocs(positionQuery);

      // 5. Build response
      const players: PlayerStatsResponse[] = [];

      querySnap.forEach((docSnap) => {
        const data = docSnap.data() as PlayerStatsDocument;
        players.push(documentToResponse(data));
      });

      const response: PlayersByPositionResponse = {
        position: position as PlayerPosition,
        count: players.length,
        players,
      };

      logger.info('Successfully fetched players by position', {
        position,
        count: players.length,
      });

      // 6. Set cache headers
      res.setHeader('Cache-Control', CACHE_CONTROL);
      res.setHeader('CDN-Cache-Control', CACHE_CONTROL);
      res.setHeader('Vercel-CDN-Cache-Control', CACHE_CONTROL);

      // 7. Return success response
      return res.status(200).json(response);

    } catch (error) {
      logger.error('Failed to fetch players by position', error instanceof Error ? error : new Error(String(error)));

      const errorResponse = createErrorResponse(
        ErrorType.DATABASE,
        'Failed to fetch players by position',
        { error: error instanceof Error ? error.message : String(error) }
      );

      return res.status(errorResponse.statusCode).json(errorResponse.body);
    }
  });
}
