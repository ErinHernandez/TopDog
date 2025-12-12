/**
 * PicksBarVX - Version X Picks Bar (TypeScript)
 * 
 * Migrated from: components/draft/v3/mobile/apple/components/PicksBarApple.js (697 lines)
 * 
 * Features:
 * - Horizontal scrolling draft picks
 * - Auto-scroll to current pick
 * - Timer display
 * - Participant name display
 * - Position tracker gradient bars
 * - Touch-optimized for mobile
 */

import React, { useRef, useEffect, useMemo, useCallback } from 'react';
import { POSITION_COLORS, BG_COLORS, getTeamColors } from '../../constants/colors';
import { MOBILE } from '../../constants/sizes';
import { PositionBadgeInline } from '../../shared/PositionBadge';
import type { FantasyPosition, RosterPosition } from '../../constants/positions';
import type { Player, Participant, Pick } from '../../shared/types';

// Re-export types for consumers
export type { Player, Participant, Pick } from '../../shared/types';

export interface PicksBarVXProps {
  /** All picks made so far */
  picks: Pick[];
  /** Current pick number (1-indexed) */
  currentPickNumber: number;
  /** List of draft participants */
  participants: Participant[];
  /** Total roster size (for calculating blank cards) */
  rosterSize?: number;
  /** Timer value in seconds */
  timer?: number;
  /** Whether it's the current user's turn */
  isMyTurn?: boolean;
  /** Index of the current user in participants */
  currentUserIndex?: number;
  /** Callback when a pick is clicked */
  onPickClick?: (pick: Pick) => void;
  /** Callback when blank card is clicked */
  onBlankClick?: (pickNumber: number) => void;
  /** Whether the draft is active */
  isDraftActive?: boolean;
}

// ============================================================================
// CONSTANTS (pixel-perfect match to original PicksBarApple)
// ============================================================================

const CARD_WIDTH = 107;      // MOBILE_SIZES.PICKS_BAR.cardWidth
const CARD_GAP = 4;          // MOBILE_SIZES.PICKS_BAR.cardGap  
const CONTAINER_HEIGHT = 160; // Original container height
const CARD_PADDING_HORIZONTAL = 16;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/** Get formatted participant name for display (matches original - no ellipsis) */
function getParticipantDisplayName(name: string, maxLength = 12): string {
  if (!name) return 'TBD';
  // Remove spaces and commas, convert to uppercase (matches original)
  const cleaned = name.replace(/[,\s]/g, '').toUpperCase();
  // Truncate without ellipsis (matches original behavior)
  return cleaned.length > maxLength ? cleaned.substring(0, maxLength) : cleaned;
}

// Position order for tracker bar - always QB, RB, WR, TE (pink first, purple last)
const POSITION_ORDER = ['QB', 'RB', 'WR', 'TE'] as const;

/** Create position tracker gradient - always sorted QB, RB, WR, TE */
function createPositionTrackerGradient(picks: Player[]): string {
  // Show grey bar when no picks (matches original pre-draft behavior)
  if (!picks || picks.length === 0) {
    return '#6B7280'; // Grey fallback
  }

  // Count positions
  const positionCounts: Record<string, number> = { QB: 0, RB: 0, WR: 0, TE: 0 };
  picks.forEach(p => {
    if (positionCounts.hasOwnProperty(p.position)) {
      positionCounts[p.position]++;
    }
  });

  // Build gradient segments in fixed order: QB, RB, WR, TE
  const totalPicks = picks.length;
  const segments: { color: string; percent: number }[] = [];
  
  POSITION_ORDER.forEach(pos => {
    if (positionCounts[pos] > 0) {
      segments.push({
        color: POSITION_COLORS[pos] || '#6B7280',
        percent: (positionCounts[pos] / totalPicks) * 100,
      });
    }
  });

  if (segments.length === 0) {
    return '#6B7280';
  }

  if (segments.length === 1) {
    return segments[0].color;
  }

  // Build gradient stops
  let currentPercent = 0;
  const gradientStops = segments.map(segment => {
    const startPercent = currentPercent;
    const endPercent = currentPercent + segment.percent;
    currentPercent = endPercent;
    return `${segment.color} ${startPercent}%, ${segment.color} ${endPercent}%`;
  });

  return `linear-gradient(to right, ${gradientStops.join(', ')})`;
}

/** Calculate total picks in draft */
function calculateTotalPicks(participants: number, rosterSize: number): number {
  return participants * rosterSize;
}

/** Get participant for a pick number */
function getParticipantForPick(pickNumber: number, participantCount: number): number {
  // Snake draft: odd rounds go 1-12, even rounds go 12-1
  const roundNumber = Math.ceil(pickNumber / participantCount);
  const positionInRound = ((pickNumber - 1) % participantCount);
  const isOddRound = roundNumber % 2 === 1;
  
  return isOddRound ? positionInRound : (participantCount - 1 - positionInRound);
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function PicksBarVX({
  picks = [],
  currentPickNumber = 1,
  participants = [],
  rosterSize = 18,
  timer = 30,
  isMyTurn = false,
  currentUserIndex = 0,
  onPickClick,
  onBlankClick,
  isDraftActive = false,
}: PicksBarVXProps): React.ReactElement {
  const scrollRef = useRef<HTMLDivElement>(null);
  const currentPickRef = useRef<HTMLDivElement>(null);

  // Total picks
  const totalPicks = useMemo(() => 
    calculateTotalPicks(participants.length, rosterSize),
    [participants.length, rosterSize]
  );

  // Build picks map for quick lookup
  const picksMap = useMemo(() => {
    const map = new Map<number, Pick>();
    picks.forEach(pick => map.set(pick.pickNumber, pick));
    return map;
  }, [picks]);

  // Get picks for each participant
  const participantPicks = useMemo(() => {
    const result: Player[][] = participants.map(() => []);
    picks.forEach(pick => {
      if (pick.participantIndex >= 0 && pick.participantIndex < participants.length) {
        result[pick.participantIndex].push(pick.player);
      }
    });
    return result;
  }, [picks, participants]);

  // Auto-scroll to current pick - center under logo
  useEffect(() => {
    if (currentPickRef.current && scrollRef.current) {
      const scrollContainer = scrollRef.current;
      const currentCard = currentPickRef.current;
      
      // Get the card's position relative to the scroll container
      const cardRect = currentCard.getBoundingClientRect();
      const containerRect = scrollContainer.getBoundingClientRect();
      
      // Current scroll position
      const currentScroll = scrollContainer.scrollLeft;
      
      // Card's left position relative to scroll container's visible area
      const cardLeftInContainer = cardRect.left - containerRect.left + currentScroll;
      
      // Center point of the container
      const containerCenter = containerRect.width / 2;
      
      // Center point of the card
      const cardCenter = cardRect.width / 2;
      
      // Calculate scroll target to center the card
      const scrollTarget = cardLeftInContainer - containerCenter + cardCenter;
      
      scrollContainer.scrollTo({
        left: Math.max(0, scrollTarget),
        behavior: 'smooth',
      });
    }
  }, [currentPickNumber]);

  // Generate all pick slots
  const pickSlots = useMemo(() => {
    const slots: { pickNumber: number; pick: Pick | null; participantIndex: number }[] = [];
    
    for (let i = 1; i <= totalPicks; i++) {
      const pick = picksMap.get(i) || null;
      const participantIndex = getParticipantForPick(i, participants.length);
      slots.push({ pickNumber: i, pick, participantIndex });
    }
    
    return slots;
  }, [totalPicks, picksMap, participants.length]);

  return (
    <div 
      className="w-full bg-[#101927] py-3"
      style={{ 
        height: `${CONTAINER_HEIGHT}px`,
      }}
    >
      {/* Scrollable Picks - full height container */}
      <div
        ref={scrollRef}
        className="flex overflow-x-auto overflow-y-hidden h-full picks-bar-scroll"
        style={{
          gap: `${CARD_GAP}px`,
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        <style jsx global>{`
          .picks-bar-scroll::-webkit-scrollbar {
            width: 0px !important;
            height: 0px !important;
            display: none !important;
          }
        `}</style>
        <div 
          className="flex items-start h-full"
          style={{ 
            gap: `${CARD_GAP}px`,
          }}
        >
          {pickSlots.map(({ pickNumber, pick, participantIndex }) => {
            const isCurrent = pickNumber === currentPickNumber;
            const participant = participants[participantIndex];
            const isUserPick = participantIndex === currentUserIndex;

            if (pick) {
              // Filled pick card
              return (
                <PickCardVX
                  key={pickNumber}
                  ref={isCurrent ? currentPickRef : null}
                  pick={pick}
                  participantName={participant?.name || 'Unknown'}
                  isCurrent={isCurrent}
                  isUserPick={isUserPick}
                  participantPicks={participantPicks[participantIndex] || []}
                  onClick={() => onPickClick?.(pick)}
                />
              );
            }

            // Blank card
            // Calculate picks away for user's future picks
            const picksAway = isUserPick && !isCurrent ? pickNumber - currentPickNumber : undefined;
            
            // Timer for pre-draft or current pick
            const cardTimer = isCurrent ? timer : (!isDraftActive && pickNumber === 1) ? timer : undefined;
            
            return (
              <BlankCardVX
                key={pickNumber}
                ref={isCurrent ? currentPickRef : null}
                pickNumber={pickNumber}
                participantName={participant?.name || 'Unknown'}
                isCurrent={isCurrent}
                isUserPick={isUserPick}
                timer={cardTimer}
                participantPicks={participantPicks[participantIndex] || []}
                isDraftActive={isDraftActive}
                picksAway={picksAway}
                onClick={() => onBlankClick?.(pickNumber)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// PICK CARD COMPONENT
// ============================================================================

interface PickCardVXProps {
  pick: Pick;
  participantName: string;
  isCurrent: boolean;
  isUserPick: boolean;
  participantPicks: Player[];
  onClick?: () => void;
}

const PickCardVX = React.forwardRef<HTMLDivElement, PickCardVXProps>(
  function PickCardVX(
    { pick, participantName, isCurrent, isUserPick, participantPicks, onClick },
    ref
  ) {
    const { player, pickNumber } = pick;
    const positionColor = POSITION_COLORS[player.position];
    const participantCount = 12; // Standard league size
    const round = Math.ceil(pickNumber / participantCount);
    const pickInRound = ((pickNumber - 1) % participantCount) + 1;

    return (
      <div
        ref={ref}
        onClick={onClick}
        className="flex-shrink-0 relative bg-gray-800 overflow-hidden cursor-pointer"
        style={{
          width: `${CARD_WIDTH}px`,
          height: 'calc(100% - 8px)', // Match original
          minWidth: `${CARD_WIDTH}px`,
          maxWidth: `${CARD_WIDTH}px`,
          borderRadius: '6px',
          border: 'none',
          boxShadow: `inset 0 0 0 4px ${positionColor}`,
          boxSizing: 'border-box',
          flexShrink: 0,
          flexGrow: 0,
        }}
      >
        {/* Header Section - clean flexbox, no negative margins */}
        <div 
          className="text-center text-black font-medium overflow-hidden"
          style={{
            fontSize: '12px',
            lineHeight: '13px',
            padding: '6px 4px',
            backgroundColor: positionColor,
            borderRadius: '6px 6px 0 0',
          }}
        >
          {getParticipantDisplayName(participantName)}
        </div>

        {/* Player Content Area - Below Header */}
        <div className="flex-1 flex flex-col px-2 pt-0.5 pb-5">
          {/* Pick Number & Position Row */}
          <div className="flex justify-between text-gray-500 text-xs font-bold" style={{ fontSize: '11.5px' }}>
            <span style={{ letterSpacing: '-0.5px' }}>
              {`${round}.${pickInRound < 10 ? `0${pickInRound}` : pickInRound}`}
            </span>
            <span>{player.position}</span>
          </div>

          {/* Team Logo - centered */}
          <div className="flex-1 flex items-center justify-center">
            <img
              src={`/logos/nfl/${player.team?.toLowerCase()}.png`}
              alt={player.team}
              className="w-10 h-10"
              onError={(e) => {
                (e.target as HTMLImageElement).style.opacity = '0.3';
              }}
            />
          </div>

          {/* Player Name */}
          <div
            className="text-white font-bold text-center truncate"
            style={{ fontSize: '11px', marginTop: '4px' }}
          >
            {player.name.split(' ').length > 1 
              ? `${player.name.charAt(0)}. ${player.name.split(' ').pop()}`
              : player.name}
          </div>
        </div>

        {/* Position Tracker Bar - fixed position from card bottom (not content) */}
        <div
          className="absolute left-1/2 -translate-x-1/2"
          style={{
            bottom: '8px',
            height: '8px',
            width: '80%',
            borderRadius: '1.5px',
            background: createPositionTrackerGradient(participantPicks),
          }}
        />
      </div>
    );
  }
);

// ============================================================================
// BLANK CARD COMPONENT
// ============================================================================

interface BlankCardVXProps {
  pickNumber: number;
  participantName: string;
  isCurrent: boolean;
  isUserPick: boolean;
  timer?: number;
  participantPicks: Player[];
  isDraftActive?: boolean;
  picksAway?: number;
  onClick?: () => void;
}

const BlankCardVX = React.forwardRef<HTMLDivElement, BlankCardVXProps>(
  function BlankCardVX(
    { pickNumber, participantName, isCurrent, isUserPick, timer, participantPicks, isDraftActive, picksAway, onClick },
    ref
  ) {
    // Pre-draft countdown state (first pick before draft starts)
    const isPreDraft = !isDraftActive && pickNumber === 1 && timer !== undefined;
    const participantCount = 12;
    const round = Math.ceil(pickNumber / participantCount);
    const pickInRound = ((pickNumber - 1) % participantCount) + 1;
    
    // Determine card color based on state (matches original styling)
    const determineColor = (): string => {
      // Pre-draft countdown on user's first pick = blue (user's color)
      if (isPreDraft) {
        return '#3B82F6'; // Blue for pre-draft
      }
      // During active draft, on-the-clock = red
      if (isCurrent && isDraftActive) {
        return '#EF4444'; // Red for on-the-clock during draft
      }
      // User's future picks = blue
      if (isUserPick) {
        return '#3B82F6'; // Blue for user's picks
      }
      // Other picks = grey
      return '#6B7280';
    };

    const cardColor = determineColor();
    const isOnTheClock = isCurrent && isDraftActive;

    // Card styling using inset boxShadow for borders (matches original)
    const cardStyling = {
      border: 'none',
      boxShadow: `inset 0 0 0 4px ${cardColor}`,
      boxSizing: 'border-box' as const,
    };
    
    return (
      <div
        ref={ref}
        onClick={onClick}
        className="flex-shrink-0 relative bg-gray-800 overflow-hidden"
        style={{
          width: `${CARD_WIDTH}px`,
          height: 'calc(100% - 8px)', // Match original
          minWidth: `${CARD_WIDTH}px`,
          maxWidth: `${CARD_WIDTH}px`,
          borderRadius: '6px',
          flexShrink: 0,
          flexGrow: 0,
          ...cardStyling,
        }}
      >
        {/* Header Section - clean flexbox, no negative margins */}
        <div 
          className="text-center text-white font-medium overflow-hidden"
          style={{
            fontSize: '12px',
            lineHeight: '13px',
            padding: '6px 4px',
            backgroundColor: cardColor,
            borderRadius: '6px 6px 0 0',
          }}
        >
          {getParticipantDisplayName(participantName)}
        </div>

        {/* Player Content Area - Below Header */}
        <div className="flex-1 flex flex-col px-2 pt-0.5 pb-5">
          {/* Pick Number - Top Left (always visible) */}
          <div
            className="text-gray-500 text-xs font-bold"
            style={{ fontSize: '11.5px', letterSpacing: '-0.5px' }}
          >
            {`${round}.${pickInRound < 10 ? `0${pickInRound}` : pickInRound}`}
          </div>

          {/* Player Content */}
          <div className="flex-1 flex items-center justify-center">
            {/* Timer display for on-the-clock OR pre-draft countdown */}
            {(isCurrent || isPreDraft) && timer !== undefined ? (
              <div className="flex flex-col items-center" style={{ marginTop: '4px' }}>
                <div
                  className="font-bold text-white"
                  style={{
                    fontSize: '48px',
                    lineHeight: 1,
                    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {timer.toString().padStart(2, '0')}
                </div>
                {isPreDraft && (
                  <div className="text-white font-medium text-xs">
                    Draft Starts In
                  </div>
                )}
              </div>
            ) : isUserPick && picksAway !== undefined && picksAway > 0 ? (
              // Show "X away" for user's future picks
              <div 
                className="text-gray-400 font-medium text-center"
                style={{ fontSize: '13px' }}
              >
                {picksAway === 1 ? 'Up Next' : `${picksAway} away`}
              </div>
            ) : (
              // Default empty state - no content
              null
            )}
          </div>
        </div>

        {/* Position Tracker Bar - fixed position from card bottom (not content) */}
        <div
          className="absolute left-1/2 -translate-x-1/2"
          style={{
            bottom: '8px',
            height: '8px',
            width: '80%',
            borderRadius: '1.5px',
            background: createPositionTrackerGradient(participantPicks),
          }}
        />
      </div>
    );
  }
);

