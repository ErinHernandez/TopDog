/**
 * Draft Room Rendering Optimizations
 * 
 * Utility functions and hooks for optimizing draft room rendering performance.
 * Provides memoization, filtering, and sorting utilities optimized for large player lists.
 * 
 * Usage:
 * ```typescript
 * import { useMemoizedPlayers, useMemoizedPicks } from '@/lib/draft/renderingOptimizations';
 * 
 * const filteredPlayers = useMemoizedPlayers(players, filters, search);
 * ```
 */

import React, { useMemo, useCallback, useState, useEffect } from 'react';

import type { PlayerPoolEntry } from '../playerPool';

// ============================================================================
// TYPES
// ============================================================================

export interface Pick {
  pickNumber: number;
  player?: PlayerPoolEntry | { name: string; [key: string]: unknown };
  name?: string;
  user?: string;
  pickedBy?: string;
  [key: string]: unknown;
}

export interface CurrentPickerInfo {
  currentPicker: string;
  currentPickNumber: number;
  currentRound: number;
  isSnakeRound: boolean;
  pickIndex: number;
}

export interface VisibleRange {
  startIndex: number;
  endIndex: number;
  visibleItems: number;
}

// ============================================================================
// MEMOIZATION UTILITIES
// ============================================================================

/**
 * Memoized player filtering and sorting
 * 
 * Optimizes player list filtering and sorting for draft room.
 * Memoizes results based on player list, filters, and search term.
 */
export function useMemoizedPlayers(
  players: PlayerPoolEntry[] | null | undefined,
  filters: string[] | null | undefined,
  search: string | null | undefined,
  sortBy: string | null | undefined,
  sortDirection: 'asc' | 'desc' = 'asc'
): PlayerPoolEntry[] {
  return useMemo(() => {
    if (!players || players.length === 0) return [];

    let filtered = [...players];

    // Filter by search term
    if (search && search.trim()) {
      const searchLower = search.toLowerCase().trim();
      filtered = filtered.filter((player) => {
        const name = (player.name || '').toLowerCase();
        const team = (player.team || '').toLowerCase();
        const position = (player.position || '').toLowerCase();
        return (
          name.includes(searchLower) ||
          team.includes(searchLower) ||
          position.includes(searchLower)
        );
      });
    }

    // Filter by position
    if (filters && filters.length > 0 && !filters.includes('ALL')) {
      filtered = filtered.filter((player) => {
        return filters.includes(player.position);
      });
    }

    // Sort
    if (sortBy) {
      filtered.sort((a, b) => {
        let aValue: string | number;
        let bValue: string | number;

        switch (sortBy) {
          case 'adp':
            aValue = a.adp || 999;
            bValue = b.adp || 999;
            break;
          case 'rankings':
            // Use custom ranking if available, otherwise fallback
            aValue = ((a as unknown) as { customRanking?: number }).customRanking || a.adp || 999;
            bValue = ((b as unknown) as { customRanking?: number }).customRanking || b.adp || 999;
            break;
          case 'name':
            aValue = (a.name || '').toLowerCase();
            bValue = (b.name || '').toLowerCase();
            break;
          case 'team':
            aValue = (a.team || '').toLowerCase();
            bValue = (b.team || '').toLowerCase();
            break;
          default:
            aValue = ((a as unknown) as Record<string, unknown>)[sortBy] as number || 0;
            bValue = ((b as unknown) as Record<string, unknown>)[sortBy] as number || 0;
        }

        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortDirection === 'asc'
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        } else if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
        } else {
          // Fallback: convert to strings for comparison
          return sortDirection === 'asc'
            ? String(aValue).localeCompare(String(bValue))
            : String(bValue).localeCompare(String(aValue));
        }
      });
    }

    return filtered;
  }, [players, filters, search, sortBy, sortDirection]);
}

/**
 * Memoized picks grouping by team
 * 
 * Groups picks by team for draft board display.
 */
export function useMemoizedPicksByTeam(
  picks: Pick[] | null | undefined,
  draftOrder: string[]
): Record<string, Pick[]> {
  return useMemo(() => {
    if (!picks || picks.length === 0) return {};

    const picksByTeam: Record<string, Pick[]> = {};
    
    draftOrder.forEach((team) => {
      picksByTeam[team] = [];
    });

    picks.forEach((pick) => {
      const team = pick.user || pick.pickedBy;
      if (team && picksByTeam[team]) {
        picksByTeam[team].push(pick);
      }
    });

    // Sort picks by pick number
    Object.keys(picksByTeam).forEach((team) => {
      const teamPicks = picksByTeam[team];
      if (teamPicks) {
        teamPicks.sort((a, b) => a.pickNumber - b.pickNumber);
      }
    });

    return picksByTeam;
  }, [picks, draftOrder]);
}

/**
 * Memoized available players (not yet picked)
 * 
 * Calculates which players are still available for drafting.
 */
export function useMemoizedAvailablePlayers(
  allPlayers: PlayerPoolEntry[] | null | undefined,
  picks: Pick[] | null | undefined
): PlayerPoolEntry[] {
  return useMemo(() => {
    if (!allPlayers || allPlayers.length === 0) return [];

    const pickedPlayerNames = new Set(
      (picks || []).map((pick) => {
        if (pick.player && typeof pick.player === 'object' && 'name' in pick.player) {
          return pick.player.name;
        }
        return pick.name || (typeof pick.player === 'string' ? pick.player : '');
      })
    );

    return allPlayers.filter((player) => {
      const playerName = player.name || '';
      return !pickedPlayerNames.has(playerName);
    });
  }, [allPlayers, picks]);
}

/**
 * Memoized team roster
 * 
 * Gets all picks for a specific team.
 */
export function useMemoizedTeamRoster(
  picks: Pick[] | null | undefined,
  teamName: string | null | undefined
): Pick[] {
  return useMemo(() => {
    if (!picks || picks.length === 0 || !teamName) return [];

    return picks
      .filter((pick) => (pick.user || pick.pickedBy) === teamName)
      .sort((a, b) => a.pickNumber - b.pickNumber);
  }, [picks, teamName]);
}

/**
 * Memoized current picker calculation
 * 
 * Calculates who is currently picking based on picks and draft order.
 */
export function useMemoizedCurrentPicker(
  picks: Pick[] | null | undefined,
  draftOrder: string[] | null | undefined,
  totalRounds: number
): CurrentPickerInfo | null {
  return useMemo(() => {
    if (!draftOrder || draftOrder.length === 0) return null;

    const currentPickNumber = (picks?.length || 0) + 1;
    const totalPicks = totalRounds * draftOrder.length;

    if (currentPickNumber > totalPicks) return null;

    const currentRound = Math.ceil(currentPickNumber / draftOrder.length);
    const isSnakeRound = currentRound % 2 === 0;
    const pickIndex = (currentPickNumber - 1) % draftOrder.length;

    const currentPicker = isSnakeRound
      ? draftOrder[draftOrder.length - 1 - pickIndex]!
      : draftOrder[pickIndex]!;

    return {
      currentPicker,
      currentPickNumber,
      currentRound,
      isSnakeRound,
      pickIndex,
    };
  }, [picks, draftOrder, totalRounds]);
}

// ============================================================================
// CALLBACK MEMOIZATION
// ============================================================================

/**
 * Memoized pick handler
 * 
 * Creates a memoized handler for making picks.
 */
export function useMemoizedPickHandler<T extends PlayerPoolEntry>(
  onPick: (player: T) => void,
  dependencies: unknown[] = []
): (player: T) => void {
  return useCallback(
    (player: T) => {
      onPick(player);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onPick, ...dependencies]
  );
}

/**
 * Memoized player select handler
 * 
 * Creates a memoized handler for player selection.
 */
export function useMemoizedPlayerSelectHandler<T extends PlayerPoolEntry>(
  onSelect: (player: T) => void,
  dependencies: unknown[] = []
): (player: T) => void {
  return useCallback(
    (player: T) => {
      onSelect(player);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [onSelect, ...dependencies]
  );
}

// ============================================================================
// PERFORMANCE UTILITIES
// ============================================================================

/**
 * Virtual scrolling helper
 * 
 * Calculates visible range for virtual scrolling.
 */
export function calculateVisibleRange(
  scrollTop: number,
  itemHeight: number,
  containerHeight: number,
  totalItems: number,
  overscan: number = 5
): VisibleRange {
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    totalItems - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  return {
    startIndex,
    endIndex,
    visibleItems: endIndex - startIndex + 1,
  };
}

/**
 * Debounce utility for search/filter inputs
 * 
 * Prevents excessive re-renders during typing.
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Throttle utility for scroll/resize events
 * 
 * Limits callback execution frequency.
 */
export function throttle<T extends (...args: unknown[]) => void>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return function (this: unknown, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// ============================================================================
// OPTIMIZATION GUIDELINES
// ============================================================================

/**
 * Optimization checklist:
 * 
 * 1. ✅ Use React.memo for expensive components (PlayerCard, PickItem, etc.)
 * 2. ✅ Use useMemo for expensive computations (filtering, sorting)
 * 3. ✅ Use useCallback for event handlers passed to children
 * 4. ✅ Debounce search input (300ms delay)
 * 5. ✅ Throttle scroll/resize events
 * 6. ✅ Virtual scrolling for long lists (100+ items)
 * 7. ✅ Lazy load non-critical components
 * 8. ✅ Split large components into smaller ones
 * 9. ✅ Avoid inline functions in JSX
 * 10. ✅ Avoid inline objects in JSX props
 */
