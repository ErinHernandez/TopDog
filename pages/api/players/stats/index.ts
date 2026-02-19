/**
 * Player Stats API - Get All Players
 *
 * GET /api/players/stats
 *
 * Returns all player statistics from Firestore with edge caching.
 * Cache-Control: s-maxage=3600, stale-while-revalidate (1 hour cache, revalidate in background)
 *
 * Response:
 * {
 *   metadata: { version, totalPlayers, lastUpdated, source, cacheHit },
 *   players: { [playerName]: PlayerStatsResponse }
 * }
 */

import { collection, getDocs, doc, getDoc, limit, query } from 'firebase/firestore';
import type { NextApiRequest, NextApiResponse } from 'next';

import {
  withErrorHandling,
  validateMethod,
  createErrorResponse,
  ErrorType,
} from '../../../../lib/apiErrorHandler';
import { db } from '../../../../lib/firebase';
import type {
  AllPlayerStatsResponse,
  PlayerStatsResponse,
  PlayerStatsDocument,
} from '../../../../lib/playerStats/types';
import { RateLimiter } from '../../../../lib/rateLimiter';
import { sanitizeErrorMessage } from '../../../../lib/utils/errorSanitizer';

// ============================================================================
// RATE LIMITER
// ============================================================================

const rateLimiter = new RateLimiter({
  maxRequests: 60,
  windowMs: 60 * 1000, // 1 minute
  endpoint: 'players_stats',
});

// ============================================================================
// CACHE CONFIGURATION
// ============================================================================

// Edge cache: 1 hour, revalidate in background
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
 * GET /api/players/stats
 *
 * Returns all player statistics with edge caching for performance.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  return withErrorHandling(req, res, async (req, res, logger) => {
    // 1. Validate HTTP method
    validateMethod(req, ['GET'], logger);

    // 2. Rate limiting
    const rateLimitResult = await rateLimiter.check(req);
    res.setHeader('X-RateLimit-Limit', '60');
    res.setHeader('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
    res.setHeader('X-RateLimit-Reset', Math.floor(rateLimitResult.resetAt / 1000).toString());

    if (!rateLimitResult.allowed) {
      return res.status(429).json({
        metadata: {
          version: '0.0',
          totalPlayers: 0,
          lastUpdated: new Date().toISOString(),
          source: 'fallback',
          cacheHit: false,
        },
        players: {},
      });
    }

    // 3. Check if Firestore is available
    if (!db) {
      logger.warn('Firestore not available, returning empty response');
      const emptyResponse: AllPlayerStatsResponse = {
        metadata: {
          version: '0.0',
          totalPlayers: 0,
          lastUpdated: new Date().toISOString(),
          source: 'fallback',
          cacheHit: false,
        },
        players: {},
      };
      return res.status(200).json(emptyResponse);
    }

    logger.info('Fetching player stats from Firestore');

    try {
      // 4. Fetch metadata
      const metadataRef = doc(db, 'playerStatsMetadata', 'current');
      const metadataSnap = await getDoc(metadataRef);
      const metadata = metadataSnap.exists() ? metadataSnap.data() : null;

      // 5. Fetch all player stats (limited to 500 to prevent overload)
      const statsRef = collection(db, 'playerStats');
      const statsQuery = query(statsRef, limit(500));
      const statsSnap = await getDocs(statsQuery);

      // 6. Build response
      const players: Record<string, PlayerStatsResponse> = {};

      statsSnap.forEach((docSnap) => {
        const data = docSnap.data() as PlayerStatsDocument;
        players[data.name] = documentToResponse(data);
      });

      const response: AllPlayerStatsResponse = {
        metadata: {
          version: metadata?.version || '1.0',
          totalPlayers: statsSnap.size,
          lastUpdated: metadata?.lastUpdated?.toDate?.()?.toISOString() || new Date().toISOString(),
          source: metadata?.source || 'Firestore',
          cacheHit: false,
        },
        players,
      };

      logger.info('Successfully fetched player stats', {
        playerCount: statsSnap.size,
        version: response.metadata.version,
      });

      // 7. Set cache headers for edge caching
      res.setHeader('Cache-Control', CACHE_CONTROL);
      res.setHeader('CDN-Cache-Control', CACHE_CONTROL);
      res.setHeader('Vercel-CDN-Cache-Control', CACHE_CONTROL);

      // 8. Return success response
      return res.status(200).json(response);

    } catch (error) {
      logger.error('Failed to fetch player stats', error instanceof Error ? error : new Error(String(error)));

      const errorResponse = createErrorResponse(
        ErrorType.DATABASE,
        'Failed to fetch player stats',
        { error: sanitizeErrorMessage(error) }
      );

      return res.status(errorResponse.statusCode).json(errorResponse.body);
    }
  });
}
