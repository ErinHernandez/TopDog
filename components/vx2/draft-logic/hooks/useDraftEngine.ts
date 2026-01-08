/**
 * VX2 Draft Logic - Draft Engine Hook
 * 
 * Main orchestrator hook that composes all draft logic.
 * All new implementation - no code reuse.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { 
  DraftRoom,
  DraftStatus,
  DraftPlayer,
  DraftPick,
  Participant,
  DraftAdapter,
  DraftEngineState,
  DraftEngineActions,
} from '../types';
import { DRAFT_CONFIG } from '../constants';
// Direct imports to avoid barrel export issues with Turbopack
import { getParticipantForPick, getRoundForPick, getPicksUntilTurn } from '../utils/snakeDraft';
import { selectAutodraftPlayer } from '../utils/autodraft';
import { useDraftTimer } from './useDraftTimer';
import { useDraftQueue } from './useDraftQueue';
import { useAutodraft } from './useAutodraft';
import { usePickExecutor } from './usePickExecutor';
import { createScopedLogger } from '../../../../lib/clientLogger';

const logger = createScopedLogger('[DraftEngine]');

// ============================================================================
// TYPES
// ============================================================================

export interface UseDraftEngineOptions {
  /** Room ID */
  roomId: string;
  /** User ID */
  userId?: string;
  /** Data adapter */
  adapter: DraftAdapter;
  /** Fast timer mode (for testing) */
  fastMode?: boolean;
}

export interface UseDraftEngineResult extends DraftEngineState, DraftEngineActions {
  /** Timer state */
  timer: ReturnType<typeof useDraftTimer>;
  /** Queue state */
  queue: ReturnType<typeof useDraftQueue>;
  /** Autodraft state */
  autodraft: ReturnType<typeof useAutodraft>;
}

// ============================================================================
// HOOK
// ============================================================================

export function useDraftEngine({
  roomId,
  userId,
  adapter,
  fastMode = false,
}: UseDraftEngineOptions): UseDraftEngineResult {
  // ============================================
  // Core State
  // ============================================
  
  const [room, setRoom] = useState<DraftRoom | null>(null);
  const [status, setStatus] = useState<DraftStatus>('loading');
  const [picks, setPicks] = useState<DraftPick[]>([]);
  const [availablePlayers, setAvailablePlayers] = useState<DraftPlayer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // ============================================
  // Derived State
  // ============================================
  
  // eslint-disable-next-line react-hooks/exhaustive-deps -- Memoize participants to stabilize hook dependencies
  const participants = useMemo(() => room?.participants ?? [], [room?.participants]);
  const teamCount = room?.settings.teamCount ?? DRAFT_CONFIG.teamCount;
  const currentPickNumber = picks.length + 1;
  const currentRound = getRoundForPick(currentPickNumber, teamCount);
  
  // Find user's participant index
  const userParticipantIndex = useMemo(() => {
    const index = participants.findIndex(p => p.isCurrentUser);
    return index >= 0 ? index : 0;
  }, [participants]);
  
  // Current picker
  const currentParticipantIndex = getParticipantForPick(currentPickNumber, teamCount);
  const currentPicker = participants[currentParticipantIndex] ?? null;
  const isMyTurn = currentParticipantIndex === userParticipantIndex;
  
  // Picks until my turn
  const picksUntilMyTurn = useMemo(() => {
    if (isMyTurn) return 0;
    return getPicksUntilTurn(
      currentPickNumber,
      userParticipantIndex,
      teamCount,
      room?.settings.rosterSize ?? DRAFT_CONFIG.rosterSize
    );
  }, [currentPickNumber, userParticipantIndex, teamCount, room?.settings.rosterSize, isMyTurn]);
  
  // Set of picked player IDs
  const pickedPlayerIds = useMemo(
    () => new Set(picks.map(p => p.player.id)),
    [picks]
  );
  
  // User's current roster
  const currentRoster = useMemo(() => {
    return picks
      .filter(p => p.participantIndex === userParticipantIndex)
      .map(p => p.player);
  }, [picks, userParticipantIndex]);
  
  // ============================================
  // Sub-Hooks
  // ============================================
  
  // Autodraft configuration
  const autodraft = useAutodraft({ userId });
  
  // Queue management
  const queue = useDraftQueue({ 
    roomId, 
    pickedPlayerIds 
  });
  
  // Load excluded players from localStorage
  const excludedPlayers = useMemo(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem('vx2Excluded');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }, []);

  // Handle timer expiration (autopick)
  const handleTimerExpire = useCallback(() => {
    if (!isMyTurn || status !== 'active') return;
    
    // Select player using autodraft AI
    const result = selectAutodraftPlayer(
      availablePlayers,
      currentRoster,
      queue.queueIds,
      autodraft.customRankings,
      autodraft.positionLimits,
      excludedPlayers
    );
    
    if (result) {
      // Execute autopick through executor
      logger.debug('Autopick', { player: result.player.name, source: result.source });
    }
  }, [
    isMyTurn, 
    status, 
    availablePlayers, 
    currentRoster, 
    queue.queueIds, 
    autodraft.customRankings, 
    autodraft.positionLimits,
    excludedPlayers
  ]);
  
  // Timer
  const timerDuration = fastMode 
    ? DRAFT_CONFIG.fastModeSeconds 
    : (room?.settings.pickTimeSeconds ?? DRAFT_CONFIG.pickTimeSeconds);
  
  const timer = useDraftTimer({
    initialSeconds: timerDuration,
    gracePeriodSeconds: room?.settings.gracePeriodSeconds ?? DRAFT_CONFIG.gracePeriodSeconds,
    isActive: status === 'active',
    isPaused: status === 'paused',
    onExpire: handleTimerExpire,
  });
  
  // Pick executor
  const executor = usePickExecutor({
    adapter,
    roomId,
    currentPickNumber,
    userParticipantIndex,
    teamCount,
    pickedPlayerIds,
    currentRoster,
    positionLimits: autodraft.positionLimits,
    draftStatus: status,
    onPickSuccess: (pick) => {
      logger.debug('Pick success', { player: pick.player.name });
      timer.reset();
    },
    onPickError: (err: unknown) => {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('Pick error', error);
      setError(err instanceof Error ? err.message : String(err));
    },
  });
  
  // ============================================
  // Data Loading
  // ============================================
  
  // Load room data
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    
    const loadRoom = async () => {
      try {
        // Subscribe to room updates
        unsubscribe = adapter.subscribeToRoom(roomId, (roomData) => {
          setRoom(roomData);
          setStatus(roomData.status);
        });
        
        // Load initial room
        const roomData = await adapter.getRoom(roomId);
        if (roomData) {
          setRoom(roomData);
          setStatus(roomData.status);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load room');
      }
    };
    
    loadRoom();
    
    return () => {
      unsubscribe?.();
    };
  }, [adapter, roomId]);
  
  // Load picks
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    
    const loadPicks = async () => {
      try {
        // Subscribe to picks
        unsubscribe = adapter.subscribeToPicks(roomId, (picksData) => {
          setPicks(picksData);
        });
        
        // Load initial picks
        const picksData = await adapter.getPicks(roomId);
        setPicks(picksData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load picks');
      }
    };
    
    loadPicks();
    
    return () => {
      unsubscribe?.();
    };
  }, [adapter, roomId]);
  
  // Load available players
  useEffect(() => {
    const loadPlayers = async () => {
      try {
        const players = await adapter.getAvailablePlayers(roomId);
        setAvailablePlayers(players);
        setIsLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load players');
        setIsLoading(false);
      }
    };
    
    loadPlayers();
  }, [adapter, roomId]);
  
  // Filter out picked players from available
  const filteredAvailablePlayers = useMemo(() => {
    return availablePlayers.filter(p => !pickedPlayerIds.has(p.id));
  }, [availablePlayers, pickedPlayerIds]);
  
  // Reset timer when pick changes
  useEffect(() => {
    if (status === 'active') {
      timer.reset();
    }
  }, [currentPickNumber, status]); // eslint-disable-line react-hooks/exhaustive-deps
  
  // ============================================
  // Actions
  // ============================================
  
  const startDraft = useCallback(() => {
    setStatus('active');
    adapter.updateRoomStatus(roomId, 'active');
    timer.start();
  }, [adapter, roomId, timer]);
  
  const pauseDraft = useCallback(() => {
    setStatus('paused');
    adapter.updateRoomStatus(roomId, 'paused');
    timer.pause();
  }, [adapter, roomId, timer]);
  
  const resumeDraft = useCallback(() => {
    setStatus('active');
    adapter.updateRoomStatus(roomId, 'active');
    timer.resume();
  }, [adapter, roomId, timer]);
  
  const makePick = useCallback(async (player: DraftPlayer): Promise<boolean> => {
    return executor.executePick(player);
  }, [executor]);
  
  const forcePick = useCallback(async (): Promise<boolean> => {
    const result = autodraft.selectPlayer(
      filteredAvailablePlayers,
      currentRoster,
      queue.queueIds
    );
    
    if (!result) {
      setError('No available players to pick');
      return false;
    }
    
    return executor.executeAutopick(result.player, result.source);
  }, [autodraft, filteredAvailablePlayers, currentRoster, queue.queueIds, executor]);
  
  const refresh = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      const [roomData, picksData, players] = await Promise.all([
        adapter.getRoom(roomId),
        adapter.getPicks(roomId),
        adapter.getAvailablePlayers(roomId),
      ]);
      
      if (roomData) {
        setRoom(roomData);
        setStatus(roomData.status);
      }
      setPicks(picksData);
      setAvailablePlayers(players);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh');
    } finally {
      setIsLoading(false);
    }
  }, [adapter, roomId]);
  
  // ============================================
  // Return
  // ============================================
  
  return {
    // State
    room,
    status,
    participants,
    picks,
    availablePlayers: filteredAvailablePlayers,
    currentPickNumber,
    currentRound,
    currentPicker,
    isMyTurn,
    userParticipantIndex,
    picksUntilMyTurn,
    isLoading,
    error,
    
    // Actions
    startDraft,
    pauseDraft,
    resumeDraft,
    makePick,
    forcePick,
    refresh,
    
    // Sub-hooks
    timer,
    queue,
    autodraft,
  };
}

export default useDraftEngine;

