/**
 * useLiveDrafts - Data hook for active draft data
 * 
 * Provides user's live drafts with loading, error, and refetch capabilities.
 * Currently uses mock data, designed for easy API integration.
 * 
 * @example
 * ```tsx
 * const { drafts, isLoading, error, refetch } = useLiveDrafts();
 * ```
 */

import { useState, useEffect, useCallback } from 'react';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Draft status types
 */
export type DraftStatus = 'your-turn' | 'waiting' | 'complete' | 'paused';

/**
 * Live draft data structure
 */
export interface LiveDraft {
  /** Unique identifier */
  id: string;
  /** Tournament name */
  tournamentName: string;
  /** Current pick number in the draft */
  pickNumber: number;
  /** Total picks in the draft */
  totalPicks: number;
  /** Current status */
  status: DraftStatus;
  /** Time left for user's pick (if your-turn) */
  timeLeftSeconds?: number;
  /** User's draft position (1-12) */
  draftPosition: number;
  /** Number of teams in draft */
  teamCount: number;
  /** When the draft started */
  startedAt?: string;
}

/**
 * Hook return type
 */
export interface UseLiveDraftsResult {
  /** List of active drafts */
  drafts: LiveDraft[];
  /** Whether data is loading */
  isLoading: boolean;
  /** Error message if fetch failed */
  error: string | null;
  /** Refetch function */
  refetch: () => Promise<void>;
  /** Whether a refetch is in progress */
  isRefetching: boolean;
  /** Count of drafts where it's user's turn */
  yourTurnCount: number;
}

// ============================================================================
// MOCK DATA
// ============================================================================

const MOCK_DRAFTS: LiveDraft[] = [
  {
    id: 'draft-1',
    tournamentName: 'TopDog International',
    pickNumber: 42,
    totalPicks: 216,
    status: 'your-turn',
    timeLeftSeconds: 45,
    draftPosition: 3,
    teamCount: 12,
    startedAt: new Date(Date.now() - 1800000).toISOString(), // 30 min ago
  },
  {
    id: 'draft-2',
    tournamentName: 'TopDog International',
    pickNumber: 89,
    totalPicks: 216,
    status: 'waiting',
    draftPosition: 7,
    teamCount: 12,
    startedAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
  },
  {
    id: 'draft-3',
    tournamentName: 'TopDog Regional',
    pickNumber: 156,
    totalPicks: 216,
    status: 'waiting',
    draftPosition: 11,
    teamCount: 12,
    startedAt: new Date(Date.now() - 5400000).toISOString(), // 1.5 hours ago
  },
];

// ============================================================================
// MOCK FETCH
// ============================================================================

async function fetchLiveDrafts(): Promise<LiveDraft[]> {
  await new Promise(resolve => setTimeout(resolve, 150 + Math.random() * 150));
  return MOCK_DRAFTS;
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook for fetching and managing live draft data
 */
export function useLiveDrafts(): UseLiveDraftsResult {
  const [drafts, setDrafts] = useState<LiveDraft[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefetching, setIsRefetching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (isRefetch = false) => {
    try {
      if (isRefetch) {
        setIsRefetching(true);
      } else {
        setIsLoading(true);
      }
      setError(null);
      
      const data = await fetchLiveDrafts();
      setDrafts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
      setIsRefetching(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(async () => {
    await fetchData(true);
  }, [fetchData]);

  // Computed value
  const yourTurnCount = drafts.filter(d => d.status === 'your-turn').length;

  return {
    drafts,
    isLoading,
    error,
    refetch,
    isRefetching,
    yourTurnCount,
  };
}

export default useLiveDrafts;

