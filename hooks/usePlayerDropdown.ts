/**
 * usePlayerDropdown - Custom Hook for Player Dropdown Logic
 *
 * Provides consistent dropdown behavior across different contexts
 */

import { useState, useEffect, useCallback } from 'react';

import { createScopedLogger } from '../lib/clientLogger';
import { playerDataService } from '../lib/playerData/PlayerDataService';

const logger = createScopedLogger('[PlayerDropdown]');

interface Player {
  name: string;
  position: string;
  team: string;
  adp?: number;
  projectedPoints?: number;
}

interface PlayerDataUpdate {
  players: Player[];
  lastUpdate: number;
}

interface UsePlayerDropdownOptions {
  initialPlayers?: Player[] | null;
  position?: string | null;
  team?: string | null;
  searchTerm?: string;
  sortBy?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface FilterOptions {
  position?: string;
  team?: string;
  searchTerm?: string;
}

interface UsePlayerDropdownReturn {
  players: Player[];
  loading: boolean;
  error: string | null;
  lastUpdate: number | null;
  expandedPlayer: string | null;
  selectedPlayer: Player | null;
  loadPlayers: (forceRefresh?: boolean) => Promise<void>;
  refreshPlayers: () => Promise<void>;
  handlePlayerSelect: (player: Player) => void;
  handlePlayerExpand: (playerName: string) => void;
  handlePlayerCollapse: () => void;
  setSelectedPlayer: (player: Player | null) => void;
  filterPlayers: (filters: FilterOptions) => Player[];
  sortPlayers: (sortMethod: string) => Player[];
  getPlayer: (playerName: string) => Player | undefined;
  getPlayersByPosition: (pos: string) => Player[];
  clearCache: () => void;
  getCacheStats: () => unknown;
  hasPlayers: boolean;
  isEmpty: boolean;
  isStale: boolean;
}

export function usePlayerDropdown({
  initialPlayers = null,
  position = null,
  team = null,
  searchTerm = '',
  sortBy = 'rank',
  autoRefresh = true,
  refreshInterval = 24 * 60 * 60 * 1000 // 24 hours
}: UsePlayerDropdownOptions): UsePlayerDropdownReturn {
  const [players, setPlayers] = useState<Player[]>(initialPlayers || []);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);
  const [expandedPlayer, setExpandedPlayer] = useState<string | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  // Load players data
  const loadPlayers = useCallback(async (forceRefresh = false): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const playerData = forceRefresh
        ? await playerDataService.refreshPlayers({ position, team, searchTerm, sortBy })
        : await playerDataService.getPlayers({ position, team, searchTerm, sortBy });

      setPlayers(playerData as Player[]);
      setLastUpdate(Date.now());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage);
      logger.error('Failed to load players', err instanceof Error ? err : new Error(String(err)));
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
        setPlayers((data.players || []) as Player[]);
        setLastUpdate(data.lastUpdate);
        setLoading(false);
      }
    });

    return unsubscribe;
  }, [initialPlayers]);

  // Player selection handlers
  const handlePlayerSelect = useCallback((player: Player) => {
    setSelectedPlayer(player);
    setExpandedPlayer(expandedPlayer === player.name ? null : player.name);
  }, [expandedPlayer]);

  const handlePlayerExpand = useCallback((playerName: string) => {
    setExpandedPlayer(expandedPlayer === playerName ? null : playerName);
  }, [expandedPlayer]);

  const handlePlayerCollapse = useCallback(() => {
    setExpandedPlayer(null);
  }, []);

  // Search and filter helpers
  const filterPlayers = useCallback((filters: FilterOptions): Player[] => {
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

  const sortPlayers = useCallback((sortMethod: string): Player[] => {
    const sorted = [...players];

    switch (sortMethod) {
      case 'adp':
        return sorted.sort((a, b) => (a.adp || 0) - (b.adp || 0));
      case 'projection':
        return sorted.sort((a, b) => (b.projectedPoints || 0) - (a.projectedPoints || 0));
      case 'name':
        return sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      case 'position':
        return sorted.sort((a, b) => (a.position || '').localeCompare(b.position || ''));
      default:
        return sorted;
    }
  }, [players]);

  // Get player by name
  const getPlayer = useCallback((playerName: string): Player | undefined => {
    return players.find(p => p.name === playerName);
  }, [players]);

  // Get players by position
  const getPlayersByPosition = useCallback((pos: string): Player[] => {
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
    isStale: lastUpdate ? (Date.now() - lastUpdate) > refreshInterval : false
  };
}

// Specialized hooks for different contexts
export function useDraftRoomDropdown(options: UsePlayerDropdownOptions = {}): UsePlayerDropdownReturn {
  return usePlayerDropdown({
    ...options,
    autoRefresh: true,
    refreshInterval: 30 * 60 * 1000 // 30 minutes for draft room
  });
}

export function useRankingsDropdown(options: UsePlayerDropdownOptions = {}): UsePlayerDropdownReturn {
  return usePlayerDropdown({
    ...options,
    autoRefresh: true,
    refreshInterval: 24 * 60 * 60 * 1000 // 24 hours for rankings
  });
}

export function useTeamManagementDropdown(options: UsePlayerDropdownOptions = {}): UsePlayerDropdownReturn {
  return usePlayerDropdown({
    ...options,
    autoRefresh: false // Manual refresh for team management
  });
}
