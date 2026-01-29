/**
 * MatchupDetailView - Side-by-side matchup comparison
 * 
 * Shows user's team vs a single opponent with:
 * - Side-by-side player rosters
 * - Shared players highlighted prominently
 * - Player status indicators (Out, Doubtful, etc.)
 * - Swipe navigation between opponents
 */

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { cn } from '@/lib/styles';
import styles from './MatchupDetailView.module.css';
import { BG_COLORS, TEXT_COLORS } from '../../../core/constants/colors';
import { SPACING, RADIUS, TYPOGRAPHY } from '../../../core/constants/sizes';
import { ChevronLeft, ChevronRight } from '../../../components/icons';
import type { PlayoffPod, PlayoffTeam, PlayoffPlayer } from '../../../../../lib/mockData/playoffTeams';

// ============================================================================
// TYPES
// ============================================================================

interface MatchupDetailViewProps {
  pod: PlayoffPod;
  opponent: PlayoffTeam;
  onBack: () => void;
  onNavigateOpponent: (opponent: PlayoffTeam) => void;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const POSITION_COLORS: Record<string, string> = {
  QB: '#F472B6',
  RB: '#0fba80',
  WR: '#FBBF25',
  TE: '#7C3AED',
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  out: { bg: 'rgba(239, 68, 68, 0.2)', text: '#ef4444' },
  doubtful: { bg: 'rgba(239, 68, 68, 0.15)', text: '#f87171' },
  questionable: { bg: 'rgba(251, 191, 37, 0.2)', text: '#fbbf24' },
  active: { bg: 'transparent', text: 'transparent' },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getSharedPlayers(userTeam: PlayoffTeam, opponent: PlayoffTeam): Set<string> {
  const userPlayerNames = new Set(userTeam.players.map(p => p.name));
  const sharedNames = new Set<string>();
  
  opponent.players.forEach(p => {
    if (userPlayerNames.has(p.name)) {
      sharedNames.add(p.name);
    }
  });
  
  return sharedNames;
}

function groupPlayersByPosition(players: PlayoffPlayer[]): Record<string, PlayoffPlayer[]> {
  const groups: Record<string, PlayoffPlayer[]> = { QB: [], RB: [], WR: [], TE: [] };
  
  players.forEach(player => {
    if (groups[player.position]) {
      groups[player.position].push(player);
    }
  });
  
  return groups;
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface PlayerChipProps {
  player: PlayoffPlayer;
  isShared: boolean;
  side: 'left' | 'right';
}

function PlayerChip({ player, isShared, side }: PlayerChipProps): React.ReactElement {
  const statusStyle = player.status ? STATUS_COLORS[player.status] : STATUS_COLORS.active;
  const positionColorVar = `--position-${player.position.toLowerCase()}`;

  return (
    <div
      className={cn(
        styles.playerChip,
        side === 'left' ? styles.playerChipLeft : styles.playerChipRight,
        isShared ? styles.playerChipShared : styles.playerChipDefault
      )}
    >
      <div
        className={side === 'left' ? styles.playerChipContentLeft : styles.playerChipContentRight}
      >
        {/* Position Badge */}
        <span
          className={cn(styles.positionBadge, styles[`positionLabel${player.position}` as keyof typeof styles])}
        >
          {player.position}
        </span>

        {/* Player Name */}
        <span
          className={isShared ? styles.playerNameShared : styles.playerNameDefault}
        >
          {player.name}
        </span>

        {/* Status Badge */}
        {player.status && player.status !== 'active' && (
          <span
            className={cn(styles.statusBadge, styles[`status${player.status.charAt(0).toUpperCase() + player.status.slice(1)}` as keyof typeof styles])}
          >
            {player.status}
          </span>
        )}

        {/* Shared Indicator */}
        {isShared && (
          <span className={styles.sharedIndicator} />
        )}
      </div>

      {/* Team & Projected */}
      <div
        className={side === 'left' ? styles.playerChipMetaLeft : styles.playerChipMeta}
      >
        <span className={styles.playerTeam}>
          {player.team}
        </span>
        <span className={styles.playerProjection}>
          {player.projectedPoints.toFixed(1)} proj
        </span>
      </div>
    </div>
  );
}

interface NavigationDotsProps {
  total: number;
  current: number;
  onSelect: (index: number) => void;
}

function NavigationDots({ total, current, onSelect }: NavigationDotsProps): React.ReactElement {
  return (
    <div className={styles.navigationDots}>
      {Array.from({ length: total }, (_, i) => (
        <button
          key={i}
          onClick={() => onSelect(i)}
          className={cn(
            current === i ? styles.navigationDotActive : styles.navigationDotInactive
          )}
          aria-label={`Go to opponent ${i + 1}`}
        />
      ))}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function MatchupDetailView({
  pod,
  opponent,
  onBack,
  onNavigateOpponent,
}: MatchupDetailViewProps): React.ReactElement {
  const containerRef = useRef<HTMLDivElement>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  
  // Get current opponent index
  const opponentIndex = useMemo(() => {
    return pod.opponents.findIndex(o => o.id === opponent.id);
  }, [pod.opponents, opponent.id]);
  
  // Get shared players
  const sharedPlayerNames = useMemo(() => {
    return getSharedPlayers(pod.userTeam, opponent);
  }, [pod.userTeam, opponent]);
  
  // Group players by position
  const userPlayersByPosition = useMemo(() => {
    return groupPlayersByPosition(pod.userTeam.players);
  }, [pod.userTeam.players]);
  
  const opponentPlayersByPosition = useMemo(() => {
    return groupPlayersByPosition(opponent.players);
  }, [opponent.players]);
  
  // Navigation handlers
  const goToPrevOpponent = useCallback(() => {
    if (opponentIndex > 0) {
      onNavigateOpponent(pod.opponents[opponentIndex - 1]);
    }
  }, [opponentIndex, pod.opponents, onNavigateOpponent]);
  
  const goToNextOpponent = useCallback(() => {
    if (opponentIndex < pod.opponents.length - 1) {
      onNavigateOpponent(pod.opponents[opponentIndex + 1]);
    }
  }, [opponentIndex, pod.opponents, onNavigateOpponent]);
  
  const goToOpponentByIndex = useCallback((index: number) => {
    if (index >= 0 && index < pod.opponents.length) {
      onNavigateOpponent(pod.opponents[index]);
    }
  }, [pod.opponents, onNavigateOpponent]);
  
  // Swipe gesture handling
  const minSwipeDistance = 50;
  
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  }, []);
  
  const onTouchMove = useCallback((e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  }, []);
  
  const onTouchEnd = useCallback(() => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe) {
      goToNextOpponent();
    } else if (isRightSwipe) {
      goToPrevOpponent();
    }
  }, [touchStart, touchEnd, goToNextOpponent, goToPrevOpponent]);
  
  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        goToPrevOpponent();
      } else if (e.key === 'ArrowRight') {
        goToNextOpponent();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToPrevOpponent, goToNextOpponent]);
  
  const advancementCount = parseInt(pod.advancementCriteria.replace('top', ''));
  
  return (
    <div
      ref={containerRef}
      className={cn('flex-1 flex flex-col min-h-0', styles.container)}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <button
            onClick={onBack}
            className={styles.backButton}
            aria-label="Back to pod"
          >
            <ChevronLeft size={16} color={TEXT_COLORS.muted} />
          </button>

          <div className={styles.headerTitle}>
            <div className={styles.headerSubtitle}>
              Matchup {opponentIndex + 1} of {pod.opponents.length}
            </div>
            <div className={styles.headerMain}>
              Week {pod.week}
            </div>
          </div>

          <div className={styles.spacer} />
        </div>
      </div>
      
      {/* Team Headers */}
      <div className={styles.teamHeadersContainer}>
        {/* User Team Header */}
        <div className={styles.teamHeaderLeft}>
          <div className={styles.teamHeaderLabel}>
            YOUR TEAM
          </div>
          <div className={styles.teamHeaderName}>
            {pod.userTeam.name}
          </div>
          <div className={styles.teamHeaderStatsLeft}>
            <span
              className={cn(
                styles.rankBadge,
                pod.userTeam.rank <= advancementCount ? styles.rankBadgeAdvancing : styles.rankBadgeEliminated
              )}
            >
              #{pod.userTeam.rank}
            </span>
            <span className={styles.pointsText}>
              {pod.userTeam.currentPoints.toFixed(1)} pts
            </span>
          </div>
        </div>

        {/* VS Divider */}
        <div className={styles.vsDivider}>
          <span className={styles.vsDividerText}>VS</span>
        </div>

        {/* Opponent Header */}
        <div className={styles.teamHeaderRight}>
          <div className={styles.teamHeaderLabel}>
            OPPONENT
          </div>
          <div className={styles.teamHeaderName}>
            {opponent.name}
          </div>
          <div className={styles.teamHeaderStatsRight}>
            <span
              className={cn(
                styles.rankBadge,
                opponent.rank <= advancementCount ? styles.rankBadgeAdvancing : styles.rankBadgeEliminated
              )}
            >
              #{opponent.rank}
            </span>
            <span className={styles.pointsText}>
              {opponent.currentPoints.toFixed(1)} pts
            </span>
          </div>
        </div>
      </div>
      
      {/* Shared Players Banner */}
      {sharedPlayerNames.size > 0 && (
        <div className={styles.sharedPlayersBanner}>
          <span className={styles.sharedPlayersIndicator} />
          <span className={styles.sharedPlayersText}>
            {sharedPlayerNames.size} Shared {sharedPlayerNames.size === 1 ? 'Player' : 'Players'}
          </span>
        </div>
      )}
      
      {/* Rosters Side by Side */}
      <div className={cn('flex-1 min-h-0 overflow-y-auto', styles.rostersContainer)}>
        {/* User Roster */}
        <div className={styles.rosterSide}>
          {(['QB', 'RB', 'WR', 'TE'] as const).map(position => {
            const players = userPlayersByPosition[position] || [];
            if (players.length === 0) return null;

            return (
              <div key={position} className={styles.positionGroup}>
                <div
                  className={cn(
                    styles.positionLabelLeft,
                    styles[`positionLabel${position}` as keyof typeof styles]
                  )}
                >
                  {position} ({players.length})
                </div>
                {players.map(player => (
                  <PlayerChip
                    key={player.id}
                    player={player}
                    isShared={sharedPlayerNames.has(player.name)}
                    side="left"
                  />
                ))}
              </div>
            );
          })}
        </div>

        {/* Opponent Roster */}
        <div className={styles.rosterSideRight}>
          {(['QB', 'RB', 'WR', 'TE'] as const).map(position => {
            const players = opponentPlayersByPosition[position] || [];
            if (players.length === 0) return null;

            return (
              <div key={position} className={styles.positionGroup}>
                <div
                  className={cn(
                    styles.positionLabel,
                    styles[`positionLabel${position}` as keyof typeof styles]
                  )}
                >
                  {position} ({players.length})
                </div>
                {players.map(player => (
                  <PlayerChip
                    key={player.id}
                    player={player}
                    isShared={sharedPlayerNames.has(player.name)}
                    side="right"
                  />
                ))}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Navigation Controls */}
      <div className={styles.navigationControls}>
        {/* Navigation Dots */}
        <NavigationDots
          total={pod.opponents.length}
          current={opponentIndex}
          onSelect={goToOpponentByIndex}
        />

        {/* Arrow Buttons */}
        <div className={styles.navigationButtons}>
          <button
            onClick={goToPrevOpponent}
            disabled={opponentIndex === 0}
            className={cn(
              styles.navigationButton,
              opponentIndex === 0 && styles.navigationButtonDisabled
            )}
          >
            <ChevronLeft size={14} color="currentColor" />
            <span>Prev</span>
          </button>

          <div className={styles.navigationHint}>
            Swipe to navigate
          </div>

          <button
            onClick={goToNextOpponent}
            disabled={opponentIndex === pod.opponents.length - 1}
            className={cn(
              styles.navigationButton,
              opponentIndex === pod.opponents.length - 1 && styles.navigationButtonDisabled
            )}
          >
            <span>Next</span>
            <ChevronRight size={14} color="currentColor" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default MatchupDetailView;

