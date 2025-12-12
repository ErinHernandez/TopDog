/**
 * React Hook for Player Pool
 * 
 * Provides React-friendly access to the static player pool.
 * 
 * Usage:
 *   const { pool, players, loading, error } = usePlayerPool();
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import type { PlayerPool, PoolPlayer, Position } from './types';
import { 
  getPlayerPool, 
  getPlayerPoolSync,
  getAvailablePlayers,
  searchPlayers,
  getPlayersByPosition,
  getBestAvailable,
} from './index';

interface UsePlayerPoolResult {
  /** Full pool object with metadata */
  pool: PlayerPool | null;
  /** Array of all players */
  players: PoolPlayer[];
  /** Loading state */
  loading: boolean;
  /** Error if load failed */
  error: Error | null;
  /** Reload the pool (clears cache) */
  reload: () => Promise<void>;
}

/**
 * Hook to load and access the player pool.
 * 
 * @example
 * function DraftRoom() {
 *   const { players, loading, error } = usePlayerPool();
 *   
 *   if (loading) return <Spinner />;
 *   if (error) return <Error message={error.message} />;
 *   
 *   return <PlayerList players={players} />;
 * }
 */
export function usePlayerPool(): UsePlayerPoolResult {
  const [pool, setPool] = useState<PlayerPool | null>(getPlayerPoolSync);
  const [loading, setLoading] = useState(!pool);
  const [error, setError] = useState<Error | null>(null);
  
  const loadPool = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const loaded = await getPlayerPool();
      setPool(loaded);
    } catch (e) {
      setError(e instanceof Error ? e : new Error('Failed to load player pool'));
    } finally {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => {
    if (!pool) {
      loadPool();
    }
  }, [pool, loadPool]);
  
  return {
    pool,
    players: pool?.players ?? [],
    loading,
    error,
    reload: loadPool,
  };
}

interface UseAvailablePlayersOptions {
  /** Position filter */
  position?: Position | 'ALL';
  /** Search query */
  searchQuery?: string;
  /** Sort method */
  sortBy?: 'adp' | 'projection' | 'name';
}

interface UseAvailablePlayersResult {
  /** Filtered and sorted available players */
  available: PoolPlayer[];
  /** Total available count (before filters) */
  totalAvailable: number;
  /** Loading state */
  loading: boolean;
  /** Best available player overall */
  bestAvailable: PoolPlayer | undefined;
  /** Best available by position */
  bestByPosition: Record<Position, PoolPlayer | undefined>;
}

/**
 * Hook for draft room available players.
 * Handles filtering, sorting, and computing best available.
 * 
 * @example
 * function AvailablePlayers({ pickedIds }) {
 *   const { available, bestAvailable, bestByPosition } = useAvailablePlayers(pickedIds, {
 *     position: 'RB',
 *     searchQuery: 'jones',
 *   });
 *   
 *   return (
 *     <div>
 *       <p>Best RB: {bestByPosition.RB?.name}</p>
 *       {available.map(p => <PlayerRow key={p.id} player={p} />)}
 *     </div>
 *   );
 * }
 */
export function useAvailablePlayers(
  pickedIds: string[],
  options: UseAvailablePlayersOptions = {}
): UseAvailablePlayersResult {
  const { players, loading } = usePlayerPool();
  const { position = 'ALL', searchQuery = '', sortBy = 'adp' } = options;
  
  const result = useMemo(() => {
    // Get all available
    const allAvailable = getAvailablePlayers(players, pickedIds);
    
    // Apply position filter
    let filtered = position === 'ALL' 
      ? allAvailable 
      : allAvailable.filter(p => p.position === position);
    
    // Apply search
    if (searchQuery.trim()) {
      filtered = searchPlayers(filtered, searchQuery);
    }
    
    // Apply sort
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'projection':
          return b.projection - a.projection;
        case 'name':
          return a.name.localeCompare(b.name);
        case 'adp':
        default:
          return a.adp - b.adp;
      }
    });
    
    // Compute best available
    const bestAvailable = getBestAvailable(players, pickedIds);
    
    const bestByPosition: Record<Position, PoolPlayer | undefined> = {
      QB: allAvailable.find(p => p.position === 'QB'),
      RB: allAvailable.find(p => p.position === 'RB'),
      WR: allAvailable.find(p => p.position === 'WR'),
      TE: allAvailable.find(p => p.position === 'TE'),
    };
    
    return {
      available: sorted,
      totalAvailable: allAvailable.length,
      bestAvailable,
      bestByPosition,
    };
  }, [players, pickedIds, position, searchQuery, sortBy]);
  
  return {
    ...result,
    loading,
  };
}

interface UseRosterOptions {
  /** Maximum roster size */
  maxSize?: number;
}

interface UseRosterResult {
  /** Players on roster */
  roster: PoolPlayer[];
  /** Position counts */
  positionCounts: Record<Position, number>;
  /** Is roster full */
  isFull: boolean;
  /** Total projected points */
  totalProjection: number;
}

/**
 * Hook for managing a draft roster.
 * 
 * @example
 * function MyRoster({ myPickedIds }) {
 *   const { roster, positionCounts, totalProjection } = useRoster(myPickedIds);
 *   
 *   return (
 *     <div>
 *       <p>QB: {positionCounts.QB}/1</p>
 *       <p>Projected: {totalProjection.toFixed(1)}</p>
 *     </div>
 *   );
 * }
 */
export function useRoster(
  pickedIds: string[],
  options: UseRosterOptions = {}
): UseRosterResult {
  const { players, loading } = usePlayerPool();
  const { maxSize = 18 } = options;
  
  return useMemo(() => {
    const pickedSet = new Set(pickedIds);
    const roster = players.filter(p => pickedSet.has(p.id));
    
    const positionCounts: Record<Position, number> = {
      QB: roster.filter(p => p.position === 'QB').length,
      RB: roster.filter(p => p.position === 'RB').length,
      WR: roster.filter(p => p.position === 'WR').length,
      TE: roster.filter(p => p.position === 'TE').length,
    };
    
    const totalProjection = roster.reduce((sum, p) => sum + p.projection, 0);
    
    return {
      roster,
      positionCounts,
      isFull: roster.length >= maxSize,
      totalProjection,
    };
  }, [players, pickedIds, maxSize]);
}

