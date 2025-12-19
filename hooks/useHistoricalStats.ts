/**
 * React Hooks for Historical Player Statistics
 * 
 * Provides easy access to immutable historical NFL player data
 * from static JSON files.
 */

import { useState, useEffect, useCallback } from 'react';
import type { SeasonStats, HistoricalPlayer } from '@/lib/historicalStats/types';
import * as historicalService from '@/lib/historicalStats/service';

// =============================================================================
// TYPES
// =============================================================================

interface UseHistoricalStatsState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

// =============================================================================
// PLAYER HOOKS
// =============================================================================

/**
 * Hook to get a player's information from the index
 */
export function useHistoricalPlayer(playerId: string | null) {
  const [state, setState] = useState<UseHistoricalStatsState<HistoricalPlayer>>({
    data: null,
    loading: false,
    error: null,
  });

  useEffect(() => {
    if (!playerId) {
      setState({ data: null, loading: false, error: null });
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    historicalService.getPlayer(playerId)
      .then(data => setState({ data, loading: false, error: null }))
      .catch(error => setState({ data: null, loading: false, error }));
  }, [playerId]);

  return state;
}

/**
 * Hook to search players by name
 */
export function useHistoricalPlayerSearch(query: string) {
  const [state, setState] = useState<UseHistoricalStatsState<HistoricalPlayer[]>>({
    data: null,
    loading: false,
    error: null,
  });

  useEffect(() => {
    if (!query || query.length < 2) {
      setState({ data: null, loading: false, error: null });
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    historicalService.searchPlayers(query)
      .then(data => setState({ data, loading: false, error: null }))
      .catch(error => setState({ data: null, loading: false, error }));
  }, [query]);

  return state;
}

// =============================================================================
// SEASON STATS HOOKS
// =============================================================================

/**
 * Hook to get a player's stats for a specific season
 */
export function usePlayerSeasonStats(playerId: string | null, season: number) {
  const [state, setState] = useState<UseHistoricalStatsState<SeasonStats>>({
    data: null,
    loading: false,
    error: null,
  });

  useEffect(() => {
    if (!playerId) {
      setState({ data: null, loading: false, error: null });
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    historicalService.getPlayerSeasonStats(playerId, season)
      .then(data => setState({ data, loading: false, error: null }))
      .catch(error => setState({ data: null, loading: false, error }));
  }, [playerId, season]);

  return state;
}

/**
 * Hook to get all historical seasons for a player
 */
export function usePlayerAllSeasons(playerId: string | null) {
  const [state, setState] = useState<UseHistoricalStatsState<SeasonStats[]>>({
    data: null,
    loading: false,
    error: null,
  });

  useEffect(() => {
    if (!playerId) {
      setState({ data: null, loading: false, error: null });
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    historicalService.getPlayerAllSeasons(playerId)
      .then(data => setState({ data, loading: false, error: null }))
      .catch(error => setState({ data: null, loading: false, error }));
  }, [playerId]);

  return state;
}

/**
 * Hook to get top performers for a position in a season
 */
export function useTopPerformers(
  position: 'QB' | 'RB' | 'WR' | 'TE',
  season: number,
  limit: number = 20
) {
  const [state, setState] = useState<UseHistoricalStatsState<SeasonStats[]>>({
    data: null,
    loading: false,
    error: null,
  });

  useEffect(() => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    historicalService.getTopPerformers(position, season, limit)
      .then(data => setState({ data, loading: false, error: null }))
      .catch(error => setState({ data: null, loading: false, error }));
  }, [position, season, limit]);

  return state;
}

// =============================================================================
// UTILITY HOOKS
// =============================================================================

/**
 * Hook to check if historical data is available
 */
export function useHistoricalDataAvailable() {
  const [available, setAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    historicalService.isHistoricalDataAvailable()
      .then(setAvailable)
      .catch(() => setAvailable(false));
  }, []);

  return available;
}

/**
 * Hook to get available seasons
 */
export function useAvailableSeasons() {
  const [seasons, setSeasons] = useState<number[]>([]);

  useEffect(() => {
    historicalService.getAvailableSeasons()
      .then(setSeasons)
      .catch(() => setSeasons([]));
  }, []);

  return seasons;
}

/**
 * Hook to preload historical data
 * Returns a function to trigger preload and loading state
 */
export function usePreloadHistoricalData() {
  const [loading, setLoading] = useState(false);
  const [preloaded, setPreloaded] = useState(false);

  const preload = useCallback(async () => {
    if (preloaded) return;
    
    setLoading(true);
    try {
      await historicalService.preloadHistoricalData();
      setPreloaded(true);
    } catch (error) {
      console.error('[usePreloadHistoricalData] Failed:', error);
    } finally {
      setLoading(false);
    }
  }, [preloaded]);

  return { preload, loading, preloaded };
}

// =============================================================================
// COMBINED HOOKS
// =============================================================================

/**
 * Hook to get comprehensive historical data for a player
 * Combines player info and all season stats
 */
export function usePlayerHistoricalProfile(playerId: string | null) {
  const player = useHistoricalPlayer(playerId);
  const seasons = usePlayerAllSeasons(playerId);

  const loading = player.loading || seasons.loading;
  const error = player.error || seasons.error;

  // Calculate career totals
  const careerTotals = seasons.data ? calculateCareerTotals(seasons.data) : null;

  return {
    player: player.data,
    seasons: seasons.data,
    careerTotals,
    loading,
    error,
  };
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

interface CareerTotals {
  gamesPlayed: number;
  seasonsPlayed: number;
  totalHalfPprPoints: number;
  avgHalfPprPpg: number;
  passing: {
    attempts: number;
    completions: number;
    yards: number;
    touchdowns: number;
    interceptions: number;
  } | null;
  rushing: {
    attempts: number;
    yards: number;
    touchdowns: number;
  } | null;
  receiving: {
    targets: number;
    receptions: number;
    yards: number;
    touchdowns: number;
  } | null;
}

function calculateCareerTotals(seasons: SeasonStats[]): CareerTotals {
  const totals: CareerTotals = {
    gamesPlayed: 0,
    seasonsPlayed: seasons.length,
    totalHalfPprPoints: 0,
    avgHalfPprPpg: 0,
    passing: null,
    rushing: null,
    receiving: null,
  };

  let hasPassingStats = false;
  let hasRushingStats = false;
  let hasReceivingStats = false;

  for (const season of seasons) {
    totals.gamesPlayed += season.gamesPlayed;
    totals.totalHalfPprPoints += season.fantasy.halfPprPoints;

    // Aggregate passing
    if (season.passing) {
      hasPassingStats = true;
      if (!totals.passing) {
        totals.passing = { attempts: 0, completions: 0, yards: 0, touchdowns: 0, interceptions: 0 };
      }
      totals.passing.attempts += season.passing.attempts;
      totals.passing.completions += season.passing.completions;
      totals.passing.yards += season.passing.yards;
      totals.passing.touchdowns += season.passing.touchdowns;
      totals.passing.interceptions += season.passing.interceptions;
    }

    // Aggregate rushing
    if (season.rushing) {
      hasRushingStats = true;
      if (!totals.rushing) {
        totals.rushing = { attempts: 0, yards: 0, touchdowns: 0 };
      }
      totals.rushing.attempts += season.rushing.attempts;
      totals.rushing.yards += season.rushing.yards;
      totals.rushing.touchdowns += season.rushing.touchdowns;
    }

    // Aggregate receiving
    if (season.receiving) {
      hasReceivingStats = true;
      if (!totals.receiving) {
        totals.receiving = { targets: 0, receptions: 0, yards: 0, touchdowns: 0 };
      }
      totals.receiving.targets += season.receiving.targets;
      totals.receiving.receptions += season.receiving.receptions;
      totals.receiving.yards += season.receiving.yards;
      totals.receiving.touchdowns += season.receiving.touchdowns;
    }
  }

  // Calculate average PPG
  totals.avgHalfPprPpg = totals.gamesPlayed > 0
    ? Math.round((totals.totalHalfPprPoints / totals.gamesPlayed) * 10) / 10
    : 0;

  // Round total points
  totals.totalHalfPprPoints = Math.round(totals.totalHalfPprPoints * 10) / 10;

  return totals;
}



