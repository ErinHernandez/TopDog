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

import { cn } from '@/lib/styles';

import { createScopedLogger } from '../../../../lib/clientLogger';
import { Share } from '../../components/icons/actions/Share';
import { PICKS_BAR_THEME } from '../../core/constants/colors';
import { DRAFT_DEFAULTS } from '../constants';
import { useImageShare } from '../hooks/useImageShare';
import type { DraftPick, DraftPlayer, Participant, Position, DraftStatus } from '../types';

import styles from './PicksBar.module.css';
import ShareOptionsModal from './ShareOptionsModal';



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
const ScrollingUsername = React.memo<ScrollingUsernameProps>(function ScrollingUsername({
  name,
  maxChars,
  color,
  fontSize,
  fontWeight,
}) {
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
      className={cn(
        styles.scrollingUsernameContainer,
        isTruncated && styles.scrollingUsernameContainerTruncated,
        isScrolling && styles.scrollingUsernameContainerScrolling
      )}
    >
      <span
        ref={textRef}
        className={cn(
          styles.scrollingUsernameText,
          isScrolling && styles.scrollingUsernameTextScrolling
        )}
        style={{
          '--scroll-color': color,
          '--scroll-font-size': `${fontSize}px`,
          '--scroll-font-weight': fontWeight,
          '--scroll-transform': isScrolling ? `translateX(-${scrollDistance}px)` : 'translateX(0)',
          '--animation-duration': `${animationDuration}s`,
        } as React.CSSProperties & { '--scroll-color': string; '--scroll-font-size': string; '--scroll-font-weight': number; '--scroll-transform': string; '--animation-duration': string }}
      >
        {isScrolling ? fullName : displayName}
      </span>
    </div>
  );
});

// ============================================================================
// PIXEL-PERFECT CONSTANTS (matched from VX PicksBarVX.tsx)
// ============================================================================

const PICKS_BAR_PX = {
  // Container – colors from PICKS_BAR_THEME / tokens (--picks-bar-container-bg)
  containerHeight: 116,
  containerPaddingX: 8,
  containerPaddingTop: 2,
  containerPaddingBottom: 0,

  // Cards – dimensions; card bg from tokens
  cardWidth: 96,
  cardGap: 0,
  cardBorderRadius: 6,
  cardBorderWidth: 4,
  cardMargin: 1,

  // Header – matched to Board
  headerHeight: 20,
  headerFontSize: 11,
  headerMaxChars: 11,

  // Content area – matched to Board
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

  // Position tracker bar – matched to Board (narrowed by 4px)
  trackerHeight: 9,
  trackerWidth: 78,
  trackerEmptyWidth: 79,
  trackerMarginTop: 2,
  trackerBorderRadius: 1,
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
 * Format player name for card display (e.g., "J. Chase")
 */
function formatPlayerName(name: string): string {
  const parts = name.split(' ');
  if (parts.length > 1) {
    const firstName = parts[0] || '';
    const lastName = parts[parts.length - 1] || '';
    return `${firstName.charAt(0)}. ${lastName}`;
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
    const positionLower = player.position.toLowerCase();

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
        className={styles.filledCard}
        data-clickable={!!onClick}
        data-position={positionLower}
      >
        {/* Header - Participant Name centered in full colored area (header + outer border) */}
        <div
          className={styles.filledCardHeader}
        >
          <ScrollingUsername
            name={participantName}
            maxChars={PICKS_BAR_PX.headerMaxChars}
            color={player.position === 'TE' ? PICKS_BAR_THEME.headerTextLight : PICKS_BAR_THEME.headerTextDark}
            fontSize={PICKS_BAR_PX.headerFontSize}
            fontWeight={500}
          />
        </div>

        {/* Content Area */}
        <div className={styles.filledCardContent}>
          {/* Pick Number & Position Row - absolutely positioned at top */}
          <div className={styles.filledCardPickNumberRow}>
            <span>{formatPickDisplay(pickNumber, teamCount)}</span>
            <span>{player.position}</span>
          </div>

          {/* Player Names - first + last on two lines */}
          <div className={styles.filledCardPlayerNames}>
            {/* First Name */}
            <div className={styles.filledCardPlayerName}>
              {firstName}
            </div>
            {/* Last Name */}
            <div className={styles.filledCardPlayerName}>
              {lastName}
            </div>
          </div>

          {/* Team - just above tracker */}
          <div className={styles.filledCardTeam}>
            {player.team}
          </div>

          {/* Position Tracker Bar - at bottom with padding */}
          <div className={styles.filledCardTrackerContainer}>
            {participantPicks.length === 0 ? (
              <div className={styles.positionTrackerEmpty} />
            ) : (
              <div className={styles.positionTrackerFilled}>
                {POSITION_ORDER
                  .filter(pos => participantPicks.filter(p => p.position === pos).length > 0)
                  .map((pos) => {
                    const count = participantPicks.filter(p => p.position === pos).length;
                    const total = participantPicks.length;
                    return (
                      <div
                        key={pos}
                        className={styles.positionTrackerSegment}
                        data-position={pos.toLowerCase()}
                        style={{
                          '--segment-flex': count / total,
                        } as React.CSSProperties & { '--segment-flex': number }}
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
const PositionTrackerBar = React.memo(function PositionTrackerBar({ picks }: { picks: DraftPlayer[] }) {
  if (picks.length === 0) {
    return <div className={styles.positionTrackerEmpty} />;
  }

  const total = picks.length;
  return (
    <div className={styles.positionTrackerFilled}>
      {POSITION_ORDER
        .filter(pos => picks.some(p => p.position === pos))
        .map((pos) => {
          const count = picks.filter(p => p.position === pos).length;
          return (
            <div
              key={pos}
              className={styles.positionTrackerSegment}
              data-position={pos.toLowerCase()}
              style={{
                '--segment-flex': count / total,
              } as React.CSSProperties & { '--segment-flex': number }}
            />
          );
        })}
    </div>
  );
});

/** Status text shown in center of blank card */
const BlankCardStatus = React.memo(function BlankCardStatus({
  isCurrent,
  isUserPick,
  picksAway,
  timer,
  isDraftActive
}: {
  isCurrent: boolean;
  isUserPick: boolean;
  picksAway?: number;
  timer?: number;
  isDraftActive: boolean;
}) {
  if (isCurrent && isDraftActive) {
    // Only show "On The Clock" text when draft is active
    return (
      <div className={styles.blankCardStatus}>
        On The<br />Clock
      </div>
    );
  }

  if (isUserPick && picksAway !== undefined && picksAway > 0) {
    return (
      <div className={cn(styles.blankCardStatus, styles.blankCardStatusUserPick)}>
        {picksAway === 1 ? 'Up Next' : `${picksAway} away`}
      </div>
    );
  }

  return null;
});

/** Shared content area for blank cards (pick number, status, tracker) */
const BlankCardContent = React.memo(function BlankCardContent({
  pickNumber,
  teamCount,
  isCurrent,
  isUserPick,
  picksAway,
  participantPicks,
  timer,
  isDraftActive,
}: {
  pickNumber: number;
  teamCount: number;
  isCurrent: boolean;
  isUserPick: boolean;
  picksAway?: number;
  participantPicks: DraftPlayer[];
  timer?: number;
  isDraftActive: boolean;
}) {
  return (
    <div className={styles.blankCardContent}>
      {/* Pick Number Row */}
      <div className={styles.blankCardPickNumberRow}>
        <span>{formatPickDisplay(pickNumber, teamCount)}</span>
        <span></span>
      </div>

      {/* Center Content - Status */}
      <div className={styles.blankCardCenterContent}>
        <BlankCardStatus
          isCurrent={isCurrent}
          isUserPick={isUserPick}
          picksAway={picksAway}
          timer={timer}
          isDraftActive={isDraftActive}
        />
      </div>

      {/* Position Tracker Bar */}
      <div className={styles.blankCardTrackerContainer}>
        <PositionTrackerBar picks={participantPicks} />
      </div>
    </div>
  );
});

/** Derive card styling based on draft state */
function getBlankCardStyle(
  isUserPick: boolean,
  isOnTheClock: boolean,
  isPreDraft: boolean,
  timer?: number
): { cardColor: string; useTiledStyle: boolean; isUrgent: boolean } {
  const isUrgent = isOnTheClock && timer !== undefined && timer <= 9;
  
  // Determine card color from theme
  let cardColor: string;
  if (isPreDraft) {
    cardColor = PICKS_BAR_THEME.preDraft;
  } else if (isOnTheClock && isUserPick) {
    cardColor = isUrgent ? PICKS_BAR_THEME.onTheClockUrgent : PICKS_BAR_THEME.onTheClock;
  } else if (isUserPick) {
    cardColor = PICKS_BAR_THEME.userPick;
  } else {
    cardColor = PICKS_BAR_THEME.otherPick;
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

    if (useTiledStyle) {
      // Tiled image border style for user picks
      return (
        <div
          ref={ref}
          onClick={onClick}
          role="listitem"
          aria-label={ariaLabel}
          className={cn(styles.blankCard, styles.blankCardTiled, styles.blankCardTiledBg)}
          data-clickable={!!onClick}
        >
          <div className={styles.blankCardInner}>
            <div
              className={cn(styles.blankCardHeader, styles.blankCardHeaderHeight, styles.blankCardTiledBg)}
            >
              <ScrollingUsername
                name={participantName}
                maxChars={PICKS_BAR_PX.headerMaxChars}
                color={PICKS_BAR_THEME.headerTextLight}
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
              isDraftActive={isDraftActive}
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
        className={styles.blankCard}
        data-clickable={!!onClick}
        style={{
          '--blank-card-border-color': cardColor,
        } as React.CSSProperties & { '--blank-card-border-color': string }}
      >
        <div
          className={cn(styles.blankCardHeader, styles.blankCardHeaderHeight)}
          style={{
            '--blank-card-header-bg': cardColor,
          } as React.CSSProperties & { '--blank-card-header-bg': string }}
        >
          <ScrollingUsername
            name={participantName}
            maxChars={PICKS_BAR_PX.headerMaxChars}
            color={isUrgent ? PICKS_BAR_THEME.headerTextLight : (isUserPick ? PICKS_BAR_THEME.headerTextDark : PICKS_BAR_THEME.headerTextLight)}
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
          isDraftActive={isDraftActive}
        />
      </div>
    );
  }
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const PicksBar = React.memo(function PicksBar({
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
  const userName = participants[userParticipantIndex]!?.name || 'My Picks';
  
  // Handle share button click - open modal
  const handleShare = useCallback(() => {
    setIsShareModalOpen(true);
  }, []);
  
  // Handle image share from modal
  const handleShareImage = useCallback(() => {
    captureAndShare(picksContentRef.current!, 'picks', userName);
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
        const participantResult = result[pick.participantIndex];
        if (participantResult) {
          participantResult.push(pick.player);
        }
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
    <div className={styles.container}>
      {/* Scrollable Container */}
      <div
        ref={scrollRef}
        role="list"
        aria-label="Draft picks"
        className={styles.scrollableContainer}
      >
        {/* Inner flex container (capturable) */}
        {/* Padding allows first/last cards to be centered */}
        <div
          ref={picksContentRef}
          className={styles.picksContent}
          style={{
            '--picks-content-padding': `calc(50% - ${PICKS_BAR_PX.cardWidth / 2}px)`,
          } as React.CSSProperties & { '--picks-content-padding': string }}
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
          className={styles.shareButton}
        >
          {isCapturing ? (
            <div className={styles.spinnerIcon} />
          ) : (
            <Share size={18} color={PICKS_BAR_THEME.headerTextLight} strokeWidth={2} aria-hidden />
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
});

export default PicksBar;

