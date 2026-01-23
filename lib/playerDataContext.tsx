/**
 * PlayerDataContext - Centralized Player Data Management
 * 
 * Eliminates duplicate fetching by providing a single source of truth for:
 * - Player pool data (PLAYER_POOL)
 * - Player headshots (fetched via SWR with automatic caching)
 * - Filtering and sorting utilities
 * - Drafted/available player tracking
 * 
 * Now powered by SWR for:
 * - Automatic caching and deduplication
 * - Background revalidation
 * - Request deduplication across components
 * 
 * Usage:
 *   import { usePlayerData } from '../lib/playerDataContext';
 *   const { allPlayers, getPlayersByPosition } = usePlayerData();
 */

import type { JSX } from 'react';
import React, { createContext, useContext, useState, useMemo, useCallback, ReactNode } from 'react';
import { PLAYER_POOL, PlayerPoolEntry } from './playerPool';
import { POSITIONS, FLEX_POSITIONS } from './constants/positions';
import { getPlayerPhotoUrl } from './playerPhotos';

// ============================================================================
// TYPES
// ============================================================================

export type Position = 'QB' | 'RB' | 'WR' | 'TE' | 'FLEX' | 'ALL';
export type PoolSource = 'all' | 'available';
export type SortBy = 'adp' | 'name' | 'proj' | 'projection' | 'position' | 'team';
export type SortDirection = 'asc' | 'desc';

export interface FilterOptions {
  position?: Position | string;
  team?: string;
  searchTerm?: string;
  sortBy?: SortBy;
  sortDirection?: SortDirection;
}

export interface PositionCounts {
  QB: number;
  RB: number;
  WR: number;
  TE: number;
  FLEX: number;
  ALL: number;
}

export interface PlayerDataContextValue {
  // Core data
  allPlayers: PlayerPoolEntry[];
  availablePlayers: PlayerPoolEntry[];
  draftedPlayerNames: string[];
  playerStats: Record<string, unknown>;
  
  // Filtering utilities
  getPlayersByPosition: (position: Position | string | null, fromPool?: PoolSource) => PlayerPoolEntry[];
  getPlayersByTeam: (team: string | null, fromPool?: PoolSource) => PlayerPoolEntry[];
  searchPlayers: (searchTerm: string, fromPool?: PoolSource) => PlayerPoolEntry[];
  filterPlayers: (options?: FilterOptions, fromPool?: PoolSource) => PlayerPoolEntry[];
  
  // Draft tracking
  markPlayerDrafted: (playerName: string) => void;
  markPlayersDrafted: (playerNames: string[]) => void;
  unmarkPlayerDrafted: (playerName: string) => void;
  resetDraftedPlayers: () => void;
  syncDraftedPlayers: (pickedPlayerNames: string[]) => void;
  
  // Lookups
  getPlayer: (playerName: string) => PlayerPoolEntry | undefined;
  getPlayerPhoto: (playerName: string) => string | null;
  
  // Stats
  positionCounts: PositionCounts;
  totalPlayers: number;
  availableCount: number;
  draftedCount: number;
}

interface PlayerDataProviderProps {
  children: ReactNode;
}

// ============================================================================
// CONTEXT
// ============================================================================

const PlayerDataContext = createContext<PlayerDataContextValue | null>(null);

// ============================================================================
// PROVIDER
// ============================================================================

export function PlayerDataProvider({ children }: PlayerDataProviderProps): JSX.Element {
  // Core state
  const [draftedPlayerNames, setDraftedPlayerNames] = useState<Set<string>>(new Set());
  const [playerStats, setPlayerStats] = useState<Record<string, unknown>>({});
  
  // All players from static pool
  const allPlayers = useMemo(() => PLAYER_POOL, []);
  
  // Available players (not drafted)
  const availablePlayers = useMemo(() => {
    if (draftedPlayerNames.size === 0) return allPlayers;
    return allPlayers.filter(p => !draftedPlayerNames.has(p.name));
  }, [allPlayers, draftedPlayerNames]);

  // ============================================
  // Player Filtering Utilities
  // ============================================
  
  const getPlayersByPosition = useCallback((
    position: Position | string | null,
    fromPool: PoolSource = 'available'
  ): PlayerPoolEntry[] => {
    const pool = fromPool === 'all' ? allPlayers : availablePlayers;
    if (!position || position === 'ALL') return pool;
    
    if (position === 'FLEX') {
      return pool.filter(p => (FLEX_POSITIONS as readonly string[]).includes(p.position));
    }
    return pool.filter(p => p.position === position);
  }, [allPlayers, availablePlayers]);

  const getPlayersByTeam = useCallback((
    team: string | null,
    fromPool: PoolSource = 'available'
  ): PlayerPoolEntry[] => {
    const pool = fromPool === 'all' ? allPlayers : availablePlayers;
    if (!team || team === 'ALL') return pool;
    return pool.filter(p => p.team === team);
  }, [allPlayers, availablePlayers]);

  const searchPlayers = useCallback((
    searchTerm: string,
    fromPool: PoolSource = 'available'
  ): PlayerPoolEntry[] => {
    const pool = fromPool === 'all' ? allPlayers : availablePlayers;
    if (!searchTerm || searchTerm.trim() === '') return pool;
    
    const term = searchTerm.toLowerCase().trim();
    return pool.filter(p => 
      p.name?.toLowerCase().includes(term) || 
      p.team?.toLowerCase().includes(term) ||
      p.position?.toLowerCase().includes(term)
    );
  }, [allPlayers, availablePlayers]);

  const filterPlayers = useCallback((
    options: FilterOptions = {},
    fromPool: PoolSource = 'available'
  ): PlayerPoolEntry[] => {
    const { position, team, searchTerm, sortBy = 'adp', sortDirection = 'asc' } = options;
    let pool = fromPool === 'all' ? allPlayers : availablePlayers;
    
    // Apply position filter
    if (position && position !== 'ALL') {
      if (position === 'FLEX') {
        pool = pool.filter(p => (FLEX_POSITIONS as readonly string[]).includes(p.position));
      } else {
        pool = pool.filter(p => p.position === position);
      }
    }
    
    // Apply team filter
    if (team && team !== 'ALL') {
      pool = pool.filter(p => p.team === team);
    }
    
    // Apply search filter
    if (searchTerm && searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase().trim();
      pool = pool.filter(p => 
        p.name?.toLowerCase().includes(term) || 
        p.team?.toLowerCase().includes(term)
      );
    }
    
    // Apply sorting
    const sorted = [...pool].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'adp':
          comparison = (a.adp || 999) - (b.adp || 999);
          break;
        case 'name':
          comparison = (a.name || '').localeCompare(b.name || '');
          break;
        case 'proj':
        case 'projection':
          const aProj = typeof a.proj === 'string' ? parseFloat(a.proj) : (a.proj || 0);
          const bProj = typeof b.proj === 'string' ? parseFloat(b.proj) : (b.proj || 0);
          comparison = bProj - aProj;
          break;
        case 'position':
          comparison = (a.position || '').localeCompare(b.position || '');
          break;
        case 'team':
          comparison = (a.team || '').localeCompare(b.team || '');
          break;
        default:
          comparison = (a.adp || 999) - (b.adp || 999);
      }
      
      return sortDirection === 'desc' ? -comparison : comparison;
    });
    
    return sorted;
  }, [allPlayers, availablePlayers]);

  // ============================================
  // Draft Tracking
  // ============================================
  
  const markPlayerDrafted = useCallback((playerName: string): void => {
    setDraftedPlayerNames(prev => new Set([...prev, playerName]));
  }, []);

  const markPlayersDrafted = useCallback((playerNames: string[]): void => {
    setDraftedPlayerNames(prev => new Set([...prev, ...playerNames]));
  }, []);

  const unmarkPlayerDrafted = useCallback((playerName: string): void => {
    setDraftedPlayerNames(prev => {
      const next = new Set(prev);
      next.delete(playerName);
      return next;
    });
  }, []);

  const resetDraftedPlayers = useCallback((): void => {
    setDraftedPlayerNames(new Set());
  }, []);

  const syncDraftedPlayers = useCallback((pickedPlayerNames: string[]): void => {
    setDraftedPlayerNames(new Set(pickedPlayerNames));
  }, []);

  // ============================================
  // Player Lookup Utilities
  // ============================================
  
  const getPlayer = useCallback((playerName: string): PlayerPoolEntry | undefined => {
    return allPlayers.find(p => p.name === playerName);
  }, [allPlayers]);

  const getPlayerPhoto = useCallback((playerName: string): string | null => {
    const player = getPlayer(playerName);
    if (!player) return null;
    return getPlayerPhotoUrl(player.name, player.team, player.position);
  }, [getPlayer]);

  // ============================================
  // Position Counts
  // ============================================
  
  const positionCounts = useMemo((): PositionCounts => {
    const counts: PositionCounts = { QB: 0, RB: 0, WR: 0, TE: 0, FLEX: 0, ALL: 0 };
    
    availablePlayers.forEach(p => {
      const pos = p.position as keyof PositionCounts;
      if (pos && pos in counts) {
        counts[pos] = (counts[pos] || 0) + 1;
      }
      counts.ALL++;
      if (FLEX_POSITIONS.includes(p.position)) {
        counts.FLEX++;
      }
    });
    
    return counts;
  }, [availablePlayers]);

  // ============================================
  // Context Value
  // ============================================
  
  const value = useMemo((): PlayerDataContextValue => ({
    // Core data
    allPlayers,
    availablePlayers,
    draftedPlayerNames: Array.from(draftedPlayerNames),
    playerStats,
    
    // Filtering utilities
    getPlayersByPosition,
    getPlayersByTeam,
    searchPlayers,
    filterPlayers,
    
    // Draft tracking
    markPlayerDrafted,
    markPlayersDrafted,
    unmarkPlayerDrafted,
    resetDraftedPlayers,
    syncDraftedPlayers,
    
    // Lookups
    getPlayer,
    getPlayerPhoto,
    
    // Stats
    positionCounts,
    totalPlayers: allPlayers.length,
    availableCount: availablePlayers.length,
    draftedCount: draftedPlayerNames.size,
  }), [
    allPlayers,
    availablePlayers,
    draftedPlayerNames,
    playerStats,
    getPlayersByPosition,
    getPlayersByTeam,
    searchPlayers,
    filterPlayers,
    markPlayerDrafted,
    markPlayersDrafted,
    unmarkPlayerDrafted,
    resetDraftedPlayers,
    syncDraftedPlayers,
    getPlayer,
    getPlayerPhoto,
    positionCounts,
  ]);

  return (
    <PlayerDataContext.Provider value={value}>
      {children}
    </PlayerDataContext.Provider>
  );
}

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook to access player data context
 * @returns Player data and utilities
 */
export function usePlayerData(): PlayerDataContextValue {
  const context = useContext(PlayerDataContext);
  
  if (!context) {
    throw new Error('usePlayerData must be used within a PlayerDataProvider');
  }
  
  return context;
}

/**
 * Hook to get filtered players with memoization
 * Useful for components that need specific filter combinations
 */
export function useFilteredPlayers(options: FilterOptions = {}): PlayerPoolEntry[] {
  const { filterPlayers } = usePlayerData();
  
  return useMemo(() => {
    return filterPlayers(options);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- options object is destructured for specific fields
  }, [filterPlayers, options.position, options.team, options.searchTerm, options.sortBy, options.sortDirection]);
}

/**
 * Hook to get player photo URL with fallback
 */
export function usePlayerHeadshot(playerName: string): { headshotUrl: string | null; loading: boolean } {
  const { getPlayerPhoto } = usePlayerData();
  
  return {
    headshotUrl: getPlayerPhoto(playerName),
    loading: false
  };
}

export default PlayerDataContext;
