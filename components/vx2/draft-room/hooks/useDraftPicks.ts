/**
 * useDraftPicks - Draft pick management hook
 * 
 * Manages pick history with computed views by round and participant.
 * Currently uses mock data - designed for Firebase integration.
 * 
 * @example
 * ```tsx
 * const { 
 *   picks, 
 *   userPicks,
 *   makePick,
 *   canMakePick 
 * } = useDraftPicks({
 *   roomId: 'abc123',
 *   participants,
 *   currentPickNumber,
 *   userParticipantIndex,
 * });
 * ```
 */

import { useState, useCallback, useMemo } from 'react';
import type { DraftPick, DraftPlayer, Participant, PositionCounts } from '../types';
import { 
  getParticipantForPick, 
  getRoundForPick, 
  getPickInRound,
  createEmptyPositionCounts,
} from '../utils';
import { DRAFT_DEFAULTS } from '../constants';

// ============================================================================
// TYPES
// ============================================================================

export interface UseDraftPicksOptions {
  /** Draft room ID */
  roomId: string;
  /** List of participants */
  participants: Participant[];
  /** Current pick number */
  currentPickNumber: number;
  /** Index of the current user */
  userParticipantIndex: number;
  /** Callback when a pick is made */
  onPickMade?: (pick: DraftPick) => void;
}

export interface UseDraftPicksResult {
  /** All completed picks */
  picks: DraftPick[];
  /** Current pick number */
  currentPickNumber: number;
  /** Current round */
  currentRound: number;
  /** Last completed pick */
  lastPick: DraftPick | null;
  
  /** Get picks for a specific round */
  picksByRound: (round: number) => DraftPick[];
  /** Get picks for a specific participant */
  picksByParticipant: (participantIndex: number) => DraftPick[];
  /** Get pick for a specific slot (round + participant) */
  getPickForSlot: (round: number, participantIndex: number) => DraftPick | null;
  
  /** Current user's picks */
  userPicks: DraftPick[];
  /** Current user's position counts */
  userPositionCounts: PositionCounts;
  /** IDs of all picked players */
  pickedPlayerIds: string[];
  
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: string | null;
  
  /** Make a pick */
  makePick: (player: DraftPlayer) => Promise<boolean>;
  /** Force a pick (bypasses turn check - for dev tools) */
  forcePickAny: (player: DraftPlayer) => Promise<boolean>;
  /** Whether a pick can currently be made */
  canMakePick: boolean;
  /** Whether a specific player is available */
  isPlayerAvailable: (playerId: string) => boolean;
}

// ============================================================================
// HOOK
// ============================================================================

/**
 * Hook for managing draft picks
 */
export function useDraftPicks({
  roomId,
  participants,
  currentPickNumber,
  userParticipantIndex,
  onPickMade,
}: UseDraftPicksOptions): UseDraftPicksResult {
  const [picks, setPicks] = useState<DraftPick[]>([]);
  const [isLoading] = useState(false);
  const [error] = useState<string | null>(null);
  
  const teamCount = participants.length || DRAFT_DEFAULTS.teamCount;
  
  // Derived values
  const currentRound = getRoundForPick(currentPickNumber, teamCount);
  const lastPick = picks.length > 0 ? picks[picks.length - 1] : null;
  
  // Check if it's the user's turn
  const currentParticipantIndex = getParticipantForPick(currentPickNumber, teamCount);
  const canMakePick = currentParticipantIndex === userParticipantIndex;
  
  // Create sets/maps for fast lookup
  const pickedPlayerIds = useMemo(() => 
    picks.map(p => p.player.id),
  [picks]);
  
  const pickedPlayerIdSet = useMemo(() => 
    new Set(pickedPlayerIds),
  [pickedPlayerIds]);
  
  // Picks indexed by round
  const picksByRoundMap = useMemo(() => {
    const map = new Map<number, DraftPick[]>();
    for (const pick of picks) {
      const round = pick.round;
      if (!map.has(round)) {
        map.set(round, []);
      }
      map.get(round)!.push(pick);
    }
    return map;
  }, [picks]);
  
  // Picks indexed by participant
  const picksByParticipantMap = useMemo(() => {
    const map = new Map<number, DraftPick[]>();
    for (const pick of picks) {
      const idx = pick.participantIndex;
      if (!map.has(idx)) {
        map.set(idx, []);
      }
      map.get(idx)!.push(pick);
    }
    return map;
  }, [picks]);
  
  // User's picks
  const userPicks = useMemo(() => 
    picksByParticipantMap.get(userParticipantIndex) ?? [],
  [picksByParticipantMap, userParticipantIndex]);
  
  // User's position counts
  const userPositionCounts = useMemo(() => {
    const counts = createEmptyPositionCounts();
    for (const pick of userPicks) {
      const pos = pick.player.position;
      if (pos in counts) {
        counts[pos as keyof PositionCounts]++;
      }
    }
    return counts;
  }, [userPicks]);
  
  // Query functions
  const picksByRound = useCallback((round: number): DraftPick[] => {
    return picksByRoundMap.get(round) ?? [];
  }, [picksByRoundMap]);
  
  const picksByParticipant = useCallback((participantIndex: number): DraftPick[] => {
    return picksByParticipantMap.get(participantIndex) ?? [];
  }, [picksByParticipantMap]);
  
  const getPickForSlot = useCallback((round: number, participantIndex: number): DraftPick | null => {
    const roundPicks = picksByRoundMap.get(round);
    if (!roundPicks) return null;
    return roundPicks.find(p => p.participantIndex === participantIndex) ?? null;
  }, [picksByRoundMap]);
  
  const isPlayerAvailable = useCallback((playerId: string): boolean => {
    return !pickedPlayerIdSet.has(playerId);
  }, [pickedPlayerIdSet]);
  
  // Actions
  const makePick = useCallback(async (player: DraftPlayer): Promise<boolean> => {
    // Validate
    if (!canMakePick) {
      console.warn('[useDraftPicks] Cannot make pick - not your turn');
      return false;
    }
    
    if (pickedPlayerIdSet.has(player.id)) {
      console.warn('[useDraftPicks] Cannot make pick - player already picked');
      return false;
    }
    
    // Create pick
    const pick: DraftPick = {
        id: `pick-${currentPickNumber}`,
        pickNumber: currentPickNumber,
      round: getRoundForPick(currentPickNumber, teamCount),
      pickInRound: getPickInRound(currentPickNumber, teamCount),
        player,
      participantId: participants[currentParticipantIndex]?.id ?? '',
      participantIndex: currentParticipantIndex,
        timestamp: Date.now(),
      };
      
    // Add to picks
    setPicks(prev => [...prev, pick]);
      
    // Notify callback
    onPickMade?.(pick);
      
      return true;
  }, [
    canMakePick, 
    currentPickNumber, 
    currentParticipantIndex, 
    teamCount, 
    participants, 
    pickedPlayerIdSet,
    onPickMade,
  ]);
  
  // Force pick - bypasses turn check (for dev tools / auto-pick)
  const forcePickAny = useCallback(async (player: DraftPlayer): Promise<boolean> => {
    if (pickedPlayerIdSet.has(player.id)) {
      console.warn('[useDraftPicks] Cannot make pick - player already picked');
      return false;
    }
    
    // Create pick for current picker (regardless of who it is)
    const pick: DraftPick = {
      id: `pick-${currentPickNumber}`,
      pickNumber: currentPickNumber,
      round: getRoundForPick(currentPickNumber, teamCount),
      pickInRound: getPickInRound(currentPickNumber, teamCount),
      player,
      participantId: participants[currentParticipantIndex]?.id ?? '',
      participantIndex: currentParticipantIndex,
      timestamp: Date.now(),
    };
    
    // Add to picks
    setPicks(prev => [...prev, pick]);
    
    // Notify callback
    onPickMade?.(pick);
    
    return true;
  }, [
    currentPickNumber, 
    currentParticipantIndex, 
    teamCount, 
    participants, 
    pickedPlayerIdSet,
    onPickMade,
  ]);
  
  return {
    picks,
    currentPickNumber,
    currentRound,
    lastPick,
    picksByRound,
    picksByParticipant,
    getPickForSlot,
    userPicks,
    userPositionCounts,
    pickedPlayerIds,
    isLoading,
    error,
    makePick,
    forcePickAny,
    canMakePick,
    isPlayerAvailable,
  };
}

export default useDraftPicks;
