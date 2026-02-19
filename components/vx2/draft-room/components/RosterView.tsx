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

import { cn } from '@/lib/styles';

import { createScopedLogger } from '../../../../lib/clientLogger';
import { Share } from '../../components/icons/actions/Share';
import { TEXT_COLORS } from '../../core/constants/colors';
import { useImageShare } from '../hooks/useImageShare';
import type { DraftPick, Participant, Position, DraftPlayer } from '../types';

import PlayerExpandedCard from './PlayerExpandedCard';
import styles from './RosterView.module.css';
import ShareOptionsModal from './ShareOptionsModal';



const logger = createScopedLogger('[RosterView]');

// ============================================================================
// PIXEL-PERFECT CONSTANTS (matched from VX RosterPanelVX.tsx)
// ============================================================================

const ROSTER_PX = {
  // Header
  headerPaddingTop: -6,
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

// Roster colors: use ROSTER_THEME from core/constants/colors for inline styles; CSS uses var(--...) tokens.

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
  /** Callback to allow external control of selected participant index */
  onParticipantSelect?: (index: number) => void;
  /** External control of selected participant index (if provided, overrides internal state) */
  selectedParticipantIndex?: number;
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

const PositionBadge = React.memo(function PositionBadge({ position, size }: PositionBadgeProps): React.ReactElement {
  const sizeClasses = {
    sm: styles.badgeSm,
    md: styles.badgeMd,
    lg: styles.badgeLg,
    xl: styles.badgeXl,
  };

  // Special three-color gradient for FLEX (RB green, WR yellow, TE purple)
  if (position === 'FLEX') {
    return (
      <div className={cn(styles.badge, styles.flexBadge, sizeClasses[size])} data-position="flex">
        {/* Three-color background stripes */}
        <div className={styles.flexBadgeBackground}>
          <div className={cn(styles.flexBadgeStripe, styles.flexBadgeStripeRb)} />
          <div className={cn(styles.flexBadgeStripe, styles.flexBadgeStripeWr)} />
          <div className={cn(styles.flexBadgeStripe, styles.flexBadgeStripeTe)} />
        </div>
        {/* Text overlay */}
        <span className={styles.flexBadgeText}>FLEX</span>
      </div>
    );
  }

  return (
    <div
      className={cn(styles.badge, sizeClasses[size])}
      data-position={position.toLowerCase()}
    >
      {position}
    </div>
  );
});

interface RosterRowProps {
  position: RosterPosition;
  player: DraftPlayer | null;
  isStarter: boolean;
  showTopBorder?: boolean;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

const RosterRow = React.memo(function RosterRow({ position, player, isStarter, showTopBorder = false, isExpanded = false, onToggleExpand }: RosterRowProps): React.ReactElement {
  const badgeSize: 'sm' | 'md' | 'lg' | 'xl' = (isStarter || !player) ? 'lg' : 'md';
  const displayPosition = player ? player.position : position;

  return (
    <div>
      <div
        onClick={player ? onToggleExpand : undefined}
        className={cn(
          styles.rosterRow,
          player && styles.interactive,
          isExpanded && styles.expanded,
          showTopBorder && styles.withTopBorder
        )}
      >
        {/* Position Badge Column */}
        <div className={styles.badgeColumn}>
          <PositionBadge position={displayPosition} size={badgeSize} />
        </div>

        {/* Player Content */}
        {player ? (
          <div className={styles.playerContent}>
            {/* Player Name */}
            <div className={styles.playerName}>{player.name}</div>

            {/* Team (Bye) */}
            <div className={styles.teamByeDisplay}>
              {player.team} ({getByeWeek(player.team) || 'TBD'})
            </div>
          </div>
        ) : (
          <div className={styles.emptyContent} />
        )}
      </div>

      {/* Expanded Stats Card */}
      {isExpanded && player && (
        <div className={styles.expandedCardWrapper}>
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
});

interface TeamSelectorProps {
  participants: Participant[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  onTheClockIndex: number;
  draftDirectionUp: boolean;
}

const TeamSelector = React.memo(function TeamSelector({
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
    <div className={styles.selectorWrapper}>
      <div ref={dropdownRef} className={styles.dropdownContainer}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          className={styles.dropdownButton}
        >
          <div className={styles.dropdownButtonText}>
            {selectedParticipant?.name || 'Select Team'}
          </div>
          <div className={styles.chevronContainer}>
            <svg
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              className={styles.chevronIcon}
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div role="listbox" className={styles.dropdownMenu}>
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
                  className={styles.dropdownItem}
                >
                  {/* Draft direction arrow */}
                  <div className={styles.draftArrow}>
                    {isOnTheClock && (
                      <svg
                        width={ROSTER_PX.dropdownArrowSize}
                        height={ROSTER_PX.dropdownArrowSize}
                        viewBox="0 0 24 24"
                        fill="none"
                      >
                        <path
                          d={draftDirectionUp
                            ? "M12 19V5M12 5L5 12M12 5L19 12" // Up arrow
                            : "M12 5V19M12 19L5 12M12 19L19 12" // Down arrow
                          }
                          stroke="var(--color-draft-arrow)"
                          strokeWidth={3}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </div>
                  <div className={styles.dropdownItemText}>{participant.name}</div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
});

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const RosterView = React.memo(function RosterView({
  picks,
  participants,
  userParticipantIndex,
  currentPickNumber = 1,
  getPicksForParticipant,
  initialScrollPosition = 0,
  onScrollPositionChange,
  onParticipantSelect,
  selectedParticipantIndex: externalSelectedIndex,
}: RosterViewProps): React.ReactElement {
  const [internalSelectedIndex, setInternalSelectedIndex] = useState(userParticipantIndex);
  
  // Use external selectedIndex if provided, otherwise use internal state
  const selectedIndex = externalSelectedIndex !== undefined ? externalSelectedIndex : internalSelectedIndex;
  
  // Update function that handles both internal state and external callback
  const setSelectedIndex = useCallback((index: number) => {
    if (externalSelectedIndex === undefined) {
      setInternalSelectedIndex(index);
    }
    onParticipantSelect?.(index);
  }, [externalSelectedIndex, onParticipantSelect]);
  
  // Sync internal state when external prop changes
  useEffect(() => {
    if (externalSelectedIndex !== undefined) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing external state on mount
      setInternalSelectedIndex(externalSelectedIndex);
    }
  }, [externalSelectedIndex]);
  const [expandedPlayerId, setExpandedPlayerId] = useState<string | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const rosterContentRef = useRef<HTMLDivElement>(null);
  
  // Image share hook
  const { captureAndShare, isCapturing } = useImageShare({
    onSuccess: (method) => {
      logger.debug('Share successful', { method });
    },
    onError: (error) => {
      logger.error('Share failed', error instanceof Error ? error : new Error(String(error)));
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
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional setState in effect
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
    const players = participantPicks.map(pick => pick.player);
    
    // CRITICAL: Deduplicate by player ID to prevent same player appearing multiple times
    const seenPlayerIds = new Set<string>();
    const uniquePlayers: DraftPlayer[] = [];
    
    for (const player of players) {
      if (!seenPlayerIds.has(player.id)) {
        seenPlayerIds.add(player.id);
        uniquePlayers.push(player);
      }
    }
    
    return uniquePlayers;
  };
  
  const team = getTeamForParticipant(selectedIndex);
  
  return (
    <div className={styles.container}>
      {/* Header with Dropdown - fixed at top */}
      <div className={styles.headerSection}>
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
        className={styles.rosterContainer}
      >
        {/* Capturable Roster Content */}
        <div ref={rosterContentRef} className={styles.rosterContent}>
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
          <div className={styles.benchHeader}>BENCH</div>

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
        className={cn(styles.shareButton, isCapturing && 'disabled')}
      >
        {isCapturing ? (
          <div className={styles.shareButtonSpinner} />
        ) : (
          <Share size={24} color={TEXT_COLORS.primary} strokeWidth={2} aria-hidden />
        )}
      </button>

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
});

export default RosterView;
