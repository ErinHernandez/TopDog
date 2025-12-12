/**
 * SWR Hooks for Player Data
 * 
 * Custom hooks for fetching and caching player data using SWR.
 * Replaces manual useEffect fetching with automatic caching,
 * deduplication, and revalidation.
 * 
 * Usage:
 *   import { useHeadshots, usePlayerStats, useADP } from '@/lib/swr/usePlayerSWR';
 *   
 *   const { headshots, isLoading, error } = useHeadshots();
 *   const { stats, isLoading } = useSeasonStats({ position: 'QB' });
 */

import useSWR, { type KeyedMutator } from 'swr';
import useSWRImmutable from 'swr/immutable';
import { API_ENDPOINTS, CACHE_TIMES, fetcher } from './config';

import type { FantasyPosition, NFLTeam, InjuryReport, PlayerNews, NFLTeamInfo } from '@/types/player';
import type { TransformedPlayerStats, TransformedADP } from '@/types/api';


// ============================================================================
// SHARED TYPES
// ============================================================================

/** Player with headshot (from API) */
interface PlayerWithHeadshot {
  playerId: number;
  name: string;
  team: string;
  position: string;
  headshotUrl: string | null;
  number?: number | null;
}

/** Base SWR return type */
interface BaseSWRReturn<T> {
  isLoading: boolean;
  isValidating: boolean;
  error: Error | undefined;
  mutate: KeyedMutator<T>;
}


// ============================================================================
// HOOK OPTIONS TYPES
// ============================================================================

interface HeadshotsOptions {
  position?: FantasyPosition | string;
  team?: NFLTeam | string;
  enabled?: boolean;
}

interface PlayersOptions {
  position?: FantasyPosition | string;
  team?: NFLTeam | string;
  search?: string;
  limit?: number;
  enabled?: boolean;
}

interface ProjectionsOptions {
  position?: FantasyPosition | string;
  limit?: number;
  enabled?: boolean;
}

interface SeasonStatsOptions {
  season?: number;
  position?: FantasyPosition | string;
  team?: NFLTeam | string;
  limit?: number;
  sort?: 'ppr' | 'half' | 'standard' | 'yards' | 'tds' | 'receptions';
  enabled?: boolean;
}

interface ADPOptions {
  position?: FantasyPosition | string;
  limit?: number;
  scoring?: 'ppr' | 'standard';
  name?: string;
  enabled?: boolean;
}

interface InjuriesOptions {
  team?: NFLTeam | string;
  enabled?: boolean;
}

interface NewsOptions {
  playerName?: string;
  team?: NFLTeam | string;
  limit?: number;
  enabled?: boolean;
}

interface TeamsOptions {
  enabled?: boolean;
}

interface ByeWeeksOptions {
  season?: number;
  enabled?: boolean;
}

interface PlayerDataCombinedOptions {
  includeStats?: boolean;
  position?: FantasyPosition | string;
  enabled?: boolean;
}


// ============================================================================
// HOOK RETURN TYPES
// ============================================================================

interface UseHeadshotsReturn extends BaseSWRReturn<PlayerWithHeadshot[]> {
  headshots: PlayerWithHeadshot[];
  headshotsMap: Record<string, string>;
}

interface UsePlayersReturn extends BaseSWRReturn<PlayerWithHeadshot[]> {
  players: PlayerWithHeadshot[];
}

interface UseProjectionsReturn extends BaseSWRReturn<unknown[]> {
  projections: unknown[];
}

interface UseSeasonStatsReturn extends BaseSWRReturn<TransformedPlayerStats[]> {
  stats: TransformedPlayerStats[];
}

interface UseADPReturn extends BaseSWRReturn<TransformedADP[]> {
  adp: TransformedADP[];
}

interface UseInjuriesReturn extends BaseSWRReturn<InjuryReport[]> {
  injuries: InjuryReport[];
  injuriesMap: Record<string, InjuryReport>;
}

interface UseNewsReturn extends BaseSWRReturn<PlayerNews[]> {
  news: PlayerNews[];
}

interface UseTeamsReturn extends BaseSWRReturn<NFLTeamInfo[]> {
  teams: NFLTeamInfo[];
  teamsMap: Record<string, NFLTeamInfo>;
}

interface ByeWeekItem {
  team?: string;
  Team?: string;
  bye?: number;
  Week?: number;
}

interface UseByeWeeksReturn extends BaseSWRReturn<ByeWeekItem[]> {
  byeWeeks: ByeWeekItem[];
  byeWeeksMap: Record<string, number>;
}

interface UsePlayerDataCombinedReturn {
  headshots: PlayerWithHeadshot[];
  headshotsMap: Record<string, string>;
  adp: TransformedADP[];
  stats: TransformedPlayerStats[];
  isLoading: boolean;
  isValidating: boolean;
  error: Error | undefined;
  mutate: {
    headshots: KeyedMutator<PlayerWithHeadshot[]>;
    adp: KeyedMutator<TransformedADP[]>;
    stats: KeyedMutator<TransformedPlayerStats[]>;
  };
}


// ============================================================================
// HEADSHOTS HOOK
// ============================================================================

/**
 * Fetch player headshots
 * Uses immutable SWR - headshots are taken before the season and never change
 * Data is fetched once and cached permanently until page refresh
 */
export function useHeadshots(options: HeadshotsOptions = {}): UseHeadshotsReturn {
  const { position, team, enabled = true } = options;
  
  // Build query string
  const params = new URLSearchParams();
  if (position) params.append('position', position);
  if (team) params.append('team', team);
  
  const queryString = params.toString();
  const url = enabled 
    ? `${API_ENDPOINTS.HEADSHOTS}${queryString ? `?${queryString}` : ''}`
    : null;
  
  // useSWRImmutable = never revalidates automatically
  const { data, error, isLoading, isValidating, mutate } = useSWRImmutable<PlayerWithHeadshot[]>(
    url,
    fetcher
  );
  
  // Create lookup map by player name
  const headshotsMap: Record<string, string> = {};
  if (data) {
    data.forEach(player => {
      if (player.name && player.headshotUrl) {
        headshotsMap[player.name] = player.headshotUrl;
      }
    });
  }
  
  return {
    headshots: data || [],
    headshotsMap,
    isLoading,
    isValidating,
    error,
    mutate,
  };
}


// ============================================================================
// PLAYERS HOOK
// ============================================================================

/**
 * Fetch player list
 */
export function usePlayers(options: PlayersOptions = {}): UsePlayersReturn {
  const { position, team, search, limit, enabled = true } = options;
  
  const params = new URLSearchParams();
  if (position) params.append('position', position);
  if (team) params.append('team', team);
  if (search) params.append('search', search);
  if (limit) params.append('limit', String(limit));
  
  const queryString = params.toString();
  const url = enabled
    ? `${API_ENDPOINTS.PLAYERS}${queryString ? `?${queryString}` : ''}`
    : null;
  
  const { data, error, isLoading, isValidating, mutate } = useSWR<PlayerWithHeadshot[]>(
    url,
    fetcher,
    {
      dedupingInterval: CACHE_TIMES.PLAYERS,
      revalidateOnFocus: false,
    }
  );
  
  return {
    players: data || [],
    isLoading,
    isValidating,
    error,
    mutate,
  };
}


// ============================================================================
// PROJECTIONS HOOK
// ============================================================================

/**
 * Fetch player projections
 */
export function useProjections(options: ProjectionsOptions = {}): UseProjectionsReturn {
  const { position, limit, enabled = true } = options;
  
  const params = new URLSearchParams();
  if (position) params.append('position', position);
  if (limit) params.append('limit', String(limit));
  
  const queryString = params.toString();
  const url = enabled
    ? `${API_ENDPOINTS.PROJECTIONS}${queryString ? `?${queryString}` : ''}`
    : null;
  
  const { data, error, isLoading, isValidating, mutate } = useSWR<unknown[]>(
    url,
    fetcher,
    {
      dedupingInterval: CACHE_TIMES.PROJECTIONS,
      revalidateOnFocus: false,
    }
  );
  
  return {
    projections: data || [],
    isLoading,
    isValidating,
    error,
    mutate,
  };
}


// ============================================================================
// SEASON STATS HOOK
// ============================================================================

/**
 * Fetch player season stats
 */
export function useSeasonStats(options: SeasonStatsOptions = {}): UseSeasonStatsReturn {
  const { season, position, team, limit = 50, sort = 'ppr', enabled = true } = options;
  
  const params = new URLSearchParams();
  if (season) params.append('season', String(season));
  if (position) params.append('position', position);
  if (team) params.append('team', team);
  if (limit) params.append('limit', String(limit));
  if (sort) params.append('sort', sort);
  
  const queryString = params.toString();
  const url = enabled
    ? `${API_ENDPOINTS.SEASON_STATS}${queryString ? `?${queryString}` : ''}`
    : null;
  
  const { data, error, isLoading, isValidating, mutate } = useSWR<TransformedPlayerStats[]>(
    url,
    fetcher,
    {
      dedupingInterval: CACHE_TIMES.SEASON_STATS,
      revalidateOnFocus: false,
    }
  );
  
  return {
    stats: data || [],
    isLoading,
    isValidating,
    error,
    mutate,
  };
}


// ============================================================================
// ADP HOOK
// ============================================================================

/**
 * Fetch Average Draft Position data
 */
export function useADP(options: ADPOptions = {}): UseADPReturn {
  const { position, limit = 100, scoring = 'ppr', name, enabled = true } = options;
  
  const params = new URLSearchParams();
  if (position) params.append('position', position);
  if (limit) params.append('limit', String(limit));
  if (scoring) params.append('scoring', scoring);
  if (name) params.append('name', name);
  
  const queryString = params.toString();
  const url = enabled
    ? `${API_ENDPOINTS.ADP}${queryString ? `?${queryString}` : ''}`
    : null;
  
  const { data, error, isLoading, isValidating, mutate } = useSWR<TransformedADP[]>(
    url,
    fetcher,
    {
      dedupingInterval: CACHE_TIMES.ADP,
      revalidateOnFocus: false,
    }
  );
  
  return {
    adp: data || [],
    isLoading,
    isValidating,
    error,
    mutate,
  };
}


// ============================================================================
// INJURIES HOOK
// ============================================================================

/**
 * Fetch injury reports
 * Uses shorter cache since injury status changes frequently
 */
export function useInjuries(options: InjuriesOptions = {}): UseInjuriesReturn {
  const { team, enabled = true } = options;
  
  const params = new URLSearchParams();
  if (team) params.append('team', team);
  
  const queryString = params.toString();
  const url = enabled
    ? `${API_ENDPOINTS.INJURIES}${queryString ? `?${queryString}` : ''}`
    : null;
  
  const { data, error, isLoading, isValidating, mutate } = useSWR<InjuryReport[]>(
    url,
    fetcher,
    {
      dedupingInterval: CACHE_TIMES.INJURIES,
      refreshInterval: CACHE_TIMES.INJURIES, // Auto-refresh
      revalidateOnFocus: true,
    }
  );
  
  // Create lookup map by player name
  const injuriesMap: Record<string, InjuryReport> = {};
  if (data) {
    data.forEach(injury => {
      if (injury.name) {
        injuriesMap[injury.name] = injury;
      }
    });
  }
  
  return {
    injuries: data || [],
    injuriesMap,
    isLoading,
    isValidating,
    error,
    mutate,
  };
}


// ============================================================================
// NEWS HOOK
// ============================================================================

/**
 * Fetch player news
 * Uses short cache for fresh updates
 */
export function useNews(options: NewsOptions = {}): UseNewsReturn {
  const { playerName, team, limit = 20, enabled = true } = options;
  
  const params = new URLSearchParams();
  if (playerName) params.append('player', playerName);
  if (team) params.append('team', team);
  if (limit) params.append('limit', String(limit));
  
  const queryString = params.toString();
  const url = enabled
    ? `${API_ENDPOINTS.NEWS}${queryString ? `?${queryString}` : ''}`
    : null;
  
  const { data, error, isLoading, isValidating, mutate } = useSWR<PlayerNews[]>(
    url,
    fetcher,
    {
      dedupingInterval: CACHE_TIMES.NEWS,
      refreshInterval: CACHE_TIMES.NEWS, // Auto-refresh
      revalidateOnFocus: true,
    }
  );
  
  return {
    news: data || [],
    isLoading,
    isValidating,
    error,
    mutate,
  };
}


// ============================================================================
// TEAMS HOOK
// ============================================================================

/**
 * Fetch NFL teams
 * Uses immutable SWR since teams rarely change
 */
export function useTeams(options: TeamsOptions = {}): UseTeamsReturn {
  const { enabled = true } = options;
  
  const { data, error, isLoading, isValidating, mutate } = useSWRImmutable<NFLTeamInfo[]>(
    enabled ? API_ENDPOINTS.TEAMS : null,
    fetcher
  );
  
  // Create lookup map by team abbreviation
  const teamsMap: Record<string, NFLTeamInfo> = {};
  if (data) {
    data.forEach(team => {
      const key = team.key || '';
      if (key) {
        teamsMap[key] = team;
      }
    });
  }
  
  return {
    teams: data || [],
    teamsMap,
    isLoading,
    isValidating,
    error,
    mutate,
  };
}


// ============================================================================
// BYE WEEKS HOOK
// ============================================================================

/**
 * Fetch bye weeks
 * Uses immutable SWR since bye weeks don't change within a season
 */
export function useByeWeeks(options: ByeWeeksOptions = {}): UseByeWeeksReturn {
  const { season, enabled = true } = options;
  
  const params = new URLSearchParams();
  if (season) params.append('season', String(season));
  
  const queryString = params.toString();
  const url = enabled
    ? `${API_ENDPOINTS.BYE_WEEKS}${queryString ? `?${queryString}` : ''}`
    : null;
  
  const { data, error, isLoading, isValidating, mutate } = useSWRImmutable<ByeWeekItem[]>(
    url,
    fetcher
  );
  
  // Create lookup map by team abbreviation
  const byeWeeksMap: Record<string, number> = {};
  if (data) {
    data.forEach(item => {
      const teamKey = item.team || item.Team;
      const byeWeek = item.bye || item.Week;
      if (teamKey && byeWeek !== undefined) {
        byeWeeksMap[teamKey] = byeWeek;
      }
    });
  }
  
  return {
    byeWeeks: data || [],
    byeWeeksMap,
    isLoading,
    isValidating,
    error,
    mutate,
  };
}


// ============================================================================
// COMBINED PLAYER DATA HOOK
// ============================================================================

/**
 * Fetch all essential player data in parallel
 * Combines headshots, ADP, and optionally stats
 */
export function usePlayerDataCombined(options: PlayerDataCombinedOptions = {}): UsePlayerDataCombinedReturn {
  const { includeStats = false, position, enabled = true } = options;
  
  const headshots = useHeadshots({ position, enabled });
  const adp = useADP({ position, enabled });
  const stats = useSeasonStats({ 
    position, 
    enabled: enabled && includeStats 
  });
  
  const isLoading = headshots.isLoading || adp.isLoading || (includeStats && stats.isLoading);
  const isValidating = headshots.isValidating || adp.isValidating || (includeStats && stats.isValidating);
  const error = headshots.error || adp.error || stats.error;
  
  return {
    headshots: headshots.headshots,
    headshotsMap: headshots.headshotsMap,
    adp: adp.adp,
    stats: stats.stats,
    isLoading,
    isValidating,
    error,
    mutate: {
      headshots: headshots.mutate,
      adp: adp.mutate,
      stats: stats.mutate,
    },
  };
}


// ============================================================================
// PREFETCH UTILITIES
// ============================================================================

/**
 * Prefetch player data for faster initial load
 * Call this on app startup or route prefetch
 */
export async function prefetchPlayerData(): Promise<void> {
  const endpoints = [
    API_ENDPOINTS.HEADSHOTS,
    API_ENDPOINTS.ADP,
  ];
  
  await Promise.allSettled(
    endpoints.map(url => fetcher(url))
  );
}


// ============================================================================
// DEFAULT EXPORT
// ============================================================================

const playerSWRHooks = {
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
};

export default playerSWRHooks;

