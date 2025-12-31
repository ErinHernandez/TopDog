/**
 * RosterViewVX2 - Enterprise-grade roster panel
 * 
 * Pixel-matched to VX RosterPanelVX.tsx:
 * - Dropdown team selector with arrow indicator for on-the-clock
 * - 9 starting slots: QB, RB, RB, WR, WR, WR, TE, FLEX, FLEX
 * - 9 bench slots
 * - Position badge per row with gradient background for filled bench
 * - Player photo, name, team (bye) display
 * 
 * A-Grade Standards:
 * - TypeScript: Full type coverage
 * - Constants: Pixel-perfect values from VX
 * - Accessibility: ARIA labels, proper semantics
 * - Co-located sub-components
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { DraftPick, Participant, Position, DraftPlayer } from '../types';
import { POSITION_COLORS } from '../constants';
import { BG_COLORS, TEXT_COLORS } from '../../core/constants/colors';
import PlayerExpandedCard from './PlayerExpandedCard';
import { useImageShare } from '../hooks/useImageShare';
import { Share } from '../../components/icons/actions/Share';
import ShareOptionsModal from './ShareOptionsModal';

// ============================================================================
// PIXEL-PERFECT CONSTANTS (matched from VX RosterPanelVX.tsx)
// ============================================================================

const ROSTER_PX = {
  // Header
  headerPaddingTop: 0,
  headerPaddingBottom: 16,
  headerPaddingX: 24,
  dropdownWidth: 240,
  dropdownBorderRadius: 12,
  dropdownMarginTop: 9,
  dropdownMaxHeight: 520,
  dropdownItemPaddingTop: 7,
  dropdownItemPaddingBottom: 9,
  dropdownItemPaddingX: 12,
  dropdownNameWidth: 150,
  dropdownArrowLeft: 12,
  dropdownArrowSize: 16,
  buttonPaddingY: 6,
  chevronSize: 16,
  chevronContainerSize: 20,
  
  // Roster Rows
  rowHeight: 40,
  rowBorderWidth: 1,
  
  // Position Badge Column
  badgeColumnWidth: 64,
  badgeColumnPaddingLeft: 8,
  starterBadgeWidth: 44,
  starterBadgeHeight: 28,
  benchBadgeWidth: 30,
  benchBadgeHeight: 19,
  benchEmptyBadgeWidth: 44,
  benchEmptyBadgeHeight: 28,
  
  // Player Content
  playerContentPaddingX: 8,
  playerNameFontSize: 13,
  teamByeFontSize: 11,
  teamByeMinWidth: 60,
  teamByeMarginLeft: 12,
  teamByeMarginRight: 8,
  
  // Bench
  benchHeaderPaddingX: 24,
  benchHeaderPaddingTop: 16,
  benchHeaderPaddingBottom: 8,
  benchHeaderFontSize: 14,
  benchHeaderTranslateY: -4,
  
  // Slots
  startingSlots: 9,
  benchSlots: 9,
} as const;

const ROSTER_COLORS = {
  background: '#101927',
  rowBackground: 'rgba(255, 255, 255, 0.02)',
  rowBorder: 'rgba(255, 255, 255, 0.1)',
  headerBorder: 'rgba(255, 255, 255, 0.1)',
  dropdownBg: '#374151',
  dropdownBorder: '#1f2833',
  dropdownHoverBg: '#4b5563',
  dropdownSelectedBg: '#4B5563',
  buttonBg: '#374151',
  textPrimary: '#ffffff',
  textSecondary: '#9ca3af',
  chevronColor: '#9ca3af',
  arrowColor: '#3B82F6',
} as const;

// Position order for starting lineup
type RosterPosition = 'QB' | 'RB' | 'WR' | 'TE' | 'FLEX' | 'BN';
const STARTING_POSITIONS: RosterPosition[] = ['QB', 'RB', 'RB', 'WR', 'WR', 'WR', 'TE', 'FLEX', 'FLEX'];

// ============================================================================
// TYPES
// ============================================================================

export interface RosterViewProps {
  /** All completed picks */
  picks: DraftPick[];
  /** List of participants */
  participants: Participant[];
  /** User's participant index */
  userParticipantIndex: number;
  /** Current pick number to determine who's on the clock */
  currentPickNumber?: number;
  /** Get picks for a participant */
  getPicksForParticipant: (participantIndex: number) => DraftPick[];
  /** Initial scroll position to restore */
  initialScrollPosition?: number;
  /** Callback when scroll position changes */
  onScrollPositionChange?: (position: number) => void;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getByeWeek(team: string): number | null {
  // Bye week lookup - 2024 season
  const byeWeeks: Record<string, number> = {
    'ARI': 11, 'ATL': 12, 'BAL': 14, 'BUF': 12,
    'CAR': 11, 'CHI': 7, 'CIN': 12, 'CLE': 10,
    'DAL': 7, 'DEN': 14, 'DET': 5, 'GB': 10,
    'HOU': 14, 'IND': 14, 'JAX': 12, 'KC': 6,
    'LAC': 5, 'LAR': 6, 'LV': 10, 'MIA': 6,
    'MIN': 6, 'NE': 14, 'NO': 12, 'NYG': 11,
    'NYJ': 12, 'PHI': 5, 'PIT': 9, 'SEA': 10,
    'SF': 9, 'TB': 11, 'TEN': 5, 'WAS': 14,
  };
  return byeWeeks[team] || null;
}

function getPlayerForSlot(
  team: DraftPlayer[],
  position: RosterPosition,
  slotIndex: number,
  allPositions: RosterPosition[]
): DraftPlayer | null {
  if (position === 'FLEX') {
    // FLEX can be RB, WR, or TE - find first unused
    const usedPlayers = new Set<string>();
    for (let i = 0; i < slotIndex; i++) {
      const player = team[i];
      if (player) usedPlayers.add(player.id);
    }
    return team.find(player =>
      (player.position === 'RB' || player.position === 'WR' || player.position === 'TE') &&
      !usedPlayers.has(player.id)
    ) || null;
  }
  
  // Regular position - count how many of this position come before this slot
  const positionPlayers = team.filter(player => player.position === position);
  const positionIndex = allPositions
    .slice(0, slotIndex + 1)
    .filter(pos => pos === position).length - 1;
  
  return positionPlayers[positionIndex] || null;
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface PositionBadgeProps {
  position: string;
  size: 'sm' | 'md' | 'lg' | 'xl';
}

function PositionBadge({ position, size }: PositionBadgeProps): React.ReactElement {
  const color = POSITION_COLORS[position as Position] || '#6B7280';
  
  const dimensions = {
    sm: { width: 24, height: 16, fontSize: 9 },
    md: { width: ROSTER_PX.benchBadgeWidth, height: ROSTER_PX.benchBadgeHeight, fontSize: 10 },
    lg: { width: ROSTER_PX.starterBadgeWidth, height: ROSTER_PX.starterBadgeHeight, fontSize: 12 },
    xl: { width: 56, height: 36, fontSize: 14 },
  };
  
  const dim = dimensions[size];
  
  // Special three-color gradient for FLEX (RB green, WR yellow, TE purple)
  if (position === 'FLEX') {
    return (
      <div
        style={{
          width: dim.width,
          height: dim.height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 6,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Three-color background stripes */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ flex: 1, backgroundColor: POSITION_COLORS.RB }} />
          <div style={{ flex: 1, backgroundColor: POSITION_COLORS.WR }} />
          <div style={{ flex: 1, backgroundColor: POSITION_COLORS.TE }} />
        </div>
        {/* Text overlay */}
        <span
          style={{
            position: 'relative',
            zIndex: 1,
            color: '#000000',
            fontSize: dim.fontSize,
            fontWeight: 700,
          }}
        >
          FLEX
        </span>
      </div>
    );
  }
  
  return (
    <div
      style={{
        width: dim.width,
        height: dim.height,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 6,
        backgroundColor: color,
        color: '#000000',
        fontSize: dim.fontSize,
        fontWeight: 700,
      }}
    >
      {position}
    </div>
  );
}

interface RosterRowProps {
  position: RosterPosition;
  player: DraftPlayer | null;
  isStarter: boolean;
  showTopBorder?: boolean;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

function RosterRow({ position, player, isStarter, showTopBorder = false, isExpanded = false, onToggleExpand }: RosterRowProps): React.ReactElement {
  const badgeSize: 'sm' | 'md' | 'lg' | 'xl' = (isStarter || !player) ? 'lg' : 'md';
  const displayPosition = player ? player.position : position;
  
  return (
    <div>
      <div
        onClick={player ? onToggleExpand : undefined}
        style={{
          display: 'flex',
          alignItems: 'center',
          position: 'relative',
          overflow: 'hidden',
          height: ROSTER_PX.rowHeight,
          backgroundColor: ROSTER_COLORS.rowBackground,
          borderBottom: isExpanded ? 'none' : `${ROSTER_PX.rowBorderWidth}px solid ${ROSTER_COLORS.rowBorder}`,
          borderTop: showTopBorder ? `${ROSTER_PX.rowBorderWidth}px solid ${ROSTER_COLORS.rowBorder}` : 'none',
          cursor: player ? 'pointer' : 'default',
        }}
      >
        
        {/* Position Badge Column */}
        <div
          style={{
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: ROSTER_PX.badgeColumnWidth,
            paddingLeft: ROSTER_PX.badgeColumnPaddingLeft,
            zIndex: 10,
          }}
        >
          <PositionBadge position={displayPosition} size={badgeSize} />
        </div>
        
        {/* Player Content */}
        {player ? (
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              paddingLeft: ROSTER_PX.playerContentPaddingX,
              paddingRight: ROSTER_PX.playerContentPaddingX,
              zIndex: 10,
            }}
          >
            {/* Player Name */}
            <div
              style={{
                flex: 1,
                fontWeight: 500,
                fontSize: ROSTER_PX.playerNameFontSize,
                color: ROSTER_COLORS.textPrimary,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {player.name}
            </div>
            
            {/* Team (Bye) */}
            <div
              style={{
                flexShrink: 0,
                textAlign: 'right',
                fontSize: ROSTER_PX.teamByeFontSize,
                minWidth: ROSTER_PX.teamByeMinWidth,
                marginLeft: ROSTER_PX.teamByeMarginLeft,
                marginRight: ROSTER_PX.teamByeMarginRight,
                color: ROSTER_COLORS.textSecondary,
              }}
            >
              {player.team} ({getByeWeek(player.team) || 'TBD'})
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, zIndex: 10 }} />
        )}
      </div>
      
      {/* Expanded Stats Card */}
      {isExpanded && player && (
        <div style={{ borderBottom: `${ROSTER_PX.rowBorderWidth}px solid ${ROSTER_COLORS.rowBorder}` }}>
          <PlayerExpandedCard
            player={{
              id: player.id,
              name: player.name,
              team: player.team,
              position: player.position,
              adp: player.adp,
              projectedPoints: player.projectedPoints,
            }}
            isMyTurn={false}
            onClose={onToggleExpand}
          />
        </div>
      )}
    </div>
  );
}

interface TeamSelectorProps {
  participants: Participant[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  onTheClockIndex: number;
  draftDirectionUp: boolean;
}

function TeamSelector({
  participants,
  selectedIndex,
  onSelect,
  onTheClockIndex,
  draftDirectionUp,
}: TeamSelectorProps): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const selectedParticipant = participants[selectedIndex];
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);
  
  return (
    <div
      style={{
        flexShrink: 0,
        display: 'flex',
        justifyContent: 'center',
        paddingTop: ROSTER_PX.headerPaddingTop,
        paddingBottom: ROSTER_PX.headerPaddingBottom,
        paddingLeft: ROSTER_PX.headerPaddingX,
        paddingRight: ROSTER_PX.headerPaddingX,
      }}
    >
      <div ref={dropdownRef} style={{ position: 'relative', width: ROSTER_PX.dropdownWidth }}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            position: 'relative',
            borderRadius: ROSTER_PX.dropdownBorderRadius,
            paddingLeft: ROSTER_PX.dropdownItemPaddingX,
            paddingRight: ROSTER_PX.dropdownItemPaddingX,
            paddingTop: ROSTER_PX.buttonPaddingY,
            paddingBottom: ROSTER_PX.buttonPaddingY,
            backgroundColor: ROSTER_COLORS.buttonBg,
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              textAlign: 'center',
              color: ROSTER_COLORS.textPrimary,
            }}
          >
            {selectedParticipant?.name || 'Select Team'}
          </div>
          <div
            style={{
              position: 'absolute',
              right: ROSTER_PX.dropdownItemPaddingX,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: ROSTER_PX.chevronContainerSize,
              height: ROSTER_PX.chevronContainerSize,
              color: ROSTER_COLORS.chevronColor,
              transition: 'transform 0.2s',
            }}
          >
            <svg
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              style={{
                width: ROSTER_PX.chevronSize,
                height: ROSTER_PX.chevronSize,
              }}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>
        
        {/* Dropdown Menu */}
        {isOpen && (
          <div
            role="listbox"
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              zIndex: 50,
              overflowY: 'auto',
              borderRadius: ROSTER_PX.dropdownBorderRadius,
              marginTop: ROSTER_PX.dropdownMarginTop,
              backgroundColor: ROSTER_COLORS.dropdownBg,
              border: `1px solid ${ROSTER_COLORS.dropdownBorder}`,
              maxHeight: ROSTER_PX.dropdownMaxHeight,
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            {participants.map((participant, index) => {
              const isSelected = index === selectedIndex;
              const isOnTheClock = index === onTheClockIndex;
              
              return (
                <button
                  key={participant.id || index}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onSelect(index);
                    setIsOpen(false);
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'center',
                    position: 'relative',
                    paddingTop: ROSTER_PX.dropdownItemPaddingTop,
                    paddingBottom: ROSTER_PX.dropdownItemPaddingBottom,
                    paddingLeft: ROSTER_PX.dropdownItemPaddingX,
                    paddingRight: ROSTER_PX.dropdownItemPaddingX,
                    backgroundColor: isSelected ? ROSTER_COLORS.dropdownSelectedBg : 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'background-color 0.15s',
                  }}
                >
                  {/* Draft direction arrow */}
                  <div
                    style={{
                      position: 'absolute',
                      left: ROSTER_PX.dropdownArrowLeft,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {isOnTheClock && (
                      <svg
                        width={ROSTER_PX.dropdownArrowSize}
                        height={ROSTER_PX.dropdownArrowSize}
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <path
                          d={draftDirectionUp
                            ? "M12 19V5M12 5L5 12M12 5L19 12"  // Up arrow
                            : "M12 5V19M12 19L5 12M12 19L19 12" // Down arrow
                          }
                          stroke={ROSTER_COLORS.arrowColor}
                          strokeWidth={3}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </div>
                  <div
                    style={{
                      fontWeight: 500,
                      fontSize: 14,
                      textAlign: 'left',
                      width: ROSTER_PX.dropdownNameWidth,
                      color: ROSTER_COLORS.textPrimary,
                    }}
                  >
                    {participant.name}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function RosterView({
  picks,
  participants,
  userParticipantIndex,
  currentPickNumber = 1,
  getPicksForParticipant,
  initialScrollPosition = 0,
  onScrollPositionChange,
}: RosterViewProps): React.ReactElement {
  const [selectedIndex, setSelectedIndex] = useState(userParticipantIndex);
  const [expandedPlayerId, setExpandedPlayerId] = useState<string | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const rosterContentRef = useRef<HTMLDivElement>(null);
  
  // Image share hook
  const { captureAndShare, isCapturing } = useImageShare({
    onSuccess: (method) => {
      console.log(`[RosterView] Share successful via ${method}`);
    },
    onError: (error) => {
      console.error('[RosterView] Share failed:', error);
    },
  });
  
  // Get selected participant name
  const selectedParticipant = participants[selectedIndex];
  const teamName = selectedParticipant?.name || 'My Team';
  
  // Handle share button click - open modal
  const handleShare = useCallback(() => {
    setIsShareModalOpen(true);
  }, []);
  
  // Handle image share from modal
  const handleShareImage = useCallback(() => {
    captureAndShare(rosterContentRef.current, 'roster', teamName);
  }, [captureAndShare, teamName]);
  
  // Collapse expanded card when switching teams
  useEffect(() => {
    setExpandedPlayerId(null);
  }, [selectedIndex]);
  
  const handleToggleExpand = useCallback((playerId: string) => {
    setExpandedPlayerId(prev => prev === playerId ? null : playerId);
  }, []);
  
  // Restore scroll position on mount
  useEffect(() => {
    if (scrollContainerRef.current && initialScrollPosition > 0) {
      scrollContainerRef.current.scrollTop = initialScrollPosition;
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  
  // Save scroll position on scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (onScrollPositionChange) {
      onScrollPositionChange(e.currentTarget.scrollTop);
    }
  }, [onScrollPositionChange]);
  
  // Calculate who's on the clock and draft direction
  const participantCount = participants.length || 12;
  const currentRound = Math.ceil(currentPickNumber / participantCount);
  const isSnakeRound = currentRound % 2 === 0;
  const pickIndexInRound = (currentPickNumber - 1) % participantCount;
  const onTheClockIndex = isSnakeRound
    ? participantCount - 1 - pickIndexInRound
    : pickIndexInRound;
  const draftDirectionUp = isSnakeRound;
  
  // Get team for selected participant
  const getTeamForParticipant = (participantIndex: number): DraftPlayer[] => {
    const participantPicks = getPicksForParticipant(participantIndex);
    return participantPicks.map(pick => pick.player);
  };
  
  const team = getTeamForParticipant(selectedIndex);
  
  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        backgroundColor: ROSTER_COLORS.background,
        color: ROSTER_COLORS.textPrimary,
        position: 'relative',
        paddingTop: 16, // Space below PicksBar
      }}
    >
      {/* Header with Dropdown - fixed at top */}
      <div style={{ flexShrink: 0 }}>
        <TeamSelector
          participants={participants}
          selectedIndex={selectedIndex}
          onSelect={setSelectedIndex}
          onTheClockIndex={onTheClockIndex}
          draftDirectionUp={draftDirectionUp}
        />
      </div>
      
      {/* Roster List - Scrollable */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        style={{
          flex: 1,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          borderTop: `2px solid ${ROSTER_COLORS.headerBorder}`,
          paddingBottom: 24,
        }}
      >
        {/* Capturable Roster Content */}
        <div ref={rosterContentRef}>
          {/* Starting Lineup */}
          {STARTING_POSITIONS.map((position, index) => {
            const player = getPlayerForSlot(team, position, index, STARTING_POSITIONS);
            return (
              <RosterRow
                key={`start-${index}`}
                position={position}
                player={player}
                isStarter={true}
                isExpanded={player ? expandedPlayerId === player.id : false}
                onToggleExpand={player ? () => handleToggleExpand(player.id) : undefined}
              />
            );
          })}
          
          {/* Bench Header */}
          <div
            style={{
              fontWeight: 500,
              paddingLeft: ROSTER_PX.benchHeaderPaddingX,
              paddingRight: ROSTER_PX.benchHeaderPaddingX,
              paddingTop: ROSTER_PX.benchHeaderPaddingTop,
              paddingBottom: ROSTER_PX.benchHeaderPaddingBottom,
              fontSize: ROSTER_PX.benchHeaderFontSize,
              transform: `translateY(${ROSTER_PX.benchHeaderTranslateY}px)`,
              color: ROSTER_COLORS.textSecondary,
            }}
          >
            BENCH
          </div>
          
          {/* Bench Slots */}
          {[...Array(ROSTER_PX.benchSlots)].map((_, index) => {
            const benchPlayers = team.slice(ROSTER_PX.startingSlots);
            const benchPlayer = benchPlayers[index] || null;
            
            return (
              <RosterRow
                key={`bench-${index}`}
                position={benchPlayer?.position as RosterPosition || 'BN'}
                player={benchPlayer}
                isStarter={false}
                showTopBorder={index === 0}
                isExpanded={benchPlayer ? expandedPlayerId === benchPlayer.id : false}
                onToggleExpand={benchPlayer ? () => handleToggleExpand(benchPlayer.id) : undefined}
              />
            );
          })}
        </div>
      </div>
      
      {/* Floating Share Button */}
      <button
        onClick={handleShare}
        disabled={isCapturing}
        aria-label="Share roster as image"
        style={{
          position: 'absolute',
          bottom: 16,
          right: 16,
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor: '#3B82F6',
          border: 'none',
          cursor: isCapturing ? 'wait' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          opacity: isCapturing ? 0.7 : 1,
          transition: 'opacity 0.2s, transform 0.2s',
          zIndex: 20,
        }}
      >
        {isCapturing ? (
          <div
            style={{
              width: 20,
              height: 20,
              border: '2px solid #FFFFFF',
              borderTopColor: 'transparent',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }}
          />
        ) : (
          <Share size={24} color="#FFFFFF" strokeWidth={2} aria-hidden />
        )}
      </button>
      
      {/* Spinner animation */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
      
      {/* Share Options Modal */}
      <ShareOptionsModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        shareType="roster"
        contentName={teamName}
        onShareImage={handleShareImage}
        isCapturingImage={isCapturing}
      />
    </div>
  );
}
