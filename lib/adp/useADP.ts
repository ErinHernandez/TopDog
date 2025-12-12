/**
 * React Hooks for ADP Data
 * 
 * Usage:
 *   const { adp, loading } = useLiveADP();
 *   const { playerADP } = usePlayerADP('chase_jamarr');
 *   const { rankings } = useADPRankings();
 */

import { useState, useEffect, useMemo } from 'react';
import type { LiveADP, PlayerADP } from './types';
import {
  getLiveADP,
  getPlayerADP,
  getPlayersByADP,
  getADPRankings,
  getBiggestRisers,
  getBiggestFallers,
} from './index';

// ============================================================================
// CORE HOOKS
// ============================================================================

interface UseLiveADPResult {
  adp: LiveADP | null;
  loading: boolean;
  error: Error | null;
  refresh: () => void;
}

/**
 * Hook to load live ADP data.
 */
export function useLiveADP(): UseLiveADPResult {
  const [adp, setADP] = useState<LiveADP | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  
  useEffect(() => {
    setLoading(true);
    setError(null);
    
    getLiveADP()
      .then(setADP)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [refreshKey]);
  
  const refresh = () => setRefreshKey(k => k + 1);
  
  return { adp, loading, error, refresh };
}

// ============================================================================
// PLAYER HOOKS
// ============================================================================

interface UsePlayerADPResult {
  playerADP: PlayerADP | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Hook to get ADP for a specific player.
 */
export function usePlayerADP(playerId: string): UsePlayerADPResult {
  const [playerADP, setPlayerADP] = useState<PlayerADP | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  useEffect(() => {
    if (!playerId) {
      setPlayerADP(null);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    getPlayerADP(playerId)
      .then(data => setPlayerADP(data ?? null))
      .catch(setError)
      .finally(() => setLoading(false));
  }, [playerId]);
  
  return { playerADP, loading, error };
}

// ============================================================================
// RANKING HOOKS
// ============================================================================

interface UseADPRankingsResult {
  rankings: Array<{ playerId: string } & PlayerADP>;
  loading: boolean;
}

/**
 * Hook to get all players ranked by ADP.
 */
export function useADPRankings(): UseADPRankingsResult {
  const { adp, loading } = useLiveADP();
  
  const rankings = useMemo(() => {
    if (!adp) return [];
    return getADPRankings(adp);
  }, [adp]);
  
  return { rankings, loading };
}

interface UseADPRangeResult {
  players: Array<{ playerId: string } & PlayerADP>;
  loading: boolean;
}

/**
 * Hook to get players within an ADP range.
 */
export function useADPRange(minADP: number, maxADP: number): UseADPRangeResult {
  const { rankings, loading } = useADPRankings();
  
  const players = useMemo(() => {
    return rankings.filter(p => p.adp >= minADP && p.adp <= maxADP);
  }, [rankings, minADP, maxADP]);
  
  return { players, loading };
}

// ============================================================================
// MOVERS HOOKS
// ============================================================================

interface UseADPMoversResult {
  risers: Array<{ playerId: string } & PlayerADP>;
  fallers: Array<{ playerId: string } & PlayerADP>;
  loading: boolean;
}

/**
 * Hook to get biggest ADP risers and fallers.
 */
export function useADPMovers(limit: number = 10): UseADPMoversResult {
  const { adp, loading } = useLiveADP();
  
  const { risers, fallers } = useMemo(() => {
    if (!adp) return { risers: [], fallers: [] };
    
    return {
      risers: getBiggestRisers(adp, limit),
      fallers: getBiggestFallers(adp, limit),
    };
  }, [adp, limit]);
  
  return { risers, fallers, loading };
}

// ============================================================================
// METADATA HOOKS
// ============================================================================

interface UseADPMetadataResult {
  generatedAt: string | null;
  totalDrafts: number;
  isStale: boolean;
  loading: boolean;
}

/**
 * Hook to get ADP metadata and freshness.
 */
export function useADPMetadata(maxAgeHours: number = 12): UseADPMetadataResult {
  const { adp, loading } = useLiveADP();
  
  const metadata = useMemo(() => {
    if (!adp) {
      return {
        generatedAt: null,
        totalDrafts: 0,
        isStale: false,
      };
    }
    
    const generatedAt = adp.metadata.generatedAt;
    const generatedTime = new Date(generatedAt).getTime();
    const maxAgeMs = maxAgeHours * 60 * 60 * 1000;
    const isStale = Date.now() - generatedTime > maxAgeMs;
    
    return {
      generatedAt,
      totalDrafts: adp.metadata.totalDrafts,
      isStale,
    };
  }, [adp, maxAgeHours]);
  
  return { ...metadata, loading };
}

// ============================================================================
// COMPARISON HOOKS
// ============================================================================

interface UseADPComparisonResult {
  /** Difference from ADP (negative = value, positive = reach) */
  difference: number | null;
  loading: boolean;
}

/**
 * Hook to compare a player's current pick position to their ADP.
 */
export function useADPComparison(
  playerId: string,
  pickPosition: number
): UseADPComparisonResult {
  const { playerADP, loading } = usePlayerADP(playerId);
  
  const comparison = useMemo(() => {
    if (!playerADP || !pickPosition) {
      return { difference: null };
    }
    
    // Negative = drafted earlier than ADP (good value)
    // Positive = drafted later than ADP (falling)
    const difference = pickPosition - playerADP.adp;
    
    return {
      difference: Math.round(difference * 10) / 10,
    };
  }, [playerADP, pickPosition]);
  
  return { ...comparison, loading };
}

