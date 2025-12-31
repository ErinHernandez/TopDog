/**
 * TabletDraftRoomVX2 - Three-Panel Draft Room
 * 
 * The crown jewel of the tablet experience.
 * Displays players, picks bar, queue, and roster simultaneously.
 * 
 * Layout:
 * ┌─────────────────────────────────────────────────────────────┐
 * │                      HEADER (Timer, Info)                   │
 * ├─────────────────────────────────────────────────────────────┤
 * │             PICKS BAR (Full Width, Horizontal Scroll)       │
 * ├─────────────┬─────────────────────────┬─────────────────────┤
 * │   LEFT      │        CENTER           │       RIGHT         │
 * │  (Players)  │     (Main Content)      │  (Queue + Roster)   │
 * ├─────────────┴─────────────────────────┴─────────────────────┤
 * │          BOTTOM TAB BAR (Players, Board, Queue, Roster)     │
 * └─────────────────────────────────────────────────────────────┘
 */

import React, { useState, useCallback, type ReactElement } from 'react';
import { BG_COLORS, TEXT_COLORS, STATE_COLORS } from '../../core/constants/colors';
import { TABLET_PANELS, TABLET_Z_INDEX, TABLET_SPACING } from '../../core/constants/tablet';
import { TabletLayoutProvider, useTabletLayoutContext } from '../../core/context/TabletLayoutContext';
import { useDraftRoom } from '../../draft-room/hooks/useDraftRoom';
import { PanelContainer, PanelDivider } from '../panels';
import TabletDraftHeader from './TabletDraftHeader';
import { PlayerListPanel } from './LeftPanel';
import { PicksBarPanel } from './CenterPanel';
import { QueueRosterPanel } from './RightPanel';
import DraftBoard from '../../draft-room/components/DraftBoard';
import type { TabletDraftRoomProps, DraftLayoutMode, DraftActivePanel } from '../../core/types/tablet';
import type { Position, DraftPlayer } from '../../draft-room/types';

// ============================================================================
// BOTTOM TAB BAR
// ============================================================================

type TabId = 'players' | 'board' | 'queue' | 'roster';

interface TabBarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

interface TabItem {
  id: TabId;
  label: string;
  icon: ReactElement;
}

function TabIcon({ d }: { d: string }): ReactElement {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d={d} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const TABS: TabItem[] = [
  { 
    id: 'players', 
    label: 'Players',
    icon: <TabIcon d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
  },
  { 
    id: 'board', 
    label: 'Board',
    icon: <TabIcon d="M3 3h18v18H3zM3 9h18M3 15h18M9 3v18M15 3v18" />
  },
  { 
    id: 'queue', 
    label: 'Queue',
    icon: <TabIcon d="M4 6h16M4 12h16M4 18h16" />
  },
  { 
    id: 'roster', 
    label: 'Roster',
    icon: <TabIcon d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2M9 5h6" />
  },
];

function BottomTabBar({ activeTab, onTabChange }: TabBarProps): ReactElement {
  return (
    <div
      style={{
        height: 56,
        minHeight: 56,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'stretch',
        backgroundColor: BG_COLORS.secondary,
        borderTop: '1px solid rgba(255,255,255,0.1)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: isActive ? STATE_COLORS.active : TEXT_COLORS.muted,
              transition: 'color 0.15s',
            }}
          >
            {tab.icon}
            <span
              style={{
                fontSize: 10,
                fontWeight: isActive ? 600 : 400,
              }}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ============================================================================
// PLAYER STATS PANEL (shows when player is selected)
// ============================================================================

import { POSITION_COLORS } from '../../core/constants/colors';

interface PlayerStatsPanelProps {
  player: {
    id: string;
    name: string;
    team: string;
    position: Position;
    adp?: number;
    projectedPoints?: number;
    byeWeek?: number;
  };
  isMyTurn: boolean;
  onDraft: () => void;
  onAddToQueue: () => void;
  onClose: () => void;
  isQueued: boolean;
}

function PlayerStatsPanel({ 
  player, 
  isMyTurn, 
  onDraft, 
  onAddToQueue, 
  onClose,
  isQueued,
}: PlayerStatsPanelProps): ReactElement {
  const positionColor = POSITION_COLORS[player.position];
  
  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: BG_COLORS.primary,
        overflow: 'hidden',
      }}
    >
      {/* Header with close button */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 600, color: TEXT_COLORS.primary }}>
          Player Details
        </span>
        <button
          onClick={onClose}
          style={{
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(255,255,255,0.1)',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            color: TEXT_COLORS.secondary,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      {/* Player Info */}
      <div
        style={{
          padding: 16,
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Position Badge */}
          <div
            style={{
              width: 48,
              height: 32,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 6,
              backgroundColor: positionColor,
              color: '#000',
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            {player.position}
          </div>
          
          {/* Name and Team */}
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 18, fontWeight: 600, color: TEXT_COLORS.primary }}>
              {player.name}
            </div>
            <div style={{ fontSize: 13, color: TEXT_COLORS.secondary, marginTop: 2 }}>
              {player.team} {player.byeWeek ? `(Bye: ${player.byeWeek})` : ''}
            </div>
          </div>
        </div>
      </div>
      
      {/* Stats Grid */}
      <div
        style={{
          flex: 1,
          padding: 16,
          overflowY: 'auto',
        }}
        className="tablet-scroll-hidden"
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 12,
          }}
        >
          {/* ADP */}
          <div
            style={{
              padding: 12,
              backgroundColor: 'rgba(255,255,255,0.05)',
              borderRadius: 8,
            }}
          >
            <div style={{ fontSize: 11, color: TEXT_COLORS.muted, marginBottom: 4 }}>ADP</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: TEXT_COLORS.primary }}>
              {player.adp?.toFixed(1) || '--'}
            </div>
          </div>
          
          {/* Projected Points */}
          <div
            style={{
              padding: 12,
              backgroundColor: 'rgba(255,255,255,0.05)',
              borderRadius: 8,
            }}
          >
            <div style={{ fontSize: 11, color: TEXT_COLORS.muted, marginBottom: 4 }}>PROJ PTS</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: TEXT_COLORS.primary }}>
              {player.projectedPoints ? Math.round(player.projectedPoints) : '--'}
            </div>
          </div>
          
          {/* Position Rank (placeholder) */}
          <div
            style={{
              padding: 12,
              backgroundColor: 'rgba(255,255,255,0.05)',
              borderRadius: 8,
            }}
          >
            <div style={{ fontSize: 11, color: TEXT_COLORS.muted, marginBottom: 4 }}>POS RANK</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: positionColor }}>
              {player.position}1
            </div>
          </div>
          
          {/* Bye Week */}
          <div
            style={{
              padding: 12,
              backgroundColor: 'rgba(255,255,255,0.05)',
              borderRadius: 8,
            }}
          >
            <div style={{ fontSize: 11, color: TEXT_COLORS.muted, marginBottom: 4 }}>BYE WEEK</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: TEXT_COLORS.primary }}>
              {player.byeWeek || '--'}
            </div>
          </div>
        </div>
        
        {/* Historical Stats Placeholder */}
        <div
          style={{
            marginTop: 16,
            padding: 16,
            backgroundColor: 'rgba(255,255,255,0.03)',
            borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.1)',
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 600, color: TEXT_COLORS.secondary, marginBottom: 8 }}>
            SEASON STATS
          </div>
          <div style={{ fontSize: 13, color: TEXT_COLORS.muted, textAlign: 'center', padding: '20px 0' }}>
            Historical stats loading...
          </div>
        </div>
      </div>
      
      {/* Action Buttons */}
      <div
        style={{
          display: 'flex',
          gap: 12,
          padding: 16,
          borderTop: '1px solid rgba(255,255,255,0.1)',
          flexShrink: 0,
        }}
      >
        {/* Add to Queue */}
        <button
          onClick={onAddToQueue}
          style={{
            flex: 1,
            height: 44,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            backgroundColor: isQueued ? 'rgba(96,165,250,0.2)' : 'rgba(255,255,255,0.1)',
            border: `2px solid ${isQueued ? '#60A5FA' : 'rgba(255,255,255,0.2)'}`,
            borderRadius: 8,
            color: isQueued ? '#60A5FA' : TEXT_COLORS.primary,
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {isQueued ? 'Remove from Queue' : 'Add to Queue'}
        </button>
        
        {/* Draft Button */}
        {isMyTurn && (
          <button
            onClick={onDraft}
            style={{
              flex: 1,
              height: 44,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: STATE_COLORS.active,
              border: 'none',
              borderRadius: 8,
              color: '#000',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Draft Now
          </button>
        )}
      </div>
      
      <style>{`
        .tablet-scroll-hidden::-webkit-scrollbar {
          display: none !important;
        }
        .tablet-scroll-hidden {
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
        }
      `}</style>
    </div>
  );
}

// ============================================================================
// LOADING STATE
// ============================================================================

function LoadingState(): ReactElement {
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
          border: '3px solid rgba(255,255,255,0.1)',
          borderTopColor: '#3B82F6',
          animation: 'spin 1s linear infinite',
        }}
      />
      <p style={{ marginTop: 16, fontSize: 14, color: '#9CA3AF' }}>
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

// ============================================================================
// ERROR STATE
// ============================================================================

interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

function ErrorState({ message, onRetry }: ErrorStateProps): ReactElement {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: BG_COLORS.primary,
        padding: 32,
        textAlign: 'center',
      }}
    >
      <h2 style={{ fontSize: 20, color: '#fff', marginBottom: 8 }}>
        Unable to Join Draft
      </h2>
      <p style={{ fontSize: 14, color: '#9CA3AF', marginBottom: 24 }}>
        {message}
      </p>
      <button
        onClick={onRetry}
        style={{
          padding: '12px 24px',
          backgroundColor: '#3B82F6',
          color: '#fff',
          fontSize: 14,
          fontWeight: 600,
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

// ============================================================================
// INNER DRAFT ROOM
// ============================================================================

interface InnerDraftRoomProps {
  roomId: string;
  onLeave?: () => void;
  fastMode?: boolean;
}

// Player type for selected player
interface SelectedPlayer {
  id: string;
  name: string;
  team: string;
  position: Position;
  adp?: number;
  projectedPoints?: number;
  byeWeek?: number;
}

function InnerDraftRoom({ roomId, onLeave, fastMode }: InnerDraftRoomProps): ReactElement {
  const layout = useTabletLayoutContext();
  const [showInfo, setShowInfo] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('players');
  const [selectedPlayer, setSelectedPlayer] = useState<SelectedPlayer | null>(null);
  
  // Use the existing VX2 draft room hook
  const draftRoom = useDraftRoom({
    roomId,
    fastMode,
  });
  
  // Handle player click - show stats in center panel
  const handlePlayerClick = useCallback((player: SelectedPlayer) => {
    setSelectedPlayer(player);
  }, []);
  
  // Close player stats
  const handleClosePlayerStats = useCallback(() => {
    setSelectedPlayer(null);
  }, []);
  
  // Leave handler
  const handleLeave = useCallback(() => {
    draftRoom.leaveDraft();
    onLeave?.();
  }, [draftRoom, onLeave]);
  
  // Panel resize handlers
  const handleLeftDrag = useCallback((delta: number) => {
    layout.setLeftWidth(layout.dimensions.left + delta);
  }, [layout]);
  
  const handleRightDrag = useCallback((delta: number) => {
    layout.setRightWidth(layout.dimensions.right - delta);
  }, [layout]);
  
  // Loading state
  if (draftRoom.isLoading) {
    return <LoadingState />;
  }
  
  // Error state
  if (draftRoom.error) {
    return (
      <ErrorState
        message={draftRoom.error}
        onRetry={() => window.location.reload()}
      />
    );
  }
  
  // Build roster structure from picks
  const rosterSlots = [
    { position: 'QB', player: undefined as DraftPlayer | undefined },
    { position: 'RB', player: undefined as DraftPlayer | undefined },
    { position: 'RB', player: undefined as DraftPlayer | undefined },
    { position: 'WR', player: undefined as DraftPlayer | undefined },
    { position: 'WR', player: undefined as DraftPlayer | undefined },
    { position: 'WR', player: undefined as DraftPlayer | undefined },
    { position: 'TE', player: undefined as DraftPlayer | undefined },
    { position: 'FLEX', player: undefined as DraftPlayer | undefined },
    { position: 'FLEX', player: undefined as DraftPlayer | undefined },
    // Bench slots
    ...Array(9).fill({ position: 'BN', player: undefined }),
  ];
  
  // Fill roster with user's picks
  const userPicks = draftRoom.picks.picksByParticipant(draftRoom.userParticipantIndex);
  userPicks.forEach((pick) => {
    const emptySlot = rosterSlots.find(
      (slot) => !slot.player && (
        slot.position === pick.player.position ||
        (slot.position === 'FLEX' && ['RB', 'WR', 'TE'].includes(pick.player.position)) ||
        slot.position === 'BN'
      )
    );
    if (emptySlot) {
      emptySlot.player = pick.player;
    }
  });
  
  // Render content based on active tab
  const renderMainContent = () => {
    switch (activeTab) {
      case 'board':
        return (
          <div
            style={{
              flex: 1,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'stretch',
              overflow: 'hidden',
              minHeight: 0,
            }}
          >
            <DraftBoard
              picks={draftRoom.picks.picks}
              participants={draftRoom.participants}
              userParticipantIndex={draftRoom.userParticipantIndex}
              currentPickNumber={draftRoom.currentPickNumber}
              timer={draftRoom.timerValue}
              isDraftActive={draftRoom.isDraftActive}
              getPickForSlot={draftRoom.picks.getPickForSlot}
            />
          </div>
        );
      
      case 'queue':
        return (
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <QueueRosterPanel
              queue={draftRoom.queue.queue}
              onRemoveFromQueue={draftRoom.queue.removeFromQueue}
              onClearQueue={draftRoom.queue.clearQueue}
              roster={rosterSlots}
              showQueueOnly
            />
          </div>
        );
      
      case 'roster':
        return (
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <QueueRosterPanel
              queue={draftRoom.queue.queue}
              onRemoveFromQueue={draftRoom.queue.removeFromQueue}
              onClearQueue={draftRoom.queue.clearQueue}
              roster={rosterSlots}
              showRosterOnly
            />
          </div>
        );
      
      case 'players':
      default:
        return (
          <div
            style={{
              flex: 1,
              display: 'flex',
              overflow: 'hidden',
            }}
          >
            {/* Left Panel - Available Players */}
            {layout.visibility.left && (
              <PanelContainer
                panelId="left"
                width={layout.dimensions.left}
              >
                <PlayerListPanel
                  players={draftRoom.availablePlayers.filteredPlayers}
                  isMyTurn={draftRoom.isMyTurn}
                  onDraft={draftRoom.draftPlayer}
                  onToggleQueue={draftRoom.queue.toggleQueue}
                  isQueued={draftRoom.queue.isQueued}
                  positionFilters={draftRoom.availablePlayers.positionFilters}
                  onToggleFilter={draftRoom.availablePlayers.togglePositionFilter}
                  searchQuery={draftRoom.availablePlayers.searchQuery}
                  onSearchChange={draftRoom.availablePlayers.setSearchQuery}
                  onClearAll={draftRoom.availablePlayers.clearAll}
                  onPlayerClick={handlePlayerClick}
                />
              </PanelContainer>
            )}
            
            {/* Left Divider */}
            {layout.visibility.left && (
              <PanelDivider
                position="left"
                draggable
                onDrag={handleLeftDrag}
              />
            )}
            
            {/* Center Panel - Player Stats or Queue */}
            <PanelContainer
              panelId="center"
              width={layout.dimensions.center}
            >
              {selectedPlayer ? (
                <PlayerStatsPanel
                  player={selectedPlayer}
                  isMyTurn={draftRoom.isMyTurn}
                  onDraft={() => {
                    draftRoom.draftPlayer(selectedPlayer as DraftPlayer);
                    handleClosePlayerStats();
                  }}
                  onAddToQueue={() => {
                    draftRoom.queue.toggleQueue(selectedPlayer as DraftPlayer);
                  }}
                  onClose={handleClosePlayerStats}
                  isQueued={draftRoom.queue.isQueued(selectedPlayer.id)}
                />
              ) : (
                <QueueRosterPanel
                  queue={draftRoom.queue.queue}
                  onRemoveFromQueue={draftRoom.queue.removeFromQueue}
                  onClearQueue={draftRoom.queue.clearQueue}
                  roster={rosterSlots}
                  showQueueOnly
                />
              )}
            </PanelContainer>
            
            {/* Right Divider */}
            {layout.visibility.right && (
              <PanelDivider
                position="right"
                draggable
                onDrag={handleRightDrag}
              />
            )}
            
            {/* Right Panel - Roster Only */}
            {layout.visibility.right && (
              <PanelContainer
                panelId="right"
                width={layout.dimensions.right}
              >
                <QueueRosterPanel
                  queue={draftRoom.queue.queue}
                  onRemoveFromQueue={draftRoom.queue.removeFromQueue}
                  onClearQueue={draftRoom.queue.clearQueue}
                  roster={rosterSlots}
                  showRosterOnly
                />
              </PanelContainer>
            )}
          </div>
        );
    }
  };
  
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: BG_COLORS.primary,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <TabletDraftHeader
        timerSeconds={draftRoom.timer.seconds}
        round={draftRoom.picks.currentRound}
        pick={draftRoom.currentPickNumber}
        isMyTurn={draftRoom.isMyTurn}
        currentPicker={draftRoom.currentPicker?.name}
        onLeave={handleLeave}
        onInfo={() => setShowInfo(true)}
      />
      
      {/* Full-Width Picks Bar - hidden on Board tab */}
      {activeTab !== 'board' && (
        <PicksBarPanel
          picks={draftRoom.picks.picks}
          currentPickNumber={draftRoom.currentPickNumber}
          participants={draftRoom.participants}
          userParticipantIndex={draftRoom.userParticipantIndex}
          timer={draftRoom.timer.seconds}
          status={draftRoom.status}
        />
      )}
      
      {/* Main Content Area */}
      {renderMainContent()}
      
      {/* Bottom Tab Bar */}
      <BottomTabBar activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

/**
 * TabletDraftRoomVX2 - Main tablet draft room entry point
 * 
 * Wraps the inner draft room with layout context provider.
 */
export default function TabletDraftRoomVX2({
  roomId,
  userId,
  onLeave,
  layoutMode,
  showDevTools = false,
  fastMode = false,
}: TabletDraftRoomProps): ReactElement {
  return (
    <TabletLayoutProvider>
      <InnerDraftRoom
        roomId={roomId}
        onLeave={onLeave}
        fastMode={fastMode}
      />
    </TabletLayoutProvider>
  );
}

