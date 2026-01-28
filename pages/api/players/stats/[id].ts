/**
 * Player Stats API - Get Single Player
 *
 * GET /api/players/stats/[id]
 *
 * Returns statistics for a single player by their normalized ID.
 * Cache-Control: s-maxage=3600, stale-while-revalidate (1 hour cache)
 *
 * Path Parameters:
 *   id: string - Normalized player ID (e.g., 'josh_allen')
 *
 * Response:
 *   PlayerStatsResponse object or 404 if not found
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../../lib/firebase';
import {
  withErrorHandling,
  validateMethod,
  createErrorResponse,
  ErrorType,
} from '../../../../lib/apiErrorHandler';
import type {
  PlayerStatsResponse,
  PlayerStatsDocument,
} from '../../../../lib/playerStats/types';

// ============================================================================
// CACHE CONFIGURATION
// ============================================================================

const CACHE_CONTROL = 's-maxage=3600, stale-while-revalidate=86400';

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

// ============================================================================
// HANDLER
// ============================================================================

/**
 * GET /api/players/stats/[id]
 *
 * Returns stats for a single player.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  return withErrorHandling(req, res, async (req, res, logger) => {
    // 1. Validate HTTP method
    validateMethod(req, ['GET'], logger);

    // 2. Get player ID from path
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      const errorResponse = createErrorResponse(
        ErrorType.VALIDATION,
        'Player ID is required'
      );
      return res.status(errorResponse.statusCode).json(errorResponse.body);
    }

    // Normalize the ID (in case it comes with different casing)
    const playerId = id.toLowerCase().replace(/\s+/g, '_');

    // 3. Check if Firestore is available
    if (!db) {
      logger.warn('Firestore not available');
      const errorResponse = createErrorResponse(
        ErrorType.DATABASE,
        'Database not available'
      );
      return res.status(errorResponse.statusCode).json(errorResponse.body);
    }

    logger.info('Fetching player stats', { playerId });

    try {
      // 4. Fetch player from Firestore
      const playerRef = doc(db, 'playerStats', playerId);
      const playerSnap = await getDoc(playerRef);

      if (!playerSnap.exists()) {
        logger.info('Player not found', { playerId });
        const errorResponse = createErrorResponse(
          ErrorType.NOT_FOUND,
          `Player not found: ${id}`
        );
        return res.status(errorResponse.statusCode).json(errorResponse.body);
      }

      const playerData = playerSnap.data() as PlayerStatsDocument;
      const response = documentToResponse(playerData);

      logger.info('Successfully fetched player stats', {
        playerId,
        playerName: response.name,
      });

      // 5. Set cache headers
      res.setHeader('Cache-Control', CACHE_CONTROL);
      res.setHeader('CDN-Cache-Control', CACHE_CONTROL);
      res.setHeader('Vercel-CDN-Cache-Control', CACHE_CONTROL);

      // 6. Return success response
      return res.status(200).json(response);

    } catch (error) {
      logger.error('Failed to fetch player stats', error instanceof Error ? error : new Error(String(error)));

      const errorResponse = createErrorResponse(
        ErrorType.DATABASE,
        'Failed to fetch player stats',
        { error: error instanceof Error ? error.message : String(error) }
      );

      return res.status(errorResponse.statusCode).json(errorResponse.body);
    }
  });
}
