/**
 * usePlayerFilters
 * 
 * Hook for filtering and sorting available players.
 * Pure computation hook for player list filtering.
 * 
 * Part of Phase 2: Extract Hooks
 */

import { useMemo } from 'react';
import { useDraftState } from '../context/DraftRoomContext';
import { Player } from '../types/draft';

export interface UsePlayerFiltersResult {
  filteredPlayers: Player[];
}

/**
 * Hook for filtering and sorting players
 */
export function usePlayerFilters(): UsePlayerFiltersResult {
  const state = useDraftState();
  const { availablePlayers, picks, filters, customRankings } = state;

  const filteredPlayers = useMemo(() => {
    // Get picked player names
    const pickedPlayerNames = new Set(picks.map((p) => p.player));

    // Filter out picked players
    let filtered = availablePlayers.filter((player) => {
      // Basic validation
      if (!player || typeof player !== 'object' || typeof player.name !== 'string') {
        return false;
      }

      // Remove picked players
      if (pickedPlayerNames.has(player.name)) {
        return false;
      }

      // Search filter
      const searchLower = filters.search.toLowerCase();
      const matchesSearch =
        player.name.toLowerCase().includes(searchLower) ||
        (player.team?.toLowerCase() || '').includes(searchLower);

      if (!matchesSearch) {
        return false;
      }

      // Position filter
      const effectivePositionFilters =
        filters.positions.length === 0 ? ['ALL'] : filters.positions;
      const matchesPosition =
        effectivePositionFilters.includes('ALL') ||
        effectivePositionFilters.includes(player.position);

      if (!matchesPosition) {
        return false;
      }

      return true;
    });

    // Sort players
    filtered.sort((a, b) => {
      if (filters.sortBy === 'adp') {
        const adpA = a.adp || 999;
        const adpB = b.adp || 999;
        return filters.sortDirection === 'asc' ? adpA - adpB : adpB - adpA;
      } else if (filters.sortBy === 'rankings') {
        // Convert -1 (not found) to 9999 for unranked players
        const aIndex = customRankings.indexOf(a.name);
        const aRank = aIndex !== -1 ? aIndex : 9999;
        const bIndex = customRankings.indexOf(b.name);
        const bRank = bIndex !== -1 ? bIndex : 9999;

        // If both players have ranks (including 9999 for unranked), sort by rank
        if (aRank !== bRank) {
          return filters.sortDirection === 'asc' ? aRank - bRank : bRank - aRank;
        }

        // If ranks are equal (both unranked with rank 9999), sort by ADP high to low
        const adpA = a.adp && a.adp > 0 ? a.adp : 9999;
        const adpB = b.adp && b.adp > 0 ? b.adp : 9999;
        return adpB - adpA; // Sort by ADP high to low for unranked players
      }

      return 0;
    });

    return filtered;
  }, [availablePlayers, picks, filters, customRankings]);

  return {
    filteredPlayers,
  };
}
