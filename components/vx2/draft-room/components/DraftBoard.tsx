/**
 * DraftBoardVX2 - Enterprise-grade draft board grid
 * 
 * Pixel-matched to VX DraftBoardVX.tsx:
 * - 18 rounds x 12 teams grid
 * - Snake draft visualization (even rounds reversed)
 * - Team headers with username + position tracker bar
 * - Pick cells with player info or timer/"X away"
 * - User column highlighted with border color
 * - Position color coding for drafted players
 * 
 * A-Grade Standards:
 * - TypeScript: Full type coverage
 * - Constants: Pixel-perfect values from VX
 * - Accessibility: ARIA labels, table semantics
 * - Co-located sub-components
 */

import React, { useRef, useEffect, useMemo, useCallback, useState } from 'react';
import type { DraftPick, Participant, Position } from '../types';
import { POSITION_COLORS } from '../constants';
import { BG_COLORS, TEXT_COLORS } from '../../core/constants/colors';
import { useImageShare } from '../hooks/useImageShare';
import { Share } from '../../components/icons/actions/Share';
import ShareOptionsModal from './ShareOptionsModal';
import { createScopedLogger } from '../../../../lib/clientLogger';
import { useCustomizationPreferences } from '../../customization/hooks/useCustomizationPreferences';
import { generateBackgroundStyle, generateOverlayStyle } from '@/lib/customization/patterns';

const logger = createScopedLogger('[DraftBoard]');

// ============================================================================
// PIXEL-PERFECT CONSTANTS (matched from VX DraftBoardVX.tsx)
// ============================================================================

const BOARD_PX = {
  // Grid dimensions
  totalRounds: 18,
  cellWidth: 92,
  cellHeight: 62,
  cellMargin: 1,
  cellBorderRadius: 6,
  cellBorderWidth: 4,
  
  // Team header
  headerHeight: 20,
  headerFontSize: 10,
  headerMaxChars: 12,
  
  // Position tracker bar
  trackerHeight: 9,
  trackerWidth: 78,
  trackerEmptyWidth: 79,
  trackerMarginTop: 2,
  trackerBorderRadius: 1,
  
  // Content area
  contentMinHeight: 70,
  contentPaddingBottom: 8,
  
  // Pick cell content
  pickNumberFontSize: 8,
  pickNumberMarginTop: 2,
  pickNumberMarginLeft: 1,
  playerFirstNameFontSize: 10,
  playerLastNameFontSize: 11,
  playerPosTeamFontSize: 9,
  playerPosTeamMarginTop: 6,
  timerFontSize: 26,
  timerMarginTop: -6,
  awayFontSize: 12,
  awayMarginTop: -4,
  
  // First row margin
  firstRowMarginTop: 7,
} as const;

const BOARD_COLORS = {
  background: '#101927',
  cellBorderDefault: 'rgba(255, 255, 255, 0.1)',
  cellBorderUser: '#3B82F6',
  cellBorderUserOnClock: '#EF4444',
  cellBgDefault: 'transparent',
  headerBgGray: '#374151', // gray-800
  trackerEmpty: '#6B7280', // gray-500
} as const;

// Position order for tracker bar
const POSITION_ORDER: Position[] = ['QB', 'RB', 'WR', 'TE'];

// ============================================================================
// TYPES
// ============================================================================

export interface DraftBoardProps {
  /** All completed picks */
  picks: DraftPick[];
  /** Current pick number */
  currentPickNumber: number;
  /** List of participants */
  participants: Participant[];
  /** User's participant index */
  userParticipantIndex: number;
  /** Timer value in seconds */
  timer?: number;
  /** Whether draft is active */
  isDraftActive?: boolean;
  /** Get pick for a specific slot */
  getPickForSlot: (round: number, participantIndex: number) => DraftPick | null;
  /** Initial scroll position to restore */
  initialScrollPosition?: number;
  /** Callback when scroll position changes */
  onScrollPositionChange?: (position: number) => void;
}

interface PickSlot {
  pickNumber: number;
  round: number;
  displayPosition: number;
  participantIndex: number;
  pick: DraftPick | null;
  isCurrentPick: boolean;
  isPastPick: boolean;
  isUserPick: boolean;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getPositionColor(position: string): string {
  return POSITION_COLORS[position as Position] || '#6b7280';
}

function formatPickNumber(pickNumber: number, teamCount: number): string {
  // Guard against division by zero
  if (teamCount < 1) {
    return '0.00';
  }
  const round = Math.ceil(pickNumber / teamCount);
  const pickInRound = ((pickNumber - 1) % teamCount) + 1;
  return `${round}.${String(pickInRound).padStart(2, '0')}`;
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface TeamHeaderProps {
  participant: Participant;
  index: number;
  isUser: boolean;
  userBorderColor: string;
  positionCounts: Record<Position, number>;
  isOnTheClock: boolean;
}

function TeamHeader({ 
  participant, 
  index, 
  isUser, 
  userBorderColor, 
  positionCounts,
  isOnTheClock,
}: TeamHeaderProps): React.ReactElement {
  const borderColor = isUser ? userBorderColor : (isOnTheClock ? '#6B7280' : '#6B7280');
  const totalPicks = Object.values(positionCounts).reduce((sum, count) => sum + count, 0);
  const displayName = participant.name?.length > BOARD_PX.headerMaxChars
    ? participant.name.substring(0, BOARD_PX.headerMaxChars)
    : participant.name || `Team ${index + 1}`;
  
  return (
    <div
      style={{
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: BOARD_COLORS.headerBgGray,
        margin: BOARD_PX.cellMargin,
        minWidth: BOARD_PX.cellWidth,
        width: BOARD_PX.cellWidth,
        borderRadius: BOARD_PX.cellBorderRadius,
        border: `${BOARD_PX.cellBorderWidth}px solid ${borderColor}`,
        overflow: 'hidden',
      }}
    >
      {/* Username Header */}
      <div
        style={{
          height: BOARD_PX.headerHeight,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 4px',
          backgroundColor: borderColor,
          fontSize: BOARD_PX.headerFontSize,
          fontWeight: 500,
          color: '#FFFFFF',
          textTransform: 'uppercase',
          textAlign: 'center',
        }}
      >
        {displayName}
      </div>
      
      {/* Content Area with Tracker */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          alignItems: 'center',
          paddingBottom: BOARD_PX.contentPaddingBottom,
          minHeight: BOARD_PX.contentMinHeight,
        }}
      >
        {/* On The Clock text */}
        {isOnTheClock && (
          <div
            style={{
              fontWeight: 600,
              color: '#FFFFFF',
              fontSize: 11,
              lineHeight: 1.2,
              textAlign: 'center',
              marginBottom: 8,
            }}
          >
            On The<br />Clock
          </div>
        )}
        
        {/* Position Tracker Bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            width: '100%',
            marginTop: BOARD_PX.trackerMarginTop,
          }}
        >
          {totalPicks === 0 ? (
            <div
              style={{
                height: BOARD_PX.trackerHeight,
                width: BOARD_PX.trackerEmptyWidth,
                backgroundColor: BOARD_COLORS.trackerEmpty,
                borderRadius: BOARD_PX.trackerBorderRadius,
              }}
            />
          ) : (
            <div
              style={{
                display: 'flex',
                height: BOARD_PX.trackerHeight,
                width: BOARD_PX.trackerWidth,
                borderRadius: BOARD_PX.trackerBorderRadius,
                overflow: 'hidden',
              }}
            >
              {POSITION_ORDER
                .filter(pos => positionCounts[pos] > 0)
                .map((position, idx, arr) => (
                  <div
                    key={position}
                    style={{
                      width: `${(positionCounts[position] / totalPicks) * 100}%`,
                      height: '100%',
                      backgroundColor: getPositionColor(position),
                      borderRadius: idx === 0 
                        ? '1px 0 0 1px' 
                        : idx === arr.length - 1 
                          ? '0 1px 1px 0' 
                          : '0',
                    }}
                  />
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface PickCellProps {
  pickData: PickSlot;
  teamCount: number;
  timer: number;
  userBorderColor: string;
  picksAway: number;
  isNextUserPick: boolean;
}

function PickCell({ 
  pickData, 
  teamCount, 
  timer, 
  userBorderColor, 
  picksAway,
  isNextUserPick,
}: PickCellProps): React.ReactElement {
  const { pick, isUserPick, isCurrentPick, pickNumber, round } = pickData;
  const { preferences } = useCustomizationPreferences();
  
  // Determine cell styling
  const getCellStyle = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      minWidth: BOARD_PX.cellWidth,
      width: BOARD_PX.cellWidth,
      margin: BOARD_PX.cellMargin,
      marginTop: round === 1 ? BOARD_PX.firstRowMarginTop : BOARD_PX.cellMargin,
      borderRadius: BOARD_PX.cellBorderRadius,
      position: 'relative', // Required for absolute positioned overlay
    };
    
    if (pick) {
      const posColor = getPositionColor(pick.player.position);
      // All picked cells use position color border
      return {
        ...base,
        border: `${BOARD_PX.cellBorderWidth}px solid ${posColor}`,
        backgroundColor: `${posColor}20`,
      };
    }
    
    if (isUserPick) {
      // Apply customization for user's unpicked cells
      const borderColor = preferences?.borderColor || userBorderColor;
      const baseStyle = {
        ...base,
        border: `${BOARD_PX.cellBorderWidth}px solid ${borderColor}`,
        backgroundColor: 'transparent',
      };

      // Apply background customization (flag or solid color)
      if (preferences && preferences.backgroundType !== 'none') {
        const bgStyle = generateBackgroundStyle(
          preferences.backgroundType,
          preferences.backgroundFlagCode,
          preferences.backgroundSolidColor
        );
        Object.assign(baseStyle, bgStyle);
      }

      return baseStyle;
    }
    
    return {
      ...base,
      border: `${BOARD_PX.cellBorderWidth}px solid ${BOARD_COLORS.cellBorderDefault}`,
      backgroundColor: 'transparent',
    };
  };
  
  return (
    <div style={getCellStyle()}>
      {/* Overlay layer for user's unpicked cells */}
      {isUserPick && !pick && preferences?.overlayEnabled && (
        <div
          className="absolute inset-0 pointer-events-none z-10"
          style={generateOverlayStyle(
            `/customization/images/${preferences.overlayImageId}.svg`,
            preferences.overlayPattern,
            preferences.overlaySize,
            preferences.overlayPattern === 'placement'
              ? { x: preferences.overlayPositionX ?? 50, y: preferences.overlayPositionY ?? 50 }
              : undefined
          )}
        />
      )}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: BOARD_PX.cellHeight,
          padding: '2px 3px',
          position: 'relative',
        }}
      >
        {/* Pick number - top left */}
        <div
          style={{
            fontSize: BOARD_PX.pickNumberFontSize,
            fontWeight: 500,
            color: '#FFFFFF',
            lineHeight: 1,
            marginTop: BOARD_PX.pickNumberMarginTop,
            marginLeft: BOARD_PX.pickNumberMarginLeft,
            flexShrink: 0,
          }}
        >
          {formatPickNumber(pickNumber, teamCount)}
        </div>
        
        {/* Content area */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          {pick ? (
            // Drafted player - First name / Last name / POS-TEAM
            <>
              <div
                style={{
                  fontWeight: 700,
                  color: '#FFFFFF',
                  textAlign: 'center',
                  width: '100%',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontSize: BOARD_PX.playerFirstNameFontSize,
                  lineHeight: 1.2,
                  marginTop: -1,
                }}
              >
                {pick.player.name.split(' ')[0]}
              </div>
              <div
                style={{
                  fontWeight: 700,
                  color: '#FFFFFF',
                  textAlign: 'center',
                  width: '100%',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  fontSize: BOARD_PX.playerLastNameFontSize,
                  lineHeight: 1.2,
                }}
              >
                {pick.player.name.split(' ').slice(1).join(' ') || pick.player.name}
              </div>
              <div
                style={{
                  color: '#FFFFFF',
                  textAlign: 'center',
                  fontSize: BOARD_PX.playerPosTeamFontSize,
                  lineHeight: 1.2,
                  marginTop: BOARD_PX.playerPosTeamMarginTop,
                }}
              >
                {pick.player.position}-{pick.player.team}
              </div>
            </>
          ) : isCurrentPick ? (
            // Current pick - show "On The Clock"
            <div
              style={{
                fontWeight: 600,
                color: '#FFFFFF',
                fontSize: 11,
                lineHeight: 1.2,
                textAlign: 'center',
                marginTop: -2,
              }}
            >
              On The<br />Clock
            </div>
          ) : isNextUserPick ? (
            // Next user pick - show "X away"
            <div
              style={{
                color: '#9CA3AF',
                fontSize: BOARD_PX.awayFontSize,
                marginTop: BOARD_PX.awayMarginTop,
              }}
            >
              {picksAway} away
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function DraftBoard({
  picks,
  currentPickNumber,
  participants,
  userParticipantIndex,
  timer = 120,
  isDraftActive = false,
  getPickForSlot,
  initialScrollPosition = 0,
  onScrollPositionChange,
}: DraftBoardProps): React.ReactElement {
  const scrollRef = useRef<HTMLDivElement>(null);
  const boardContentRef = useRef<HTMLDivElement>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const teamCount = participants.length || 12;
  
  // Image share hook
  const { captureAndShare, isCapturing } = useImageShare({
    onSuccess: (method) => {
      logger.debug('Share successful', { method });
    },
    onError: (error) => {
      logger.error('Share failed', error instanceof Error ? error : new Error(String(error)));
    },
  });
  
  // Get user name for sharing
  const userName = participants[userParticipantIndex]?.name || 'Draft Board';
  
  // Handle share button click - open modal
  const handleShare = useCallback(() => {
    setIsShareModalOpen(true);
  }, []);
  
  // Handle image share from modal
  const handleShareImage = useCallback(() => {
    captureAndShare(boardContentRef.current, 'draft-board', userName);
  }, [captureAndShare, userName]);
  
  // Restore scroll position on mount
  useEffect(() => {
    if (scrollRef.current && initialScrollPosition > 0) {
      scrollRef.current.scrollTop = initialScrollPosition;
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  
  // Save scroll position on scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (onScrollPositionChange) {
      onScrollPositionChange(e.currentTarget.scrollTop);
    }
  }, [onScrollPositionChange]);
  
  // Determine if user is on the clock
  // Guard against division by zero (defensive programming)
  const currentRound = teamCount > 0 ? Math.ceil(currentPickNumber / teamCount) : 1;
  const isSnakeRound = currentRound % 2 === 0;
  const pickIndexInRound = teamCount > 0 ? (currentPickNumber - 1) % teamCount : 0;
  const currentParticipantIndex = isSnakeRound
    ? teamCount - 1 - pickIndexInRound
    : pickIndexInRound;
  const isUserOnClock = isDraftActive && currentParticipantIndex === userParticipantIndex;
  
  // Urgent mode when user is on the clock and timer <= 9s
  const isUrgent = isUserOnClock && timer <= 9;
  
  // User border color: red when urgent (on clock + timer <= 9s), blue otherwise
  const userBorderColor = isUrgent 
    ? BOARD_COLORS.cellBorderUserOnClock 
    : BOARD_COLORS.cellBorderUser;
  
  // Generate draft grid with snake ordering
  const draftGrid = useMemo(() => {
    const grid: { round: number; picks: PickSlot[] }[] = [];
    
    for (let round = 1; round <= BOARD_PX.totalRounds; round++) {
      const roundPicks: PickSlot[] = [];
      const isSnakeRound = round % 2 === 0;
      
      for (let displayPosition = 1; displayPosition <= teamCount; displayPosition++) {
        const participantIndex = displayPosition - 1;
        const actualPosition = isSnakeRound ? teamCount - displayPosition + 1 : displayPosition;
        const pickNumber = (round - 1) * teamCount + actualPosition;
        const pick = getPickForSlot(round, participantIndex);
        
        roundPicks.push({
          pickNumber,
          round,
          displayPosition,
          participantIndex,
          pick,
          isCurrentPick: pickNumber === currentPickNumber,
          isPastPick: pickNumber < currentPickNumber,
          isUserPick: participantIndex === userParticipantIndex,
        });
      }
      
      grid.push({ round, picks: roundPicks });
    }
    
    return grid;
  }, [teamCount, currentPickNumber, userParticipantIndex, getPickForSlot]);
  
  // Get position counts for a participant
  const getPositionCounts = (participantIndex: number): Record<Position, number> => {
    const counts: Record<Position, number> = { QB: 0, RB: 0, WR: 0, TE: 0 };
    
    picks.forEach(pick => {
      // Guard against division by zero (defensive programming)
      const round = teamCount > 0 ? Math.ceil(pick.pickNumber / teamCount) : 1;
      const isSnakeRound = round % 2 === 0;
      const pickIndexInRound = teamCount > 0 ? (pick.pickNumber - 1) % teamCount : 0;
      const pickParticipantIndex = isSnakeRound
        ? teamCount - 1 - pickIndexInRound
        : pickIndexInRound;
      
      if (pickParticipantIndex === participantIndex && pick.player) {
        const pos = pick.player.position as Position;
        if (pos in counts) {
          counts[pos]++;
        }
      }
    });
    
    return counts;
  };
  
  // Calculate picks away from current pick
  const getPicksAway = (pickNumber: number): number => {
    if (pickNumber <= currentPickNumber) return 0;
    return pickNumber - currentPickNumber;
  };
  
  // Find next user pick
  const nextUserPickNumber = useMemo(() => {
    const allUserPicks = draftGrid.flatMap(round =>
      round.picks.filter(p => p.isUserPick && p.pickNumber > currentPickNumber)
    );
    if (allUserPicks.length === 0) return null;
    return Math.min(...allUserPicks.map(p => p.pickNumber));
  }, [draftGrid, currentPickNumber]);
  
  // Auto-scroll to current pick
  useEffect(() => {
    if (scrollRef.current && isDraftActive) {
      const roundElement = scrollRef.current.querySelector(`[data-round="${currentRound}"]`);
      if (roundElement) {
        roundElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentPickNumber, isDraftActive, currentRound]);
  
  const gridMinWidth = teamCount * (BOARD_PX.cellWidth + BOARD_PX.cellMargin * 2);
  
  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: BOARD_COLORS.background,
        position: 'relative',
      }}
    >
      {/* Scrollable Grid */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        style={{
          flex: 1,
          overflow: 'auto',
          WebkitOverflowScrolling: 'touch',
          overscrollBehavior: 'contain',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        <style>{`
          .draft-board-scroll::-webkit-scrollbar {
            display: none !important;
          }
        `}</style>
        
        {/* Capturable Board Content */}
        <div ref={boardContentRef}>
          {/* Team Headers - Sticky */}
          <div
            style={{
              position: 'sticky',
              top: 0,
              zIndex: 10,
              backgroundColor: BOARD_COLORS.background,
              paddingTop: 16,
            }}
          >
            <div
              style={{
                display: 'flex',
                minWidth: gridMinWidth,
                width: 'max-content',
              }}
            >
              {participants.map((participant, index) => (
                <TeamHeader
                  key={participant.id || index}
                  participant={participant}
                  index={index}
                  isUser={index === userParticipantIndex}
                  userBorderColor={userBorderColor}
                  positionCounts={getPositionCounts(index)}
                  isOnTheClock={isDraftActive && index === currentParticipantIndex}
                />
              ))}
            </div>
          </div>
          
          {/* Draft Grid Rows */}
          <div style={{ paddingBottom: 24 }}>
            {draftGrid.map((roundData) => (
              <div
                key={roundData.round}
                data-round={roundData.round}
                style={{
                  display: 'flex',
                  minWidth: gridMinWidth,
                  width: 'max-content',
                }}
              >
                {roundData.picks.map((pickData) => (
                  <PickCell
                    key={pickData.pickNumber}
                    pickData={pickData}
                    teamCount={teamCount}
                    timer={timer}
                    userBorderColor={userBorderColor}
                    picksAway={getPicksAway(pickData.pickNumber)}
                    isNextUserPick={pickData.pickNumber === nextUserPickNumber}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Floating Share Button */}
      <button
        onClick={handleShare}
        disabled={isCapturing}
        aria-label="Share draft board as image"
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
        shareType="draft-board"
        contentName={userName}
        onShareImage={handleShareImage}
        isCapturingImage={isCapturing}
      />
    </div>
  );
}
