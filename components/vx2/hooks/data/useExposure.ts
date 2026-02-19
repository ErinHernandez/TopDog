/**
 * useExposure - Data hook for player exposure data
 * 
 * Provides player exposure across user's teams with filtering and sorting.
 * Currently uses mock data, designed for easy API integration.
 * 
 * @example
 * ```tsx
 * const { players, isLoading, error, refetch } = useExposure();
 * ```
 */

import { useState, useEffect, useCallback, useMemo } from 'react';

import type { Position } from './useMyTeams';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Player exposure data
 */
export interface ExposurePlayer {
  /** Unique identifier */
  id: string;
  /** Player name */
  name: string;
  /** Position */
  position: Position;
  /** NFL team abbreviation */
  team: string;
  /** Exposure percentage (0-100) */
  exposure: number;
  /** Number of teams player is on */
  teams: number;
  /** Average draft position */
  adp: number;
}

/**
 * Sort options
 */
export type ExposureSortBy = 'exposure' | 'adp' | 'name' | 'teams';
export type SortOrder = 'asc' | 'desc';

/**
 * Filter options
 */
export interface ExposureFilters {
  /** Filter by positions (empty = all) */
  positions: Position[];
  /** Search query */
  searchQuery: string;
}

/**
 * Hook options
 */
export interface UseExposureOptions {
  /** Initial sort field */
  initialSortBy?: ExposureSortBy;
  /** Initial sort order */
  initialSortOrder?: SortOrder;
}

/**
 * Hook return type
 */
export interface UseExposureResult {
  /** Filtered and sorted players */
  players: ExposurePlayer[];
  /** All players (unfiltered) */
  allPlayers: ExposurePlayer[];
  /** Whether data is loading */
  isLoading: boolean;
  /** Error message if fetch failed */
  error: string | null;
  /** Refetch function */
  refetch: () => Promise<void>;
  /** Whether a refetch is in progress */
  isRefetching: boolean;
  /** Current filters */
  filters: ExposureFilters;
  /** Update filters */
  setFilters: (filters: Partial<ExposureFilters>) => void;
  /** Current sort field */
  sortBy: ExposureSortBy;
  /** Current sort order */
  sortOrder: SortOrder;
  /** Update sort */
  setSort: (sortBy: ExposureSortBy, order?: SortOrder) => void;
  /** Toggle sort order */
  toggleSortOrder: () => void;
  /** Summary stats */
  stats: {
    totalPlayers: number;
    averageExposure: number;
    maxExposure: number;
  };
}

// ============================================================================
// MOCK DATA
// ============================================================================

const MOCK_EXPOSURE: ExposurePlayer[] = [
  { id: '1', name: "Ja'Marr Chase", position: 'WR', team: 'CIN', exposure: 52.0, teams: 78, adp: 2.1 },
  { id: '2', name: 'CeeDee Lamb', position: 'WR', team: 'DAL', exposure: 47.3, teams: 71, adp: 3.4 },
  { id: '3', name: 'Amon-Ra St. Brown', position: 'WR', team: 'DET', exposure: 44.7, teams: 67, adp: 4.8 },
  { id: '4', name: 'Bijan Robinson', position: 'RB', team: 'ATL', exposure: 38.7, teams: 58, adp: 1.8 },
  { id: '5', name: 'Breece Hall', position: 'RB', team: 'NYJ', exposure: 36.0, teams: 54, adp: 6.2 },
  { id: '6', name: 'Garrett Wilson', position: 'WR', team: 'NYJ', exposure: 34.7, teams: 52, adp: 11.3 },
  { id: '7', name: 'Tyreek Hill', position: 'WR', team: 'MIA', exposure: 33.3, teams: 50, adp: 8.7 },
  { id: '8', name: 'Puka Nacua', position: 'WR', team: 'LAR', exposure: 31.3, teams: 47, adp: 9.4 },
  { id: '9', name: 'Travis Kelce', position: 'TE', team: 'KC', exposure: 28.7, teams: 43, adp: 18.5 },
  { id: '10', name: 'Josh Allen', position: 'QB', team: 'BUF', exposure: 27.3, teams: 41, adp: 24.1 },
  { id: '11', name: 'Saquon Barkley', position: 'RB', team: 'PHI', exposure: 26.0, teams: 39, adp: 5.2 },
  { id: '12', name: 'Davante Adams', position: 'WR', team: 'NYJ', exposure: 24.7, teams: 37, adp: 16.8 },
  { id: '13', name: 'Chris Olave', position: 'WR', team: 'NO', exposure: 23.3, teams: 35, adp: 22.4 },
  { id: '14', name: 'Jahmyr Gibbs', position: 'RB', team: 'DET', exposure: 22.0, teams: 33, adp: 7.1 },
  { id: '15', name: 'Sam LaPorta', position: 'TE', team: 'DET', exposure: 21.3, teams: 32, adp: 38.6 },
  { id: '16', name: 'Jalen Hurts', position: 'QB', team: 'PHI', exposure: 19.3, teams: 29, adp: 31.2 },
  { id: '17', name: 'DeVonta Smith', position: 'WR', team: 'PHI', exposure: 18.7, teams: 28, adp: 28.9 },
  { id: '18', name: 'Jonathan Taylor', position: 'RB', team: 'IND', exposure: 18.0, teams: 27, adp: 12.4 },
  { id: '19', name: 'Drake London', position: 'WR', team: 'ATL', exposure: 17.3, teams: 26, adp: 35.7 },
  { id: '20', name: 'Mark Andrews', position: 'TE', team: 'BAL', exposure: 16.7, teams: 25, adp: 42.3 },
  { id: '21', name: 'Lamar Jackson', position: 'QB', team: 'BAL', exposure: 16.0, teams: 24, adp: 45.8 },
  { id: '22', name: 'Kyren Williams', position: 'RB', team: 'LAR', exposure: 15.3, teams: 23, adp: 14.6 },
  { id: '23', name: 'George Pickens', position: 'WR', team: 'PIT', exposure: 14.7, teams: 22, adp: 33.1 },
  { id: '24', name: 'Patrick Mahomes', position: 'QB', team: 'KC', exposure: 14.0, teams: 21, adp: 52.4 },
  { id: '25', name: 'Dalton Kincaid', position: 'TE', team: 'BUF', exposure: 13.3, teams: 20, adp: 58.7 },
  { id: '26', name: "De'Von Achane", position: 'RB', team: 'MIA', exposure: 12.7, teams: 19, adp: 19.3 },
  { id: '27', name: 'Rashee Rice', position: 'WR', team: 'KC', exposure: 12.0, teams: 18, adp: 41.2 },
  { id: '28', name: 'Travis Etienne', position: 'RB', team: 'JAX', exposure: 11.3, teams: 17, adp: 21.8 },
  { id: '29', name: 'Zay Flowers', position: 'WR', team: 'BAL', exposure: 10.7, teams: 16, adp: 47.5 },
  { id: '30', name: 'Anthony Richardson', position: 'QB', team: 'IND', exposure: 10.0, teams: 15, adp: 68.3 },
];

// ============================================================================
// MOCK FETCH
// ============================================================================

async function fetchExposure(): Promise<ExposurePlayer[]> {
  await new Promise(resolve => setTimeout(resolve, 180 + Math.random() * 120));
  return MOCK_EXPOSURE;
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook for fetching and managing player exposure data
 */
export function useExposure(options: UseExposureOptions = {}): UseExposureResult {
  const { initialSortBy = 'exposure', initialSortOrder = 'desc' } = options;

  const [allPlayers, setAllPlayers] = useState<ExposurePlayer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefetching, setIsRefetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [filters, setFiltersState] = useState<ExposureFilters>({
    positions: [],
    searchQuery: '',
  });
  
  const [sortBy, setSortBy] = useState<ExposureSortBy>(initialSortBy);
  const [sortOrder, setSortOrder] = useState<SortOrder>(initialSortOrder);

  const fetchData = useCallback(async (isRefetch = false) => {
    try {
      if (isRefetch) {
        setIsRefetching(true);
      } else {
        setIsLoading(true);
      }
      setError(null);
      
      const data = await fetchExposure();
      setAllPlayers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
      setIsRefetching(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(async () => {
    await fetchData(true);
  }, [fetchData]);

  // Filter and sort players
  const players = useMemo(() => {
    let result = [...allPlayers];
    
    // Apply position filter
    if (filters.positions.length > 0) {
      result = result.filter(p => filters.positions.includes(p.position));
    }
    
    // Apply search filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      result = result.filter(p => 
        (p.name?.toLowerCase() || '').includes(query) ||
        (p.team?.toLowerCase() || '').includes(query) ||
        (p.position?.toLowerCase() || '').includes(query)
      );
    }
    
    // Apply sort
    result.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'exposure':
          comparison = a.exposure - b.exposure;
          break;
        case 'adp':
          comparison = a.adp - b.adp;
          break;
        case 'name':
          comparison = (a.name || '').localeCompare(b.name || '');
          break;
        case 'teams':
          comparison = a.teams - b.teams;
          break;
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });
    
    return result;
  }, [allPlayers, filters, sortBy, sortOrder]);

  // Calculate stats
  const stats = useMemo(() => {
    if (allPlayers.length === 0) {
      return { totalPlayers: 0, averageExposure: 0, maxExposure: 0 };
    }
    let total = 0;
    let max = 0;
    for (const p of allPlayers) {
      total += p.exposure;
      if (p.exposure > max) max = p.exposure;
    }
    return {
      totalPlayers: allPlayers.length,
      averageExposure: Math.round(total / allPlayers.length * 10) / 10,
      maxExposure: max,
    };
  }, [allPlayers]);

  const setFilters = useCallback((newFilters: Partial<ExposureFilters>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }));
  }, []);

  const setSort = useCallback((newSortBy: ExposureSortBy, order?: SortOrder) => {
    setSortBy(newSortBy);
    if (order) setSortOrder(order);
  }, []);

  const toggleSortOrder = useCallback(() => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  }, []);

  return {
    players,
    allPlayers,
    isLoading,
    error,
    refetch,
    isRefetching,
    filters,
    setFilters,
    sortBy,
    sortOrder,
    setSort,
    toggleSortOrder,
    stats,
  };
}

export default useExposure;

