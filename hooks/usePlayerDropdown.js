/**
 * usePlayerDropdown - Custom Hook for Player Dropdown Logic
 * 
 * Provides consistent dropdown behavior across different contexts
 */

import { useState, useEffect, useCallback } from 'react';
import { playerDataService } from '../lib/playerData/PlayerDataService';

export function usePlayerDropdown({
  initialPlayers = null,
  position = null,
  team = null,
  searchTerm = '',
  sortBy = 'rank',
  autoRefresh = true,
  refreshInterval = 24 * 60 * 60 * 1000 // 24 hours
}) {
  const [players, setPlayers] = useState(initialPlayers || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [expandedPlayer, setExpandedPlayer] = useState(null);
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  // Load players data
  const loadPlayers = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError(null);

    try {
      const playerData = forceRefresh 
        ? await playerDataService.refreshPlayers({ position, team, searchTerm, sortBy })
        : await playerDataService.getPlayers({ position, team, searchTerm, sortBy });
      
      setPlayers(playerData);
      setLastUpdate(Date.now());
    } catch (err) {
      setError(err.message);
      console.error('Failed to load players:', err);
    } finally {
      setLoading(false);
    }
  }, [position, team, searchTerm, sortBy]);

  // Initial load
  useEffect(() => {
    if (!initialPlayers) {
      loadPlayers();
    }
  }, [initialPlayers, loadPlayers]);

  // Auto-refresh setup
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadPlayers(true);
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, loadPlayers]);

  // Subscribe to data service updates
  useEffect(() => {
    const unsubscribe = playerDataService.subscribe((data) => {
      if (!initialPlayers) {
        setPlayers(data.players || []);
        setLastUpdate(data.lastUpdate);
        setLoading(false);
      }
    });

    return unsubscribe;
  }, [initialPlayers]);

  // Player selection handlers
  const handlePlayerSelect = useCallback((player) => {
    setSelectedPlayer(player);
    setExpandedPlayer(expandedPlayer === player.name ? null : player.name);
  }, [expandedPlayer]);

  const handlePlayerExpand = useCallback((playerName) => {
    setExpandedPlayer(expandedPlayer === playerName ? null : playerName);
  }, [expandedPlayer]);

  const handlePlayerCollapse = useCallback(() => {
    setExpandedPlayer(null);
  }, []);

  // Search and filter helpers
  const filterPlayers = useCallback((filters) => {
    return players.filter(player => {
      if (filters.position && player.position !== filters.position) return false;
      if (filters.team && player.team !== filters.team) return false;
      if (filters.searchTerm) {
        const term = filters.searchTerm.toLowerCase();
        return (player.name?.toLowerCase() || '').includes(term) || 
               (player.team?.toLowerCase() || '').includes(term);
      }
      return true;
    });
  }, [players]);

  const sortPlayers = useCallback((sortMethod) => {
    const sorted = [...players];
    
    switch (sortMethod) {
      case 'adp':
        return sorted.sort((a, b) => a.adp - b.adp);
      case 'projection':
        return sorted.sort((a, b) => b.projectedPoints - a.projectedPoints);
      case 'name':
        return sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      case 'position':
        return sorted.sort((a, b) => (a.position || '').localeCompare(b.position || ''));
      default:
        return sorted;
    }
  }, [players]);

  // Get player by name
  const getPlayer = useCallback((playerName) => {
    return players.find(p => p.name === playerName);
  }, [players]);

  // Get players by position
  const getPlayersByPosition = useCallback((pos) => {
    return players.filter(p => p.position === pos);
  }, [players]);

  // Cache management
  const clearCache = useCallback(() => {
    playerDataService.clearCache();
  }, []);

  const getCacheStats = useCallback(() => {
    return playerDataService.getCacheStats();
  }, []);

  return {
    // Data
    players,
    loading,
    error,
    lastUpdate,
    
    // Selection state
    expandedPlayer,
    selectedPlayer,
    
    // Actions
    loadPlayers,
    refreshPlayers: () => loadPlayers(true),
    handlePlayerSelect,
    handlePlayerExpand,
    handlePlayerCollapse,
    setSelectedPlayer,
    
    // Utilities
    filterPlayers,
    sortPlayers,
    getPlayer,
    getPlayersByPosition,
    
    // Cache management
    clearCache,
    getCacheStats,
    
    // Computed values
    hasPlayers: players.length > 0,
    isEmpty: !loading && players.length === 0,
    isStale: lastUpdate && (Date.now() - lastUpdate) > refreshInterval
  };
}

// Specialized hooks for different contexts
export function useDraftRoomDropdown(options = {}) {
  return usePlayerDropdown({
    ...options,
    autoRefresh: true,
    refreshInterval: 30 * 60 * 1000 // 30 minutes for draft room
  });
}

export function useRankingsDropdown(options = {}) {
  return usePlayerDropdown({
    ...options,
    autoRefresh: true,
    refreshInterval: 24 * 60 * 60 * 1000 // 24 hours for rankings
  });
}

export function useTeamManagementDropdown(options = {}) {
  return usePlayerDropdown({
    ...options,
    autoRefresh: false // Manual refresh for team management
  });
}

