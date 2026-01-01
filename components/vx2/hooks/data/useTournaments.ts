/**
 * useTournaments - Data hook for tournament data
 * 
 * Provides tournament list with loading, error, and refetch capabilities.
 * Currently uses mock data, designed for easy API integration.
 * 
 * @example
 * ```tsx
 * const { tournaments, isLoading, error, refetch } = useTournaments();
 * 
 * if (isLoading) return <Skeleton />;
 * if (error) return <ErrorState onRetry={refetch} />;
 * if (tournaments.length === 0) return <EmptyState />;
 * ```
 */

import { useState, useEffect, useCallback } from 'react';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Tournament data structure
 */
export interface Tournament {
  /** Unique identifier */
  id: string;
  /** Tournament display name */
  title: string;
  /** Entry fee (formatted, e.g., "$25") */
  entryFee: string;
  /** Entry fee in cents for calculations */
  entryFeeCents: number;
  /** Total entries formatted (e.g., "571,480") */
  totalEntries: string;
  /** Current number of entries */
  currentEntries: number;
  /** Maximum entries allowed */
  maxEntries: number;
  /** First place prize (formatted, e.g., "$2M") */
  firstPlacePrize: string;
  /** Whether this is a featured tournament */
  isFeatured: boolean;
  /** Tournament status */
  status: 'filling' | 'full' | 'drafting' | 'complete';
  /** Start time (ISO string) */
  startTime?: string;
}

/**
 * Hook return type
 */
export interface UseTournamentsResult {
  /** List of tournaments */
  tournaments: Tournament[];
  /** Whether data is loading */
  isLoading: boolean;
  /** Error message if fetch failed */
  error: string | null;
  /** Refetch function */
  refetch: () => Promise<void>;
  /** Whether a refetch is in progress */
  isRefetching: boolean;
}

// ============================================================================
// MOCK DATA (Will be replaced with API call)
// ============================================================================

const MOCK_TOURNAMENTS: Tournament[] = [
  {
    id: 'topdog-international',
    title: 'THE TOPDOG INTERNATIONAL',
    entryFee: '$25',
    entryFeeCents: 2500,
    totalEntries: '571,480',
    currentEntries: 571480,
    maxEntries: 672672,
    firstPlacePrize: '$2M',
    isFeatured: true,
    status: 'filling',
  },
];

// ============================================================================
// MOCK FETCH (Simulates API latency)
// ============================================================================

async function fetchTournaments(): Promise<Tournament[]> {
  // Simulate network latency (200-400ms)
  await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 200));
  
  // Simulate occasional errors (5% chance) - disabled for now
  // if (Math.random() < 0.05) {
  //   throw new Error('Failed to fetch tournaments');
  // }
  
  return MOCK_TOURNAMENTS;
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook for fetching and managing tournament data
 * 
 * @returns Tournament data with loading/error states and refetch capability
 */
export function useTournaments(): UseTournamentsResult {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/2aaead3f-67a7-4f92-b03f-ef7a26e0239e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useTournaments.ts:111',message:'useTournaments hook called',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'H'})}).catch(()=>{});
  // #endregion
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefetching, setIsRefetching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (isRefetch = false) => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/2aaead3f-67a7-4f92-b03f-ef7a26e0239e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useTournaments.ts:117',message:'fetchData called',data:{isRefetch},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'H'})}).catch(()=>{});
    // #endregion
    try {
      if (isRefetch) {
        setIsRefetching(true);
      } else {
        setIsLoading(true);
      }
      setError(null);
      
      const data = await fetchTournaments();
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/2aaead3f-67a7-4f92-b03f-ef7a26e0239e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useTournaments.ts:127',message:'fetchTournaments success',data:{tournamentCount:data.length},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'H'})}).catch(()=>{});
      // #endregion
      setTournaments(data);
    } catch (err) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/2aaead3f-67a7-4f92-b03f-ef7a26e0239e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useTournaments.ts:131',message:'fetchTournaments error',data:{errorMessage:err instanceof Error ? err.message : 'Unknown error'},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'H'})}).catch(()=>{});
      // #endregion
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
      setIsRefetching(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/2aaead3f-67a7-4f92-b03f-ef7a26e0239e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useTournaments.ts:142',message:'useTournaments initial fetch effect',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'H'})}).catch(()=>{});
    // #endregion
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(async () => {
    await fetchData(true);
  }, [fetchData]);

  return {
    tournaments,
    isLoading,
    error,
    refetch,
    isRefetching,
  };
}

export default useTournaments;

