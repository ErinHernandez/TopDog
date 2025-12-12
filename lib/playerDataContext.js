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
 *   const { allPlayers, headshotsMap, getPlayersByPosition } = usePlayerData();
 */

import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import { PLAYER_POOL } from './playerPool';
import { POSITIONS, FLEX_POSITIONS } from '../components/draft/v3/constants/positions';
import { useHeadshots } from './swr/usePlayerSWR';

const PlayerDataContext = createContext(null);

export function PlayerDataProvider({ children }) {
  // Core state
  const [draftedPlayerNames, setDraftedPlayerNames] = useState(new Set());
  const [playerStats, setPlayerStats] = useState({});
  
  // Headshots via SWR - automatic caching, deduplication, and revalidation
  const { headshotsMap, isLoading: headshotsLoading, mutate: mutateHeadshots } = useHeadshots();
  
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
  
  const getPlayersByPosition = useCallback((position, fromPool = 'available') => {
    const pool = fromPool === 'all' ? allPlayers : availablePlayers;
    if (!position || position === 'ALL') return pool;
    
    if (position === 'FLEX') {
      return pool.filter(p => FLEX_POSITIONS.includes(p.position));
    }
    return pool.filter(p => p.position === position);
  }, [allPlayers, availablePlayers]);

  const getPlayersByTeam = useCallback((team, fromPool = 'available') => {
    const pool = fromPool === 'all' ? allPlayers : availablePlayers;
    if (!team || team === 'ALL') return pool;
    return pool.filter(p => p.team === team);
  }, [allPlayers, availablePlayers]);

  const searchPlayers = useCallback((searchTerm, fromPool = 'available') => {
    const pool = fromPool === 'all' ? allPlayers : availablePlayers;
    if (!searchTerm || searchTerm.trim() === '') return pool;
    
    const term = searchTerm.toLowerCase().trim();
    return pool.filter(p => 
      p.name?.toLowerCase().includes(term) || 
      p.team?.toLowerCase().includes(term) ||
      p.position?.toLowerCase().includes(term)
    );
  }, [allPlayers, availablePlayers]);

  const filterPlayers = useCallback((options = {}, fromPool = 'available') => {
    const { position, team, searchTerm, sortBy = 'adp', sortDirection = 'asc' } = options;
    let pool = fromPool === 'all' ? allPlayers : availablePlayers;
    
    // Apply position filter
    if (position && position !== 'ALL') {
      if (position === 'FLEX') {
        pool = pool.filter(p => FLEX_POSITIONS.includes(p.position));
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
          comparison = (parseFloat(b.proj) || 0) - (parseFloat(a.proj) || 0);
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
  
  const markPlayerDrafted = useCallback((playerName) => {
    setDraftedPlayerNames(prev => new Set([...prev, playerName]));
  }, []);

  const markPlayersDrafted = useCallback((playerNames) => {
    setDraftedPlayerNames(prev => new Set([...prev, ...playerNames]));
  }, []);

  const unmarkPlayerDrafted = useCallback((playerName) => {
    setDraftedPlayerNames(prev => {
      const next = new Set(prev);
      next.delete(playerName);
      return next;
    });
  }, []);

  const resetDraftedPlayers = useCallback(() => {
    setDraftedPlayerNames(new Set());
  }, []);

  const syncDraftedPlayers = useCallback((pickedPlayerNames) => {
    setDraftedPlayerNames(new Set(pickedPlayerNames));
  }, []);

  // ============================================
  // Player Lookup Utilities
  // ============================================
  
  const getPlayer = useCallback((playerName) => {
    return allPlayers.find(p => p.name === playerName);
  }, [allPlayers]);

  const getPlayerHeadshot = useCallback((playerName) => {
    return headshotsMap[playerName] || null;
  }, [headshotsMap]);

  const getPlayerWithHeadshot = useCallback((playerName) => {
    const player = getPlayer(playerName);
    if (!player) return null;
    
    return {
      ...player,
      headshotUrl: headshotsMap[player.name] || null
    };
  }, [getPlayer, headshotsMap]);

  // ============================================
  // Position Counts
  // ============================================
  
  const positionCounts = useMemo(() => {
    const counts = { QB: 0, RB: 0, WR: 0, TE: 0, FLEX: 0, ALL: 0 };
    
    availablePlayers.forEach(p => {
      counts[p.position] = (counts[p.position] || 0) + 1;
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
  
  // Refresh headshots (useful for manual refresh)
  const refreshHeadshots = useCallback(() => {
    mutateHeadshots();
  }, [mutateHeadshots]);

  const value = useMemo(() => ({
    // Core data
    allPlayers,
    availablePlayers,
    headshotsMap,
    headshotsLoading,
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
    getPlayerHeadshot,
    getPlayerWithHeadshot,
    
    // Stats
    positionCounts,
    totalPlayers: allPlayers.length,
    availableCount: availablePlayers.length,
    draftedCount: draftedPlayerNames.size,
    
    // SWR utilities
    refreshHeadshots,
  }), [
    allPlayers,
    availablePlayers,
    headshotsMap,
    headshotsLoading,
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
    getPlayerHeadshot,
    getPlayerWithHeadshot,
    positionCounts,
    refreshHeadshots,
  ]);

  return (
    <PlayerDataContext.Provider value={value}>
      {children}
    </PlayerDataContext.Provider>
  );
}

/**
 * Hook to access player data context
 * @returns {Object} Player data and utilities
 */
export function usePlayerData() {
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
export function useFilteredPlayers(options = {}) {
  const { filterPlayers, availablePlayers } = usePlayerData();
  
  return useMemo(() => {
    return filterPlayers(options);
  }, [filterPlayers, options.position, options.team, options.searchTerm, options.sortBy, options.sortDirection]);
}

/**
 * Hook to get player headshot with fallback
 */
export function usePlayerHeadshot(playerName) {
  const { getPlayerHeadshot, headshotsLoading } = usePlayerData();
  
  return {
    headshotUrl: getPlayerHeadshot(playerName),
    loading: headshotsLoading
  };
}

export default PlayerDataContext;

