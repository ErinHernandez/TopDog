/**
 * DraftRoomVX2 - Main draft room orchestrator
 * 
 * Enterprise-grade mobile draft room component.
 * Orchestrates all sub-components and hooks.
 * 
 * A-Grade Requirements:
 * - TypeScript: Full type coverage
 * - Constants: VX2 constants for colors/sizes
 * - Accessibility: Full keyboard and screen reader support
 * - Loading/Error/Empty states: Proper handling
 */

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import type { DraftTab } from '../types';
import { DRAFT_LAYOUT, DRAFT_DEFAULTS } from '../constants';
import { BG_COLORS, TEXT_COLORS } from '../../core/constants/colors';
import { SPACING, TYPOGRAPHY, RADIUS } from '../../core/constants/sizes';
import { createScopedLogger } from '../../../../lib/clientLogger';

// Create scoped logger for this component
const logger = createScopedLogger('[DraftRoomVX2]');

// ============================================================================
// TUTORIAL STORAGE KEYS
// ============================================================================

const TUTORIAL_DISABLED_KEY = 'topdog_tutorial_disabled';
const TUTORIAL_SHOWN_PREFIX = 'topdog_tutorial_shown_';

// Hooks
import { useDraftRoom } from '../hooks/useDraftRoom';
import { getParticipantForPick } from '../utils';

// Components
import DraftStatusBar, { HEADER_HEIGHT } from './DraftStatusBar';
import PicksBar from './PicksBar';
import PlayerList from './PlayerList';
import QueueView from './QueueView';
import RosterView from './RosterView';
import DraftBoard from './DraftBoard';
import DraftInfo from './DraftInfo';
import DraftFooter from './DraftFooter';
import LeaveConfirmModal from './LeaveConfirmModal';
import NavigateAwayAlertsPromptModal, { DRAFT_ALERTS_PROMPT_SEEN_KEY } from './NavigateAwayAlertsPromptModal';
import DraftInfoModal from './DraftInfoModal';
import DraftTutorialModal from './DraftTutorialModal';

// ============================================================================
// CONSTANTS
// ============================================================================

const LAYOUT_PX = {
  navbarHeight: DRAFT_LAYOUT.navbarHeight,
  picksBarHeight: DRAFT_LAYOUT.picksBarHeight,
  footerHeight: DRAFT_LAYOUT.footerHeight,
} as const;

// Content area height calculation
const CONTENT_TOP = LAYOUT_PX.navbarHeight + LAYOUT_PX.picksBarHeight;
const CONTENT_BOTTOM = LAYOUT_PX.footerHeight;

// ============================================================================
// TYPES
// ============================================================================

export interface DraftRoomVX2Props {
  /** Draft room ID */
  roomId: string;
  /** User ID (optional) */
  userId?: string;
  /** Callback when leaving draft */
  onLeave?: () => void;
  /** Enable fast timer mode (3 seconds per pick) */
  fastMode?: boolean;
  /** Initial pick number to start at (default: 1) */
  initialPickNumber?: number;
  /** Team count (default: 12) */
  teamCount?: number;
  /** Callback to expose dev tools to parent */
  onDevToolsReady?: (devTools: {
    startDraft: () => void;
    togglePause: () => void;
    forcePick: () => void;
    isPaused: boolean;
    status: string;
  }) => void;
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface LoadingStateProps {}

function LoadingState({}: LoadingStateProps): React.ReactElement {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: BG_COLORS.primary,
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 24,
          border: `3px solid ${BG_COLORS.elevated}`,
          borderTopColor: '#3B82F6',
          animation: 'spin 1s linear infinite',
        }}
      />
      <p
        style={{
          marginTop: SPACING.lg,
          fontSize: TYPOGRAPHY.fontSize.sm,
          color: TEXT_COLORS.secondary,
        }}
      >
        Joining draft room...
      </p>
      
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

function ErrorState({ message, onRetry }: ErrorStateProps): React.ReactElement {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: BG_COLORS.primary,
        padding: SPACING.xl,
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: 32,
          backgroundColor: '#EF444420',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: SPACING.lg,
        }}
      >
        <span style={{ fontSize: 28, color: '#EF4444' }}>!</span>
      </div>
      
      <h2
        style={{
          fontSize: TYPOGRAPHY.fontSize.lg,
          fontWeight: TYPOGRAPHY.fontWeight.semibold,
          color: TEXT_COLORS.primary,
          marginBottom: SPACING.sm,
        }}
      >
        Unable to Join Draft
      </h2>
      
      <p
        style={{
          fontSize: TYPOGRAPHY.fontSize.sm,
          color: TEXT_COLORS.secondary,
          marginBottom: SPACING.lg,
        }}
      >
        {message}
      </p>
      
      <button
        onClick={onRetry}
        style={{
          padding: `${SPACING.sm}px ${SPACING.lg}px`,
          backgroundColor: '#3B82F6',
          color: '#FFFFFF',
          fontSize: TYPOGRAPHY.fontSize.sm,
          fontWeight: TYPOGRAPHY.fontWeight.medium,
          border: 'none',
          borderRadius: 8,
          cursor: 'pointer',
        }}
      >
        Try Again
      </button>
    </div>
  );
}

interface TabContentProps {
  activeTab: DraftTab;
  draftRoom: ReturnType<typeof useDraftRoom>;
  onTutorial?: () => void;
  onLeave?: () => void;
  onLeaveFromLink?: () => void;
  draftSettings: {
    teamCount: number;
    rosterSize: number;
    pickTimeSeconds: number;
  };
  selectedRosterParticipantIndex?: number;
  onRosterParticipantSelect?: (index: number) => void;
}

function TabContent({ activeTab, draftRoom, onTutorial, onLeave, onLeaveFromLink, draftSettings, selectedRosterParticipantIndex, onRosterParticipantSelect }: TabContentProps): React.ReactElement {
  switch (activeTab) {
    case 'players':
      return (
        <div style={{ height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column', position: 'relative' }}>
          <PlayerList
            players={draftRoom.availablePlayers.filteredPlayers}
            totalCount={draftRoom.availablePlayers.totalCount}
            isLoading={draftRoom.availablePlayers.isLoading}
            isMyTurn={draftRoom.isMyTurn}
            draftedCounts={draftRoom.picks.userPositionCounts}
            positionFilters={draftRoom.availablePlayers.positionFilters}
            onToggleFilter={draftRoom.availablePlayers.togglePositionFilter}
            searchQuery={draftRoom.availablePlayers.searchQuery}
            onSearchChange={draftRoom.availablePlayers.setSearchQuery}
            onClearAll={draftRoom.availablePlayers.clearAll}
            sortOption={draftRoom.availablePlayers.sortOption}
            onSortChange={draftRoom.availablePlayers.setSortOption}
            onDraft={draftRoom.draftPlayer}
            onToggleQueue={draftRoom.queue.toggleQueue}
            isQueued={draftRoom.queue.isQueued}
            initialScrollPosition={draftRoom.getScrollPosition('players')}
            onScrollPositionChange={(pos) => draftRoom.saveScrollPosition('players', pos)}
          />
        </div>
      );
    
    case 'queue':
      return (
        <QueueView
          queue={draftRoom.queue.queue}
          onRemove={draftRoom.queue.removeFromQueue}
          onReorder={draftRoom.queue.reorderQueue}
          onClear={draftRoom.queue.clearQueue}
          onAddPlayers={() => draftRoom.setActiveTab('players')}
          initialScrollPosition={draftRoom.getScrollPosition('queue')}
          onScrollPositionChange={(pos) => draftRoom.saveScrollPosition('queue', pos)}
        />
      );
    
    case 'rosters':
      return (
        <RosterView
          picks={draftRoom.picks.picks}
          participants={draftRoom.participants}
          userParticipantIndex={draftRoom.userParticipantIndex}
          getPicksForParticipant={(idx) => draftRoom.picks.picksByParticipant(idx)}
          initialScrollPosition={draftRoom.getScrollPosition('rosters')}
          onScrollPositionChange={(pos) => draftRoom.saveScrollPosition('rosters', pos)}
          selectedParticipantIndex={selectedRosterParticipantIndex}
          onParticipantSelect={onRosterParticipantSelect}
        />
      );
    
    case 'board':
      return (
        <DraftBoard
          picks={draftRoom.picks.picks}
          currentPickNumber={draftRoom.currentPickNumber}
          participants={draftRoom.participants}
          userParticipantIndex={draftRoom.userParticipantIndex}
          getPickForSlot={draftRoom.picks.getPickForSlot}
          initialScrollPosition={draftRoom.getScrollPosition('board')}
          onScrollPositionChange={(pos) => draftRoom.saveScrollPosition('board', pos)}
        />
      );
    
    case 'info':
      return (
        <DraftInfo 
          settings={draftSettings}
          initialScrollPosition={draftRoom.getScrollPosition('info')}
          onScrollPositionChange={(pos) => draftRoom.saveScrollPosition('info', pos)}
          onTutorial={onTutorial}
          onLeave={onLeaveFromLink || onLeave}
        />
      );
    
    default:
      return <div>Unknown tab</div>;
  }
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function DraftRoomVX2({
  roomId,
  userId,
  onLeave,
  fastMode = false,
  initialPickNumber = 1,
  teamCount = 12,
  onDevToolsReady,
}: DraftRoomVX2Props): React.ReactElement {
  // Initialize draft room hook
  const draftRoom = useDraftRoom({
    roomId,
    userId,
    fastMode,
    initialPickNumber,
    teamCount,
  });
  
  // Expose dev tools to parent - use ref to track previous values and prevent infinite loops
  const prevDevToolsRef = useRef<{ status: string; isPaused: boolean } | null>(null);

  // SECURITY FIX: Store latest onLeave callback in ref to prevent stale closure issues
  // when setTimeout captures an outdated reference to the callback
  const onLeaveRef = useRef(onLeave);
  useEffect(() => {
    onLeaveRef.current = onLeave;
  }, [onLeave]);
  
  React.useEffect(() => {
    if (!onDevToolsReady || draftRoom.isLoading) return;
    
    const current = {
      status: draftRoom.status,
      isPaused: draftRoom.devTools.isPaused,
    };
    
    // Only call callback if status or isPaused actually changed
    const prev = prevDevToolsRef.current;
    if (!prev || prev.status !== current.status || prev.isPaused !== current.isPaused) {
      prevDevToolsRef.current = current;
      onDevToolsReady({
        ...draftRoom.devTools,
        status: draftRoom.status,
      });
    }
  }, [onDevToolsReady, draftRoom.devTools, draftRoom.status, draftRoom.isLoading]);
  
  // Leave confirmation modal state
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showAlertsPrompt, setShowAlertsPrompt] = useState(false);
  const [showTopBarHint, setShowTopBarHint] = useState(false);
  
  // Info and tutorial modal state
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showTutorialModal, setShowTutorialModal] = useState(false);
  
  // Selected participant index in rosters tab (for external control from PicksBar)
  const [selectedRosterParticipantIndex, setSelectedRosterParticipantIndex] = useState<number | undefined>(undefined);
  
  // Reset selected participant index when switching away from rosters tab
  useEffect(() => {
    if (draftRoom.activeTab !== 'rosters') {
      setSelectedRosterParticipantIndex(undefined);
    }
  }, [draftRoom.activeTab]);
  
  // Track if we've already auto-shown tutorial for this draft session
  const hasAutoShownTutorial = useRef(false);
  
  // Compute draft settings once - used by both DraftInfo tab and DraftInfoModal
  // This ensures they always show the same values
  const draftSettings = useMemo(() => {
    return {
      teamCount: draftRoom.room?.settings?.teamCount ?? DRAFT_DEFAULTS.teamCount,
      rosterSize: draftRoom.room?.settings?.rosterSize ?? DRAFT_DEFAULTS.rosterSize,
      pickTimeSeconds: draftRoom.room?.settings?.pickTimeSeconds ?? DRAFT_DEFAULTS.pickTimeSeconds,
    };
  }, [draftRoom.room?.settings?.teamCount, draftRoom.room?.settings?.rosterSize, draftRoom.room?.settings?.pickTimeSeconds]);
  
  // Auto-show tutorial when draft becomes active (first time only per draft)
  useEffect(() => {
    // Only proceed if draft just became active and we haven't shown tutorial yet
    if (draftRoom.status !== 'active' || hasAutoShownTutorial.current) return;
    
    // Check if user has disabled tutorials
    const tutorialDisabled = localStorage.getItem(TUTORIAL_DISABLED_KEY) === 'true';
    if (tutorialDisabled) return;
    
    // Check if tutorial was already shown for this specific draft room
    const tutorialShownKey = `${TUTORIAL_SHOWN_PREFIX}${roomId}`;
    const alreadyShownForRoom = localStorage.getItem(tutorialShownKey) === 'true';
    if (alreadyShownForRoom) return;
    
    // Mark that we've shown the tutorial for this draft room
    localStorage.setItem(tutorialShownKey, 'true');
    hasAutoShownTutorial.current = true;
    
    // Show the tutorial with a small delay to let the UI settle
    const timer = setTimeout(() => {
      setShowTutorialModal(true);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [draftRoom.status, roomId]);
  
  // Handle "don't show again" checkbox
  const handleDontShowAgainChange = useCallback((checked: boolean) => {
    localStorage.setItem(TUTORIAL_DISABLED_KEY, checked ? 'true' : 'false');
  }, []);
  
  // Show leave confirmation modal (from top bar). On first leave from any draft room, show alerts prompt first.
  const handleLeaveClick = useCallback(() => {
    logger.debug('Leave button clicked - opening modal');
    setShowTopBarHint(false);
    const seen = typeof window !== 'undefined' && window.localStorage.getItem(DRAFT_ALERTS_PROMPT_SEEN_KEY) === 'true';
    if (seen) {
      setShowLeaveModal(true);
    } else {
      setShowAlertsPrompt(true);
    }
  }, []);

  // Show leave confirmation modal (from Exit Draft link)
  const handleLeaveFromLink = useCallback(() => {
    logger.debug('Leave from Exit Draft link - opening modal with hint');
    setShowTopBarHint(true);
    const seen = typeof window !== 'undefined' && window.localStorage.getItem(DRAFT_ALERTS_PROMPT_SEEN_KEY) === 'true';
    if (seen) {
      setShowLeaveModal(true);
    } else {
      setShowAlertsPrompt(true);
    }
  }, []);

  // After alerts prompt (Enable or No thanks) -> show leave confirm
  const handleAlertsPromptContinue = useCallback(() => {
    setShowAlertsPrompt(false);
    setShowLeaveModal(true);
  }, []);
  
  // Track if component is mounted to prevent state updates after unmount
  const isMountedRef = useRef(true);
  const leaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      // Clear any pending leave timeout on unmount
      if (leaveTimeoutRef.current) {
        clearTimeout(leaveTimeoutRef.current);
        leaveTimeoutRef.current = null;
      }
    };
  }, []);

  // Confirm leaving (during active draft)
  const handleLeaveConfirm = useCallback(() => {
    logger.debug('Leave confirmed, cleaning up', { hasOnLeave: !!onLeaveRef.current });
    // Call leave draft cleanup
    draftRoom.leaveDraft();
    // Close modal first
    setShowLeaveModal(false);
    // Trigger navigation - use setTimeout to ensure it happens after state update
    // SECURITY FIX: Use ref to get latest onLeave callback, avoiding stale closure
    if (onLeaveRef.current) {
      logger.debug('Scheduling onLeave callback');
      // Clear any existing timeout
      if (leaveTimeoutRef.current) {
        clearTimeout(leaveTimeoutRef.current);
      }
      // Use setTimeout to ensure navigation happens after modal closes
      leaveTimeoutRef.current = setTimeout(() => {
        // Only call onLeave if component is still mounted
        if (isMountedRef.current && onLeaveRef.current) {
          try {
            logger.debug('Calling onLeave callback');
            onLeaveRef.current();
          } catch (error) {
            logger.error('Error in onLeave callback', error as Error);
          }
        }
        leaveTimeoutRef.current = null;
      }, 0);
    } else {
      logger.warn('onLeave callback not provided');
    }
  }, [draftRoom]);

  // Handle withdrawal (before draft starts)
  const handleWithdraw = useCallback(async () => {
    logger.debug('Withdraw confirmed, cleaning up', { hasOnLeave: !!onLeaveRef.current, roomId, userId });

    // Withdrawal-specific logic (runs before draft starts)
    // 1. Remove user from participants list via API
    // 2. Process entry fee refund if applicable
    try {
      if (userId && roomId) {
        logger.info('Processing withdrawal request', { userId, roomId });

        const response = await fetch(`/api/drafts/${roomId}/withdraw`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          logger.warn('Withdrawal API returned non-OK status', {
            status: response.status,
            error: errorData
          });
          // Continue with cleanup even if API fails - user still leaves UI
        } else {
          const result = await response.json();
          logger.info('Withdrawal processed successfully', {
            refundAmount: result.refundAmount,
            refundStatus: result.refundStatus,
            removedFromParticipants: result.removedFromParticipants
          });
        }
      }
    } catch (error) {
      // Log but don't block - user should still be able to leave
      logger.error('Error processing withdrawal', error instanceof Error ? error : new Error(String(error)));
    }

    // Call leave draft cleanup
    draftRoom.leaveDraft();

    // Close modal first
    setShowLeaveModal(false);
    // Trigger navigation - use setTimeout to ensure it happens after state update
    // SECURITY FIX: Use ref to get latest onLeave callback, avoiding stale closure
    if (onLeaveRef.current) {
      logger.debug('Scheduling onLeave callback after withdrawal');
      // Clear any existing timeout
      if (leaveTimeoutRef.current) {
        clearTimeout(leaveTimeoutRef.current);
      }
      // Use setTimeout to ensure navigation happens after modal closes
      leaveTimeoutRef.current = setTimeout(() => {
        // Only call onLeave if component is still mounted
        if (isMountedRef.current && onLeaveRef.current) {
          try {
            logger.debug('Calling onLeave callback after withdrawal');
            onLeaveRef.current();
          } catch (error) {
            logger.error('Error in onLeave callback after withdrawal', error as Error);
          }
        }
        leaveTimeoutRef.current = null;
      }, 0);
    } else {
      logger.warn('onLeave callback not provided for withdrawal');
    }
  }, [draftRoom, roomId, userId]);
  
  // Cancel leaving
  const handleLeaveCancel = useCallback(() => {
    setShowLeaveModal(false);
    setShowTopBarHint(false);
  }, []);
  
  // Info button handler
  const handleInfoClick = useCallback(() => {
    setShowInfoModal(true);
  }, []);
  
  // Grace period end handler - triggers auto-pick for user after navbar shake
  const handleGracePeriodEnd = useCallback(() => {
    draftRoom.autoPickForUser();
  }, [draftRoom]);
  
  // Tutorial handler (called from info modal)
  const handleTutorialClick = useCallback(() => {
    setShowInfoModal(false);
    setShowTutorialModal(true);
  }, []);
  
  // Loading state
  if (draftRoom.isLoading) {
    return <LoadingState />;
  }
  
  // Error state
  if (draftRoom.error) {
    return (
      <ErrorState 
        message={draftRoom.error || 'An error occurred'} 
        onRetry={() => window.location.reload()} 
      />
    );
  }
  
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        backgroundColor: BG_COLORS.primary,
        overflow: 'hidden',
      }}
    >
      {/* Header - Fixed 54px */}
      <div style={{ flexShrink: 0, height: HEADER_HEIGHT, zIndex: 50 }}>
        <DraftStatusBar
          timerSeconds={draftRoom.timer.seconds}
          isUserTurn={draftRoom.isMyTurn && draftRoom.status === 'active'}
          onGracePeriodEnd={handleGracePeriodEnd}
          onLeave={handleLeaveClick}
          hideTimer={false} // Always show timer in status bar
          preDraftCountdown={draftRoom.preDraftCountdown}
          draftStatus={draftRoom.status}
        />
      </div>

      {/* Content Area - Flexible */}
      <div
        style={{
          flex: 1,
          minHeight: 0,  // CRITICAL: Allow shrinking
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Picks Bar - 200px when visible (not on board tab) */}
        {draftRoom.activeTab !== 'board' && (
          <div style={{ flexShrink: 0, height: LAYOUT_PX.picksBarHeight, marginBottom: 0, paddingBottom: 0 }}>
            <PicksBar
              picks={draftRoom.picks.picks}
              currentPickNumber={draftRoom.currentPickNumber}
              participants={draftRoom.participants}
              userParticipantIndex={draftRoom.userParticipantIndex}
              timer={draftRoom.timer.seconds}
              status={draftRoom.status}
              onBlankClick={(pickNumber) => {
                // When in rosters tab, clicking a blank card should navigate to that user
                if (draftRoom.activeTab === 'rosters') {
                  const teamCount = draftRoom.participants.length;
                  const participantIndex = getParticipantForPick(pickNumber, teamCount);
                  setSelectedRosterParticipantIndex(participantIndex);
                }
              }}
            />
          </div>
        )}

        {/* Main Content - Fill available space, let child components handle scrolling */}
        <main
          style={{
            flex: 1,
            minHeight: 0,  // CRITICAL: Allow shrinking
            overflow: 'hidden',  // Changed from 'auto' - let child components handle scrolling
            display: 'flex',
            flexDirection: 'column',
            paddingTop: 0,
          }}
        >
          <TabContent 
            activeTab={draftRoom.activeTab} 
            draftRoom={draftRoom} 
            onTutorial={() => setShowTutorialModal(true)}
            onLeave={handleLeaveClick}
            onLeaveFromLink={handleLeaveFromLink}
            draftSettings={draftSettings}
            selectedRosterParticipantIndex={selectedRosterParticipantIndex}
            onRosterParticipantSelect={setSelectedRosterParticipantIndex}
          />
        </main>
      </div>

      {/* Footer - Fixed 56px */}
      <div style={{ flexShrink: 0, height: LAYOUT_PX.footerHeight, zIndex: 50 }}>
        <DraftFooter
          activeTab={draftRoom.activeTab}
          onTabChange={draftRoom.setActiveTab}
          queueCount={draftRoom.queue.queueCount}
        />
      </div>
      
      {/* First-time leave: ask about alerts when navigating away (in-app vs outside app) */}
      <NavigateAwayAlertsPromptModal
        isOpen={showAlertsPrompt}
        onContinue={handleAlertsPromptContinue}
      />

      {/* Leave Confirmation Modal */}
      <LeaveConfirmModal
        isOpen={showLeaveModal}
        draftStatus={draftRoom.status}
        onConfirm={handleLeaveConfirm}
        onWithdraw={handleWithdraw}
        onCancel={handleLeaveCancel}
        showTopBarHint={showTopBarHint}
      />
      
      {/* Info Modal */}
      <DraftInfoModal
        isOpen={showInfoModal}
        onClose={() => setShowInfoModal(false)}
        onTutorial={handleTutorialClick}
        draftInfo={{
          format: 'Snake',
          teams: draftSettings.teamCount,
          rounds: draftSettings.rosterSize,
          pickTime: draftSettings.pickTimeSeconds,
          scoring: 'Best Ball',
        }}
      />
      
      {/* Tutorial Modal */}
      <DraftTutorialModal
        isOpen={showTutorialModal}
        onClose={() => setShowTutorialModal(false)}
        onRules={() => logger.debug('Rules clicked')}
        format="Snake"
        showDontShowAgain={true}
        onDontShowAgainChange={handleDontShowAgainChange}
      />
    </div>
  );
}

