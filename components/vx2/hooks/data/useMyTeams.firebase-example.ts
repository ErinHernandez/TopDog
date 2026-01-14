/**
 * useMyTeams - Firebase Integration Example
 * 
 * This shows how to convert the mock data hook to use Firebase Firestore.
 * Replace the fetchMyTeams function in useMyTeams.ts with this implementation.
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  getDocs,
  Timestamp,
  QuerySnapshot,
  DocumentData
} from 'firebase/firestore';
import { db } from '../../../../lib/firebase';
import { useAuth } from '../../auth'; // VX2 auth hook
import { FirestoreTeam, TeamStatus } from '../../../../types/firestore';
import { MyTeam, TeamPlayer, UseMyTeamsResult } from './useMyTeams';

// ============================================================================
// DATA TRANSFORMATION
// ============================================================================

/**
 * Convert FirestoreTeam to MyTeam (component type)
 */
function transformFirestoreTeamToMyTeam(
  firestoreTeam: FirestoreTeam & { id: string }
): MyTeam {
  // Transform roster from Firestore format to component format
  const players: TeamPlayer[] = firestoreTeam.roster.map((player, index) => ({
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
    name: firestoreTeam.tournamentName || 'Unnamed Team', // Or use a custom name field
    tournament: firestoreTeam.tournamentName,
    tournamentId: firestoreTeam.tournamentId,
    rank: firestoreTeam.rank,
    totalTeams: undefined, // Would need to query tournament for total
    projectedPoints: firestoreTeam.totalPoints || 0,
    draftedAt: firestoreTeam.createdAt instanceof Timestamp
      ? firestoreTeam.createdAt.toDate().toISOString()
      : new Date().toISOString(),
    players,
  };
}

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

// ============================================================================
// FIREBASE QUERIES
// ============================================================================

/**
 * Fetch teams once (non-real-time)
 */
async function fetchMyTeamsOnce(userId: string): Promise<MyTeam[]> {
  if (!db) {
    throw new Error('Firebase Firestore is not initialized');
  }
  try {
    const teamsRef = collection(db, 'users', userId, 'teams');
    const teamsQuery = query(
      teamsRef,
      orderBy('createdAt', 'desc') // Most recent first
    );

    const snapshot = await getDocs(teamsQuery);
    
    const teams: MyTeam[] = [];
    snapshot.forEach((doc) => {
      const data = { id: doc.id, ...doc.data() } as FirestoreTeam & { id: string };
      try {
        const transformed = transformFirestoreTeamToMyTeam(data);
        teams.push(transformed);
      } catch (error) {
        console.error(`Error transforming team ${doc.id}:`, error);
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
  if (!db) {
    onError(new Error('Firebase Firestore is not initialized'));
    return () => {}; // Return no-op unsubscribe function
  }
  const teamsRef = collection(db, 'users', userId, 'teams');
  const teamsQuery = query(
    teamsRef,
    orderBy('createdAt', 'desc')
  );

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
          console.error(`Error transforming team ${doc.id}:`, error);
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
 */
export function useMyTeamsFirebase(realTime: boolean = true): UseMyTeamsResult {
  const [teams, setTeams] = useState<MyTeam[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefetching, setIsRefetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Get current user (adjust based on your auth setup)
  const { user } = useAuth(); // Or useAuth() from your auth context
  const userId = user?.uid;

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
      
      const data = await fetchMyTeamsOnce(userId);
      setTeams(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      console.error('[useMyTeams] Fetch error:', err);
    } finally {
      setIsLoading(false);
      setIsRefetching(false);
    }
  }, [userId]);

  // Set up real-time listener or one-time fetch
  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      setError('User not authenticated');
      return;
    }

    if (!realTime) {
      // One-time fetch
      fetchData();
      return;
    }

    // Real-time listener
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
  }, [userId, realTime, fetchData]);

  const refetch = useCallback(async () => {
    if (!realTime) {
      await fetchData(true);
    }
    // For real-time, the snapshot listener handles updates automatically
  }, [fetchData, realTime]);

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
// ADVANCED QUERIES
// ============================================================================

/**
 * Query teams by tournament
 */
export async function fetchTeamsByTournament(
  userId: string,
  tournamentId: string
): Promise<MyTeam[]> {
  if (!db) {
    throw new Error('Firebase Firestore is not initialized');
  }
  const teamsRef = collection(db, 'users', userId, 'teams');
  const teamsQuery = query(
    teamsRef,
    where('tournamentId', '==', tournamentId),
    orderBy('createdAt', 'desc')
  );

  const snapshot = await getDocs(teamsQuery);
  const teams: MyTeam[] = [];
  
  snapshot.forEach((doc) => {
    const data = { id: doc.id, ...doc.data() } as FirestoreTeam & { id: string };
    teams.push(transformFirestoreTeamToMyTeam(data));
  });

  return teams;
}

/**
 * Query teams by status
 */
export async function fetchTeamsByStatus(
  userId: string,
  status: TeamStatus
): Promise<MyTeam[]> {
  if (!db) {
    throw new Error('Firebase Firestore is not initialized');
  }
  const teamsRef = collection(db, 'users', userId, 'teams');
  const teamsQuery = query(
    teamsRef,
    where('status', '==', status),
    orderBy('createdAt', 'desc')
  );

  const snapshot = await getDocs(teamsQuery);
  const teams: MyTeam[] = [];
  
  snapshot.forEach((doc) => {
    const data = { id: doc.id, ...doc.data() } as FirestoreTeam & { id: string };
    teams.push(transformFirestoreTeamToMyTeam(data));
  });

  return teams;
}

/**
 * Query teams with multiple filters
 * Note: Firestore requires composite indexes for multiple where clauses
 */
export async function fetchTeamsFiltered(
  userId: string,
  filters: {
    tournamentId?: string;
    status?: TeamStatus;
    minPoints?: number;
  }
): Promise<MyTeam[]> {
  if (!db) {
    throw new Error('Firebase Firestore is not initialized');
  }
  const teamsRef = collection(db, 'users', userId, 'teams');
  let teamsQuery: any = teamsRef;

  // Build query with filters
  if (filters.tournamentId) {
    teamsQuery = query(teamsQuery, where('tournamentId', '==', filters.tournamentId));
  }
  if (filters.status) {
    teamsQuery = query(teamsQuery, where('status', '==', filters.status));
  }
  
  teamsQuery = query(teamsQuery, orderBy('createdAt', 'desc'));

  const snapshot = await getDocs(teamsQuery);
  const teams: MyTeam[] = [];
  
  snapshot.forEach((doc) => {
    const docData = doc.data();
    if (!docData) return; // Skip if no data
    const data = { id: doc.id, ...(docData as Record<string, unknown>) } as FirestoreTeam & { id: string };
    const transformed = transformFirestoreTeamToMyTeam(data);
    
    // Apply client-side filters that can't be done in Firestore
    if (filters.minPoints && transformed.projectedPoints < filters.minPoints) {
      return; // Skip this team
    }
    
    teams.push(transformed);
  });

  return teams;
}

