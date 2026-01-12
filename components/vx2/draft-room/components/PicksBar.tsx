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
import { useImageShare } from '../hooks/useImageShare';
import { Share } from '../../components/icons/actions/Share';
import ShareOptionsModal from './ShareOptionsModal';
import { createScopedLogger } from '../../../../lib/clientLogger';

const logger = createScopedLogger('[PicksBar]');

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
  containerHeight: 116, // Fits card height + padding (reduced by 8px)
  containerBg: '#101927',
  containerPaddingX: 8,
  containerPaddingTop: 2,
  containerPaddingBottom: 0,
  
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
  /** Enable image share functionality */
  enableShare?: boolean;
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

// ============================================================================
// BLANK CARD SUB-COMPONENTS
// ============================================================================

/** Position tracker bar showing draft composition by position */
function PositionTrackerBar({ picks }: { picks: DraftPlayer[] }) {
  if (picks.length === 0) {
    return (
      <div
        style={{
          height: PICKS_BAR_PX.trackerHeight,
          width: PICKS_BAR_PX.trackerEmptyWidth,
          backgroundColor: CARD_COLORS.emptyTracker,
          borderRadius: PICKS_BAR_PX.trackerBorderRadius,
        }}
      />
    );
  }

  const total = picks.length;
  return (
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
        .filter(pos => picks.some(p => p.position === pos))
        .map((pos) => {
          const count = picks.filter(p => p.position === pos).length;
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
  );
}

/** Status text shown in center of blank card */
function BlankCardStatus({ 
  isCurrent, 
  isUserPick, 
  picksAway,
  timer
}: { 
  isCurrent: boolean; 
  isUserPick: boolean; 
  picksAway?: number;
  timer?: number;
}) {
  if (isCurrent) {
    // Show timer instead of "On The Clock" text
    if (timer !== undefined && timer !== null) {
      return (
        <div
          style={{
            fontWeight: 700,
            color: '#FFFFFF',
            fontSize: 24,
            lineHeight: 1.2,
            textAlign: 'center',
            marginTop: 6,
            fontVariantNumeric: 'tabular-nums',
          }}
          aria-label={`${timer} seconds remaining${isUserPick ? ', your turn' : ''}`}
          aria-live="polite"
        >
          {timer}
        </div>
      );
    }
    
    // Fallback to "On The Clock" if timer not available
    return (
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
    );
  }
  
  if (isUserPick && picksAway !== undefined && picksAway > 0) {
    return (
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
    );
  }
  
  return null;
}

/** Shared content area for blank cards (pick number, status, tracker) */
function BlankCardContent({
  pickNumber,
  teamCount,
  isCurrent,
  isUserPick,
  picksAway,
  participantPicks,
  timer,
}: {
  pickNumber: number;
  teamCount: number;
  isCurrent: boolean;
  isUserPick: boolean;
  picksAway?: number;
  participantPicks: DraftPlayer[];
  timer?: number;
}) {
  return (
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
        <BlankCardStatus 
          isCurrent={isCurrent} 
          isUserPick={isUserPick} 
          picksAway={picksAway}
          timer={timer}
        />
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
        <PositionTrackerBar picks={participantPicks} />
      </div>
    </div>
  );
}

/** Derive card styling based on draft state */
function getBlankCardStyle(
  isUserPick: boolean,
  isOnTheClock: boolean,
  isPreDraft: boolean,
  timer?: number
): { cardColor: string; useTiledStyle: boolean; isUrgent: boolean } {
  const isUrgent = isOnTheClock && timer !== undefined && timer <= 9;
  
  // Determine card color
  let cardColor: string;
  if (isPreDraft) {
    cardColor = CARD_COLORS.preDraft;
  } else if (isOnTheClock && isUserPick) {
    cardColor = isUrgent ? CARD_COLORS.onTheClockUrgent : CARD_COLORS.onTheClock;
  } else if (isUserPick) {
    cardColor = CARD_COLORS.userPick;
  } else {
    cardColor = CARD_COLORS.otherPick;
  }
  
  // Use tiled image style for user's picks (except urgent)
  const useTiledStyle = isUserPick && !isUrgent;
  
  return { cardColor, useTiledStyle, isUrgent };
}

// ============================================================================
// BLANK CARD MAIN COMPONENT
// ============================================================================

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
    
    const { cardColor, useTiledStyle, isUrgent } = getBlankCardStyle(
      isUserPick, isOnTheClock, isPreDraft, timer
    );
    
    const borderWidth = PICKS_BAR_PX.cardBorderWidth;
    const ariaLabel = `Pick ${pickNumber}: ${participantName}${isCurrent ? ' (current)' : ''}`;
    
    // Shared card wrapper styles
    const cardWrapperStyle: React.CSSProperties = {
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
      cursor: onClick ? 'pointer' : 'default',
    };
    
    // Header styles
    const headerBaseStyle: React.CSSProperties = {
      height: PICKS_BAR_PX.headerHeight + (borderWidth * 2),
      marginTop: -(borderWidth * 2),
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '0 4px',
      borderTopLeftRadius: PICKS_BAR_PX.cardBorderRadius,
      borderTopRightRadius: PICKS_BAR_PX.cardBorderRadius,
    };
    
    if (useTiledStyle) {
      // Tiled image border style for user picks
      return (
        <div
          ref={ref}
          onClick={onClick}
          role="listitem"
          aria-label={ariaLabel}
          style={{
            ...cardWrapperStyle,
            ...TILED_BG_STYLE,
            padding: borderWidth,
          }}
        >
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
            <div style={{ ...headerBaseStyle, ...TILED_BG_STYLE }}>
              <ScrollingUsername
                name={participantName}
                maxChars={PICKS_BAR_PX.headerMaxChars}
                color="#FFFFFF"
                fontSize={PICKS_BAR_PX.headerFontSize}
                fontWeight={500}
              />
            </div>
            <BlankCardContent
              pickNumber={pickNumber}
              teamCount={teamCount}
              isCurrent={isCurrent}
              isUserPick={isUserPick}
              picksAway={picksAway}
              participantPicks={participantPicks}
              timer={timer}
            />
          </div>
        </div>
      );
    }
    
    // Solid border style for non-user picks, urgent, and pre-draft
    return (
      <div
        ref={ref}
        onClick={onClick}
        role="listitem"
        aria-label={ariaLabel}
        style={{
          ...cardWrapperStyle,
          border: `${borderWidth}px solid ${cardColor}`,
          backgroundColor: PICKS_BAR_PX.cardBg,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
        }}
      >
        <div style={{ ...headerBaseStyle, backgroundColor: cardColor }}>
          <ScrollingUsername
            name={participantName}
            maxChars={PICKS_BAR_PX.headerMaxChars}
            color={isUrgent ? '#FFFFFF' : (isUserPick ? '#000000' : '#FFFFFF')}
            fontSize={PICKS_BAR_PX.headerFontSize}
            fontWeight={500}
          />
        </div>
        <BlankCardContent
          pickNumber={pickNumber}
          teamCount={teamCount}
          isCurrent={isCurrent}
          isUserPick={isUserPick}
          picksAway={picksAway}
          participantPicks={participantPicks}
          timer={timer}
        />
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
  enableShare = false,
}: PicksBarProps): React.ReactElement {
  const scrollRef = useRef<HTMLDivElement>(null);
  const currentPickRef = useRef<HTMLDivElement>(null);
  const picksContentRef = useRef<HTMLDivElement>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  
  const teamCount = participants.length || DRAFT_DEFAULTS.teamCount;
  const rosterSize = DRAFT_DEFAULTS.rosterSize;
  const totalPicks = teamCount * rosterSize;
  
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
  const userName = participants[userParticipantIndex]?.name || 'My Picks';
  
  // Handle share button click - open modal
  const handleShare = useCallback(() => {
    setIsShareModalOpen(true);
  }, []);
  
  // Handle image share from modal
  const handleShareImage = useCallback(() => {
    captureAndShare(picksContentRef.current, 'picks', userName);
  }, [captureAndShare, userName]);
  
  // Build picks map for quick lookup
  const picksMap = useMemo(() => {
    const map = new Map<number, DraftPick>();
    picks.forEach(pick => map.set(pick.pickNumber, pick));
    return map;
  }, [picks]);
  
  // Get picks for each participant (for position tracker)
  const participantPicks = useMemo((): DraftPlayer[][] => {
    const result: DraftPlayer[][] = participants.map((): DraftPlayer[] => []);
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
  
  // Find the user's next upcoming pick (for picksAway calculation)
  const nextUserPickNumber = useMemo(() => {
    if (status !== 'active') return null;
    for (let i = currentPickNumber + 1; i <= totalPicks; i++) {
      const participantIndex = getParticipantForPick(i, teamCount);
      if (participantIndex === userParticipantIndex && !picksMap.has(i)) {
        return i; // Found the next blank user pick
      }
    }
    return null; // No more user picks remaining
  }, [currentPickNumber, userParticipantIndex, teamCount, totalPicks, picksMap, status]);
  
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
        position: 'relative',
        marginTop: 8,
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
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
        
        {/* Inner flex container (capturable) */}
        {/* Padding allows first/last cards to be centered */}
        <div
          ref={picksContentRef}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            height: '100%',
            gap: PICKS_BAR_PX.cardGap,
            paddingLeft: `calc(50% - ${PICKS_BAR_PX.cardWidth / 2}px)`,
            paddingRight: `calc(50% - ${PICKS_BAR_PX.cardWidth / 2}px)`,
            backgroundColor: PICKS_BAR_PX.containerBg,
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
            
            // Only show picksAway for the user's next upcoming pick, not all future picks
            const isNextUserPick = pickNumber === nextUserPickNumber;
            const picksAway = isNextUserPick && !isCurrent && status === 'active' 
              ? pickNumber - currentPickNumber 
              : undefined;
            
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
      
      {/* Floating Share Button */}
      {enableShare && (
        <button
          onClick={handleShare}
          disabled={isCapturing}
          aria-label="Share picks bar as image"
          style={{
            position: 'absolute',
            bottom: 8,
            right: 8,
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: '#3B82F6',
            border: 'none',
            cursor: isCapturing ? 'wait' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
            opacity: isCapturing ? 0.7 : 1,
            transition: 'opacity 0.2s, transform 0.2s',
            zIndex: 20,
          }}
        >
          {isCapturing ? (
            <div
              style={{
                width: 16,
                height: 16,
                border: '2px solid #FFFFFF',
                borderTopColor: 'transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
              }}
            />
          ) : (
            <Share size={18} color="#FFFFFF" strokeWidth={2} aria-hidden />
          )}
        </button>
      )}
      
      {/* Share Options Modal */}
      {enableShare && (
        <ShareOptionsModal
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          shareType="picks"
          contentName={userName}
          onShareImage={handleShareImage}
          isCapturingImage={isCapturing}
        />
      )}
    </div>
  );
}

