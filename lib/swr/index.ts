/**
 * SWR Module - Data Fetching with Caching
 * 
 * Exports all SWR configuration and hooks for player data.
 * 
 * Usage:
 *   import { useHeadshots, useADP, swrConfig } from '@/lib/swr';
 */

// Configuration
export { 
  fetcher, 
  fetcherWithOptions,
  postFetcher,
  swrConfig,
  CACHE_TIMES,
  API_ENDPOINTS,
  type FetchError,
  type CacheTimeKey,
  type ApiEndpointKey,
  type ApiEndpointValue,
} from './config';

// Player data hooks
export {
  useHeadshots,
  usePlayers,
  useProjections,
  useSeasonStats,
  useADP,
  useInjuries,
  useNews,
  useTeams,
  useByeWeeks,
  usePlayerDataCombined,
  prefetchPlayerData,
} from './usePlayerSWR';

// Re-export default config for SWRConfig provider
export { default as swrConfigDefault } from './config';

