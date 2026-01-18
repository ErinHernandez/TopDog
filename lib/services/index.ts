/**
 * Services Index
 *
 * Central export point for all service modules.
 *
 * @example
 * import {
 *   getAvailablePlayers,
 *   getDraftPicks,
 *   batchGetUserPicks
 * } from '@/lib/services';
 */

export {
  getAvailablePlayers,
  getTopAvailableByPosition,
  clearPlayerCache,
  getPlayerCacheStats,
  type Player,
  type PlayerQueryOptions,
} from './playerService';

export {
  getDraftPicks,
  getDraftedPlayerIds,
  batchGetUserPicks,
  countPositionsForParticipant,
  type DraftPick,
  type GetPicksOptions,
} from './draftPicksService';
