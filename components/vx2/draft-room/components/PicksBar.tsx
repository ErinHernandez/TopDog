/**
 * PicksBar - Horizontal Scrolling Draft Picks Bar
 * 
 * Pixel-matched to VX PicksBarVX.tsx with VX2 architecture.
 * 
 * Features:
 * - Horizontal scrolling draft picks (shows all picks)
 * - Auto-scroll to center current pick
 * - Timer display on current pick
 * - "Draft Starts In" for pre-draft countdown
 * - "X away" / "Up Next" for user's future picks
 * - Position tracker gradient bar per participant
 * - Team logos for completed picks
 * - Snake draft position calculation
 * 
 * A-Grade Requirements:
 * - TypeScript: Full type coverage
 * - Constants: Pixel-perfect values from VX
 * - Accessibility: ARIA labels, semantic markup
 * - Performance: Memoized calculations, virtualization-ready
 */

import React, { useRef, useEffect, useMemo, useState, useCallback } from 'react';
import type { DraftPick, DraftPlayer, Participant, Position, DraftStatus } from '../types';
import { POSITION_COLORS, DRAFT_DEFAULTS, TILED_BG_STYLE } from '../constants';

// ============================================================================
// SCROLLING USERNAME COMPONENT
// ============================================================================

interface ScrollingUsernameProps {
  name: string;
  maxChars: number;
  color: string;
  fontSize: number;
  fontWeight: number;
}

/**
 * Username that scrolls horizontally when tapped if truncated.
 * Shows full username with smooth scroll animation, then resets.
 */
const ScrollingUsername: React.FC<ScrollingUsernameProps> = ({
  name,
  maxChars,
  color,
  fontSize,
  fontWeight,
}) => {
  const [isScrolling, setIsScrolling] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  
  const fullName = name.toUpperCase();
  const isTruncated = name.length > maxChars;
  const displayName = isTruncated ? fullName.substring(0, maxChars) : fullName;
  
  // Calculate scroll distance
  const [scrollDistance, setScrollDistance] = useState(0);
  
  useEffect(() => {
    if (isScrolling && containerRef.current && textRef.current) {
      const containerWidth = containerRef.current.offsetWidth;
      const textWidth = textRef.current.scrollWidth;
      setScrollDistance(Math.max(0, textWidth - containerWidth + 8)); // +8 for padding
    }
  }, [isScrolling]);
  
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    if (isTruncated && !isScrolling) {
      setIsScrolling(true);
      // Auto-reset after animation
      setTimeout(() => setIsScrolling(false), 2000);
    }
  }, [isTruncated, isScrolling]);
  
  // Animation duration based on text length
  const animationDuration = Math.max(1.5, (fullName.length - maxChars) * 0.15);
  
  return (
    <div
      ref={containerRef}
      onClick={handleClick}
      style={{
        overflow: 'hidden',
        width: '100%',
        cursor: isTruncated ? 'pointer' : 'default',
        textAlign: isScrolling ? 'left' : 'center',
      }}
    >
      <span
        ref={textRef}
        style={{
          display: 'inline-block',
          color,
          fontSize,
          fontWeight,
          whiteSpace: 'nowrap',
          transform: isScrolling ? `translateX(-${scrollDistance}px)` : 'translateX(0)',
          transition: isScrolling 
            ? `transform ${animationDuration}s ease-in-out`
            : 'transform 0.3s ease-out',
        }}
      >
        {isScrolling ? fullName : displayName}
      </span>
    </div>
  );
};

// ============================================================================
// PIXEL-PERFECT CONSTANTS (matched from VX PicksBarVX.tsx)
// ============================================================================

const PICKS_BAR_PX = {
  // Container
  containerHeight: 124, // Fits card height + padding
  containerBg: '#101927',
  containerPaddingX: 8,
  containerPaddingTop: 2,
  containerPaddingBottom: 4,
  
  // Cards - EXACT match to Board's TeamHeader
  cardWidth: 96,
  cardGap: 0,
  cardBorderRadius: 6,
  cardBorderWidth: 4,
  cardMargin: 1,
  cardBg: '#374151', // gray-700 (matches Board headerBgGray)
  
  // Header - matched to Board
  headerHeight: 20,
  headerFontSize: 11,
  headerMaxChars: 11,
  
  // Content area - matched to Board
  contentMinHeight: 78,
  contentPaddingBottom: 8,
  
  // Pick number & position row
  pickNumberFontSize: 9,
  pickNumberTop: 0,
  pickNumberMarginLeft: 2,
  
  // Timer
  timerFontSize: 24,
  
  // Player name
  playerLastNameFontSize: 11,
  playerPosTeamFontSize: 10,
  playerPosTeamMarginTop: 1,
  
  // Position tracker bar - matched to Board (narrowed by 4px)
  trackerHeight: 9,
  trackerWidth: 78,
  trackerEmptyWidth: 79,
  trackerMarginTop: 2,
  trackerBorderRadius: 1,
} as const;

const CARD_COLORS = {
  // State colors
  userPick: '#1E3A5F',      // Navy blue for user's future picks (matches navbar)
  onTheClock: '#1E3A5F',    // Navy blue for on-the-clock (matches navbar tiled bg)
  onTheClockUrgent: '#DC2626', // Red when timer <= 9s (matches navbar urgent)
  preDraft: '#1E3A5F',      // Navy blue for pre-draft countdown (matches navbar)
  otherPick: '#6B7280',     // Gray for other participants
  emptyTracker: '#6B7280',  // Gray for empty position tracker
  
  // Text colors
  headerTextDark: '#000000',
  headerTextLight: '#FFFFFF',
  pickNumberText: '#6B7280',
  playerNameText: '#FFFFFF',
  awayText: '#9CA3AF',
} as const;

// Position order for tracker gradient (always: QB, RB, WR, TE)
const POSITION_ORDER: Position[] = ['QB', 'RB', 'WR', 'TE'];

// ============================================================================
// TYPES
// ============================================================================

export interface PicksBarProps {
  /** All completed picks */
  picks: DraftPick[];
  /** Current pick number (1-indexed) */
  currentPickNumber: number;
  /** List of participants */
  participants: Participant[];
  /** Index of the current user */
  userParticipantIndex: number;
  /** Timer value in seconds */
  timer?: number;
  /** Draft status */
  status?: DraftStatus;
  /** Callback when a pick card is clicked */
  onPickClick?: (pick: DraftPick) => void;
  /** Callback when a blank card is clicked */
  onBlankClick?: (pickNumber: number) => void;
}

interface PickSlot {
  pickNumber: number;
  pick: DraftPick | null;
  participantIndex: number;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get participant index for a pick number (snake draft)
 * Odd rounds: 0-11, Even rounds: 11-0
 */
function getParticipantForPick(pickNumber: number, participantCount: number): number {
  const round = Math.ceil(pickNumber / participantCount);
  const positionInRound = (pickNumber - 1) % participantCount;
  const isOddRound = round % 2 === 1;
  return isOddRound ? positionInRound : (participantCount - 1 - positionInRound);
}

/**
 * Format participant name for display
 * Removes spaces/commas, uppercase, truncated (no ellipsis)
 */
function formatParticipantName(name: string, maxLength = 12): string {
  if (!name) return 'TBD';
  const cleaned = name.replace(/[,\s]/g, '').toUpperCase();
  return cleaned.length > maxLength ? cleaned.substring(0, maxLength) : cleaned;
}

/**
 * Format pick number as Round.Pick (e.g., "1.01")
 */
function formatPickDisplay(pickNumber: number, teamCount: number): string {
  const round = Math.ceil(pickNumber / teamCount);
  const pickInRound = ((pickNumber - 1) % teamCount) + 1;
  return `${round}.${pickInRound.toString().padStart(2, '0')}`;
}

/**
 * Create position tracker gradient from picks
 * Shows proportional colors for QB, RB, WR, TE
 */
function createPositionGradient(picks: DraftPlayer[]): string {
  if (!picks || picks.length === 0) {
    return CARD_COLORS.emptyTracker;
  }
  
  // Count positions
  const counts: Record<Position, number> = { QB: 0, RB: 0, WR: 0, TE: 0 };
  picks.forEach(p => {
    if (counts.hasOwnProperty(p.position)) {
      counts[p.position]++;
    }
  });
  
  // Build gradient segments in fixed order
  const totalPicks = picks.length;
  const segments: { color: string; percent: number }[] = [];
  
  POSITION_ORDER.forEach(pos => {
    if (counts[pos] > 0) {
      segments.push({
        color: POSITION_COLORS[pos] || CARD_COLORS.emptyTracker,
        percent: (counts[pos] / totalPicks) * 100,
      });
    }
  });
  
  if (segments.length === 0) return CARD_COLORS.emptyTracker;
  if (segments.length === 1) return segments[0].color;
  
  // Build gradient stops
  let currentPercent = 0;
  const stops = segments.map(segment => {
    const start = currentPercent;
    const end = currentPercent + segment.percent;
    currentPercent = end;
    return `${segment.color} ${start}%, ${segment.color} ${end}%`;
  });
  
  return `linear-gradient(to right, ${stops.join(', ')})`;
}

/**
 * Format player name for card display (e.g., "J. Chase")
 */
function formatPlayerName(name: string): string {
  const parts = name.split(' ');
  if (parts.length > 1) {
    return `${parts[0].charAt(0)}. ${parts[parts.length - 1]}`;
  }
  return name;
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

// --- Filled Pick Card ---
interface FilledCardProps {
  pick: DraftPick;
  participantName: string;
  isCurrent: boolean;
  participantPicks: DraftPlayer[];
  teamCount: number;
  onClick?: () => void;
}

const FilledCard = React.forwardRef<HTMLDivElement, FilledCardProps>(
  function FilledCard({ pick, participantName, isCurrent, participantPicks, teamCount, onClick }, ref) {
    const { player, pickNumber } = pick;
    const positionColor = POSITION_COLORS[player.position] || CARD_COLORS.otherPick;
    
    // Split name into first and last
    const nameParts = player.name.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || player.name;
    
    return (
      <div
        ref={ref}
        onClick={onClick}
        role="listitem"
        aria-label={`Pick ${pickNumber}: ${player.name}, ${player.position} from ${player.team}`}
        style={{
          flexShrink: 0,
          flexGrow: 0,
          boxSizing: 'border-box',
          width: PICKS_BAR_PX.cardWidth,
          minWidth: PICKS_BAR_PX.cardWidth,
          maxWidth: PICKS_BAR_PX.cardWidth,
          marginTop: 4,
          marginBottom: PICKS_BAR_PX.cardMargin,
          marginLeft: PICKS_BAR_PX.cardMargin,
          marginRight: PICKS_BAR_PX.cardMargin,
          borderRadius: PICKS_BAR_PX.cardBorderRadius,
          border: `${PICKS_BAR_PX.cardBorderWidth}px solid ${positionColor}`,
          backgroundColor: PICKS_BAR_PX.cardBg,
          overflow: 'hidden',
          cursor: onClick ? 'pointer' : 'default',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}
      >
        {/* Header - Participant Name centered in full colored area (header + outer border) */}
        <div
          style={{
            height: PICKS_BAR_PX.headerHeight + (PICKS_BAR_PX.cardBorderWidth * 2),
            marginTop: -(PICKS_BAR_PX.cardBorderWidth * 2),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 4px',
            backgroundColor: positionColor,
            borderTopLeftRadius: PICKS_BAR_PX.cardBorderRadius,
            borderTopRightRadius: PICKS_BAR_PX.cardBorderRadius,
          }}
        >
          <ScrollingUsername
            name={participantName}
            maxChars={PICKS_BAR_PX.headerMaxChars}
            color={player.position === 'TE' ? '#FFFFFF' : '#000000'}
            fontSize={PICKS_BAR_PX.headerFontSize}
            fontWeight={500}
          />
        </div>
        
        {/* Content Area */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minHeight: PICKS_BAR_PX.contentMinHeight,
            position: 'relative',
          }}
        >
          {/* Pick Number & Position Row - absolutely positioned at top */}
          <div
            style={{
              position: 'absolute',
              top: PICKS_BAR_PX.pickNumberTop,
              left: PICKS_BAR_PX.pickNumberMarginLeft,
              right: PICKS_BAR_PX.pickNumberMarginLeft,
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: PICKS_BAR_PX.pickNumberFontSize,
              fontWeight: 500,
              color: '#FFFFFF',
            }}
          >
            <span>{formatPickDisplay(pickNumber, teamCount)}</span>
            <span>{player.position}</span>
          </div>
          
          {/* Player Names - first + last on two lines */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: 12,
            }}
          >
            {/* First Name */}
            <div
              style={{
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: PICKS_BAR_PX.playerLastNameFontSize,
                textAlign: 'center',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                lineHeight: 1.2,
              }}
            >
              {firstName}
            </div>
            {/* Last Name */}
            <div
              style={{
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: PICKS_BAR_PX.playerLastNameFontSize,
                textAlign: 'center',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                lineHeight: 1.2,
              }}
            >
              {lastName}
            </div>
          </div>
          
          {/* Team - just above tracker */}
          <div
            style={{
              color: '#FFFFFF',
              fontSize: PICKS_BAR_PX.playerPosTeamFontSize,
              textAlign: 'center',
              lineHeight: 1.2,
              marginBottom: 2,
            }}
          >
            {player.team}
          </div>
          
          {/* Position Tracker Bar - at bottom with padding */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              width: '100%',
              paddingBottom: 5,
            }}
          >
            {participantPicks.length === 0 ? (
              <div
                style={{
                  height: PICKS_BAR_PX.trackerHeight,
                  width: PICKS_BAR_PX.trackerEmptyWidth,
                  backgroundColor: CARD_COLORS.emptyTracker,
                  borderRadius: PICKS_BAR_PX.trackerBorderRadius,
                }}
              />
            ) : (
              <div
                style={{
                  display: 'flex',
                  height: PICKS_BAR_PX.trackerHeight,
                  width: PICKS_BAR_PX.trackerWidth,
                  borderRadius: PICKS_BAR_PX.trackerBorderRadius,
                  overflow: 'hidden',
                }}
              >
                {POSITION_ORDER
                  .filter(pos => participantPicks.filter(p => p.position === pos).length > 0)
                  .map((pos) => {
                    const count = participantPicks.filter(p => p.position === pos).length;
                    const total = participantPicks.length;
                    return (
                      <div
                        key={pos}
                        style={{
                          flex: count / total,
                          backgroundColor: POSITION_COLORS[pos],
                        }}
                      />
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
);

// --- Blank Pick Card ---
interface BlankCardProps {
  pickNumber: number;
  participantName: string;
  isCurrent: boolean;
  isUserPick: boolean;
  participantPicks: DraftPlayer[];
  teamCount: number;
  timer?: number;
  status?: DraftStatus;
  picksAway?: number;
  onClick?: () => void;
}

const BlankCard = React.forwardRef<HTMLDivElement, BlankCardProps>(
  function BlankCard({ 
    pickNumber, 
    participantName, 
    isCurrent, 
    isUserPick, 
    participantPicks, 
    teamCount,
    timer, 
    status,
    picksAway, 
    onClick 
  }, ref) {
    const isPreDraft = status === 'waiting' && pickNumber === 1;
    const isDraftActive = status === 'active';
    const isOnTheClock = isCurrent && isDraftActive;
    
    // Determine card color
    // When user is on the clock: blue normally, red when timer <= 9s
    // Blue for user's other picks, gray for everyone else
    const getCardColor = (): string => {
      if (isPreDraft) return CARD_COLORS.preDraft;
      if (isOnTheClock && isUserPick) {
        // Match navbar logic: red when urgent (<=9s), blue otherwise
        return (timer !== undefined && timer <= 9) 
          ? CARD_COLORS.onTheClockUrgent 
          : CARD_COLORS.onTheClock;
      }
      if (isUserPick) return CARD_COLORS.userPick;
      return CARD_COLORS.otherPick;
    };
    
    const cardColor = getCardColor();
    
    // Use image styling (tiled wr_blue border) for user's picks:
    // - Future picks (not on the clock)
    // - On the clock with timer > 9s (blue tiled)
    // Use solid border for:
    // - On the clock with timer <= 9s (red urgent)
    // - Non-user picks (gray)
    const isUrgent = isOnTheClock && timer !== undefined && timer <= 9;
    const usesImageStyle = isUserPick && !isUrgent;
    
    // For image-styled cards, use wrapper approach to get rounded corners with image border
    // Wrapper is larger to account for padding that acts as the "border"
    const borderWidth = PICKS_BAR_PX.cardBorderWidth;
    
    if (usesImageStyle) {
      return (
        <div
          ref={ref}
          onClick={onClick}
          role="listitem"
          aria-label={`Pick ${pickNumber}: ${participantName}${isCurrent ? ' (current)' : ''}`}
          style={{
            flexShrink: 0,
            flexGrow: 0,
            boxSizing: 'border-box',
            width: PICKS_BAR_PX.cardWidth,
            minWidth: PICKS_BAR_PX.cardWidth,
            maxWidth: PICKS_BAR_PX.cardWidth,
            marginTop: 4,
            marginBottom: PICKS_BAR_PX.cardMargin,
            marginLeft: PICKS_BAR_PX.cardMargin,
            marginRight: PICKS_BAR_PX.cardMargin,
            borderRadius: PICKS_BAR_PX.cardBorderRadius,
            ...TILED_BG_STYLE, // Image background acts as border
            padding: borderWidth, // Creates the "border" width
            cursor: onClick ? 'pointer' : 'default',
          }}
        >
          {/* Inner card content - fills available space after padding */}
          <div
            style={{
              width: '100%',
              height: '100%',
              backgroundColor: PICKS_BAR_PX.cardBg,
              borderRadius: PICKS_BAR_PX.cardBorderRadius - 2,
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Header - with tiled background, centered in full colored area */}
            <div
              style={{
                height: PICKS_BAR_PX.headerHeight + (PICKS_BAR_PX.cardBorderWidth * 2),
                marginTop: -(PICKS_BAR_PX.cardBorderWidth * 2),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 4px',
                borderTopLeftRadius: PICKS_BAR_PX.cardBorderRadius,
                borderTopRightRadius: PICKS_BAR_PX.cardBorderRadius,
                ...TILED_BG_STYLE, // Tiled background for header
              }}
            >
              <ScrollingUsername
                name={participantName}
                maxChars={PICKS_BAR_PX.headerMaxChars}
                color="#FFFFFF"
                fontSize={PICKS_BAR_PX.headerFontSize}
                fontWeight={500}
              />
            </div>
            
            {/* Content Area - matches standard card */}
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                minHeight: PICKS_BAR_PX.contentMinHeight,
                position: 'relative',
              }}
            >
              {/* Pick Number Row */}
              <div
                style={{
                  position: 'absolute',
                  top: PICKS_BAR_PX.pickNumberTop,
                  left: PICKS_BAR_PX.pickNumberMarginLeft,
                  right: PICKS_BAR_PX.pickNumberMarginLeft,
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: PICKS_BAR_PX.pickNumberFontSize,
                  fontWeight: 500,
                  color: '#FFFFFF',
                }}
              >
                <span>{formatPickDisplay(pickNumber, teamCount)}</span>
                <span></span>
              </div>
              
              {/* Center Content - Status */}
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {picksAway !== undefined && picksAway > 0 ? (
                  <div
                    style={{
                      color: '#FFFFFF',
                      fontWeight: 500,
                      fontSize: 11,
                      textAlign: 'center',
                      lineHeight: 1.2,
                    }}
                  >
                    {picksAway === 1 ? 'Up Next' : `${picksAway} away`}
                  </div>
                ) : null}
              </div>
              
              {/* Position Tracker Bar */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  width: '100%',
                  paddingBottom: 5,
                }}
              >
                {participantPicks.length === 0 ? (
                  <div
                    style={{
                      height: PICKS_BAR_PX.trackerHeight,
                      width: PICKS_BAR_PX.trackerEmptyWidth,
                      backgroundColor: CARD_COLORS.emptyTracker,
                      borderRadius: PICKS_BAR_PX.trackerBorderRadius,
                    }}
                  />
                ) : (
                  <div
                    style={{
                      display: 'flex',
                      height: PICKS_BAR_PX.trackerHeight,
                      width: PICKS_BAR_PX.trackerWidth,
                      borderRadius: PICKS_BAR_PX.trackerBorderRadius,
                      overflow: 'hidden',
                    }}
                  >
                    {POSITION_ORDER
                      .filter(pos => participantPicks.filter(p => p.position === pos).length > 0)
                      .map((pos) => {
                        const count = participantPicks.filter(p => p.position === pos).length;
                        const total = participantPicks.length;
                        return (
                          <div
                            key={pos}
                            style={{
                              flex: count / total,
                              backgroundColor: POSITION_COLORS[pos],
                            }}
                          />
                        );
                      })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    // Standard card for non-user picks, on-the-clock, and pre-draft
    return (
      <div
        ref={ref}
        onClick={onClick}
        role="listitem"
        aria-label={`Pick ${pickNumber}: ${participantName}${isCurrent ? ' (current)' : ''}`}
        style={{
          flexShrink: 0,
          flexGrow: 0,
          boxSizing: 'border-box',
          width: PICKS_BAR_PX.cardWidth,
          minWidth: PICKS_BAR_PX.cardWidth,
          maxWidth: PICKS_BAR_PX.cardWidth,
          marginTop: 4,
          marginBottom: PICKS_BAR_PX.cardMargin,
          marginLeft: PICKS_BAR_PX.cardMargin,
          marginRight: PICKS_BAR_PX.cardMargin,
          borderRadius: PICKS_BAR_PX.cardBorderRadius,
          border: `${PICKS_BAR_PX.cardBorderWidth}px solid ${cardColor}`,
          backgroundColor: PICKS_BAR_PX.cardBg,
          overflow: 'hidden',
          cursor: onClick ? 'pointer' : 'default',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}
      >
        {/* Header - Participant Name centered in full colored area (header + outer border) */}
        <div
          style={{
            height: PICKS_BAR_PX.headerHeight + (PICKS_BAR_PX.cardBorderWidth * 2),
            marginTop: -(PICKS_BAR_PX.cardBorderWidth * 2),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 4px',
            backgroundColor: cardColor,
            borderTopLeftRadius: PICKS_BAR_PX.cardBorderRadius,
            borderTopRightRadius: PICKS_BAR_PX.cardBorderRadius,
          }}
        >
          <ScrollingUsername
            name={participantName}
            maxChars={PICKS_BAR_PX.headerMaxChars}
            color={isUrgent ? '#FFFFFF' : (isUserPick ? '#000000' : '#FFFFFF')}
            fontSize={PICKS_BAR_PX.headerFontSize}
            fontWeight={500}
          />
        </div>
        
        {/* Content Area */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minHeight: PICKS_BAR_PX.contentMinHeight,
            position: 'relative',
          }}
        >
          {/* Pick Number Row - absolutely positioned at top */}
          <div
            style={{
              position: 'absolute',
              top: PICKS_BAR_PX.pickNumberTop,
              left: PICKS_BAR_PX.pickNumberMarginLeft,
              right: PICKS_BAR_PX.pickNumberMarginLeft,
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: PICKS_BAR_PX.pickNumberFontSize,
              fontWeight: 500,
              color: '#FFFFFF',
            }}
          >
            <span>{formatPickDisplay(pickNumber, teamCount)}</span>
            <span></span>
          </div>
          
          {/* Center Content - Timer or Status */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {isCurrent ? (
              <div
                style={{
                  fontWeight: 600,
                  color: '#FFFFFF',
                  fontSize: 11,
                  lineHeight: 1.2,
                  textAlign: 'center',
                  marginTop: 6,
                }}
              >
                On The<br />Clock
              </div>
            ) : isUserPick && picksAway !== undefined && picksAway > 0 ? (
              <div
                style={{
                  color: '#FFFFFF',
                  fontWeight: 500,
                  fontSize: 11,
                  textAlign: 'center',
                  lineHeight: 1.2,
                }}
              >
                {picksAway === 1 ? 'Up Next' : `${picksAway} away`}
              </div>
            ) : null}
          </div>
          
          {/* Position Tracker Bar - at bottom with padding */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              width: '100%',
              paddingBottom: 5,
            }}
          >
            {participantPicks.length === 0 ? (
              <div
                style={{
                  height: PICKS_BAR_PX.trackerHeight,
                  width: PICKS_BAR_PX.trackerEmptyWidth,
                  backgroundColor: CARD_COLORS.emptyTracker,
                  borderRadius: PICKS_BAR_PX.trackerBorderRadius,
                }}
              />
            ) : (
              <div
                style={{
                  display: 'flex',
                  height: PICKS_BAR_PX.trackerHeight,
                  width: PICKS_BAR_PX.trackerWidth,
                  borderRadius: PICKS_BAR_PX.trackerBorderRadius,
                  overflow: 'hidden',
                }}
              >
                {POSITION_ORDER
                  .filter(pos => participantPicks.filter(p => p.position === pos).length > 0)
                  .map((pos) => {
                    const count = participantPicks.filter(p => p.position === pos).length;
                    const total = participantPicks.length;
                    return (
                      <div
                        key={pos}
                        style={{
                          flex: count / total,
                          backgroundColor: POSITION_COLORS[pos],
                        }}
                      />
                    );
                  })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function PicksBar({
  picks,
  currentPickNumber,
  participants,
  userParticipantIndex,
  timer,
  status = 'active',
  onPickClick,
  onBlankClick,
}: PicksBarProps): React.ReactElement {
  const scrollRef = useRef<HTMLDivElement>(null);
  const currentPickRef = useRef<HTMLDivElement>(null);
  
  const teamCount = participants.length || DRAFT_DEFAULTS.teamCount;
  const rosterSize = DRAFT_DEFAULTS.rosterSize;
  const totalPicks = teamCount * rosterSize;
  
  // Build picks map for quick lookup
  const picksMap = useMemo(() => {
    const map = new Map<number, DraftPick>();
    picks.forEach(pick => map.set(pick.pickNumber, pick));
    return map;
  }, [picks]);
  
  // Get picks for each participant (for position tracker)
  const participantPicks = useMemo(() => {
    const result: DraftPlayer[][] = participants.map(() => []);
    picks.forEach(pick => {
      if (pick.participantIndex >= 0 && pick.participantIndex < participants.length) {
        result[pick.participantIndex].push(pick.player);
      }
    });
    return result;
  }, [picks, participants]);
  
  // Generate all pick slots
  const pickSlots = useMemo<PickSlot[]>(() => {
    const slots: PickSlot[] = [];
    for (let i = 1; i <= totalPicks; i++) {
      slots.push({
        pickNumber: i,
        pick: picksMap.get(i) || null,
        participantIndex: getParticipantForPick(i, teamCount),
      });
    }
    return slots;
  }, [totalPicks, picksMap, teamCount]);
  
  // Track if this is the initial render
  const isInitialRender = useRef(true);
  
  // Auto-scroll to current pick (centered)
  // On initial load, scroll instantly; on subsequent picks, scroll smoothly
  useEffect(() => {
    if (currentPickRef.current && scrollRef.current) {
      const container = scrollRef.current;
      const card = currentPickRef.current;
      
      const cardRect = card.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const currentScroll = container.scrollLeft;
      
      const cardLeftInContainer = cardRect.left - containerRect.left + currentScroll;
      const containerCenter = containerRect.width / 2;
      const cardCenter = cardRect.width / 2;
      
      const scrollTarget = cardLeftInContainer - containerCenter + cardCenter;
      
      container.scrollTo({
        left: Math.max(0, scrollTarget),
        behavior: isInitialRender.current ? 'instant' : 'smooth',
      });
      
      isInitialRender.current = false;
    }
  }, [currentPickNumber]);
  
  return (
    <div
      style={{
        width: '100%',
        height: PICKS_BAR_PX.containerHeight,
        backgroundColor: PICKS_BAR_PX.containerBg,
        paddingTop: PICKS_BAR_PX.containerPaddingTop,
        paddingBottom: PICKS_BAR_PX.containerPaddingBottom,
        paddingLeft: 0,
        paddingRight: 0,
      }}
    >
      {/* Scrollable Container */}
      <div
        ref={scrollRef}
        role="list"
        aria-label="Draft picks"
        className="picks-bar-scroll-vx2"
        style={{
          display: 'flex',
          gap: PICKS_BAR_PX.cardGap,
          height: '100%',
          overflowX: 'auto',
          overflowY: 'hidden',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {/* Hidden scrollbar CSS */}
        <style>{`
          .picks-bar-scroll-vx2::-webkit-scrollbar {
            width: 0px !important;
            height: 0px !important;
            display: none !important;
          }
        `}</style>
        
        {/* Inner flex container */}
        {/* Padding allows first/last cards to be centered */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            height: '100%',
            gap: PICKS_BAR_PX.cardGap,
            paddingLeft: `calc(50% - ${PICKS_BAR_PX.cardWidth / 2}px)`,
            paddingRight: `calc(50% - ${PICKS_BAR_PX.cardWidth / 2}px)`,
          }}
        >
          {pickSlots.map(({ pickNumber, pick, participantIndex }) => {
            const isCurrent = pickNumber === currentPickNumber;
            const participant = participants[participantIndex];
            const isUserPick = participantIndex === userParticipantIndex;
            const playerPicks = participantPicks[participantIndex] || [];
            
            if (pick) {
              return (
                <FilledCard
                  key={pickNumber}
                  ref={isCurrent ? currentPickRef : null}
                  pick={pick}
                  participantName={participant?.name || 'Unknown'}
                  isCurrent={isCurrent}
                  participantPicks={playerPicks}
                  teamCount={teamCount}
                  onClick={onPickClick ? () => onPickClick(pick) : undefined}
                />
              );
            }
            
            const picksAway = isUserPick && !isCurrent ? pickNumber - currentPickNumber : undefined;
            
            return (
              <BlankCard
                key={pickNumber}
                ref={isCurrent ? currentPickRef : null}
                pickNumber={pickNumber}
                participantName={participant?.name || 'Unknown'}
                isCurrent={isCurrent}
                isUserPick={isUserPick}
                participantPicks={playerPicks}
                teamCount={teamCount}
                timer={isCurrent ? timer : undefined}
                status={status}
                picksAway={picksAway}
                onClick={onBlankClick ? () => onBlankClick(pickNumber) : undefined}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

