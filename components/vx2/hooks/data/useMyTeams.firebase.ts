/**
 * Firebase Query Functions
 * 
 * Firebase operations for fetching and subscribing to user's teams.
 */

import {
  collection,
  query,
  orderBy,
  onSnapshot,
  getDocs,
  QuerySnapshot,
  DocumentData
} from 'firebase/firestore';
import { useState, useEffect, useCallback, useMemo } from 'react';

import { createScopedLogger } from '@/lib/clientLogger';

import { db } from '../../../../lib/firebase';
import { shouldUseRealTimeForTeams } from '../../../../lib/tournament/tournamentUtils';
import { FirestoreTeam } from '../../../../types/firestore';
import { useAuth } from '../../auth/hooks/useAuth';

import { transformFirestoreTeam } from './useMyTeams.transform';
import type { MyTeam, UseMyTeamsResult } from './useMyTeams.types';


const logger = createScopedLogger('[useMyTeamsFirebase]');

/**
 * Create teams query with proper ordering
 */
export function createTeamsQuery(userId: string) {
  if (!db) {
    throw new Error('Firebase Firestore is not initialized');
  }
  const teamsRef = collection(db, 'users', userId, 'teams');
  return query(teamsRef, orderBy('createdAt', 'desc'));
}

/**
 * Fetch teams once (non-real-time)
 */
export async function fetchTeamsOnce(userId: string): Promise<MyTeam[]> {
  try {
    const teamsQuery = createTeamsQuery(userId);
    const snapshot = await getDocs(teamsQuery);
    
    const teams: MyTeam[] = [];
    snapshot.forEach((doc) => {
      const data = { id: doc.id, ...doc.data() } as FirestoreTeam & { id: string };
      try {
        const transformed = transformFirestoreTeam(data);
        teams.push(transformed);
      } catch (error) {
        logger.error(`Error transforming team ${doc.id}:`, error instanceof Error ? error : new Error(String(error)));
      }
    });

    return teams;
  } catch (error) {
    logger.error('Fetch error:', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

/**
 * Set up real-time listener for user's teams
 */
export function subscribeToTeams(
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
          const transformed = transformFirestoreTeam(data);
          teams.push(transformed);
        } catch (error) {
          logger.error(`Error transforming team ${doc.id}:`, error instanceof Error ? error : new Error(String(error)));
        }
      });

      onUpdate(teams);
    },
    (error) => {
      logger.error('Snapshot error:', error instanceof Error ? error : new Error(String(error)));
      onError(new Error(error.message));
    }
  );

  return unsubscribe;
}

/**
 * Check if real-time should be used based on game day logic
 */
export function shouldUseRealTime(): boolean {
  return shouldUseRealTimeForTeams();
}

/**
 * Hook for fetching and managing user's teams with Firebase
 * 
 * Uses game-day optimization:
 * - Always starts with one-time fetch (cheaper)
 * - Adds real-time listener only on game days/post-game days during active tournaments
 * - Falls back to one-time fetch on non-game days and after Week 17
 */
export function useMyTeamsWithFirebase(): UseMyTeamsResult {
  const [teams, setTeams] = useState<MyTeam[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefetching, setIsRefetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { user } = useAuth();
  const userId = user?.uid;

  // Determine if we should use real-time based on game day logic
  const useRealTime = useMemo(() => shouldUseRealTimeForTeams(), []);

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
      
      const data = await fetchTeamsOnce(userId);
      setTeams(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      logger.error('Fetch error:', err instanceof Error ? err : new Error(String(err)));
    } finally {
      setIsLoading(false);
      setIsRefetching(false);
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

    const unsubscribe = subscribeToTeams(
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

