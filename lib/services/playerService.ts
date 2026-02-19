/**
 * Player Service with Optimized Queries
 *
 * Provides cached, paginated access to player data with retry protection.
 * Uses existing patterns from:
 * - lib/firebase/retryUtils.ts → withFullProtection()
 * - lib/firebase/queryOptimization.ts → buildOptimizedQuery()
 *
 * @module lib/services/playerService
 */

import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  where,
} from 'firebase/firestore';

import { db } from '../firebase';
import {
  buildOptimizedQuery,
  generateCacheKey,
} from '../firebase/queryOptimization';
import { withFullProtection } from '../firebase/retryUtils';
import { logger } from '../structuredLogger';

// ============================================================================
// TYPES
// ============================================================================

export interface Player {
  id: string;
  name: string;
  position: 'QB' | 'RB' | 'WR' | 'TE';
  team: string;
  adp: number;
  projectedPoints?: number;
}

export interface PlayerQueryOptions {
  /** Filter by specific positions */
  positions?: ('QB' | 'RB' | 'WR' | 'TE')[];
  /** Player IDs to exclude (e.g., already drafted) */
  excludeIds?: Set<string>;
  /** Maximum number of players to return */
  limit?: number;
  /** Field to order by */
  orderByField?: 'adp' | 'projectedPoints';
}

interface CacheEntry {
  data: Player[];
  expiry: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_PLAYER_LIMIT = 200;
const MAX_PLAYER_LIMIT = 500;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// ============================================================================
// CACHE
// ============================================================================

const playerCache = new Map<string, CacheEntry>();

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Get available players with caching and pagination
 *
 * @param options - Query options for filtering and limiting
 * @returns Array of players matching the criteria
 *
 * @example
 * // Get top 100 players by ADP
 * const players = await getAvailablePlayers({ limit: 100 });
 *
 * @example
 * // Get available QBs and RBs, excluding drafted players
 * const players = await getAvailablePlayers({
 *   positions: ['QB', 'RB'],
 *   excludeIds: new Set(['player1', 'player2']),
 * });
 */
export async function getAvailablePlayers(
  options: PlayerQueryOptions = {}
): Promise<Player[]> {
  const cacheKey = generateCacheKey('players', {
    positions: options.positions?.join(','),
    limit: options.limit,
    orderBy: options.orderByField,
  });

  // Check cache
  const cached = playerCache.get(cacheKey);
  if (cached && cached.expiry > Date.now()) {
    logger.debug('Player cache hit', { cacheKey });

    // Filter out excluded IDs from cache
    if (options.excludeIds && options.excludeIds.size > 0) {
      return cached.data.filter((p) => !options.excludeIds!.has(p.id));
    }
    return cached.data;
  }

  // Fetch with protection
  return withFullProtection('players:query', async () => {
    if (!db) {
      throw new Error('Database not initialized');
    }

    const playersRef = collection(db, 'players');

    const queryLimit = Math.min(
      options.limit || DEFAULT_PLAYER_LIMIT,
      MAX_PLAYER_LIMIT
    );

    // Build query with optimizations
    let q = query(
      playersRef,
      orderBy(options.orderByField || 'adp', 'asc'),
      limit(queryLimit)
    );

    // Add position filter if specified
    if (options.positions && options.positions.length > 0) {
      q = query(
        playersRef,
        where('position', 'in', options.positions),
        orderBy(options.orderByField || 'adp', 'asc'),
        limit(queryLimit)
      );
    }

    const snapshot = await getDocs(q);

    const players: Player[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || data.displayName || 'Unknown',
        position: data.position as Player['position'],
        team: data.team || data.nflTeam || 'FA',
        adp: data.adp || data.averageDraftPosition || 999,
        projectedPoints: data.projectedPoints,
      };
    });

    // Cache results
    playerCache.set(cacheKey, {
      data: players,
      expiry: Date.now() + CACHE_TTL_MS,
    });

    logger.info('Players fetched', {
      component: 'playerService',
      count: players.length,
      cacheKey,
    });

    // Filter out excluded IDs
    if (options.excludeIds && options.excludeIds.size > 0) {
      return players.filter((p) => !options.excludeIds!.has(p.id));
    }

    return players;
  });
}

/**
 * Get top available players grouped by position
 *
 * @param excludeIds - Set of player IDs to exclude (already drafted)
 * @param topN - Number of players to return per position (default: 5)
 * @returns Object with arrays of top players for each position
 *
 * @example
 * const draftedIds = new Set(['p1', 'p2', 'p3']);
 * const topAvailable = await getTopAvailableByPosition(draftedIds, 5);
 * console.log(topAvailable.QB); // Top 5 available QBs
 */
export async function getTopAvailableByPosition(
  excludeIds: Set<string>,
  topN: number = 5
): Promise<Record<'QB' | 'RB' | 'WR' | 'TE', Player[]>> {
  const allPlayers = await getAvailablePlayers({
    limit: 200,
    excludeIds,
  });

  return {
    QB: allPlayers.filter((p) => p.position === 'QB').slice(0, topN),
    RB: allPlayers.filter((p) => p.position === 'RB').slice(0, topN),
    WR: allPlayers.filter((p) => p.position === 'WR').slice(0, topN),
    TE: allPlayers.filter((p) => p.position === 'TE').slice(0, topN),
  };
}

/**
 * Clear the player cache
 *
 * Call this when players are updated or when cache should be invalidated.
 */
export function clearPlayerCache(): void {
  playerCache.clear();
  logger.info('Player cache cleared', { component: 'playerService' });
}

/**
 * Get cache statistics for monitoring
 */
export function getPlayerCacheStats(): {
  size: number;
  keys: string[];
} {
  return {
    size: playerCache.size,
    keys: Array.from(playerCache.keys()),
  };
}
