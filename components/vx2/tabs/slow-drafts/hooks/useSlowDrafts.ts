/**
 * useSlowDrafts - Hook for fetching and managing slow draft data
 *
 * Uses SWR for data fetching with automatic polling for real-time updates.
 * Falls back to mock data in development when API is unavailable.
 */

import { useState, useMemo, useCallback } from 'react';
import useSWR from 'swr';

import { createScopedLogger } from '@/lib/clientLogger';

const logger = createScopedLogger('[useSlowDrafts]');
import {
  POSITION_REQUIREMENTS,
  SLOW_DRAFT_THRESHOLDS,
  type SortOption,
  type FilterOption,
} from '../constants';
import type {
  SlowDraft,
  MyPick,
  PositionCounts,
  PositionNeed,
  Position,
  DraftPlayer,
  TopAvailable,
} from '../types';

// ============================================================================
// API FETCHER
// ============================================================================

async function fetcher<T>(url: string): Promise<T> {
  try {
    const res = await fetch(url);

    if (!res.ok) {
      // For 400 errors (like missing userId), return empty array to trigger mock data fallback
      if (res.status === 400) {
        return [] as T;
      }
      const error = new Error('Failed to fetch slow drafts');
      throw error;
    }

    const data = await res.json();

    // Handle API responses that wrap data in { ok, data } format
    if (data.ok !== undefined && data.data !== undefined) {
      return data.data as T;
    }

    return data as T;
  } catch (error) {
    // Return empty array on any error to trigger mock data fallback
    logger.warn('Fetcher error, falling back to mock data');
    return [] as T;
  }
}

// ============================================================================
// MOCK DATA (fallback for development/demo)
// ============================================================================

const MOCK_PLAYERS: DraftPlayer[] = [
  { id: 'allen_josh', name: 'Josh Allen', position: 'QB', team: 'BUF', adp: 25.5 },
  { id: 'jackson_lamar', name: 'Lamar Jackson', position: 'QB', team: 'BAL', adp: 30.2 },
  { id: 'hurts_jalen', name: 'Jalen Hurts', position: 'QB', team: 'PHI', adp: 35.1 },
  { id: 'mahomes_patrick', name: 'Patrick Mahomes', position: 'QB', team: 'KC', adp: 42.3 },
  { id: 'burrow_joe', name: 'Joe Burrow', position: 'QB', team: 'CIN', adp: 48.7 },
  { id: 'robinson_bijan', name: 'Bijan Robinson', position: 'RB', team: 'ATL', adp: 2.7 },
  { id: 'gibbs_jahmyr', name: 'Jahmyr Gibbs', position: 'RB', team: 'DET', adp: 3.1 },
  { id: 'henry_derrick', name: 'Derrick Henry', position: 'RB', team: 'BAL', adp: 12.4 },
  { id: 'hall_breece', name: 'Breece Hall', position: 'RB', team: 'NYJ', adp: 8.9 },
  { id: 'williams_kyren', name: 'Kyren Williams', position: 'RB', team: 'LAR', adp: 15.3 },
  { id: 'barkley_saquon', name: 'Saquon Barkley', position: 'RB', team: 'PHI', adp: 5.0 },
  { id: 'chubb_nick', name: 'Nick Chubb', position: 'RB', team: 'CLE', adp: 45.2 },
  { id: 'chase_jamarr', name: "Ja'Marr Chase", position: 'WR', team: 'CIN', adp: 1.8 },
  { id: 'lamb_ceedee', name: 'CeeDee Lamb', position: 'WR', team: 'DAL', adp: 3.7 },
  { id: 'jefferson_justin', name: 'Justin Jefferson', position: 'WR', team: 'MIN', adp: 5.8 },
  { id: 'hill_tyreek', name: 'Tyreek Hill', position: 'WR', team: 'MIA', adp: 6.2 },
  { id: 'brown_amon', name: 'Amon-Ra St. Brown', position: 'WR', team: 'DET', adp: 9.9 },
  { id: 'wilson_garrett', name: 'Garrett Wilson', position: 'WR', team: 'NYJ', adp: 18.3 },
  { id: 'olave_chris', name: 'Chris Olave', position: 'WR', team: 'NO', adp: 24.1 },
  { id: 'kelce_travis', name: 'Travis Kelce', position: 'TE', team: 'KC', adp: 14.2 },
  { id: 'laporta_sam', name: 'Sam LaPorta', position: 'TE', team: 'DET', adp: 35.8 },
  { id: 'kincaid_dalton', name: 'Dalton Kincaid', position: 'TE', team: 'BUF', adp: 42.1 },
  { id: 'kittle_george', name: 'George Kittle', position: 'TE', team: 'SF', adp: 55.3 },
  { id: 'andrews_mark', name: 'Mark Andrews', position: 'TE', team: 'BAL', adp: 62.0 },
];

function getRandomPlayer(position?: Position): DraftPlayer {
  const pool = position
    ? MOCK_PLAYERS.filter((p) => p.position === position)
    : MOCK_PLAYERS;
  return pool[Math.floor(Math.random() * pool.length)]!;
}

function generateMockPicks(count: number): MyPick[] {
  const picks: MyPick[] = [];
  const usedPlayers = new Set<string>();

  for (let i = 0; i < count; i++) {
    let player: DraftPlayer;
    do {
      player = getRandomPlayer();
    } while (usedPlayers.has(player.id));

    usedPlayers.add(player.id);

    picks.push({
      slotIndex: i,
      player,
      pickNumber: (i + 1) * 12 - Math.floor(Math.random() * 6),
      round: i + 1,
      pickInRound: Math.floor(Math.random() * 12) + 1,
    });
  }

  return picks;
}

function calculatePositionCounts(picks: MyPick[]): PositionCounts {
  const counts: PositionCounts = { QB: 0, RB: 0, WR: 0, TE: 0 };
  picks.forEach((pick) => {
    counts[pick.player.position]++;
  });
  return counts;
}

function calculatePositionNeeds(counts: PositionCounts, currentRound: number): PositionNeed[] {
  const needs: PositionNeed[] = [];

  (Object.keys(POSITION_REQUIREMENTS) as Position[]).forEach((position) => {
    const req = POSITION_REQUIREMENTS[position];
    const current = counts[position];
    const needed = Math.max(0, req.min - current);

    let urgency: PositionNeed['urgency'] = 'neutral';
    if (needed > 0 && currentRound >= 12) {
      urgency = 'critical';
    } else if (needed > 0 && currentRound >= 8) {
      urgency = 'warning';
    } else if (current >= req.min) {
      urgency = 'good';
    }

    needs.push({
      position,
      current,
      minimum: req.min,
      recommended: req.recommended,
      urgency,
      needed,
    });
  });

  return needs;
}

function generateTopAvailable(picks: MyPick[]): TopAvailable {
  const pickedIds = new Set(picks.map((p) => p.player.id));
  const available = MOCK_PLAYERS.filter((p) => !pickedIds.has(p.id));

  return {
    QB: available.filter((p) => p.position === 'QB').slice(0, 3),
    RB: available.filter((p) => p.position === 'RB').slice(0, 3),
    WR: available.filter((p) => p.position === 'WR').slice(0, 3),
    TE: available.filter((p) => p.position === 'TE').slice(0, 3),
  };
}

function calculatePicksAway(
  currentPick: number,
  userPosition: number,
  teamCount: number
): number {
  const currentRound = Math.ceil(currentPick / teamCount);
  const pickInRound = ((currentPick - 1) % teamCount) + 1;
  const isOddRound = currentRound % 2 === 1;

  const userPickInRound = isOddRound ? userPosition : teamCount - userPosition + 1;

  if (pickInRound < userPickInRound) {
    return userPickInRound - pickInRound;
  } else if (pickInRound === userPickInRound) {
    return 0;
  } else {
    const nextRoundUserPick = !isOddRound ? userPosition : teamCount - userPosition + 1;
    return (teamCount - pickInRound) + nextRoundUserPick;
  }
}

function generateMockSlowDraft(index: number): SlowDraft {
  const id = `slow-draft-${index}`;
  const pickNumber = Math.floor(Math.random() * 150) + 20;
  const currentRound = Math.ceil(pickNumber / 12);
  const userPosition = (index % 12) + 1;

  const picksAway = calculatePicksAway(pickNumber, userPosition, 12);
  const isYourTurn = picksAway === 0;

  const myPickCount = Math.floor(currentRound * 0.9);
  const myPicks = generateMockPicks(myPickCount);
  const positionCounts = calculatePositionCounts(myPicks);

  const timeLeftSeconds = isYourTurn
    ? 3600 + Math.floor(Math.random() * 86400)
    : 3600 * 2 + Math.floor(Math.random() * 86400 * 3);

  return {
    id,
    tournamentId: `tournament-${index}`,
    tournamentName: [
      'TopDog International I',
      'TopDog International II',
      'TopDog International III',
    ][index % 3]!,
    teamId: `team-${index}`,
    teamName: `Team ${index + 1}`,
    status: isYourTurn ? 'your-turn' : 'waiting',
    pickNumber,
    totalPicks: 216,
    currentRound,
    totalRounds: 18,
    draftPosition: userPosition,
    teamCount: 12,
    timeLeftSeconds,
    picksAway,
    myPicks,
    positionCounts,
    positionNeeds: calculatePositionNeeds(positionCounts, currentRound),
    recentPicks: [],
    notableEvents: [],
    topAvailable: generateTopAvailable(myPicks),
    lastActivityAt: Date.now() - Math.random() * 86400000,
  };
}

function generateMockDrafts(): SlowDraft[] {
  const count = 8 + Math.floor(Math.random() * 8);
  const mockDrafts = Array.from({ length: count }, (_, i) =>
    generateMockSlowDraft(i)
  );

  // Ensure at least 2 are "your turn"
  if (mockDrafts.filter((d) => d.status === 'your-turn').length < 2) {
    const first = mockDrafts[0];
    if (first) {
      first.status = 'your-turn';
      first.picksAway = 0;
    }
    const second = mockDrafts[1];
    if (second) {
      second.status = 'your-turn';
      second.picksAway = 0;
    }
  }

  return mockDrafts;
}

// ============================================================================
// HOOK
// ============================================================================

interface UseSlowDraftsOptions {
  userId?: string;
  useMockData?: boolean;
  refreshInterval?: number;
}

interface UseSlowDraftsResult {
  drafts: SlowDraft[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;

  // Sorting and filtering
  sortBy: SortOption;
  filterBy: FilterOption;
  setSortBy: (sort: SortOption) => void;
  setFilterBy: (filter: FilterOption) => void;

  // Counts for filter badges
  counts: {
    total: number;
    myTurn: number;
    needsAttention: number;
  };

  // Processed list
  sortedFilteredDrafts: SlowDraft[];

  // Quick pick action
  quickPick: (draftId: string, playerId: string) => Promise<void>;
}

export function useSlowDrafts(options: UseSlowDraftsOptions = {}): UseSlowDraftsResult {
  const {
    userId,
    useMockData = false,
    refreshInterval = 30000, // 30 second polling by default
  } = options;

  const [sortBy, setSortBy] = useState<SortOption>('picksUntilTurn');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');

  // Build API URL
  const apiUrl = userId && !useMockData
    ? `/api/slow-drafts?userId=${encodeURIComponent(userId)}`
    : null;

  // Use SWR for data fetching with polling
  const {
    data: apiDrafts,
    error: swrError,
    isLoading: swrLoading,
    mutate,
  } = useSWR<SlowDraft[]>(
    apiUrl,
    fetcher,
    {
      refreshInterval: apiUrl ? refreshInterval : 0,
      revalidateOnFocus: true,
      dedupingInterval: 5000,
      onError: (err) => {
        // Silently fall back to mock data - don't log errors in development
        // as we expect API to fail when userId is not provided
        if (process.env.NODE_ENV === 'production') {
          logger.error('API error', err instanceof Error ? err : new Error(String(err)));
        }
      },
      // Don't throw errors - gracefully fall back to mock data
      shouldRetryOnError: false,
      // Force revalidation to clear cache
      revalidateOnMount: true,
    }
  );

  // Use mock data as fallback when API fails or userId is not provided
  const mockDrafts = useMemo(() => {
    // Always use mock data if no userId or if API fails
    if (!userId || swrError || !apiUrl) {
      return generateMockDrafts();
    }
    // Only use API data if we have userId and no error
    return null;
  }, [userId, apiUrl, swrError]);

  // Combine data sources - prefer API data, fallback to mock
  const allDrafts = useMemo(
    () => apiDrafts || mockDrafts || [],
    [apiDrafts, mockDrafts]
  );
  // Only show loading if we're trying to use API and don't have mock data yet
  const isLoading = Boolean(swrLoading && apiUrl && !mockDrafts);
  // Don't show error to user if we have mock data as fallback
  const error = swrError && !mockDrafts ? 'Failed to load drafts' : null;

  // Filter to only TopDog International tournaments FIRST
  const drafts = useMemo(() => {
    const filtered = allDrafts.filter((draft) => {
      const name = draft.tournamentName.toLowerCase().trim();
      
      // STRICT: Only allow exact "TopDog International" variants
      // Must start with "topdog international" (case insensitive)
      const isTopDogInternational = /^topdog\s+international/.test(name) ||
                                    name === 'topdog international i' ||
                                    name === 'topdog international ii' ||
                                    name === 'topdog international iii' ||
                                    name.startsWith('topdog international');
      
      // Explicitly exclude all other tournaments
      const isExcluded = name.includes('best ball') ||
                        name.includes('summer') ||
                        name.includes('ultimate') ||
                        name.includes('draft masters') ||
                        name.includes('gridiron') ||
                        name.includes('championship') ||
                        name.includes('showdown') ||
                        name.includes('bowl') ||
                        name.includes('league') ||
                        name.includes('premier') ||
                        name.includes('elite') ||
                        name.includes('regional');
      
      const shouldInclude = isTopDogInternational && !isExcluded;
      
      if (!shouldInclude && process.env.NODE_ENV === 'development') {
        logger.debug(`Filtering out: ${draft.tournamentName}`, {
          isTopDogInternational,
          isExcluded,
          name
        });
      }
      
      return shouldInclude;
    });
    
    // Debug log in development
    if (process.env.NODE_ENV === 'development') {
      logger.debug('Filter results', {
        total: allDrafts.length,
        filtered: filtered.length,
        removed: allDrafts.length - filtered.length,
        kept: filtered.map(d => d.tournamentName),
      });
    }
    
    return filtered;
  }, [allDrafts]);

  // Calculate counts (after filtering)
  const counts = useMemo(() => {
    const myTurn = drafts.filter((d) => d.status === 'your-turn').length;
    const needsAttention = drafts.filter((d) => {
      const hasUrgentNeeds = d.positionNeeds.some(
        (n) => n.urgency === 'critical' || n.urgency === 'warning'
      );
      const hasUrgentTimer =
        d.timeLeftSeconds !== undefined &&
        d.timeLeftSeconds < SLOW_DRAFT_THRESHOLDS.timerWarning;
      return d.status === 'your-turn' || hasUrgentNeeds || hasUrgentTimer;
    }).length;

    const countsResult = {
      total: drafts.length,
      myTurn,
      needsAttention,
    };

    // Debug log counts in development
    if (process.env.NODE_ENV === 'development') {
      logger.debug('Counts calculated', {
        ...countsResult,
        fromDraftsCount: drafts.length,
        tournamentNames: drafts.map(d => d.tournamentName),
      });
    }

    return countsResult;
  }, [drafts]);

  // Sort and filter
  const sortedFilteredDrafts = useMemo(() => {
    let filtered = [...drafts];

    // Apply filter (drafts are already filtered to TopDog International only)
    switch (filterBy) {
      case 'needsAttention':
        filtered = filtered.filter((d) => {
          const hasUrgentNeeds = d.positionNeeds.some(
            (n) => n.urgency === 'critical' || n.urgency === 'warning'
          );
          const hasUrgentTimer =
            d.timeLeftSeconds !== undefined &&
            d.timeLeftSeconds < SLOW_DRAFT_THRESHOLDS.timerWarning;
          return d.status === 'your-turn' || hasUrgentNeeds || hasUrgentTimer;
        });
        break;
    }

    // Apply sort
    switch (sortBy) {
      case 'picksUntilTurn':
        filtered.sort((a, b) => a.picksAway - b.picksAway);
        break;
      case 'timeRemaining':
        filtered.sort((a, b) => {
          const timeA = a.timeLeftSeconds ?? Infinity;
          const timeB = b.timeLeftSeconds ?? Infinity;
          return timeA - timeB;
        });
        break;
      case 'draftProgress':
        filtered.sort((a, b) => {
          const progressA = a.pickNumber / a.totalPicks;
          const progressB = b.pickNumber / b.totalPicks;
          return progressA - progressB;
        });
        break;
      case 'recentlyActive':
        filtered.sort((a, b) => {
          const activityA = a.lastActivityAt ?? 0;
          const activityB = b.lastActivityAt ?? 0;
          return activityB - activityA;
        });
        break;
    }

    return filtered;
  }, [drafts, sortBy, filterBy]);

  const refetch = useCallback(() => {
    if (apiUrl) {
      mutate();
    }
  }, [apiUrl, mutate]);

  // Quick pick action
  const quickPick = useCallback(async (draftId: string, playerId: string) => {
    if (!userId) {
      throw new Error('User ID is required for quick pick');
    }

    const response = await fetch(`/api/slow-drafts/${draftId}/quick-pick`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        playerId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to submit quick pick');
    }

    // Refresh data after successful pick
    mutate();
  }, [userId, mutate]);

  return {
    drafts,
    isLoading,
    error,
    refetch,
    sortBy,
    filterBy,
    setSortBy,
    setFilterBy,
    counts,
    sortedFilteredDrafts,
    quickPick,
  };
}

export default useSlowDrafts;
