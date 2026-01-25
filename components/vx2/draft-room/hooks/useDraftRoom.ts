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
  Position,
} from '../types';
// Using new draft-logic module for core calculations
import { 
  getParticipantForPick,
  getPickNumbersForParticipant,
  selectAutodraftPlayer,
  getPicksUntilTurn,
} from '../../draft-logic';
import { createScopedLogger } from '../../../../lib/clientLogger';

const logger = createScopedLogger('[useDraftRoom]');
import { DRAFT_DEFAULTS, DEV_FLAGS } from '../constants';
import { useDraftTimer } from './useDraftTimer';
import { useDraftQueue } from './useDraftQueue';
import { useAvailablePlayers } from './useAvailablePlayers';
import { useDraftPicks } from './useDraftPicks';
import { usePlayerPool } from '../../../../lib/playerPool/usePlayerPool';
import type { DraftPick } from '../types';
import { getPickInRound, getRoundForPick, generatePlayerId } from '../utils';
import { useDraftAlerts } from '../../draft-logic/hooks/useDraftAlerts';

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
  /** Initial pick number to start at (default: 1) */
  initialPickNumber?: number;
  /** Team count (default: 12) */
  teamCount?: number;
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

  // Pre-draft countdown (seconds remaining before draft starts)
  preDraftCountdown: number | null;
  
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

function createMockRoom(roomId: string, initialPickNumber: number = 1, teamCount: number = DRAFT_DEFAULTS.teamCount): DraftRoom {
  return {
    id: roomId,
    status: initialPickNumber > 1 ? 'active' : 'waiting',
    currentPickNumber: initialPickNumber,
    settings: {
      teamCount: teamCount,
      rosterSize: DRAFT_DEFAULTS.rosterSize,
      pickTimeSeconds: DRAFT_DEFAULTS.pickTimeSeconds,
      gracePeriodSeconds: DRAFT_DEFAULTS.gracePeriodSeconds,
    },
    participants: createMockParticipants(),
    startedAt: Date.now(),
  };
}

/**
 * Generate mock picks for all picks prior to the initial pick number
 * Ensures the draft board shows complete history when starting mid-draft
 */
/**
 * Generate mock picks for all picks prior to the initial pick number
 * Ensures the draft board shows complete history when starting mid-draft
 */
function generateMockPicks(
  initialPickNumber: number,
  participants: Participant[],
  teamCount: number,
  allPlayers: DraftPlayer[]
): DraftPick[] {
  if (initialPickNumber <= 1 || allPlayers.length === 0 || participants.length === 0) {
    return [];
  }

  const picks: DraftPick[] = [];
  const usedPlayerIds = new Set<string>();
  
  // Sort players by ADP for realistic mock draft order
  const sortedPlayers = [...allPlayers].sort((a, b) => (a.adp || 999) - (b.adp || 999));
  
  // Generate picks for picks 1 to (initialPickNumber - 1)
  // This ensures all previous picks are populated - no empty slots before current pick
  for (let pickNum = 1; pickNum < initialPickNumber; pickNum++) {
    // Find next available player (not already picked)
    const player = sortedPlayers.find(p => !usedPlayerIds.has(p.id));
    
    if (!player) {
      logger.warn(`No available players for mock pick ${pickNum}`, { 
        totalPlayers: allPlayers.length, 
        usedPlayers: usedPlayerIds.size 
      });
      break; // Break instead of continue to avoid gaps
    }
    
    // Get participant for this pick (snake draft logic)
    const participantIndex = getParticipantForPick(pickNum, teamCount);
    const participant = participants[participantIndex];
    
    if (!participant) {
      logger.warn(`No participant found for pick ${pickNum}`, { 
        participantIndex, 
        totalParticipants: participants.length 
      });
      break; // Break instead of continue to avoid gaps
    }
    
    // Create pick
    const pick: DraftPick = {
      id: `pick-${pickNum}`,
      pickNumber: pickNum,
      round: getRoundForPick(pickNum, teamCount),
      pickInRound: getPickInRound(pickNum, teamCount),
      player,
      participantId: participant.id,
      participantIndex,
      timestamp: Date.now() - (initialPickNumber - pickNum) * 30000, // Spread out timestamps
    };
    
    picks.push(pick);
    usedPlayerIds.add(player.id);
  }
  
  logger.debug(`Generated ${picks.length} mock picks for picks 1-${initialPickNumber - 1}`);
  return picks;
}

// ============================================================================
// HOOK
// ============================================================================

export function useDraftRoom({
  roomId,
  initialStatus = 'loading',
  fastMode = false,
  initialPickNumber = 1,
  teamCount = DRAFT_DEFAULTS.teamCount,
}: UseDraftRoomOptions): UseDraftRoomResult {
  // Room state (mock for now)
  const [room, setRoom] = useState<DraftRoom | null>(null);
  const [status, setStatus] = useState<DraftStatus>(initialStatus);
  const [currentPickNumber, setCurrentPickNumber] = useState(initialPickNumber);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [preDraftCountdown, setPreDraftCountdown] = useState<number | null>(null);
  
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
  
  // Load mock room on mount - starts at the specified pick number
  useEffect(() => {
    if (!DEV_FLAGS.useMockData) return;
    
    const timer = setTimeout(() => {
      const mockRoom = createMockRoom(roomId, initialPickNumber, teamCount);
      setRoom(mockRoom);
      // If we're starting at a pick > 1, the draft is already active
      const initialStatus = initialPickNumber > 1 ? 'active' : 'waiting';
      setStatus(initialStatus);
      setCurrentPickNumber(initialPickNumber);
      setIsLoading(false);
      // Don't start countdown here - wait for room to be full
    }, 500);
    
    return () => clearTimeout(timer);
  }, [roomId, initialPickNumber, teamCount]);
  
  // Load player pool to generate mock picks
  const { players: poolPlayers, loading: poolLoading } = usePlayerPool();
  
  // Derived values - memoized to stabilize hook dependencies
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const participants = useMemo(() => room?.participants ?? [], [room?.participants]);
  // Use room's teamCount if available, otherwise use the parameter or default
  const effectiveTeamCount = room?.settings.teamCount ?? teamCount;
  
  // Check if room is full (all participants joined)
  const isRoomFull = useMemo(() => {
    if (!room) return false;
    return participants.length >= effectiveTeamCount;
  }, [participants.length, effectiveTeamCount, room]);
  
  // Start countdown when room becomes full
  useEffect(() => {
    if (status === 'waiting' && isRoomFull && preDraftCountdown === null) {
      // Room just became full - start 60-second countdown
      setPreDraftCountdown(60);
    }
  }, [status, isRoomFull, preDraftCountdown]);
  
  // Pre-draft countdown timer - counts down from 60 to 0, then starts draft
  useEffect(() => {
    if (status !== 'waiting' || preDraftCountdown === null || !isRoomFull) return;
    
    if (preDraftCountdown <= 0) {
      // Countdown finished - start the draft
      setStatus('active');
      setPreDraftCountdown(null);
      return;
    }
    
    const interval = setInterval(() => {
      setPreDraftCountdown(prev => {
        if (prev === null || prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [status, preDraftCountdown, isRoomFull]);
  
  // Convert pool players to DraftPlayer format for mock picks
  const allPlayersForPicks = useMemo(() => {
    if (poolPlayers.length === 0) return [];
    return poolPlayers.map(poolPlayer => ({
      id: poolPlayer.id || generatePlayerId(poolPlayer.name),
      name: poolPlayer.name,
      position: poolPlayer.position as Position,
      team: poolPlayer.team,
      adp: poolPlayer.adp ?? 999,
      projectedPoints: poolPlayer.projection ?? 0,
      byeWeek: poolPlayer.byeWeek ?? 0,
    }));
  }, [poolPlayers]);
  
  // Generate mock picks for all previous picks when starting mid-draft (MOCK MODE ONLY)
  // In production, real picks will be loaded from Firebase via useDraftPicks
  // This ensures all picks 1 through (initialPickNumber - 1) are populated in mock mode
  // No empty slots should exist before the current pick
  const initialPicks = useMemo(() => {
    // Only generate mock picks in dev/mock mode
    if (!DEV_FLAGS.useMockData) {
      return []; // Real picks will be loaded from Firebase
    }
    
    // Only generate if starting mid-draft and we have the necessary data
    if (initialPickNumber <= 1 || !room || allPlayersForPicks.length === 0 || participants.length === 0) {
      return [];
    }
    
    const mockPicks = generateMockPicks(initialPickNumber, participants, effectiveTeamCount, allPlayersForPicks);
    if (mockPicks.length > 0) {
      logger.debug(`Generated ${mockPicks.length} mock picks for mid-draft start at pick ${initialPickNumber} (MOCK MODE)`);
    }
    return mockPicks;
  }, [initialPickNumber, room, participants, effectiveTeamCount, allPlayersForPicks]);
  
  const userParticipantIndex = useMemo(() => {
    const index = participants.findIndex(p => p.isUser);
    return index >= 0 ? index : 0;
  }, [participants]);
  
  const currentParticipantIndex = getParticipantForPick(currentPickNumber, effectiveTeamCount);
  const isMyTurn = currentParticipantIndex === userParticipantIndex;
  const currentPicker = participants[currentParticipantIndex] ?? null;
  
  const myPickNumbers = useMemo(() => {
    return getPickNumbersForParticipant(
      userParticipantIndex,
      effectiveTeamCount, 
      room?.settings.rosterSize ?? DRAFT_DEFAULTS.rosterSize
    );
  }, [userParticipantIndex, effectiveTeamCount, room?.settings.rosterSize]);
  
  // Use draft-logic utility for picks until turn calculation
  const picksUntilMyTurn = useMemo(() => {
    return getPicksUntilTurn(
      currentPickNumber,
      userParticipantIndex,
      effectiveTeamCount,
      room?.settings.rosterSize ?? DRAFT_DEFAULTS.rosterSize
    );
  }, [currentPickNumber, userParticipantIndex, effectiveTeamCount, room?.settings.rosterSize]);
  
  // Initialize picks hook with initial picks if starting mid-draft
  const picksHook = useDraftPicks({
    roomId,
    participants,
    currentPickNumber,
    userParticipantIndex,
    initialPicks: initialPicks,
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
      logger.debug('Timer expired for user - waiting for grace period');
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
      logger.debug('Autopick', { 
        participant: participants[currentParticipantIndex]?.name, 
        player: result.player.name, 
        source: result.source 
      });
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
    logger.debug('Leaving draft');
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
      logger.debug('Force pick', { player: result.player.name, source: result.source });
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
      logger.debug('User auto-pick after grace period', { player: result.player.name, source: result.source });
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
  
  // Integrate draft alerts
  useDraftAlerts({
    roomId,
    participants: participants.map(p => ({ id: p.id, name: p.name })),
    maxParticipants: effectiveTeamCount,
    roomStatus: status === 'loading' ? 'waiting' : status === 'complete' ? 'completed' : status as 'waiting' | 'active' | 'paused',
    preDraftCountdown: preDraftCountdown ?? 0,
    picksUntilMyTurn,
    isMyTurn,
    timer: timerHook.seconds,
    currentRound: picksHook.currentRound,
    currentPick: currentPickNumber,
  });
  
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
    preDraftCountdown,
  };
}

export default useDraftRoom;
