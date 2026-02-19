/**
 * PlayoffPodDetail - Detailed view of a playoff pod
 * 
 * Shows all 12 teams in the pod with standings, best case calculations,
 * and overlap detection for the user's team vs opponents.
 */

import React, { useState, useMemo, useCallback } from 'react';

import { cn } from '@/lib/styles';

import type { PlayoffPod, PlayoffTeam, PlayoffPlayer } from '../../../../../lib/mockData/playoffTeams';
import { ChevronLeft, ChevronRight } from '../../../components/icons';
import { TEXT_COLORS } from '../../../core/constants/colors';
import { TYPOGRAPHY } from '../../../core/constants/sizes';

import styles from './PlayoffPodDetail.module.css';

// ============================================================================
// TYPES
// ============================================================================

interface PlayoffPodDetailProps {
  pod: PlayoffPod;
  onBack: () => void;
  onSelectOpponent: (opponent: PlayoffTeam) => void;
}

type StandingsSortOption = 'rank' | 'currentPoints' | 'bestCaseTotal' | 'bestCaseRank' | 'overlap';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function calculateOverlap(userTeam: PlayoffTeam, opponent: PlayoffTeam): PlayoffPlayer[] {
  const userPlayerNames = new Set(userTeam.players.map(p => p.name));
  return opponent.players.filter(p => userPlayerNames.has(p.name));
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface TeamRowProps {
  team: PlayoffTeam;
  rank: number;
  isUserTeam: boolean;
  isInAdvancementZone: boolean;
  overlapCount: number;
  onClick?: () => void;
}

function TeamRow({ team, rank, isUserTeam, isInAdvancementZone, overlapCount, onClick }: TeamRowProps): React.ReactElement {
  return (
    <button
      onClick={onClick}
      disabled={isUserTeam}
      className={cn(
        styles.teamRow,
        isUserTeam ? styles.teamRowUserTeam : styles.teamRowOpponent
      )}
    >
      {/* Rank */}
      <div
        className={cn(
          styles.rankBadge,
          isInAdvancementZone ? styles.rankBadgeAdvancing : styles.rankBadgeEliminated
        )}
      >
        {rank}
      </div>

      {/* Team Info */}
      <div className={styles.teamInfo}>
        <div className={styles.teamNameContainer}>
          <span
            className={isUserTeam ? styles.teamNameUserTeam : styles.teamName}
          >
            {team.name}
          </span>
          {isUserTeam && (
            <span className={styles.youBadge}>
              YOU
            </span>
          )}
        </div>
      </div>

      {/* Current Points */}
      <div className={styles.currentPoints}>
        {team.currentPoints.toFixed(1)}
      </div>

      {/* Best Case */}
      <div className={styles.bestCasePoints}>
        {team.bestCaseTotal.toFixed(1)}
      </div>

      {/* Overlap (only for opponents) */}
      {!isUserTeam && (
        <div className={styles.overlapColumn}>
          {overlapCount > 0 ? (
            <span className={styles.overlapBadge}>
              {overlapCount}
            </span>
          ) : (
            <span className={styles.overlapEmpty}>-</span>
          )}
        </div>
      )}

      {/* Chevron for opponents */}
      {!isUserTeam && (
        <div className={styles.chevronColumn}>
          <ChevronRight size={14} />
        </div>
      )}
    </button>
  );
}

interface SortHeaderProps {
  label: string;
  sortKey: StandingsSortOption;
  currentSort: StandingsSortOption;
  direction: 'asc' | 'desc';
  onClick: (key: StandingsSortOption) => void;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

function SortHeader({ label, sortKey, currentSort, direction, onClick, width, align = 'right' }: SortHeaderProps): React.ReactElement {
  const isActive = currentSort === sortKey;

  return (
    <button
      onClick={() => onClick(sortKey)}
      style={{ '--header-width': width } as React.CSSProperties}
      className={cn(
        styles.sortHeader,
        isActive && styles.sortHeaderActive,
        align === 'left' && styles.sortHeaderLeft,
        align === 'center' && styles.sortHeaderCenter
      )}
    >
      <span>{label}</span>
      {isActive && (
        <svg
          width="8"
          height="8"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          className={cn(styles.sortHeaderIcon, direction === 'desc' && styles.sortHeaderIconRotated)}
        >
          <polyline points="18 15 12 9 6 15" />
        </svg>
      )}
    </button>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function PlayoffPodDetail({
  pod,
  onBack,
  onSelectOpponent,
}: PlayoffPodDetailProps): React.ReactElement {
  const [sortBy, setSortBy] = useState<StandingsSortOption>('rank');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  const advancementCount = parseInt(pod.advancementCriteria.replace('top', ''));
  
  // Calculate overlap for each opponent
  const teamsWithOverlap = useMemo(() => {
    return pod.teams.map(team => ({
      team,
      overlap: team.isUserTeam ? [] : calculateOverlap(pod.userTeam, team),
      overlapCount: team.isUserTeam ? 0 : calculateOverlap(pod.userTeam, team).length,
    }));
  }, [pod]);
  
  // Sort teams
  const sortedTeams = useMemo(() => {
    const sorted = [...teamsWithOverlap].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'rank':
          comparison = a.team.rank - b.team.rank;
          break;
        case 'currentPoints':
          comparison = b.team.currentPoints - a.team.currentPoints;
          break;
        case 'bestCaseTotal':
          comparison = b.team.bestCaseTotal - a.team.bestCaseTotal;
          break;
        case 'bestCaseRank':
          comparison = a.team.bestCaseRank - b.team.bestCaseRank;
          break;
        case 'overlap':
          comparison = b.overlapCount - a.overlapCount;
          break;
      }
      
      return sortDirection === 'desc' ? -comparison : comparison;
    });
    
    return sorted;
  }, [teamsWithOverlap, sortBy, sortDirection]);
  
  const handleSortClick = useCallback((key: StandingsSortOption) => {
    if (sortBy === key) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(key);
      setSortDirection(key === 'rank' || key === 'bestCaseRank' ? 'asc' : 'desc');
    }
  }, [sortBy]);
  
  // Calculate user's position relative to advancement
  const userRank = pod.userTeam.rank;
  const isInAdvancementZone = userRank <= advancementCount;
  const pointsBehindCutoff = isInAdvancementZone 
    ? 0 
    : pod.teams.find(t => t.rank === advancementCount)!.currentPoints - pod.userTeam.currentPoints;
  
  return (
    <div className={cn('flex-1 flex flex-col min-h-0', styles.container)}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <button
            onClick={onBack}
            className={styles.backButton}
            aria-label="Back to pods"
          >
            <ChevronLeft size={16} color="#6b7280" />
          </button>

          <div className={styles.headerInfo}>
            <div className={styles.headerTitle}>
              <span className={styles.podName}>
                {pod.name}
              </span>
              <span className={styles.weekBadge}>
                Week {pod.week}
              </span>
            </div>
            <div className={styles.headerDescription}>
              {pod.room} - Top {advancementCount} advance - {pod.teams.length} teams
            </div>
          </div>
        </div>


        {/* User Status Summary */}
        <div
          className={cn(
            styles.statusSummary,
            isInAdvancementZone ? styles.statusSummaryAdvancing : styles.statusSummaryEliminated
          )}
        >
          <div className={styles.statusItem}>
            <div className={styles.statusLabel}>
              Your Rank
            </div>
            <div
              className={cn(
                styles.statusValue,
                isInAdvancementZone ? styles.statusValueAdvancing : styles.statusValueEliminated
              )}
            >
              #{userRank}
            </div>
          </div>

          <div className={styles.statusDivider} />

          <div className={styles.statusItem}>
            <div className={styles.statusLabel}>
              Current
            </div>
            <div className={styles.statusValueNeutral}>
              {pod.userTeam.currentPoints.toFixed(1)}
            </div>
          </div>

          <div className={styles.statusItem}>
            <div className={styles.statusLabel}>
              Best Case
            </div>
            <div className={styles.statusValueSecondary}>
              {pod.userTeam.bestCaseTotal.toFixed(1)}
            </div>
          </div>

          {!isInAdvancementZone && (
            <>
              <div className={styles.statusDivider} />
              <div className={styles.statusItem}>
                <div className={styles.statusLabel}>
                  Behind Cutoff
                </div>
                <div className={styles.statusValueEliminated}>
                  {pointsBehindCutoff.toFixed(1)}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* Standings Table Header */}
      <div className={styles.tableHeader}>
        <div className={styles.rankColumnSpacer} />
        <div className={styles.teamColumn}>
          <SortHeader
            label="Team"
            sortKey="rank"
            currentSort={sortBy}
            direction={sortDirection}
            onClick={handleSortClick}
            align="left"
          />
        </div>
        <SortHeader
          label="Current"
          sortKey="currentPoints"
          currentSort={sortBy}
          direction={sortDirection}
          onClick={handleSortClick}
          width="65px"
        />
        <SortHeader
          label="Best"
          sortKey="bestCaseTotal"
          currentSort={sortBy}
          direction={sortDirection}
          onClick={handleSortClick}
          width="65px"
        />
        <SortHeader
          label="Overlap"
          sortKey="overlap"
          currentSort={sortBy}
          direction={sortDirection}
          onClick={handleSortClick}
          width="40px"
          align="center"
        />
        <div className={styles.chevronSpacer} />
      </div>
      
      {/* Standings List */}
      <div className={cn('flex-1 min-h-0 overflow-y-auto', styles.standings)}>
        {sortedTeams.map(({ team, overlapCount }) => (
          <TeamRow
            key={team.id}
            team={team}
            rank={team.rank}
            isUserTeam={team.isUserTeam}
            isInAdvancementZone={team.rank <= advancementCount}
            overlapCount={overlapCount}
            onClick={team.isUserTeam ? undefined : () => onSelectOpponent(team)}
          />
        ))}

        {/* Bottom padding */}
        <div className={styles.bottomPadding} />
      </div>
    </div>
  );
}

export default PlayoffPodDetail;

