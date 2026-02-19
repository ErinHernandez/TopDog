/**
 * useAvailablePlayers - Available player pool hook
 * 
 * Manages the available player pool with filtering, sorting, and search.
 * Integrates with lib/playerPool for static data and lib/adp for live ADP.
 * 
 * @example
 * ```tsx
 * const { 
 *   filteredPlayers, 
 *   togglePositionFilter, 
 *   searchQuery,
 *   setSearchQuery 
 * } = useAvailablePlayers({
 *   pickedPlayerIds: picks.map(p => p.player.id),
 * });
 * ```
 */

import { useState, useEffect, useMemo, useCallback } from 'react';

import type { PlayerADP } from '../../../../lib/adp/types';
import { useLiveADP } from '../../../../lib/adp/useADP';
import type { PoolPlayer } from '../../../../lib/playerPool/types';
import { usePlayerPool } from '../../../../lib/playerPool/usePlayerPool';
import type { DraftPlayer, Position, PlayerSortOption } from '../types';
import { generatePlayerId, playerMatchesSearch } from '../utils';

// ============================================================================
// TYPES
// ============================================================================

export interface UseAvailablePlayersOptions {
  /** IDs of players that have been picked */
  pickedPlayerIds?: string[];
  /** Initial sort option */
  initialSort?: PlayerSortOption;
  /** Initial position filters */
  initialFilters?: Position[];
}

export interface UseAvailablePlayersResult {
  /** All available players (not yet picked) */
  players: DraftPlayer[];
  /** Filtered and sorted players */
  filteredPlayers: DraftPlayer[];
  /** Total count of available players */
  totalCount: number;
  /** Count after filtering */
  filteredCount: number;
  
  /** Loading state */
  isLoading: boolean;
  /** Error message */
  error: string | null;
  
  /** Active position filters */
  positionFilters: Position[];
  /** Toggle a position filter */
  togglePositionFilter: (position: Position) => void;
  /** Clear all position filters */
  clearPositionFilters: () => void;
  /** Set all position filters at once */
  setPositionFilters: (positions: Position[]) => void;
  
  /** Current search query */
  searchQuery: string;
  /** Set search query */
  setSearchQuery: (query: string) => void;
  
  /** Current sort option */
  sortOption: PlayerSortOption;
  /** Set sort option */
  setSortOption: (option: PlayerSortOption) => void;
  
  /** Clear all filters and search */
  clearAll: () => void;
  /** Get a specific player by ID */
  getPlayer: (playerId: string) => DraftPlayer | undefined;
  /** Refetch player data */
  refetch: () => Promise<void>;
}

// ============================================================================
// CONVERSION HELPERS
// ============================================================================

/**
 * Seeded random number generator for consistent mock data
 * Uses player name as seed for deterministic variance
 */
function seededRandom(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  // Return value between 0 and 1
  return Math.abs(Math.sin(hash));
}

/**
 * Generate unique sequential rankings with variance from ADP order
 * Rankings are 1 to N with no duplicates and no gaps
 */
function generateUniqueRankings(
  players: Array<{ name: string; adpIndex: number }>
): Map<string, number> {
  // Create shuffle scores for each player based on name + some ADP influence
  const playerScores = players.map((p, idx) => {
    const random = seededRandom(p.name);
    // Score combines ADP position with random variance
    // Higher variance for middle picks, less for top/bottom
    const positionFactor = Math.sin((idx / players.length) * Math.PI); // 0 at edges, 1 in middle
    const variance = (random - 0.5) * 100 * (0.3 + positionFactor * 0.7);
    return {
      name: p.name,
      score: idx + variance, // Base score is ADP index + variance
    };
  });
  
  // Sort by score to determine rank order
  playerScores.sort((a, b) => a.score - b.score);
  
  // Assign sequential ranks 1 to N
  const rankings = new Map<string, number>();
  playerScores.forEach((p, idx) => {
    rankings.set(p.name, idx + 1);
  });
  
  return rankings;
}

/**
 * Convert PoolPlayer to DraftPlayer, merging with live ADP if available
 */
function convertToDraftPlayer(
  poolPlayer: PoolPlayer,
  liveADP?: PlayerADP,
  rank?: number
): DraftPlayer {
  const id = poolPlayer.id || generatePlayerId(poolPlayer.name);
  const adp = liveADP?.adp ?? poolPlayer.adp ?? 999;
  
  return {
    id,
    name: poolPlayer.name,
    position: poolPlayer.position as Position,
    team: poolPlayer.team,
    adp,
    projectedPoints: poolPlayer.projection ?? 0,
    byeWeek: poolPlayer.byeWeek ?? 0,
    rank,
  };
}

// ============================================================================
// SORTING
// ============================================================================

function sortPlayers(players: DraftPlayer[], sortOption: PlayerSortOption): DraftPlayer[] {
  const sorted = [...players];
  
  switch (sortOption) {
    case 'adp-asc':
      return sorted.sort((a, b) => (a.adp ?? 999) - (b.adp ?? 999));
    case 'adp-desc':
      return sorted.sort((a, b) => (b.adp ?? 999) - (a.adp ?? 999));
    case 'name-asc':
      return sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    case 'name-desc':
      return sorted.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
    case 'proj-asc':
      return sorted.sort((a, b) => (a.projectedPoints ?? 0) - (b.projectedPoints ?? 0));
    case 'proj-desc':
      return sorted.sort((a, b) => (b.projectedPoints ?? 0) - (a.projectedPoints ?? 0));
    case 'rank-asc':
      // Ranked players first (by rank), then unranked players (by ADP)
      return sorted.sort((a, b) => {
        const aRanked = a.rank !== undefined;
        const bRanked = b.rank !== undefined;
        if (aRanked && bRanked) return a.rank! - b.rank!;
        if (aRanked && !bRanked) return -1; // ranked before unranked
        if (!aRanked && bRanked) return 1;  // unranked after ranked
        return (a.adp ?? 999) - (b.adp ?? 999); // both unranked: sort by ADP
      });
    case 'rank-desc':
      // Ranked players first (by rank desc), then unranked players (by ADP)
      return sorted.sort((a, b) => {
        const aRanked = a.rank !== undefined;
        const bRanked = b.rank !== undefined;
        if (aRanked && bRanked) return b.rank! - a.rank!;
        if (aRanked && !bRanked) return -1; // ranked before unranked
        if (!aRanked && bRanked) return 1;  // unranked after ranked
        return (a.adp ?? 999) - (b.adp ?? 999); // both unranked: sort by ADP
      });
    default:
      return sorted;
  }
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook for managing available players
 */
export function useAvailablePlayers({
  pickedPlayerIds = [],
  initialSort = 'adp-asc',
  initialFilters = [],
}: UseAvailablePlayersOptions = {}): UseAvailablePlayersResult {
  // Load player pool and live ADP
  const { players: poolPlayers, loading: poolLoading, error: poolError } = usePlayerPool();
  const { adp: liveADPData, loading: adpLoading } = useLiveADP();
  
  // UI state
  const [positionFilters, setPositionFilters] = useState<Position[]>(initialFilters);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<PlayerSortOption>(initialSort);
  
  // Combined loading/error state
  const isLoading = poolLoading || adpLoading;
  const error = poolError?.message || null;
  
  // Convert pool players to DraftPlayer format with live ADP
  // Generate unique sequential rankings with variance from ADP order
  const allPlayers = useMemo(() => {
    if (poolPlayers.length === 0) return [];
  
    // First pass: convert all players with ADP data and sort by ADP
    const playersWithADP = poolPlayers.map(poolPlayer => {
      const id = poolPlayer.id || generatePlayerId(poolPlayer.name);
      const playerADP = liveADPData?.players?.[id];
      const adp = playerADP?.adp ?? poolPlayer.adp ?? 999;
      return { poolPlayer, playerADP, adp };
    });
    
    // Sort by ADP
    playersWithADP.sort((a, b) => a.adp - b.adp);
    
    // Generate unique rankings (1 to N, no duplicates, no gaps)
    const rankingInput = playersWithADP.map((item, idx) => ({
      name: item.poolPlayer.name,
      adpIndex: idx,
    }));
    const rankings = generateUniqueRankings(rankingInput);
    
    // Convert to DraftPlayer with assigned ranks
    return playersWithADP.map((item) => {
      const rank = rankings.get(item.poolPlayer.name);
      return convertToDraftPlayer(item.poolPlayer, item.playerADP, rank);
    });
  }, [poolPlayers, liveADPData]);
  
  // Create Set for fast picked lookup
  const pickedSet = useMemo(() => new Set(pickedPlayerIds), [pickedPlayerIds]);
  
  // Available players (not picked)
  const players = useMemo(() => {
    return allPlayers.filter(p => !pickedSet.has(p.id));
  }, [allPlayers, pickedSet]);
  
  // Filtered and sorted players
  const filteredPlayers = useMemo(() => {
    let result = players;
    
    // Apply position filters
    if (positionFilters.length > 0) {
      result = result.filter(p => positionFilters.includes(p.position));
    }
    
    // Apply search
    if (searchQuery.trim()) {
      result = result.filter(p => playerMatchesSearch(p, searchQuery));
    }
    
    // Apply sorting
    result = sortPlayers(result, sortOption);
    
    return result;
  }, [players, positionFilters, searchQuery, sortOption]);
  
  // Create map for fast lookup
  const playerMap = useMemo(() => {
    const map = new Map<string, DraftPlayer>();
    for (const player of allPlayers) {
      map.set(player.id, player);
    }
    return map;
  }, [allPlayers]);
  
  // Actions
  const togglePositionFilter = useCallback((position: Position) => {
    setPositionFilters(prev => {
      if (prev.includes(position)) {
        return prev.filter(p => p !== position);
      }
      return [...prev, position];
    });
  }, []);
  
  const clearPositionFilters = useCallback(() => {
    setPositionFilters([]);
  }, []);
  
  const clearAll = useCallback(() => {
    setPositionFilters([]);
    setSearchQuery('');
    setSortOption('adp-asc');
  }, []);
  
  const getPlayer = useCallback((playerId: string): DraftPlayer | undefined => {
    return playerMap.get(playerId);
  }, [playerMap]);
  
  // Refetch is a no-op for now (static data)
  const refetch = useCallback(async () => {
    // In the future, this could refetch from API
  }, []);
  
  return {
    players,
    filteredPlayers,
    totalCount: players.length,
    filteredCount: filteredPlayers.length,
    isLoading,
    error,
    positionFilters,
    togglePositionFilter,
    clearPositionFilters,
    setPositionFilters,
    searchQuery,
    setSearchQuery,
    sortOption,
    setSortOption,
    clearAll,
    getPlayer,
    refetch,
  };
}

export default useAvailablePlayers;
