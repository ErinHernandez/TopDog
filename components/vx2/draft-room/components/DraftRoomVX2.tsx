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

import dynamic from 'next/dynamic';
import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';

import { cn } from '@/lib/styles';

import { createScopedLogger } from '../../../../lib/clientLogger';
import {
  DRAFT_LAYOUT,
  DRAFT_DEFAULTS,
  TUTORIAL_DISABLED_KEY,
  TUTORIAL_SHOWN_PREFIX,
  DRAFT_ALERTS_PROMPT_SEEN_KEY,
} from '../constants';

// Create scoped logger for this component
const logger = createScopedLogger('[DraftRoomVX2]');

// Hooks
import { useDraftRoom } from '../hooks/useDraftRoom';
import type { DraftTab } from '../types';
import { getParticipantForPick } from '../utils';

// Components - Eager imports for always-visible components
import DraftFooter from './DraftFooter';
import styles from './DraftRoomVX2.module.css';
import DraftStatusBar, { HEADER_HEIGHT } from './DraftStatusBar';

// Components - Direct import for LeaveConfirmModal to avoid hook count mismatch with dynamic import
import LeaveConfirmModal from './LeaveConfirmModal';

// Components - Dynamic imports for modals (conditionally rendered, not visible on initial load)
const NavigateAwayAlertsPromptModal = dynamic(
  () => import('./NavigateAwayAlertsPromptModal'),
  { ssr: false }
);
const DraftInfoModal = dynamic(
  () => import('./DraftInfoModal'),
  { ssr: false }
);
const DraftTutorialModal = dynamic(
  () => import('./DraftTutorialModal'),
  { ssr: false }
);
const ShareOptionsModal = dynamic(
  () => import('./ShareOptionsModal'),
  { ssr: false }
);

// Components - Dynamic imports for tab content (rendered based on activeTab)
const PicksBar = dynamic(
  () => import('./PicksBar'),
  { ssr: false }
);
const PlayerList = dynamic(
  () => import('./PlayerList'),
  { ssr: false }
);
const QueueView = dynamic(
  () => import('./QueueView'),
  { ssr: false }
);
const RosterView = dynamic(
  () => import('./RosterView'),
  { ssr: false }
);
const DraftBoard = dynamic(
  () => import('./DraftBoard'),
  { ssr: false }
);
const DraftInfo = dynamic(
  () => import('./DraftInfo'),
  { ssr: false }
);

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
    <div className={styles.loadingContainer}>
      <div className={styles.spinner} />
      <p className={styles.loadingText}>
        Joining draft room...
      </p>
    </div>
  );
}

interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

function ErrorState({ message, onRetry }: ErrorStateProps): React.ReactElement {
  return (
    <div className={styles.errorContainer}>
      <div className={styles.errorIcon}>
        <span className={styles.errorIconText}>!</span>
      </div>

      <h2 className={styles.errorTitle}>
        Unable to Join Draft
      </h2>

      <p className={styles.errorMessage}>
        {message}
      </p>

      <button
        onClick={onRetry}
        className={styles.errorButton}
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
        <div className={styles.tabContent}>
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

  // SECURITY FIX: Store latest userId in ref to prevent stale closure in withdraw handler
  const userIdRef = useRef(userId);
  useEffect(() => {
    userIdRef.current = userId;
  }, [userId]);
  
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
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional setState in effect
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
    logger.debug('Withdraw confirmed, cleaning up', { hasOnLeave: !!onLeaveRef.current, roomId, userId: userIdRef.current });

    // Withdrawal-specific logic (runs before draft starts)
    // 1. Remove user from participants list via API
    // 2. Process entry fee refund if applicable
    try {
      if (userIdRef.current && roomId) {
        logger.info('Processing withdrawal request', { userId: userIdRef.current, roomId });

        const response = await fetch(`/api/drafts/${roomId}/withdraw`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: userIdRef.current }),
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
    <div className={styles.container}>
      {/* Header - Fixed 54px */}
      <div className={styles.header}>
        <DraftStatusBar
          timerSeconds={draftRoom.timer.seconds}
          isUserTurn={draftRoom.isMyTurn && draftRoom.status === 'active'}
          onGracePeriodEnd={handleGracePeriodEnd}
          onLeave={handleLeaveClick}
          hideTimer={false}
          preDraftCountdown={draftRoom.preDraftCountdown}
          draftStatus={draftRoom.status}
        />
      </div>

      {/* Content Area - Flexible */}
      <div className={styles.contentArea}>
        {/* Picks Bar - 200px when visible (not on board tab) */}
        {draftRoom.activeTab !== 'board' && (
          <div className={styles.picksBarContainer}>
            <PicksBar
              picks={draftRoom.picks.picks}
              currentPickNumber={draftRoom.currentPickNumber}
              participants={draftRoom.participants}
              userParticipantIndex={draftRoom.userParticipantIndex}
              timer={draftRoom.timer.seconds}
              status={draftRoom.status}
              onBlankClick={(pickNumber) => {
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
        <main className={styles.mainContent}>
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
      <div className={styles.footer}>
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

