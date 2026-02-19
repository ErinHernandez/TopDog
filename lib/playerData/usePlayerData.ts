/**
 * React Hooks for Static Player Data
 * 
 * Provides React-friendly access to static player data.
 * 
 * Usage:
 *   const { registry, loading } = useRegistry();
 *   const { player, loading } = useFullPlayer('chase_jamarr');
 */

import { useState, useEffect, useMemo } from 'react';

import type { 
  RegistryData, 
  CareerStatsData, 
  RostersData, 
  FullPlayer,
  SeasonStats,
  Position,
} from './types';

import {
  getRegistry,
  getCareerStats,
  getRosters,
  getFullPlayer,
  getAllFullPlayers,
  getCareerTotals,
} from './index';

// ============================================================================
// CORE DATA HOOKS
// ============================================================================

interface UseRegistryResult {
  registry: RegistryData | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Hook to load player registry.
 */
export function useRegistry(): UseRegistryResult {
  const [registry, setRegistry] = useState<RegistryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    getRegistry()
      .then(setRegistry)
      .catch((err: unknown) => setError(err instanceof Error ? err : new Error(String(err))))
      .finally(() => setLoading(false));
  }, []);
  
  return { registry, loading, error };
}

interface UseCareerStatsResult {
  careerStats: CareerStatsData | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Hook to load career stats.
 */
export function useCareerStats(): UseCareerStatsResult {
  const [careerStats, setCareerStats] = useState<CareerStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    getCareerStats()
      .then(setCareerStats)
      .catch((err: unknown) => setError(err instanceof Error ? err : new Error(String(err))))
      .finally(() => setLoading(false));
  }, []);
  
  return { careerStats, loading, error };
}

interface UseRostersResult {
  rosters: RostersData | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Hook to load rosters.
 */
export function useRosters(): UseRostersResult {
  const [rosters, setRosters] = useState<RostersData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    getRosters()
      .then(setRosters)
      .catch((err: unknown) => setError(err instanceof Error ? err : new Error(String(err))))
      .finally(() => setLoading(false));
  }, []);
  
  return { rosters, loading, error };
}

// ============================================================================
// PLAYER HOOKS
// ============================================================================

interface UseFullPlayerResult {
  player: FullPlayer | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Hook to load a single player with all data.
 */
export function useFullPlayer(playerId: string): UseFullPlayerResult {
  const [player, setPlayer] = useState<FullPlayer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    if (!playerId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional setState in effect
      setPlayer(null);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    getFullPlayer(playerId)
      .then(p => setPlayer(p ?? null))
      .catch((err: unknown) => setError(err instanceof Error ? err : new Error(String(err))))
      .finally(() => setLoading(false));
  }, [playerId]);
  
  return { player, loading, error };
}

interface UseAllPlayersResult {
  players: FullPlayer[];
  loading: boolean;
  error: Error | null;
}

/**
 * Hook to load all players with full data.
 */
export function useAllPlayers(): UseAllPlayersResult {
  const [players, setPlayers] = useState<FullPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    getAllFullPlayers()
      .then(setPlayers)
      .catch((err: unknown) => setError(err instanceof Error ? err : new Error(String(err))))
      .finally(() => setLoading(false));
  }, []);
  
  return { players, loading, error };
}

// ============================================================================
// FILTERED PLAYER HOOKS
// ============================================================================

interface UsePlayersByPositionResult {
  players: FullPlayer[];
  loading: boolean;
}

/**
 * Hook to get players filtered by position.
 */
export function usePlayersByPosition(position: Position | 'ALL'): UsePlayersByPositionResult {
  const { players: allPlayers, loading } = useAllPlayers();
  
  const players = useMemo(() => {
    if (position === 'ALL') return allPlayers;
    return allPlayers.filter((p: FullPlayer) => p.position === position);
  }, [allPlayers, position]);
  
  return { players, loading };
}

interface UsePlayersByTeamResult {
  players: FullPlayer[];
  loading: boolean;
}

/**
 * Hook to get players filtered by team.
 */
export function usePlayersByTeam(team: string): UsePlayersByTeamResult {
  const { players: allPlayers, loading } = useAllPlayers();
  
  const players = useMemo(() => {
    if (!team) return allPlayers;
    return allPlayers.filter((p: FullPlayer) => p.team === team);
  }, [allPlayers, team]);
  
  return { players, loading };
}

// ============================================================================
// STATS HOOKS
// ============================================================================

interface UsePlayerStatsResult {
  stats: Record<string, SeasonStats> | null;
  totals: SeasonStats | null;
  loading: boolean;
}

/**
 * Hook to get a player's career stats and totals.
 */
export function usePlayerStats(playerId: string): UsePlayerStatsResult {
  const [stats, setStats] = useState<Record<string, SeasonStats> | null>(null);
  const [totals, setTotals] = useState<SeasonStats | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!playerId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional setState in effect
      setStats(null);
      setTotals(null);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    Promise.all([
      getCareerStats().then(data => data.players[playerId] ?? null),
      getCareerTotals(playerId).then(t => t ?? null),
    ])
      .then(([s, t]) => {
        setStats(s);
        setTotals(t);
      })
      .finally(() => setLoading(false));
  }, [playerId]);
  
  return { stats, totals, loading };
}

// ============================================================================
// SEARCH HOOK
// ============================================================================

interface UsePlayerSearchResult {
  results: FullPlayer[];
  loading: boolean;
}

/**
 * Hook to search players by name.
 */
export function usePlayerSearch(query: string): UsePlayerSearchResult {
  const { players, loading } = useAllPlayers();
  
  const results = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return [];
    
    return players.filter((p: FullPlayer) => 
      p.name.toLowerCase().includes(q) ||
      p.team.toLowerCase().includes(q) ||
      p.college.toLowerCase().includes(q)
    );
  }, [players, query]);
  
  return { results, loading };
}

