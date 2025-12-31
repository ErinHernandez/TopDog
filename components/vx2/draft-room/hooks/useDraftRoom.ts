/**
 * useDraftRoom - Core draft room state orchestrator
 * 
 * Main hook that manages room connection, participants, and draft status.
 * Currently uses mock data - designed for Firebase integration.
 * 
 * @example
 * ```tsx
 * const { 
 *   room, 
 *   isMyTurn,
 *   timer,
 *   availablePlayers,
 *   queue,
 *   picks,
 * } = useDraftRoom({ roomId: 'abc123' });
 * ```
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { 
  DraftRoom, 
  DraftStatus, 
  Participant,
  DraftPlayer,
  DraftTab,
} from '../types';
// Using new draft-logic module for core calculations
import { 
  getParticipantForPick, 
  getPickNumbersForParticipant,
  selectAutodraftPlayer,
  getPicksUntilTurn,
} from '../../draft-logic';
import { DRAFT_DEFAULTS, DEV_FLAGS } from '../constants';
import { useDraftTimer } from './useDraftTimer';
import { useDraftQueue } from './useDraftQueue';
import { useAvailablePlayers } from './useAvailablePlayers';
import { useDraftPicks } from './useDraftPicks';

// ============================================================================
// TYPES
// ============================================================================

export interface UseDraftRoomOptions {
  /** Draft room ID */
  roomId: string;
  /** User ID (for identifying user's participant) */
  userId?: string;
  /** Initial draft status (for dev tools) */
  initialStatus?: DraftStatus;
  /** Enable fast timer mode (for dev tools) */
  fastMode?: boolean;
}

export interface UseDraftRoomResult {
  // Room data
  room: DraftRoom | null;
  status: DraftStatus;
  participants: Participant[];
  
  // User context
  userParticipantIndex: number;
  isMyTurn: boolean;
  myPickNumbers: number[];
  picksUntilMyTurn: number;
  
  // Current pick info
  currentPickNumber: number;
  currentRound: number;
  currentPicker: Participant | null;
  
  // Sub-hook results
  timer: ReturnType<typeof useDraftTimer>;
  queue: ReturnType<typeof useDraftQueue>;
  availablePlayers: ReturnType<typeof useAvailablePlayers>;
  picks: ReturnType<typeof useDraftPicks>;
  
  // UI state
  activeTab: DraftTab;
  setActiveTab: (tab: DraftTab) => void;
  
  // Scroll position preservation
  saveScrollPosition: (tab: DraftTab, position: number) => void;
  getScrollPosition: (tab: DraftTab) => number;
  
  // Loading/error
  isLoading: boolean;
  error: string | null;
  
  // Actions
  draftPlayer: (player: DraftPlayer) => Promise<boolean>;
  draftFromQueue: () => Promise<boolean>;
  leaveDraft: () => void;
  autoPickForUser: () => void;
  
  // Dev Tools
  devTools: {
  /** Start the draft */
    startDraft: () => void;
    /** Pause/resume the draft */
    togglePause: () => void;
    /** Force a pick (auto-draft best available) */
    forcePick: () => void;
    /** Whether draft is paused */
    isPaused: boolean;
  };
}

// ============================================================================
// MOCK DATA
// ============================================================================

function createMockParticipants(): Participant[] {
  const names = [
    'NEWUSERNAME', 'DragonSlayer', 'FFChampion', 'GridironGuru',
    'PickMaster', 'TouchdownKing', 'BestBaller', 'DynastyDan',
    'WaiverWire', 'TradeGod', 'RookieHunter', 'SleepKing',
  ];
  
  return names.map((name, index) => ({
    id: `participant-${index}`,
    name,
    isUser: index === 0,
    draftPosition: index,
  }));
}

function createMockRoom(roomId: string): DraftRoom {
  return {
    id: roomId,
    status: 'active',
    currentPickNumber: 1,
    settings: {
  teamCount: DRAFT_DEFAULTS.teamCount,
  rosterSize: DRAFT_DEFAULTS.rosterSize,
  pickTimeSeconds: DRAFT_DEFAULTS.pickTimeSeconds,
  gracePeriodSeconds: DRAFT_DEFAULTS.gracePeriodSeconds,
    },
    participants: createMockParticipants(),
    startedAt: Date.now(),
};
}

// ============================================================================
// HOOK
// ============================================================================

export function useDraftRoom({
  roomId,
  initialStatus = 'loading',
  fastMode = false,
}: UseDraftRoomOptions): UseDraftRoomResult {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/2aaead3f-67a7-4f92-b03f-ef7a26e0239e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useDraftRoom.ts:149',message:'useDraftRoom hook called',data:{roomId,initialStatus,fastMode},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'G'})}).catch(()=>{});
  // #endregion
  // Room state (mock for now)
  const [room, setRoom] = useState<DraftRoom | null>(null);
  const [status, setStatus] = useState<DraftStatus>(initialStatus);
  const [currentPickNumber, setCurrentPickNumber] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  
  // UI state
  const [activeTab, setActiveTab] = useState<DraftTab>('players');
  const [scrollPositions, setScrollPositions] = useState<Record<DraftTab, number>>({
    players: 0,
    queue: 0,
    rosters: 0,
    board: 0,
    info: 0,
  });
  
  // Scroll position preservation functions
  const saveScrollPosition = useCallback((tab: DraftTab, position: number) => {
    setScrollPositions(prev => ({ ...prev, [tab]: position }));
  }, []);
  
  const getScrollPosition = useCallback((tab: DraftTab): number => {
    return scrollPositions[tab] ?? 0;
  }, [scrollPositions]);
  
  // Load mock room on mount - starts in 'waiting' state, user must click Start Draft
  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/2aaead3f-67a7-4f92-b03f-ef7a26e0239e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useDraftRoom.ts:182',message:'useDraftRoom loading effect',data:{roomId,useMockData:DEV_FLAGS.useMockData},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'G'})}).catch(()=>{});
    // #endregion
    if (!DEV_FLAGS.useMockData) return;
    
    const timer = setTimeout(() => {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/2aaead3f-67a7-4f92-b03f-ef7a26e0239e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useDraftRoom.ts:186',message:'useDraftRoom creating mock room',data:{roomId},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'G'})}).catch(()=>{});
      // #endregion
      const mockRoom = createMockRoom(roomId);
      setRoom(mockRoom);
      setStatus('waiting'); // Start in waiting state, not active
      setIsLoading(false);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/2aaead3f-67a7-4f92-b03f-ef7a26e0239e',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useDraftRoom.ts:190',message:'useDraftRoom mock room loaded',data:{roomId,participantCount:mockRoom.participants.length,status:'waiting'},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'G'})}).catch(()=>{});
      // #endregion
    }, 500);
    
    return () => clearTimeout(timer);
  }, [roomId]);
  
  // Derived values
  const participants = room?.participants ?? [];
  const teamCount = room?.settings.teamCount ?? DRAFT_DEFAULTS.teamCount;
  
  const userParticipantIndex = useMemo(() => {
    const index = participants.findIndex(p => p.isUser);
    return index >= 0 ? index : 0;
  }, [participants]);
  
  const currentParticipantIndex = getParticipantForPick(currentPickNumber, teamCount);
  const isMyTurn = currentParticipantIndex === userParticipantIndex;
  const currentPicker = participants[currentParticipantIndex] ?? null;
  
  const myPickNumbers = useMemo(() => {
    return getPickNumbersForParticipant(
      userParticipantIndex,
      teamCount, 
      room?.settings.rosterSize ?? DRAFT_DEFAULTS.rosterSize
    );
  }, [userParticipantIndex, teamCount, room?.settings.rosterSize]);
  
  // Use draft-logic utility for picks until turn calculation
  const picksUntilMyTurn = useMemo(() => {
    return getPicksUntilTurn(
      currentPickNumber,
      userParticipantIndex,
      teamCount,
      room?.settings.rosterSize ?? DRAFT_DEFAULTS.rosterSize
    );
  }, [currentPickNumber, userParticipantIndex, teamCount, room?.settings.rosterSize]);
  
  // Initialize picks hook
  const picksHook = useDraftPicks({
    roomId,
    participants,
    currentPickNumber,
    userParticipantIndex,
    onPickMade: () => {
      setCurrentPickNumber(prev => prev + 1);
    },
  });
  
  // Initialize queue hook
  const queueHook = useDraftQueue({
    pickedPlayerIds: picksHook.pickedPlayerIds,
  });
  
  // Initialize available players hook
  const availablePlayersHook = useAvailablePlayers({
    pickedPlayerIds: picksHook.pickedPlayerIds,
  });
  
  // Handle timer expiration - uses draft-logic selectAutodraftPlayer
  // For user's turn, skip auto-pick here - navbar's grace period will handle it
  const handleTimerExpire = useCallback(() => {
    // Skip auto-pick for user's turn - navbar's onGracePeriodEnd will handle it
    // This allows the navbar shake animation to complete first
    if (isMyTurn) {
      console.log('[useDraftRoom] Timer expired for user - waiting for grace period');
      return;
    }
    
    // Get current picker's roster for position limit checking
    const currentPickerRoster = picksHook.picksByParticipant(currentParticipantIndex)
      .map(pick => pick.player);
    
    // Use draft-logic autodraft AI: Queue → Custom Rankings → ADP
    const result = selectAutodraftPlayer(
      availablePlayersHook.filteredPlayers,
      currentPickerRoster,
      [], // no queue for AI players
      [], // custom rankings (future feature)
    );
    
    if (result) {
      console.log(`[useDraftRoom] Autopick for ${participants[currentParticipantIndex]?.name}: ${result.player.name} (${result.source})`);
      // Use forcePickAny since it may not be user's turn in mock mode
      picksHook.forcePickAny(result.player as DraftPlayer);
    }
  }, [isMyTurn, picksHook, availablePlayersHook.filteredPlayers, currentParticipantIndex, participants]);
  
  // Initialize timer hook
  // Non-user picks (mock opponents) always get 3 seconds
  // User picks get full time unless fastMode is enabled
  const normalUserPickTime = room?.settings.pickTimeSeconds ?? DRAFT_DEFAULTS.pickTimeSeconds;
  const mockOpponentPickTime = DRAFT_DEFAULTS.fastModeSeconds; // 3 seconds for mock opponents
  const userPickTime = fastMode ? mockOpponentPickTime : normalUserPickTime;
  const initialTimerSeconds = isMyTurn ? userPickTime : mockOpponentPickTime;
  
  const timerHook = useDraftTimer({
    initialSeconds: initialTimerSeconds,
    isActive: status === 'active' && !isPaused,
    isPaused: isPaused,
    onExpire: handleTimerExpire,
  });
  
  // Reset timer when pick changes - user gets configured time, mock opponents always get 3s
  useEffect(() => {
    if (status === 'active') {
      const newTimerSeconds = isMyTurn ? userPickTime : mockOpponentPickTime;
      timerHook.reset(newTimerSeconds);
    }
  }, [currentPickNumber, status, isMyTurn, userPickTime, mockOpponentPickTime]); // eslint-disable-line react-hooks/exhaustive-deps
  
  // Actions
  const draftPlayer = useCallback(async (player: DraftPlayer): Promise<boolean> => {
    if (!isMyTurn) {
      return false;
    }
    return picksHook.makePick(player);
  }, [isMyTurn, picksHook]);
  
  const draftFromQueue = useCallback(async (): Promise<boolean> => {
    const nextInQueue = queueHook.getNextInQueue();
    if (!nextInQueue) return false;
    
    if (!picksHook.isPlayerAvailable(nextInQueue.id)) {
      queueHook.removeFromQueue(nextInQueue.id);
      return false;
      }
      
    return draftPlayer(nextInQueue);
  }, [queueHook, picksHook, draftPlayer]);
  
  const leaveDraftCalledRef = useRef(false);
  const leaveDraft = useCallback(() => {
    // Guard against duplicate calls (e.g., React StrictMode double-render)
    if (leaveDraftCalledRef.current) {
      return;
    }
    leaveDraftCalledRef.current = true;
    console.log('[useDraftRoom] Leaving draft...');
  }, []);
  
  // Dev Tools
  const startDraft = useCallback(() => {
    setStatus('active');
    setIsPaused(false);
  }, []);
  
  const togglePause = useCallback(() => {
    setIsPaused(prev => !prev);
  }, []);
  
  const forcePick = useCallback(() => {
    // Get current picker's roster for position limit checking
    const currentPickerRoster = picksHook.picksByParticipant(currentParticipantIndex)
      .map(pick => pick.player);
    
    // Use draft-logic autodraft AI for force pick
    const result = selectAutodraftPlayer(
      availablePlayersHook.filteredPlayers,
      currentPickerRoster,
      [], // no queue for force pick
      [], // no custom rankings for force pick
    );
    
    if (result) {
      console.log(`[useDraftRoom] Force pick: ${result.player.name} (${result.source})`);
      // Cast to local DraftPlayer type (draft-logic returns compatible shape)
      picksHook.forcePickAny(result.player as DraftPlayer);
    }
  }, [availablePlayersHook.filteredPlayers, picksHook, currentParticipantIndex]);
  
  // Auto-pick for user when grace period ends (called by navbar's onGracePeriodEnd)
  const autoPickForUser = useCallback(() => {
    if (!isMyTurn) return;
    
    // Get user's roster for position limit checking
    const userRoster = picksHook.picksByParticipant(userParticipantIndex)
      .map(pick => pick.player);
    
    // Get queue IDs for user's auto-pick (Queue → Custom Rankings → ADP)
    const queueIds = queueHook.queue.map(p => p.id);
    
    // Use draft-logic autodraft AI
    const result = selectAutodraftPlayer(
      availablePlayersHook.filteredPlayers,
      userRoster,
      queueIds,
      [], // custom rankings (future feature)
    );
    
    if (result) {
      console.log(`[useDraftRoom] User auto-pick after grace period: ${result.player.name} (${result.source})`);
      picksHook.forcePickAny(result.player as DraftPlayer);
    }
  }, [isMyTurn, userParticipantIndex, queueHook.queue, picksHook, availablePlayersHook.filteredPlayers]);
  
  // Memoize devTools to prevent infinite re-renders
  const devTools = useMemo(() => ({
    startDraft,
    togglePause,
    forcePick,
    isPaused,
  }), [startDraft, togglePause, forcePick, isPaused]);
  
  return {
    room,
    status,
    participants,
    userParticipantIndex,
    isMyTurn,
    myPickNumbers,
    picksUntilMyTurn,
    currentPickNumber,
    currentRound: picksHook.currentRound,
    currentPicker,
    timer: timerHook,
    queue: queueHook,
    availablePlayers: availablePlayersHook,
    picks: picksHook,
    activeTab,
    setActiveTab,
    saveScrollPosition,
    getScrollPosition,
    isLoading: isLoading || availablePlayersHook.isLoading,
    error: error || availablePlayersHook.error,
    draftPlayer,
    draftFromQueue,
    leaveDraft,
    autoPickForUser,
    devTools,
  };
}

export default useDraftRoom;
