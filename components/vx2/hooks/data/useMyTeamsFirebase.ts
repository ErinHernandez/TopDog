/**
 * useMyTeamsFirebase - Firebase integration for user's teams
 * 
 * Provides real-time and one-time fetch capabilities for user's teams from Firestore.
 * Uses game-day optimization to minimize Firebase costs.
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  getDocs,
  Timestamp,
  QuerySnapshot,
  DocumentData
} from 'firebase/firestore';
import { db } from '../../../../lib/firebase';
import { useAuth } from '../../auth/hooks/useAuth';
import { FirestoreTeam } from '../../../../types/firestore';
import { MyTeam, TeamPlayer, UseMyTeamsResult } from './useMyTeams';
import { shouldUseRealTime } from '../../../../lib/tournament/seasonUtils';

// ============================================================================
// DATA TRANSFORMATION
// ============================================================================

/**
 * Convert Firestore Timestamp to ISO string
 */
function timestampToISO(timestamp: Timestamp | Date | string): string {
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate().toISOString();
  }
  if (timestamp instanceof Date) {
    return timestamp.toISOString();
  }
  return timestamp;
}

/**
 * Convert FirestoreTeam to MyTeam (component type)
 */
function transformFirestoreTeamToMyTeam(
  firestoreTeam: FirestoreTeam & { id: string }
): MyTeam {
  // Transform roster from Firestore format to component format
  const players: TeamPlayer[] = firestoreTeam.roster.map((player) => ({
    name: player.name,
    team: player.team,
    bye: 0, // Would need to look up from NFL_TEAMS or player data
    adp: 0, // Would need to calculate or fetch from player data
    pick: player.pickNumber,
    projectedPoints: 0, // Would need to fetch from player projections
    position: player.position as 'QB' | 'RB' | 'WR' | 'TE',
  }));

  return {
    id: firestoreTeam.id,
    name: firestoreTeam.name || firestoreTeam.tournamentName || 'Unnamed Team',
    tournament: firestoreTeam.tournamentName,
    tournamentId: firestoreTeam.tournamentId,
    rank: firestoreTeam.rank,
    totalTeams: undefined, // Would need to query tournament for total
    projectedPoints: firestoreTeam.totalPoints || 0,
    draftedAt: timestampToISO(firestoreTeam.createdAt),
    players,
  };
}

// ============================================================================
// FIREBASE QUERIES
// ============================================================================

/**
 * Create teams query with proper ordering
 */
function createTeamsQuery(userId: string) {
  if (!db) {
    throw new Error('Firebase Firestore is not initialized');
  }
  const teamsRef = collection(db, 'users', userId, 'teams');
  return query(teamsRef, orderBy('createdAt', 'desc'));
}

/**
 * Fetch teams once (non-real-time)
 */
async function fetchMyTeamsOnce(userId: string): Promise<MyTeam[]> {
  try {
    const teamsQuery = createTeamsQuery(userId);
    const snapshot = await getDocs(teamsQuery);
    
    const teams: MyTeam[] = [];
    snapshot.forEach((doc) => {
      const data = { id: doc.id, ...doc.data() } as FirestoreTeam & { id: string };
      try {
        const transformed = transformFirestoreTeamToMyTeam(data);
        teams.push(transformed);
      } catch (error) {
        console.error(`[fetchMyTeamsOnce] Error transforming team ${doc.id}:`, error);
      }
    });

    return teams;
  } catch (error) {
    console.error('[fetchMyTeamsOnce] Error:', error);
    throw error;
  }
}

/**
 * Set up real-time listener for user's teams
 */
function setupTeamsListener(
  userId: string,
  onUpdate: (teams: MyTeam[]) => void,
  onError: (error: Error) => void
): () => void {
  const teamsQuery = createTeamsQuery(userId);

  const unsubscribe = onSnapshot(
    teamsQuery,
    (snapshot: QuerySnapshot<DocumentData>) => {
      const teams: MyTeam[] = [];
      
      snapshot.forEach((doc) => {
        const data = { id: doc.id, ...doc.data() } as FirestoreTeam & { id: string };
        try {
          const transformed = transformFirestoreTeamToMyTeam(data);
          teams.push(transformed);
        } catch (error) {
          console.error(`[setupTeamsListener] Error transforming team ${doc.id}:`, error);
        }
      });

      onUpdate(teams);
    },
    (error) => {
      console.error('[setupTeamsListener] Snapshot error:', error);
      onError(new Error(error.message));
    }
  );

  return unsubscribe;
}

// ============================================================================
// HOOK WITH FIREBASE
// ============================================================================

/**
 * Hook for fetching and managing user's teams with Firebase
 * 
 * Uses game-day optimization:
 * - Always starts with one-time fetch (cheaper)
 * - Adds real-time listener only on game days/post-game days during active tournaments
 * - Falls back to one-time fetch on non-game days and after Week 17
 */
export function useMyTeamsFirebase(): UseMyTeamsResult {
  const [teams, setTeams] = useState<MyTeam[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefetching, setIsRefetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { user } = useAuth();
  const userId = user?.uid;

  // FIX: Track mounted state to prevent state updates after unmount
  const isMountedRef = useRef(true);
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Determine if we should use real-time based on game day logic
  const useRealTime = useMemo(() => shouldUseRealTime(), []);

  // One-time fetch function
  const fetchData = useCallback(async (isRefetch = false) => {
    if (!userId) {
      setError('User not authenticated');
      setIsLoading(false);
      return;
    }

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/2aaead3f-67a7-4f92-b03f-ef7a26e0239e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useMyTeamsFirebase.ts:171',message:'fetchData called',data:{userId,isRefetch},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion

    try {
      if (isRefetch) {
        setIsRefetching(true);
      } else {
        setIsLoading(true);
      }
      setError(null);
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/2aaead3f-67a7-4f92-b03f-ef7a26e0239e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useMyTeamsFirebase.ts:186',message:'Before fetchMyTeamsOnce',data:{userId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      const data = await fetchMyTeamsOnce(userId);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/2aaead3f-67a7-4f92-b03f-ef7a26e0239e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useMyTeamsFirebase.ts:189',message:'After fetchMyTeamsOnce',data:{dataLength:data?.length,isArray:Array.isArray(data),isMounted:isMountedRef.current},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      // FIX: Check if component is mounted before setting state
      if (!isMountedRef.current) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/2aaead3f-67a7-4f92-b03f-ef7a26e0239e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useMyTeamsFirebase.ts:198',message:'Skipping state update - component unmounted',data:{userId},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'B'})}).catch(()=>{});
        // #endregion
        return;
      }
      setTeams(data);
    } catch (err) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/2aaead3f-67a7-4f92-b03f-ef7a26e0239e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useMyTeamsFirebase.ts:192',message:'fetchData error',data:{error:err instanceof Error?err.message:'unknown',userId},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      // FIX: Check if mounted before setting error state
      if (isMountedRef.current) {
        setError(errorMessage);
      }
      console.error('[useMyTeamsFirebase] Fetch error:', err);
    } finally {
      // FIX: Check if mounted before setting loading state
      if (isMountedRef.current) {
        setIsLoading(false);
        setIsRefetching(false);
      }
    }
  }, [userId]);

  // Set up listener or one-time fetch based on game day
  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      setError('User not authenticated');
      return;
    }

    // Always start with one-time fetch (cheaper than establishing listener immediately)
    fetchData();

    // Then add real-time listener only if needed (game days/post-game days)
    if (!useRealTime) {
      // Non-game day, after Week 17, or off-season: One-time fetch only
      return;
    }

    // Game day or post-game day during active tournament: Add real-time listener
    setIsLoading(true);
    setError(null);

    const unsubscribe = setupTeamsListener(
      userId,
      (updatedTeams) => {
        setTeams(updatedTeams);
        setIsLoading(false);
        setError(null);
      },
      (err) => {
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

