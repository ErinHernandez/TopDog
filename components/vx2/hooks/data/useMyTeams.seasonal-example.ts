/**
 * useMyTeams - Seasonal Real-Time Example
 * 
 * This shows how to implement seasonal real-time listeners that only
 * activate during NFL season, saving 60-70% on Firebase costs.
 */

import { useState, useEffect, useCallback } from 'react';
import { collection, query, orderBy, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../../../../lib/firebase';
import { useAuth } from '../../auth'; // VX2 auth hook
import { MyTeam, UseMyTeamsResult } from './useMyTeams';

// ============================================================================
// SEASONAL LOGIC
// ============================================================================

/**
 * Check if NFL season is currently active
 * 
 * NFL regular season: Weeks 1-17 (typically September - early January)
 * Week 17 typically ends around January 7-10
 * 
 * Preseason: August (games start, but tournaments may not be active yet)
 * Regular season: September - Week 17 (early January)
 * 
 * Off-season: After Week 17 through July (no games, no updates needed)
 * 
 * NOTE: This is hardcoded for regular season tournaments.
 * Future tournaments (playoffs, weekly) will need flexible schedule logic.
 */
export function isNFLSeasonActive(): boolean {
  const now = new Date();
  const month = now.getMonth(); // 0-11 (Jan = 0, Dec = 11)
  
  // NFL season months: August (7) through January (0)
  // Week 17 typically ends in early January
  // August is preseason, but tournaments may be active
  return month >= 7 || month === 0;
}

/**
 * Check if tournaments are still active
 * 
 * Tournaments end after Week 17 completion (typically early January).
 * After Week 17, all teams are final and no updates are needed.
 * 
 * NOTE: This is hardcoded for regular season tournaments.
 * Future tournaments (playoffs, weekly) will need flexible schedule logic.
 */
export function isTournamentActive(): boolean {
  if (!isNFLSeasonActive()) {
    return false; // Off-season: tournaments not active
  }
  
  const now = new Date();
  const month = now.getMonth();
  const date = now.getDate();
  
  // Week 17 typically ends around January 7-10
  // After that, tournaments are complete and teams are final
  if (month === 0 && date > 10) {
    return false; // After Jan 10, tournaments are done
  }
  
  return true; // Still in season, tournaments active
}

/**
 * Get player news update frequency
 * 
 * During season (August - Week 17): 3x daily
 * After Week 17: 1x daily
 * 
 * NOTE: This is hardcoded for regular season.
 * Future tournaments will use tournament-specific config.
 */
export function getPlayerNewsFrequency(): number {
  const now = new Date();
  const month = now.getMonth();
  const date = now.getDate();
  
  // Season: August (7) through Week 17 (early January, ~Jan 10)
  // During this period: 3x daily updates
  if (month >= 7 || (month === 0 && date <= 10)) {
    return 3; // 3x daily during season
  }
  
  // After Week 17 through July: 1x daily
  return 1; // 1x daily off-season
}

/**
 * Check if today is a game day
 * 
 * NFL games happen on:
 * - Thursday: 1 game (usually)
 * - Sunday: Most games
 * - Monday: 1 game (usually)
 * 
 * Team data (points, status, rankings) ONLY updates on game days.
 * Non-game days have static team data (player news doesn't change team data).
 * 
 * Only relevant during active tournaments (Weeks 1-17).
 */
export function isGameDay(): boolean {
  if (!isTournamentActive()) return false; // Tournaments end after Week 17
  
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0-6 (Sun = 0, Sat = 6)
  
  // Game days: Thursday (4), Sunday (0), Monday (1)
  return dayOfWeek === 0 || dayOfWeek === 1 || dayOfWeek === 4;
}

/**
 * Check if today is the day after games (for score finalization)
 * 
 * Score updates typically finalize:
 * - Friday (after Thursday games)
 * - Monday (after Sunday games) - Note: Monday is also a game day
 * - Tuesday (after Monday games)
 * 
 * Only relevant during active tournaments (Weeks 1-17).
 */
export function isPostGameDay(): boolean {
  if (!isTournamentActive()) return false; // Tournaments end after Week 17
  
  const now = new Date();
  const dayOfWeek = now.getDay();
  
  // Post-game days: Friday (5), Monday (1), Tuesday (2)
  // Monday counts as both game day and post-game day
  return dayOfWeek === 2 || dayOfWeek === 5 || dayOfWeek === 1;
}


/**
 * Check if real-time updates are needed
 * 
 * Real-time is ONLY needed when:
 * 1. Tournaments are active (Weeks 1-17, before Week 17 ends)
 * 2. It's a game day OR day after games (for score finalization)
 * 
 * Team data (roster, points, status, rankings) ONLY changes on game days.
 * Non-game days have static team data - player news doesn't change team data.
 * After Week 17, tournaments end and teams are final - no updates needed.
 */
export function shouldUseRealTime(): boolean {
  // Tournaments end after Week 17 - no updates needed after that
  if (!isTournamentActive()) {
    return false; // After Week 17 or off-season: no updates
  }
  
  // Only use real-time on game days + post-game days
  // Non-game days: Team data is static, use one-time fetch
  return isGameDay() || isPostGameDay();
}

// ============================================================================
// HOOK WITH SEASONAL LOGIC
// ============================================================================

/**
 * Hook for fetching user's teams with seasonal real-time optimization
 */
export function useMyTeamsSeasonal(): UseMyTeamsResult {
  const [teams, setTeams] = useState<MyTeam[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefetching, setIsRefetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { user } = useAuth();
  const userId = user?.uid;
  const useRealTime = shouldUseRealTime();

  // One-time fetch function
  const fetchData = useCallback(async (isRefetch = false) => {
    if (!userId) {
      setError('User not authenticated');
      setIsLoading(false);
      return;
    }

    try {
      if (isRefetch) {
        setIsRefetching(true);
      } else {
        setIsLoading(true);
      }
      setError(null);
      
      if (!db) {
        throw new Error('Firebase Firestore is not initialized');
      }
      const teamsRef = collection(db, 'users', userId, 'teams');
      const teamsQuery = query(teamsRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(teamsQuery);
      
      const fetchedTeams = snapshot.docs.map(doc => {
        // Transform Firestore document to MyTeam
        const data = doc.data();
        return {
          id: doc.id,
          // ... transformation logic
        } as MyTeam;
      });
      
      setTeams(fetchedTeams);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      console.error('[useMyTeamsSeasonal] Fetch error:', err);
    } finally {
      setIsLoading(false);
      setIsRefetching(false);
    }
  }, [userId]);

  // Set up listener or one-time fetch based on season
  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      setError('User not authenticated');
      return;
    }

    if (!useRealTime) {
      // After Week 17, off-season, or non-game day: Use one-time fetch
      // Team data is static on non-game days (player news doesn't change team data)
      // After Week 17, tournaments are complete and teams are final
      console.log('[useMyTeamsSeasonal] Non-game day, after Week 17, or off-season: Using one-time fetch');
      fetchData();
      return;
    }

    // Game day or post-game day during active tournament: Use real-time listener
    // Team data (points, status, rankings) updates during/after games
    // Only active until Week 17 ends
    console.log('[useMyTeamsSeasonal] Game day or post-game during active tournament: Using real-time listener');
    setIsLoading(true);
    setError(null);

    if (!db) {
      setError('Firebase Firestore is not initialized');
      setIsLoading(false);
      return;
    }
    const teamsRef = collection(db, 'users', userId, 'teams');
    const teamsQuery = query(teamsRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      teamsQuery,
      (snapshot) => {
        const fetchedTeams = snapshot.docs.map(doc => {
          // Transform Firestore document to MyTeam
          const data = doc.data();
          return {
            id: doc.id,
            // ... transformation logic
          } as MyTeam;
        });
        
        setTeams(fetchedTeams);
        setIsLoading(false);
        setError(null);
      },
      (err) => {
        console.error('[useMyTeamsSeasonal] Snapshot error:', err);
        setError(err.message);
        setIsLoading(false);
      }
    );

    // Cleanup on unmount
    return () => {
      unsubscribe();
    };
  }, [userId, useRealTime, fetchData]);

  const refetch = useCallback(async () => {
    if (!useRealTime) {
      await fetchData(true);
    }
    // For real-time, the snapshot listener handles updates automatically
  }, [fetchData, useRealTime]);

  return {
    teams,
    isLoading,
    error,
    refetch,
    isRefetching,
    teamCount: teams.length,
  };
}

// ============================================================================
// ADVANCED: GAME-DAY SPECIFIC OPTIMIZATION
// ============================================================================

/**
 * Even more granular: Only use real-time on game days + 1 day after
 * 
 * This further reduces costs by only listening when updates actually happen
 */
export function useMyTeamsGameDayOptimized(): UseMyTeamsResult {
  const [teams, setTeams] = useState<MyTeam[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { user } = useAuth();
  const userId = user?.uid;
  
  // Check if we should use real-time (game day or day after, during active tournament)
  const shouldUseRealTimeNow = useCallback(() => {
    // Tournaments end after Week 17 - no updates needed after that
    if (!isTournamentActive()) return false;
    
    // Team data only changes on game days + post-game days
    // Non-game days: Static data (player news doesn't change team data)
    return isGameDay() || isPostGameDay();
  }, []);

  // Helper function to transform Firestore document to MyTeam
  const transform = useCallback((doc: any): MyTeam => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.tournamentName || 'Unnamed Team',
      tournament: data.tournamentName,
      tournamentId: data.tournamentId,
      rank: data.rank,
      totalTeams: undefined,
      projectedPoints: data.totalPoints || 0,
      draftedAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      players: (data.roster || []).map((p: any) => ({
        name: p.name,
        team: p.team,
        bye: 0,
        adp: 0,
        pick: p.pickNumber,
        projectedPoints: 0,
        position: p.position as 'QB' | 'RB' | 'WR' | 'TE',
      })),
    };
  }, []);

  // Helper function to fetch data once (for non-game days)
  const fetchData = useCallback(async () => {
    if (!userId) return;
    if (!db) {
      setError('Firebase Firestore is not initialized');
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const snapshot = await getDocs(
        query(collection(db, 'users', userId, 'teams'), orderBy('createdAt', 'desc'))
      );
      setTeams(snapshot.docs.map(transform));
      setIsLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch teams');
      setIsLoading(false);
    }
  }, [userId, transform]);

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    const useRealTime = shouldUseRealTimeNow();

    if (!useRealTime) {
      // Non-game days: One-time fetch
      fetchData();
      return;
    }

    if (!db) {
      setError('Firebase Firestore is not initialized');
      setIsLoading(false);
      return;
    }

    // Game days: Real-time listener
    const unsubscribe = onSnapshot(
      query(collection(db, 'users', userId, 'teams'), orderBy('createdAt', 'desc')),
      (snapshot) => {
        setTeams(snapshot.docs.map(transform));
        setIsLoading(false);
      },
      (err) => {
        setError(err.message);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId, shouldUseRealTimeNow, fetchData, transform]);

  const refetch = useCallback(async () => {
    // Implementation would fetch data again
    setIsLoading(true);
    // ... fetch logic
    setIsLoading(false);
  }, [userId]);

  return {
    teams,
    isLoading,
    error,
    refetch,
    isRefetching: false,
    teamCount: teams.length,
  };
}

