/**
 * useSlowDrafts - Hook for fetching and managing slow draft data
 *
 * Provides enhanced draft data including:
 * - User's picks with full player details
 * - Position counts and needs
 * - Notable events (reaches, steals, alerts)
 * - Top available players
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import type {
  SlowDraft,
  MyPick,
  RecentPick,
  NotableEvent,
  PositionCounts,
  PositionNeed,
  Position,
  DraftPlayer,
  TopAvailable,
} from '../types';
import {
  POSITION_REQUIREMENTS,
  SLOW_DRAFT_THRESHOLDS,
  type SortOption,
  type FilterOption,
} from '../constants';

// ============================================================================
// MOCK DATA GENERATION
// ============================================================================

// Player pool for mock data
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
  return pool[Math.floor(Math.random() * pool.length)];
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
      pickNumber: (i + 1) * 12 - Math.floor(Math.random() * 6), // Rough snake draft sim
      round: i + 1,
      pickInRound: Math.floor(Math.random() * 12) + 1,
    });
  }

  return picks;
}

function generateNotableEvents(draftId: string, pickNumber: number): NotableEvent[] {
  const events: NotableEvent[] = [];
  const now = Date.now();

  // Reach event
  if (Math.random() > 0.4) {
    const player = getRandomPlayer();
    events.push({
      id: `${draftId}-reach-${pickNumber}`,
      type: 'reach',
      pickNumber: pickNumber - 3,
      round: Math.ceil((pickNumber - 3) / 12),
      description: `${player.name} taken early`,
      severity: 'warning',
      player,
      drafter: { id: 'user-123', name: 'GridironGuru' },
      adpDelta: 15 + Math.floor(Math.random() * 20),
      timestamp: now - Math.random() * 3600000,
    });
  }

  // Queue alert
  if (Math.random() > 0.7) {
    const player = getRandomPlayer();
    events.push({
      id: `${draftId}-queue-${pickNumber}`,
      type: 'queue_alert',
      pickNumber: pickNumber - 1,
      round: Math.ceil((pickNumber - 1) / 12),
      description: `${player.name} was taken!`,
      severity: 'alert',
      player,
      drafter: { id: 'user-789', name: 'DragonSlayer' },
      timestamp: now - Math.random() * 1800000,
    });
  }

  return events;
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

    // Determine urgency based on round and needs
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

// Calculate picks away in a snake draft
function calculatePicksAway(
  currentPick: number,
  userPosition: number,
  teamCount: number
): number {
  const currentRound = Math.ceil(currentPick / teamCount);
  const pickInRound = ((currentPick - 1) % teamCount) + 1;
  const isOddRound = currentRound % 2 === 1;

  // User's position in current round
  const userPickInRound = isOddRound ? userPosition : teamCount - userPosition + 1;

  if (pickInRound < userPickInRound) {
    return userPickInRound - pickInRound;
  } else if (pickInRound === userPickInRound) {
    return 0;
  } else {
    // Next round
    const nextRoundUserPick = !isOddRound ? userPosition : teamCount - userPosition + 1;
    return (teamCount - pickInRound) + nextRoundUserPick;
  }
}

// ============================================================================
// MOCK DRAFT GENERATOR
// ============================================================================

function generateMockSlowDraft(index: number): SlowDraft {
  const id = `slow-draft-${index}`;
  const pickNumber = Math.floor(Math.random() * 150) + 20;
  const currentRound = Math.ceil(pickNumber / 12);
  const userPosition = (index % 12) + 1;

  const picksAway = calculatePicksAway(pickNumber, userPosition, 12);
  const isYourTurn = picksAway === 0;

  const myPickCount = Math.floor(currentRound * 0.9); // Roughly your picks
  const myPicks = generateMockPicks(myPickCount);
  const positionCounts = calculatePositionCounts(myPicks);

  const timeLeftSeconds = isYourTurn
    ? 3600 + Math.floor(Math.random() * 86400) // 1h to 1d
    : 3600 * 2 + Math.floor(Math.random() * 86400 * 3); // 2h to 3d

  return {
    id,
    tournamentId: `tournament-${index}`,
    tournamentName: [
      'TopDog International I',
      'TopDog International II',
      'TopDog International III',
    ][index % 3],
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
    notableEvents: generateNotableEvents(id, pickNumber),
    topAvailable: generateTopAvailable(myPicks),
    lastActivityAt: Date.now() - Math.random() * 86400000,
  };
}

// ============================================================================
// HOOK
// ============================================================================

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
}

export function useSlowDrafts(): UseSlowDraftsResult {
  const [drafts, setDrafts] = useState<SlowDraft[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [sortBy, setSortBy] = useState<SortOption>('myTurnFirst');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');

  // Initial fetch
  useEffect(() => {
    const fetchDrafts = async () => {
      setIsLoading(true);
      try {
        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 800));

        // Generate mock drafts (5-15 drafts)
        const count = 8 + Math.floor(Math.random() * 8);
        const mockDrafts = Array.from({ length: count }, (_, i) =>
          generateMockSlowDraft(i)
        );

        // Ensure at least 2 are "your turn"
        if (mockDrafts.filter((d) => d.status === 'your-turn').length < 2) {
          mockDrafts[0].status = 'your-turn';
          mockDrafts[0].picksAway = 0;
          mockDrafts[1].status = 'your-turn';
          mockDrafts[1].picksAway = 0;
        }

        setDrafts(mockDrafts);
        setError(null);
      } catch (err) {
        setError('Failed to load drafts');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDrafts();
  }, []);

  // Calculate counts
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

    return {
      total: drafts.length,
      myTurn,
      needsAttention,
    };
  }, [drafts]);

  // Sort and filter
  const sortedFilteredDrafts = useMemo(() => {
    let filtered = [...drafts];

    // Apply filter
    switch (filterBy) {
      case 'myTurnOnly':
        filtered = filtered.filter((d) => d.status === 'your-turn');
        break;
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
      case 'myTurnFirst':
        filtered.sort((a, b) => {
          if (a.status === 'your-turn' && b.status !== 'your-turn') return -1;
          if (b.status === 'your-turn' && a.status !== 'your-turn') return 1;
          return a.picksAway - b.picksAway;
        });
        break;
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
    setIsLoading(true);
    // Re-trigger effect
    setDrafts([]);
    setTimeout(() => {
      const count = 8 + Math.floor(Math.random() * 8);
      const mockDrafts = Array.from({ length: count }, (_, i) =>
        generateMockSlowDraft(i)
      );
      setDrafts(mockDrafts);
      setIsLoading(false);
    }, 800);
  }, []);

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
  };
}

export default useSlowDrafts;
