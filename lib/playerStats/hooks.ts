/**
 * Player Stats SWR Hooks
 *
 * React hooks for fetching player statistics from the API with:
 * - SWR for caching and revalidation
 * - localStorage persistence for offline support
 * - Prefetching for improved UX
 */

import useSWR, { SWRConfiguration, mutate } from 'swr';

import type {
  AllPlayerStatsResponse,
  PlayerStatsResponse,
  PlayersByPositionResponse,
  PlayerPosition,
  LegacyPlayerStats,
  LegacyStaticPlayerStatsData,
  PositionCounts,
} from './types';

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * SWR configuration for player stats
 * - 1 hour stale time (matching edge cache)
 * - 24 hour cache time
 * - Retry twice on error
 * - Revalidate on focus (but not too aggressively)
 */
const SWR_CONFIG: SWRConfiguration = {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  dedupingInterval: 60000, // 1 minute
  errorRetryCount: 2,
  errorRetryInterval: 5000,
  // Keep data fresh for 1 hour
  refreshInterval: 0, // Don't auto-refresh (edge cache handles freshness)
};

// Local storage key for persistence
const STORAGE_KEY = 'playerStats_cache';
const STORAGE_VERSION = '1';

// ============================================================================
// FETCHER
// ============================================================================

/**
 * Generic fetcher for SWR
 */
async function fetcher<T>(url: string): Promise<T> {
  const res = await fetch(url);

  if (!res.ok) {
    const error = new Error('Failed to fetch player stats');
    (error as Error & { status: number }).status = res.status;
    throw error;
  }

  return res.json();
}

// ============================================================================
// LOCAL STORAGE PERSISTENCE
// ============================================================================

interface StoredCache {
  version: string;
  timestamp: number;
  data: AllPlayerStatsResponse;
}

/**
 * Get cached data from localStorage
 */
function getFromStorage(): AllPlayerStatsResponse | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    const parsed: StoredCache = JSON.parse(stored);

    // Check version
    if (parsed.version !== STORAGE_VERSION) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    // Check if cache is still valid (24 hours)
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours in ms
    if (Date.now() - parsed.timestamp > maxAge) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    return parsed.data;
  } catch {
    return null;
  }
}

/**
 * Save data to localStorage
 */
function saveToStorage(data: AllPlayerStatsResponse): void {
  if (typeof window === 'undefined') return;

  try {
    const cache: StoredCache = {
      version: STORAGE_VERSION,
      timestamp: Date.now(),
      data,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch {
    // Ignore storage errors (quota exceeded, etc.)
  }
}

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook to fetch all player stats
 *
 * Uses SWR with localStorage fallback for instant loading.
 *
 * @example
 * ```tsx
 * const { data, error, isLoading } = usePlayerStats();
 * if (isLoading) return <Skeleton />;
 * if (error) return <Error />;
 * return <PlayerList players={data.players} />;
 * ```
 */
export function usePlayerStats() {
  const cachedData = getFromStorage();

  const { data, error, isLoading, isValidating } = useSWR<AllPlayerStatsResponse>(
    '/api/players/stats',
    fetcher,
    {
      ...SWR_CONFIG,
      fallbackData: cachedData || undefined,
      onSuccess: (data) => {
        saveToStorage(data);
      },
    }
  );

  return {
    data,
    error,
    isLoading: isLoading && !cachedData,
    isValidating,
    // Helper to check if data is from cache
    isCached: !isLoading && !!cachedData && !data?.metadata?.cacheHit,
  };
}

/**
 * Hook to fetch a single player's stats
 *
 * @param playerId - Normalized player ID (e.g., 'josh_allen')
 *
 * @example
 * ```tsx
 * const { data, error, isLoading } = usePlayerStatsById('josh_allen');
 * ```
 */
export function usePlayerStatsById(playerId: string | null) {
  const { data, error, isLoading, isValidating } = useSWR<PlayerStatsResponse>(
    playerId ? `/api/players/stats/${playerId}` : null,
    fetcher,
    SWR_CONFIG
  );

  return {
    data,
    error,
    isLoading,
    isValidating,
  };
}

/**
 * Hook to fetch players by position
 *
 * @param position - Position to filter by (QB, RB, WR, TE)
 *
 * @example
 * ```tsx
 * const { data, error, isLoading } = usePlayerStatsByPosition('QB');
 * ```
 */
export function usePlayerStatsByPosition(position: PlayerPosition | null) {
  const { data, error, isLoading, isValidating } = useSWR<PlayersByPositionResponse>(
    position ? `/api/players/stats/position/${position}` : null,
    fetcher,
    SWR_CONFIG
  );

  return {
    data,
    error,
    isLoading,
    isValidating,
  };
}

// ============================================================================
// PREFETCHING
// ============================================================================

/**
 * Prefetch all player stats (call on draft room entry)
 *
 * This starts fetching data before the modal opens for instant loading.
 *
 * @example
 * ```tsx
 * // In draft room page
 * useEffect(() => {
 *   prefetchPlayerStats();
 * }, []);
 * ```
 */
export function prefetchPlayerStats(): void {
  mutate('/api/players/stats', fetcher('/api/players/stats'), { revalidate: false });
}

/**
 * Prefetch players by position
 */
export function prefetchPlayerStatsByPosition(position: PlayerPosition): void {
  const url = `/api/players/stats/position/${position}`;
  mutate(url, fetcher(url), { revalidate: false });
}

/**
 * Prefetch all positions (for draft room)
 */
export function prefetchAllPositions(): void {
  const positions: PlayerPosition[] = ['QB', 'RB', 'WR', 'TE'];
  positions.forEach((pos) => prefetchPlayerStatsByPosition(pos));
}

// ============================================================================
// LEGACY COMPATIBILITY HELPERS
// ============================================================================

/**
 * Convert API response to legacy format for backward compatibility
 */
export function toLegacyFormat(data: AllPlayerStatsResponse): LegacyStaticPlayerStatsData {
  const players: Record<string, LegacyPlayerStats> = {};

  Object.entries(data.players).forEach(([name, player]) => {
    players[name] = {
      name: player.name,
      position: player.position,
      team: player.team,
      seasons: player.seasons,
      career: player.career,
      databaseId: player.databaseId,
      draftkingsRank: player.draftkingsRank,
      draftkingsADP: player.draftkingsADP,
      clayRank: player.clayRank,
      clayLastUpdated: player.clayLastUpdated,
    };
  });

  return {
    metadata: {
      generatedAt: data.metadata.lastUpdated,
      totalPlayers: data.metadata.totalPlayers,
      successfulFetches: data.metadata.totalPlayers,
      failedFetches: 0,
      version: data.metadata.version,
      source: data.metadata.source,
    },
    players,
  };
}

/**
 * Get player stats by name from API response
 */
export function getPlayerFromResponse(
  data: AllPlayerStatsResponse | undefined,
  playerName: string
): LegacyPlayerStats | null {
  if (!data?.players[playerName]) return null;

  const player = data.players[playerName];
  return {
    name: player.name,
    position: player.position,
    team: player.team,
    seasons: player.seasons,
    career: player.career,
    databaseId: player.databaseId,
    draftkingsRank: player.draftkingsRank,
    draftkingsADP: player.draftkingsADP,
    clayRank: player.clayRank,
    clayLastUpdated: player.clayLastUpdated,
  };
}

/**
 * Get position counts from API response
 */
export function getPositionCounts(data: AllPlayerStatsResponse | undefined): PositionCounts {
  const counts: PositionCounts = { QB: 0, RB: 0, WR: 0, TE: 0 };

  if (!data?.players) return counts;

  Object.values(data.players).forEach((player) => {
    const pos = player.position;
    if (pos in counts) {
      counts[pos]++;
    } else {
      counts[pos] = (counts[pos] || 0) + 1;
    }
  });

  return counts;
}
