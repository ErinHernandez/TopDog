/**
 * Player Stats Module
 *
 * Enterprise-grade player statistics system with:
 * - Firestore backend with edge caching
 * - SWR hooks for React components
 * - localStorage persistence for offline support
 * - Legacy compatibility exports
 *
 * @example
 * ```tsx
 * // Modern usage with hooks
 * import { usePlayerStats, prefetchPlayerStats } from '@/lib/playerStats';
 *
 * function DraftRoom() {
 *   const { data, isLoading } = usePlayerStats();
 *   // ...
 * }
 *
 * // Legacy usage (backward compatible)
 * import { STATIC_PLAYER_STATS, getPlayerStats } from '@/lib/playerStats';
 * const player = getPlayerStats('Josh Allen');
 * ```
 */

// Export types
export * from './types';

// Export hooks
export {
  usePlayerStats,
  usePlayerStatsById,
  usePlayerStatsByPosition,
  prefetchPlayerStats,
  prefetchPlayerStatsByPosition,
  prefetchAllPositions,
  toLegacyFormat,
  getPlayerFromResponse,
  getPositionCounts,
} from './hooks';

// ============================================================================
// LEGACY COMPATIBILITY EXPORTS
// ============================================================================

// Re-export legacy types and functions from the old staticPlayerStats module
// This allows existing code to continue working without changes

import type {
  LegacyPlayerStats,
  LegacyStatsMetadata,
  LegacyStaticPlayerStatsData,
  PositionCounts,
} from './types';

// Legacy type exports (aliased for backward compatibility)
export type PlayerStats = LegacyPlayerStats;
export type StatsMetadata = LegacyStatsMetadata;
export type StaticPlayerStatsData = LegacyStaticPlayerStatsData;

// Import static fallback data for SSR and initial load
let staticPlayerStatsModule: { STATIC_PLAYER_STATS?: LegacyStaticPlayerStatsData } = {};

try {
  // Only load the static file as fallback (will be removed after migration verification)
  staticPlayerStatsModule = require('../staticPlayerStats.js.bak');
} catch {
  // File may not exist after cleanup
  staticPlayerStatsModule = {};
}

/**
 * Legacy STATIC_PLAYER_STATS export
 *
 * DEPRECATED: Use usePlayerStats() hook instead for dynamic loading.
 * This export is maintained for backward compatibility and SSR fallback.
 */
export const STATIC_PLAYER_STATS: LegacyStaticPlayerStatsData = staticPlayerStatsModule.STATIC_PLAYER_STATS || {
  metadata: {
    generatedAt: new Date().toISOString(),
    totalPlayers: 0,
    successfulFetches: 0,
    failedFetches: 0,
    version: '5.0',
    source: 'Empty Fallback - Use usePlayerStats() hook',
  },
  players: {},
};

/**
 * Get player stats by name (legacy function)
 *
 * DEPRECATED: Use usePlayerStats() hook and access players from the response.
 */
export function getPlayerStats(playerName: string): LegacyPlayerStats | null {
  return STATIC_PLAYER_STATS.players[playerName] || null;
}

/**
 * Check if player stats are available (legacy function)
 */
export function hasPlayerStats(): boolean {
  return STATIC_PLAYER_STATS.metadata.totalPlayers > 0;
}

/**
 * Get stats metadata (legacy function)
 */
export function getStatsMetadata(): LegacyStatsMetadata {
  return STATIC_PLAYER_STATS.metadata;
}

/**
 * Get player count by position (legacy function)
 */
export function getPlayerCountByPosition(): PositionCounts {
  const counts: PositionCounts = {
    QB: 0,
    RB: 0,
    WR: 0,
    TE: 0,
  };

  Object.values(STATIC_PLAYER_STATS.players).forEach((player) => {
    const pos = player.position;
    if (pos in counts) {
      counts[pos as keyof PositionCounts]++;
    } else {
      counts[pos] = (counts[pos] || 0) + 1;
    }
  });

  return counts;
}
