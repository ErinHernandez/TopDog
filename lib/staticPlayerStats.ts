/**
 * Static Player Stats Module
 *
 * MIGRATION STATUS: Migrated to Firestore with edge caching.
 *
 * This file now re-exports from the new playerStats module for backward compatibility.
 * Existing imports from 'lib/staticPlayerStats' will continue to work.
 *
 * NEW USAGE (Recommended):
 * ```tsx
 * import { usePlayerStats, prefetchPlayerStats } from '@/lib/playerStats';
 *
 * function DraftRoom() {
 *   const { data, isLoading } = usePlayerStats();
 *   // ...
 * }
 * ```
 *
 * LEGACY USAGE (Still supported):
 * ```ts
 * import { STATIC_PLAYER_STATS, getPlayerStats } from '@/lib/staticPlayerStats';
 * const player = getPlayerStats('Josh Allen');
 * ```
 *
 * Generated: 2025-08-17T06:58:58.208Z
 * Migrated: 2026-01-28
 */

// ============================================================================
// RE-EXPORTS FROM NEW MODULE
// ============================================================================

// Export everything from the new playerStats module
export * from './playerStats';

// Re-export hooks explicitly for convenience
export {
  usePlayerStats,
  usePlayerStatsById,
  usePlayerStatsByPosition,
  prefetchPlayerStats,
  prefetchPlayerStatsByPosition,
  prefetchAllPositions,
} from './playerStats';

// ============================================================================
// LEGACY TYPE ALIASES (for backward compatibility)
// ============================================================================

// These re-exports ensure that code using the old type names continues to work
export type {
  PassingStats,
  RushingStats,
  ReceivingStats,
  ScrimmageStats,
  FantasyStats,
  SeasonStats,
  CareerStats,
  PositionCounts,
} from './playerStats/types';

// Legacy PlayerStats type (now LegacyPlayerStats in the new module)
export type { LegacyPlayerStats as PlayerStats } from './playerStats/types';
export type { LegacyStatsMetadata as StatsMetadata } from './playerStats/types';
export type { LegacyStaticPlayerStatsData as StaticPlayerStatsData } from './playerStats/types';

// ============================================================================
// LEGACY DATA AND FUNCTIONS (for backward compatibility)
// ============================================================================

import {
  STATIC_PLAYER_STATS as _STATIC_PLAYER_STATS,
  getPlayerStats as _getPlayerStats,
  hasPlayerStats as _hasPlayerStats,
  getStatsMetadata as _getStatsMetadata,
  getPlayerCountByPosition as _getPlayerCountByPosition,
} from './playerStats';

// Re-export legacy data and functions
export const STATIC_PLAYER_STATS = _STATIC_PLAYER_STATS;
export const getPlayerStats = _getPlayerStats;
export const hasPlayerStats = _hasPlayerStats;
export const getStatsMetadata = _getStatsMetadata;
export const getPlayerCountByPosition = _getPlayerCountByPosition;

// ============================================================================
// COMMONJS EXPORTS (for backward compatibility with require())
// ============================================================================

module.exports = {
  STATIC_PLAYER_STATS,
  getPlayerStats,
  hasPlayerStats,
  getStatsMetadata,
  getPlayerCountByPosition,
  // Also export hooks for CommonJS consumers
  usePlayerStats: require('./playerStats').usePlayerStats,
  usePlayerStatsById: require('./playerStats').usePlayerStatsById,
  usePlayerStatsByPosition: require('./playerStats').usePlayerStatsByPosition,
  prefetchPlayerStats: require('./playerStats').prefetchPlayerStats,
  prefetchPlayerStatsByPosition: require('./playerStats').prefetchPlayerStatsByPosition,
  prefetchAllPositions: require('./playerStats').prefetchAllPositions,
};
