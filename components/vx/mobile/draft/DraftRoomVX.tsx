/**
 * DraftRoomVX - Version X Draft Room (Mobile-First)
 * 
 * Migrated from: components/draft/v3/mobile/apple/DraftRoomApple.js (2,201 lines)
 * Now using TypeScript and modular components.
 * 
 * The original remains untouched at:
 * components/draft/v3/mobile/apple/DraftRoomApple.js
 * 
 * Demo pages:
 * - Original: /testing-grounds/mobile-apple-demo
 * - VX: /testing-grounds/vx-mobile-demo
 */

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/router';
import { BG_COLORS } from '../../constants/colors';
import { MOBILE } from '../../constants/sizes';
import type { FantasyPosition } from '../../constants/positions';
import type { Player, Participant, Pick, DraftState } from '../../shared/types';
import { usePlayerPool } from '../../../../lib/playerPool/usePlayerPool';
import type { PoolPlayer } from '../../../../lib/playerPool/types';
import { useLiveADP } from '../../../../lib/adp/useADP';
import type { PlayerADP } from '../../../../lib/adp/types';

// VX Components
import { NavbarVX } from '../navigation';
import { FooterVX, type DraftTabId } from '../navigation';
import PlayerListVX from './PlayerListVX';
import PicksBarVX from './PicksBarVX';
import QueuePanelVX from './QueuePanelVX';
import RosterPanelVX from './RosterPanelVX';
import DraftBoardVX from './DraftBoardVX';
import DraftInfoVX from './DraftInfoVX';

// ============================================================================
// MOCK DATA (for development)
// ============================================================================

const MOCK_PARTICIPANTS: Participant[] = [
  { name: 'NOTTODDMIDDLETON' },
  { name: 'FLIGHT800' },
  { name: 'TITANIMPLOSION' },
  { name: 'LOLITAEXPRESS' },
  { name: 'BPWASFRAMED' },
  { name: 'SEXWORKISWORK' },
  { name: 'TRAPPEDINTHECLOSET' },
  { name: 'KANYEAPOLOGISTS' },
  { name: 'ICEWALL' },
  { name: 'MOONLANDINGFAKE' },
  { name: 'BIRDSARENTREAL' },
  { name: 'CHEMTRAILSROCK' },
];

// ============================================================================
// PLAYER POOL CONVERSION
// ============================================================================

/**
 * Convert PoolPlayer to the Player type used by VX components.
 * Merges static pool data with live ADP data.
 * 
 * @param poolPlayer - Static player data from pool
 * @param adpData - Live ADP data (optional, uses pool ADP as fallback)
 */
function poolPlayerToPlayer(
  poolPlayer: PoolPlayer, 
  adpData?: PlayerADP
): Player {
  return {
    id: poolPlayer.id,
    name: poolPlayer.name,
    position: poolPlayer.position as FantasyPosition,
    team: poolPlayer.team,
    // Use live ADP if available, otherwise fall back to static pool ADP
    adp: adpData?.adp ?? poolPlayer.adp,
    bye: poolPlayer.byeWeek,
    projectedPoints: poolPlayer.projection,
  };
}

/**
 * Generate player ID from name (matches the format in player pool)
 */
function getPlayerId(name: string): string {
  const parts = name.toLowerCase().split(' ');
  if (parts.length >= 2) {
    return `${parts[parts.length - 1]}_${parts[0]}`.replace(/[^a-z_]/g, '');
  }
  return name.toLowerCase().replace(/[^a-z]/g, '');
}

// ============================================================================
// COMPONENT PROPS
// ============================================================================

interface DraftRoomVXProps {
  /** External control: whether draft is active */
  isDraftActive?: boolean;
  /** External control: whether draft is paused */
  isDraftPaused?: boolean;
  /** External control: mock draft speed enabled */
  mockDraftSpeed?: boolean;
  /** Callback when draft should start */
  onDraftStart?: () => void;
  /** Trigger to force a pick (increment to trigger) */
  forcePickTrigger?: number;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function DraftRoomVX({
  isDraftActive: externalDraftActive,
  isDraftPaused: externalDraftPaused,
  mockDraftSpeed = false,
  onDraftStart,
  forcePickTrigger = 0,
}: DraftRoomVXProps = {}) {
  const router = useRouter();
  
  // Player scroll ref
  const playerScrollRef = useRef<HTMLDivElement>(null);

  // Load static player pool
  const { players: poolPlayers, loading: poolLoading } = usePlayerPool();
  
  // Load live ADP data
  const { adp: liveADP, loading: adpLoading } = useLiveADP();
  
  // Combined loading state
  const isDataLoading = poolLoading || adpLoading;

  // Draft state (syncs with external props when provided)
  const [draftState, setDraftState] = useState<DraftState>({
    isDraftActive: externalDraftActive ?? false,
    isPaused: externalDraftPaused ?? false,
    currentPickNumber: 1,
    timer: 7,
    isMyTurn: true,
    myPickNumbers: [1, 24, 25, 48, 49, 72, 73, 96, 97, 120, 121, 144, 145, 168, 169, 192, 193, 216],
    currentUserIndex: 0,
  });

  // Sync with external props
  useEffect(() => {
    if (externalDraftActive !== undefined) {
      setDraftState(prev => ({ ...prev, isDraftActive: externalDraftActive }));
    }
  }, [externalDraftActive]);

  useEffect(() => {
    if (externalDraftPaused !== undefined) {
      setDraftState(prev => ({ ...prev, isPaused: externalDraftPaused }));
    }
  }, [externalDraftPaused]);

  // Players state - initialized from static pool + live ADP
  const [availablePlayers, setAvailablePlayers] = useState<Player[]>([]);
  const [poolInitialized, setPoolInitialized] = useState(false);

  // Initialize available players from static pool merged with live ADP
  useEffect(() => {
    if (poolPlayers.length > 0 && !poolInitialized) {
      // Convert pool players to Player type, merging with live ADP if available
      const convertedPlayers = poolPlayers.map(poolPlayer => {
        const playerId = poolPlayer.id || getPlayerId(poolPlayer.name);
        const playerADP = liveADP?.players?.[playerId];
        return poolPlayerToPlayer(poolPlayer, playerADP);
      });
      
      // Sort by ADP (live ADP if available, otherwise static)
      convertedPlayers.sort((a, b) => (a.adp ?? 999) - (b.adp ?? 999));
      
      setAvailablePlayers(convertedPlayers);
      setPoolInitialized(true);
      
      console.log(`[DraftRoomVX] Loaded ${convertedPlayers.length} players from static pool`);
      if (liveADP) {
        console.log(`[DraftRoomVX] Merged with live ADP (${Object.keys(liveADP.players).length} players)`);
      }
    }
  }, [poolPlayers, poolInitialized, liveADP]);
  const [picks, setPicks] = useState<Pick[]>([]);
  const [queuedPlayers, setQueuedPlayers] = useState<Player[]>([]);

  // UI state
  const [activeTab, setActiveTab] = useState<DraftTabId>('Players');
  const [selectedRosterIndex, setSelectedRosterIndex] = useState(0);

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const isMyTurn = useMemo(() => {
    return draftState.myPickNumbers.includes(draftState.currentPickNumber);
  }, [draftState.myPickNumbers, draftState.currentPickNumber]);

  // Calculate drafted position counts for the current user (participant index 0)
  const draftedCounts = useMemo(() => {
    const counts = { QB: 0, RB: 0, WR: 0, TE: 0 } as Record<'QB' | 'RB' | 'WR' | 'TE', number>;
    picks.forEach(pick => {
      if (pick.participantIndex === draftState.currentUserIndex && pick.player?.position) {
        const pos = pick.player.position as 'QB' | 'RB' | 'WR' | 'TE';
        if (counts[pos] !== undefined) {
          counts[pos]++;
        }
      }
    });
    return counts;
  }, [picks, draftState.currentUserIndex]);

  // ============================================================================
  // TIMER EFFECT
  // ============================================================================

  const prevTimerRef = useRef(draftState.timer);

  useEffect(() => {
    if (!draftState.isDraftActive || draftState.isPaused) return;

    // Normal speed: 7 seconds per pick
    // Fast speed: 1 second per pick
    const pickTime = mockDraftSpeed ? 1 : 7;

    const interval = setInterval(() => {
      setDraftState(prev => {
        const newTimer = prev.timer - 1;
        
        if (newTimer <= 0) {
          return { ...prev, timer: pickTime };
        }
        
        return { ...prev, timer: newTimer };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [draftState.isDraftActive, draftState.isPaused, mockDraftSpeed]);

  // Update isMyTurn when pick number changes
  useEffect(() => {
    setDraftState(prev => ({
      ...prev,
      isMyTurn: prev.myPickNumbers.includes(prev.currentPickNumber),
    }));
  }, [draftState.currentPickNumber]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleStartDraft = useCallback(() => {
    setDraftState(prev => ({
      ...prev,
      isDraftActive: true,
      timer: 7,
    }));
  }, []);

  const handleDraftPlayer = useCallback((player: Player) => {
    if (!isMyTurn || !draftState.isDraftActive) return;

    const participantIndex = getParticipantForPick(
      draftState.currentPickNumber,
      MOCK_PARTICIPANTS.length
    );

    // Create pick
    const newPick: Pick = {
      pickNumber: draftState.currentPickNumber,
      player,
      participantIndex,
      timestamp: Date.now(),
    };

    // Update state
    setPicks(prev => [...prev, newPick]);
    setAvailablePlayers(prev => prev.filter(p => p.name !== player.name));
    setQueuedPlayers(prev => prev.filter(p => p.name !== player.name));

    // Advance to next pick
    setDraftState(prev => ({
      ...prev,
      currentPickNumber: prev.currentPickNumber + 1,
      timer: 7,
    }));
  }, [isMyTurn, draftState.isDraftActive, draftState.currentPickNumber]);

  const handleQueuePlayer = useCallback((player: Player) => {
    setQueuedPlayers(prev => {
      const isQueued = prev.some(p => p.name === player.name);
      if (isQueued) {
        return prev.filter(p => p.name !== player.name);
      }
      return [...prev, player];
    });
  }, []);

  const handleReorderQueue = useCallback((newOrder: Player[]) => {
    setQueuedPlayers(newOrder);
  }, []);

  const handleRemoveFromQueue = useCallback((player: Player) => {
    setQueuedPlayers(prev => prev.filter(p => p.name !== player.name));
  }, []);

  const handleLeaveDraft = useCallback(() => {
    // Navigate back to mobile app (VX lobby)
    // Use window.location.replace for reliable navigation in production (Vercel)
    // This is more reliable than router.push in production environments
    const targetPath = '/testing-grounds/vx-mobile-app-demo';
    console.log('[DraftRoomVX] handleLeaveDraft called, navigating to:', targetPath);
    // Use setTimeout to ensure it happens after any React state updates
    setTimeout(() => {
      window.location.replace(targetPath);
    }, 100);
  }, []);

  // Lock to prevent concurrent picks
  const isPickingRef = useRef(false);

  // Force pick handler - picks best available player by ADP
  const handleForcePick = useCallback(() => {
    const TOTAL_PICKS = MOCK_PARTICIPANTS.length * 18; // 12 teams * 18 rounds = 216
    
    // Guard: Prevent concurrent picks (race condition protection)
    if (isPickingRef.current) return;
    
    // Guard: Don't pick if draft isn't active, no players, or draft is complete
    if (!draftState.isDraftActive || availablePlayers.length === 0) return;
    if (draftState.currentPickNumber > TOTAL_PICKS) {
      // Draft is complete
      setDraftState(prev => ({ ...prev, isDraftActive: false }));
      return;
    }

    // Lock to prevent race conditions
    isPickingRef.current = true;

    // Sort by ADP and pick the best available
    const sortedPlayers = [...availablePlayers].sort((a, b) => {
      const adpA = a.adp ?? 999;
      const adpB = b.adp ?? 999;
      return adpA - adpB;
    });

    const playerToPick = sortedPlayers[0];
    const participantIndex = getParticipantForPick(
      draftState.currentPickNumber,
      MOCK_PARTICIPANTS.length
    );

    // Create pick
    const newPick: Pick = {
      pickNumber: draftState.currentPickNumber,
      player: playerToPick,
      participantIndex,
      timestamp: Date.now(),
    };

    // Update state atomically - check for duplicate pickNumber
    setPicks(prev => {
      // Prevent duplicate pick numbers
      if (prev.some(p => p.pickNumber === newPick.pickNumber)) {
        console.warn(`Duplicate pick number ${newPick.pickNumber} blocked`);
        return prev;
      }
      return [...prev, newPick];
    });
    setAvailablePlayers(prev => prev.filter(p => p.name !== playerToPick.name));
    setQueuedPlayers(prev => prev.filter(p => p.name !== playerToPick.name));

    // Advance to next pick
    setDraftState(prev => {
      const nextPick = prev.currentPickNumber + 1;
      
      // Check if draft is complete
      if (nextPick > TOTAL_PICKS) {
        return { ...prev, isDraftActive: false, currentPickNumber: nextPick };
      }
      
      return {
        ...prev,
        currentPickNumber: nextPick,
        timer: mockDraftSpeed ? 1 : 7,
      };
    });

    // Unlock after state updates (use setTimeout to ensure state has settled)
    setTimeout(() => {
      isPickingRef.current = false;
    }, 50);
  }, [draftState.isDraftActive, draftState.currentPickNumber, availablePlayers, mockDraftSpeed]);

  // Watch for force pick trigger
  useEffect(() => {
    if (forcePickTrigger > 0) {
      handleForcePick();
    }
  }, [forcePickTrigger, handleForcePick]);

  // Auto-pick when timer resets (expired) - delegates to handleForcePick for consistency
  useEffect(() => {
    const prevTimer = prevTimerRef.current;
    const pickTime = mockDraftSpeed ? 1 : 7;
    prevTimerRef.current = draftState.timer;
    
    const TOTAL_PICKS = MOCK_PARTICIPANTS.length * 18; // 12 teams * 18 rounds = 216

    // Detect timer expiration: previous was 1 (or less), now reset to pickTime
    if (prevTimer <= 1 && draftState.timer === pickTime && draftState.isDraftActive && !draftState.isPaused && availablePlayers.length > 0 && draftState.currentPickNumber <= TOTAL_PICKS) {
      // Use the centralized pick handler (which has race condition protection)
      handleForcePick();
    }
  }, [draftState.timer, draftState.isDraftActive, draftState.isPaused, draftState.currentPickNumber, availablePlayers, mockDraftSpeed, handleForcePick]);

  // ============================================================================
  // RENDER
  // ============================================================================

  // Show loading state while data loads
  if (isDataLoading && availablePlayers.length === 0) {
    return (
      <div
        className="h-full flex flex-col items-center justify-center"
        style={{ backgroundColor: BG_COLORS.primary }}
      >
        <div className="text-white text-lg">Loading draft room...</div>
        <div className="text-gray-400 text-sm mt-2">
          {poolLoading ? 'Loading player pool...' : ''}
          {adpLoading ? 'Loading ADP data...' : ''}
        </div>
      </div>
    );
  }

  return (
    <div
      className="h-full flex flex-col relative"
      style={{ backgroundColor: BG_COLORS.primary }}
    >
      {/* Navbar */}
      <NavbarVX
        isMyTurn={isMyTurn}
        timer={draftState.timer}
        isDraftMode={true}
        isDraftStarted={draftState.isDraftActive}
        onLeaveDraft={handleLeaveDraft}
      />

      {/* Picks Bar - hidden on Board tab (matches original) */}
      {activeTab !== 'Board' && (
        <PicksBarVX
          picks={picks}
          currentPickNumber={draftState.currentPickNumber}
          participants={MOCK_PARTICIPANTS}
          rosterSize={18}
          timer={draftState.timer}
          isMyTurn={isMyTurn}
          currentUserIndex={draftState.currentUserIndex}
          isDraftActive={draftState.isDraftActive}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'Players' && (
          <PlayerListVX
            players={availablePlayers}
            onDraftPlayer={handleDraftPlayer}
            onQueuePlayer={handleQueuePlayer}
            scrollRef={playerScrollRef}
            isMyTurn={isMyTurn && draftState.isDraftActive}
            queuedPlayers={queuedPlayers}
            draftedCounts={draftedCounts}
          />
        )}

        {activeTab === 'Queue' && (
          <QueuePanelVX
            queuedPlayers={queuedPlayers}
            onReorder={handleReorderQueue}
            onRemove={handleRemoveFromQueue}
          />
        )}

        {activeTab === 'Rosters' && (
          <RosterPanelVX
            participants={MOCK_PARTICIPANTS}
            picks={picks}
            selectedParticipantIndex={selectedRosterIndex}
            onParticipantChange={setSelectedRosterIndex}
            isMyTurn={isMyTurn}
            currentPickNumber={draftState.currentPickNumber}
          />
        )}

        {activeTab === 'Board' && (
          <DraftBoardVX
            picks={picks}
            participants={MOCK_PARTICIPANTS}
            currentPickNumber={draftState.currentPickNumber}
            isDraftActive={draftState.isDraftActive}
            timer={draftState.timer}
          />
        )}

        {activeTab === 'Info' && (
          <DraftInfoVX />
        )}
      </div>

      {/* Footer Navigation */}
      <FooterVX
        activeTab={activeTab}
        onTabChange={setActiveTab}
        queueCount={queuedPlayers.length}
      />
    </div>
  );
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/** Get participant for a pick number (snake draft) */
function getParticipantForPick(pickNumber: number, participantCount: number): number {
  const roundNumber = Math.ceil(pickNumber / participantCount);
  const positionInRound = ((pickNumber - 1) % participantCount);
  const isOddRound = roundNumber % 2 === 1;
  
  return isOddRound ? positionInRound : (participantCount - 1 - positionInRound);
}

// ============================================================================
// DEMO WRAPPER (for testing page)
// ============================================================================

export function DraftRoomVXDemo() {
  return (
    <div
      className="mx-auto bg-black rounded-3xl overflow-hidden shadow-2xl"
      style={{
        width: '375px',
        height: '812px',
      }}
    >
      <DraftRoomVX />
    </div>
  );
}
