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

import React, { useState, useEffect, useCallback, useRef } from 'react';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Draft status types
 */
export type DraftStatus = 'your-turn' | 'waiting' | 'complete' | 'paused';

/**
 * Draft speed type - fast (30 sec) or slow (longer time per pick)
 */
export type DraftSpeed = 'fast' | 'slow';

/**
 * Live draft data structure
 */
export interface LiveDraft {
  /** Unique identifier */
  id: string;
  /** Tournament name */
  tournamentName: string;
  /** Team name for this draft */
  teamName: string;
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
  /** Draft speed type */
  draftSpeed?: DraftSpeed;
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
// HELPERS
// ============================================================================

/**
 * Convert number to Roman numeral
 */
function toRomanNumeral(num: number): string {
  const values = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1];
  const numerals = ['M', 'CM', 'D', 'CD', 'C', 'XC', 'L', 'XL', 'X', 'IX', 'V', 'IV', 'I'];
  let result = '';
  
  for (let i = 0; i < values.length; i++) {
    while (num >= values[i]) {
      result += numerals[i];
      num -= values[i];
    }
  }
  
  return result;
}

// ============================================================================
// MOCK DATA
// ============================================================================

const MOCK_DRAFTS: LiveDraft[] = [
  // Fast drafts (30 sec)
  {
    id: 'draft-1',
    tournamentName: 'TopDog International',
    teamName: `The TopDog International   ${toRomanNumeral(1)}`,
    pickNumber: 42,
    totalPicks: 216,
    status: 'your-turn',
    timeLeftSeconds: 25,
    draftPosition: 3,
    teamCount: 12,
    startedAt: new Date(Date.now() - 1800000).toISOString(), // 30 min ago
    draftSpeed: 'fast',
  },
  {
    id: 'draft-2',
    tournamentName: 'TopDog International',
    teamName: `The TopDog International   ${toRomanNumeral(2)}`,
    pickNumber: 89,
    totalPicks: 216,
    status: 'waiting',
    draftPosition: 7,
    teamCount: 12,
    startedAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    draftSpeed: 'fast',
  },
  {
    id: 'draft-3',
    tournamentName: 'TopDog Regional',
    teamName: `The TopDog International   ${toRomanNumeral(3)}`,
    pickNumber: 156,
    totalPicks: 216,
    status: 'waiting',
    draftPosition: 11,
    teamCount: 12,
    startedAt: new Date(Date.now() - 5400000).toISOString(), // 1.5 hours ago
    draftSpeed: 'fast',
  },
  // Slow drafts (for dev purposes)
  {
    id: 'slow-draft-1',
    tournamentName: 'TopDog Premier League',
    teamName: `The TopDog International   ${toRomanNumeral(4)}`,
    pickNumber: 15,
    totalPicks: 216,
    status: 'your-turn',
    timeLeftSeconds: 14400, // 4 hours (slow draft)
    draftPosition: 2,
    teamCount: 12,
    startedAt: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
    draftSpeed: 'slow',
  },
  {
    id: 'slow-draft-2',
    tournamentName: 'TopDog Championship',
    teamName: `The TopDog International   ${toRomanNumeral(5)}`,
    pickNumber: 38,
    totalPicks: 216,
    status: 'waiting',
    draftPosition: 5,
    teamCount: 12,
    startedAt: new Date(Date.now() - 86400000 * 5).toISOString(), // 5 days ago
    draftSpeed: 'slow',
  },
  {
    id: 'slow-draft-3',
    tournamentName: 'TopDog Elite Series',
    teamName: `The TopDog International   ${toRomanNumeral(6)}`,
    pickNumber: 72,
    totalPicks: 216,
    status: 'waiting',
    draftPosition: 9,
    teamCount: 12,
    startedAt: new Date(Date.now() - 86400000 * 7).toISOString(), // 7 days ago
    draftSpeed: 'slow',
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
 *
 * SECURITY FIX: Prevent infinite loop by using ref-based fetch pattern
 * and ensuring stable callback references
 */
export function useLiveDrafts(): UseLiveDraftsResult {
  const [drafts, setDrafts] = useState<LiveDraft[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefetching, setIsRefetching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Track if initial fetch has run to prevent double-fetch
  const hasFetchedRef = useRef(false);

  // Stable fetch function that doesn't cause re-renders
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

  // Initial fetch - runs only once on mount
  // Empty dependency array is intentional to prevent infinite loops
  useEffect(() => {
    // Prevent double-fetch in StrictMode
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

