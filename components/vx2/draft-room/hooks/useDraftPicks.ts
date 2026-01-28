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

import { useState, useCallback, useMemo, useEffect } from 'react';
import type { DraftPick, DraftPlayer, Participant, PositionCounts, Position } from '../types';
import { 
  getParticipantForPick, 
  getRoundForPick, 
  getPickInRound,
  createEmptyPositionCounts,
} from '../utils';
import { DRAFT_DEFAULTS, DEV_FLAGS } from '../constants';
import { createScopedLogger } from '../../../../lib/clientLogger';
import { db } from '../../../../lib/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { generatePlayerId } from '../utils';
import { usePlayerPool } from '../../../../lib/playerPool/usePlayerPool';
import type { PoolPlayer } from '../../../../lib/playerPool/types';
import type { Timestamp } from 'firebase/firestore';

const logger = createScopedLogger('[useDraftPicks]');

/**
 * Firebase pick document structure from Firestore
 */
interface FirebasePickDocument {
  id?: string;
  pickNumber: number;
  player: string | { name: string; [key: string]: unknown };
  participantId?: string;
  picker?: string;
  pickerId?: string;
  timestamp?: { toMillis?: () => number } | number;
}

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
  /** Initial picks to populate (for drafts started mid-way) */
  initialPicks?: DraftPick[];
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
  initialPicks = [],
}: UseDraftPicksOptions): UseDraftPicksResult {
  const [picks, setPicks] = useState<DraftPick[]>(initialPicks);
  const [isLoading, setIsLoading] = useState(!DEV_FLAGS.useMockData); // Loading in production until Firebase loads
  const [error, setError] = useState<string | null>(null);
  
  // Load player pool to convert Firebase player names to DraftPlayer objects
  const { players: poolPlayers } = usePlayerPool();
  
  // Create player lookup map by name
  const playerMapByName = useMemo(() => {
    const map = new Map<string, DraftPlayer>();
    for (const poolPlayer of poolPlayers) {
      const draftPlayer: DraftPlayer = {
        id: poolPlayer.id || generatePlayerId(poolPlayer.name),
        name: poolPlayer.name,
        position: poolPlayer.position as Position,
        team: poolPlayer.team,
        adp: poolPlayer.adp ?? 999,
        projectedPoints: poolPlayer.projection ?? 0,
        byeWeek: poolPlayer.byeWeek ?? 0,
      };
      map.set(poolPlayer.name, draftPlayer);
    }
    return map;
  }, [poolPlayers]);
  
  // Convert Firebase pick data to DraftPick format
  const convertFirebasePick = useCallback((firebasePick: FirebasePickDocument, teamCount: number): DraftPick | null => {
    // Extract player name (Firebase stores as string)
    let playerName: string;
    if (typeof firebasePick.player === 'string') {
      playerName = firebasePick.player;
    } else if (firebasePick.player?.name) {
      playerName = firebasePick.player.name;
    } else {
      logger.warn('Invalid player data in Firebase pick', { pick: firebasePick });
      return null;
    }
    
    // Look up player in pool
    const player = playerMapByName.get(playerName);
    if (!player) {
      logger.warn('Player not found in pool', { playerName, pickNumber: firebasePick.pickNumber });
      return null;
    }
    
    // Find participant index
    const participantIndex = participants.findIndex(p => 
      p.id === firebasePick.participantId || 
      p.name === firebasePick.picker ||
      p.id === firebasePick.pickerId
    );
    
    if (participantIndex === -1) {
      logger.warn('Participant not found for pick', { 
        pickNumber: firebasePick.pickNumber,
        participantId: firebasePick.participantId,
        picker: firebasePick.picker
      });
      return null;
    }
    
    return {
      id: firebasePick.id || `pick-${firebasePick.pickNumber}`,
      pickNumber: firebasePick.pickNumber,
      round: getRoundForPick(firebasePick.pickNumber, teamCount),
      pickInRound: getPickInRound(firebasePick.pickNumber, teamCount),
      player,
      participantId: participants[participantIndex].id,
      participantIndex,
      timestamp: typeof firebasePick.timestamp === 'object' && firebasePick.timestamp?.toMillis
        ? firebasePick.timestamp.toMillis()
        : (typeof firebasePick.timestamp === 'number' ? firebasePick.timestamp : Date.now()),
    };
  }, [playerMapByName, participants]);
  
  // Load real picks from Firebase (PRODUCTION MODE)
  useEffect(() => {
    // Only load from Firebase if not in mock mode
    if (DEV_FLAGS.useMockData) {
      // In mock mode, use initialPicks if provided
      if (initialPicks.length > 0 && (picks.length === 0 || picks.length < initialPicks.length)) {
        // CRITICAL: Filter out any future picks (pickNumber >= currentPickNumber)
        // Future picks should NEVER have players in them
        const validInitialPicks = initialPicks.filter(pick => pick.pickNumber < currentPickNumber);
        
        if (validInitialPicks.length !== initialPicks.length) {
          logger.warn('Filtered out future picks from initialPicks', {
            totalPicks: initialPicks.length,
            validPicks: validInitialPicks.length,
            currentPickNumber,
            filteredCount: initialPicks.length - validInitialPicks.length
          });
        }
        
        logger.debug('Initializing picks with mock picks', { 
          initialPicksCount: initialPicks.length,
          validPicksCount: validInitialPicks.length,
          currentPicksCount: picks.length,
          currentPickNumber
        });
        setPicks(validInitialPicks);
        setIsLoading(false);
      }
      return;
    }
    
    // PRODUCTION MODE: Load picks from Firebase
    if (!roomId) return;
    if (!db) return;
    
    setIsLoading(true);
    const picksQuery = query(
      collection(db, 'draftRooms', roomId, 'picks'),
      orderBy('pickNumber')
    );
    
    const unsubscribe = onSnapshot(
      picksQuery,
      (snapshot) => {
        const teamCount = participants.length || DRAFT_DEFAULTS.teamCount;
        const firebasePicks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FirebasePickDocument));

        // Convert Firebase picks to DraftPick format
        const convertedPicks: DraftPick[] = [];
        for (const firebasePick of firebasePicks) {
          const converted = convertFirebasePick(firebasePick, teamCount);
          if (converted) {
            convertedPicks.push(converted);
          }
        }
        
        // Sort by pick number to ensure order
        convertedPicks.sort((a, b) => a.pickNumber - b.pickNumber);
        
        // CRITICAL: Filter out any future picks (pickNumber >= currentPickNumber)
        // Future picks should NEVER have players in them
        const validPicks = convertedPicks.filter(pick => pick.pickNumber < currentPickNumber);
        
        if (validPicks.length !== convertedPicks.length) {
          logger.warn('Filtered out future picks', {
            totalPicks: convertedPicks.length,
            validPicks: validPicks.length,
            currentPickNumber,
            filteredCount: convertedPicks.length - validPicks.length
          });
        }
        
        logger.debug('Loaded picks from Firebase', { 
          count: validPicks.length,
          roomId 
        });
        
        setPicks(validPicks);
        setIsLoading(false);
        setError(null);
      },
      (err) => {
        logger.error('Error loading picks from Firebase', err);
        setError(err.message);
        setIsLoading(false);
      }
    );
    
    return () => unsubscribe();
  }, [roomId, initialPicks, picks.length, participants, convertFirebasePick, currentPickNumber]);
  
  // CRITICAL: Filter out future picks whenever currentPickNumber changes
  // This ensures that if the draft refreshes or restarts, future picks are cleared
  useEffect(() => {
    setPicks(prevPicks => {
      const validPicks = prevPicks.filter(pick => pick.pickNumber < currentPickNumber);
      const futurePicks = prevPicks.filter(pick => pick.pickNumber >= currentPickNumber);
      
      if (futurePicks.length > 0) {
        logger.warn('Removing future picks', {
          futurePicksCount: futurePicks.length,
          currentPickNumber,
          futurePickNumbers: futurePicks.map(p => p.pickNumber)
        });
      }
      
      return validPicks;
    });
  }, [currentPickNumber]);
  
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
      logger.warn('Cannot make pick - not your turn');
      return false;
    }
    
    if (pickedPlayerIdSet.has(player.id)) {
      logger.warn('Cannot make pick - player already picked');
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
      logger.warn('Cannot make pick - player already picked');
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
