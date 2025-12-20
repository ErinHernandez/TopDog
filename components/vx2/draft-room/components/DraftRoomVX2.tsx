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

import React, { useState, useCallback, useEffect, useRef } from 'react';
import type { DraftTab } from '../types';
import { DRAFT_LAYOUT } from '../constants';
import { BG_COLORS, TEXT_COLORS } from '../../core/constants/colors';
import { SPACING, TYPOGRAPHY, RADIUS } from '../../core/constants/sizes';

// ============================================================================
// TUTORIAL STORAGE KEYS
// ============================================================================

const TUTORIAL_DISABLED_KEY = 'topdog_tutorial_disabled';
const TUTORIAL_SHOWN_PREFIX = 'topdog_tutorial_shown_';

// Hooks
import { useDraftRoom } from '../hooks/useDraftRoom';
import { useHeadshots } from '@/lib/swr/usePlayerSWR';

// Components
import DraftNavbar from './DraftNavbar';
import DraftStatusBar from './DraftStatusBar';
import PicksBar from './PicksBar';
import PlayerList from './PlayerList';
import QueueView from './QueueView';
import RosterView from './RosterView';
import DraftBoard from './DraftBoard';
import DraftInfo from './DraftInfo';
import DraftFooter from './DraftFooter';
import LeaveConfirmModal from './LeaveConfirmModal';
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
  /** Use absolute positioning (for phone frame container) */
  useAbsolutePosition?: boolean;
  /** Enable fast timer mode (3 seconds per pick) */
  fastMode?: boolean;
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
  headshotsMap?: Record<string, string>;
}

function TabContent({ activeTab, draftRoom, onTutorial, headshotsMap }: TabContentProps): React.ReactElement {
  switch (activeTab) {
    case 'players':
      return (
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
          headshotsMap={headshotsMap}
        />
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
          settings={draftRoom.room?.settings}
          initialScrollPosition={draftRoom.getScrollPosition('info')}
          onScrollPositionChange={(pos) => draftRoom.saveScrollPosition('info', pos)}
          onTutorial={onTutorial}
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
  useAbsolutePosition = false,
  fastMode = false,
  onDevToolsReady,
}: DraftRoomVX2Props): React.ReactElement {
  // Initialize draft room hook
  const draftRoom = useDraftRoom({
    roomId,
    userId,
    fastMode,
  });
  
  // Fetch player headshots from SportsDataIO
  const { headshotsMap } = useHeadshots();
  
  // Expose dev tools to parent - always keep ref updated
  React.useEffect(() => {
    if (onDevToolsReady && !draftRoom.isLoading) {
      onDevToolsReady({
        ...draftRoom.devTools,
        status: draftRoom.status,
      });
    }
  }, [onDevToolsReady, draftRoom.devTools, draftRoom.status, draftRoom.isLoading]);
  
  // Leave confirmation modal state
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  
  // Info and tutorial modal state
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showTutorialModal, setShowTutorialModal] = useState(false);
  
  // Track if we've already auto-shown tutorial for this draft session
  const hasAutoShownTutorial = useRef(false);
  
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
    setTimeout(() => {
      setShowTutorialModal(true);
    }, 300);
  }, [draftRoom.status, roomId]);
  
  // Handle "don't show again" checkbox
  const handleDontShowAgainChange = useCallback((checked: boolean) => {
    localStorage.setItem(TUTORIAL_DISABLED_KEY, checked ? 'true' : 'false');
  }, []);
  
  // Show leave confirmation modal
  const handleLeaveClick = useCallback(() => {
    setShowLeaveModal(true);
  }, []);
  
  // Confirm leaving
  const handleLeaveConfirm = useCallback(() => {
    console.log('[DraftRoomVX2] Leave confirmed, cleaning up...');
    // Call leave draft cleanup
    draftRoom.leaveDraft();
    // Close modal
    setShowLeaveModal(false);
    // Trigger navigation immediately
    if (onLeave) {
      console.log('[DraftRoomVX2] Calling onLeave callback...');
      try {
        onLeave();
      } catch (error) {
        console.error('[DraftRoomVX2] Error in onLeave callback:', error);
      }
    } else {
      console.warn('[DraftRoomVX2] onLeave callback not provided!');
    }
  }, [draftRoom, onLeave]);
  
  // Cancel leaving
  const handleLeaveCancel = useCallback(() => {
    setShowLeaveModal(false);
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
  
  const positionStyle = useAbsolutePosition ? 'absolute' : 'fixed';
  
  return (
    <div
      style={{
        position: positionStyle,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: BG_COLORS.primary,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Combined Status Bar + Navbar Header (54px total: 28px + 26px) */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '54px', // Status bar (28px) + navbar (26px)
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Status Bar - matches navbar background for unified appearance */}
        <DraftStatusBar
          timerSeconds={draftRoom.timer.seconds}
          isUserTurn={draftRoom.isMyTurn && draftRoom.status === 'active'}
        />
        
        {/* Navbar - timer hidden, rendered externally below */}
        <DraftNavbar
          onLeave={handleLeaveClick}
          useAbsolutePosition={false}
          timerSeconds={draftRoom.timer.seconds}
          isUserTurn={draftRoom.isMyTurn && draftRoom.status === 'active'}
          onGracePeriodEnd={handleGracePeriodEnd}
          onInfo={handleInfoClick}
          hideTimer={true}
        />
        
        {/* Centered Timer - spans both status bar and navbar, above all elements */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '54px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none', // Allow clicks through to buttons
            zIndex: 100, // Above status bar and navbar
          }}
        >
          <div
            style={{
              fontSize: '32px',
              fontWeight: 700,
              fontVariantNumeric: 'tabular-nums',
              color: '#FFFFFF',
              textShadow: '0 2px 4px rgba(0,0,0,0.4)',
            }}
            aria-label={`${draftRoom.timer.seconds} seconds remaining`}
          >
            {draftRoom.timer.seconds}
          </div>
        </div>
      </div>
      
      {/* Content wrapper - accounts for combined header (54px) + safe area */}
      <div
        style={{
          position: 'absolute',
          // Account for combined header (54px) + safe area inset
          top: `calc(54px + env(safe-area-inset-top, 0px))`,
          left: 0,
          right: 0,
          bottom: LAYOUT_PX.footerHeight,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Picks Bar - hidden on Board tab (matches VX) */}
        {draftRoom.activeTab !== 'board' && (
          <div style={{ flexShrink: 0 }}>
            <PicksBar
              picks={draftRoom.picks.picks}
              currentPickNumber={draftRoom.currentPickNumber}
              participants={draftRoom.participants}
              userParticipantIndex={draftRoom.userParticipantIndex}
              timer={draftRoom.timer.seconds}
              status={draftRoom.status}
            />
          </div>
        )}
        
        {/* Main Content Area */}
        <main
          style={{
            flex: 1,
            overflow: 'hidden',
          }}
        >
          <TabContent activeTab={draftRoom.activeTab} draftRoom={draftRoom} onTutorial={() => setShowTutorialModal(true)} headshotsMap={headshotsMap} />
        </main>
      </div>
      
      {/* Footer */}
      <DraftFooter
        activeTab={draftRoom.activeTab}
        onTabChange={draftRoom.setActiveTab}
        queueCount={draftRoom.queue.queueCount}
        useAbsolutePosition={useAbsolutePosition}
      />
      
      {/* Leave Confirmation Modal */}
      <LeaveConfirmModal
        isOpen={showLeaveModal}
        onConfirm={handleLeaveConfirm}
        onCancel={handleLeaveCancel}
      />
      
      {/* Info Modal */}
      <DraftInfoModal
        isOpen={showInfoModal}
        onClose={() => setShowInfoModal(false)}
        onTutorial={handleTutorialClick}
        draftInfo={{
          format: 'Snake',
          teams: draftRoom.room?.settings.teamCount ?? 12,
          rounds: draftRoom.room?.settings.rosterSize ?? 18,
          pickTime: draftRoom.room?.settings.pickTimeSeconds ?? 30,
          scoring: 'Best Ball',
        }}
      />
      
      {/* Tutorial Modal */}
      <DraftTutorialModal
        isOpen={showTutorialModal}
        onClose={() => setShowTutorialModal(false)}
        onRules={() => console.log('Rules clicked')}
        format="Snake"
        showDontShowAgain={true}
        onDontShowAgainChange={handleDontShowAgainChange}
      />
    </div>
  );
}

