/**
 * PlayoffPodList - List of user's playoff pods
 * 
 * Displays all playoff pods the user has teams in,
 * with compact team cards and navigation to pod details.
 */

import React, { useState, useMemo, useCallback } from 'react';

import { cn } from '@/lib/styles';

import type { PlayoffPod, PlayoffTeam } from '../../../../../lib/mockData/playoffTeams';
import { SearchInput } from '../../../../ui';
import { ChevronRight } from '../../../components/icons';
import { TYPOGRAPHY } from '../../../core/constants/sizes';

import styles from './PlayoffPodList.module.css';

// ============================================================================
// TYPES
// ============================================================================

interface PlayoffPodListProps {
  pods: PlayoffPod[];
  isLoading?: boolean;
  onSelectPod: (pod: PlayoffPod) => void;
  onSelectTeam: (team: PlayoffTeam, pod: PlayoffPod) => void;
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface PodCardProps {
  pod: PlayoffPod;
  onSelect: () => void;
  onTeamSelect: (team: PlayoffTeam) => void;
}

function PodCard({ pod, onSelect, onTeamSelect }: PodCardProps): React.ReactElement {
  const advancementCount = parseInt(pod.advancementCriteria.replace('top', ''));
  const userRank = pod.userTeam.rank;
  const isInAdvancementZone = userRank <= advancementCount;

  return (
    <div className={styles.podCard}>
      {/* Pod Header */}
      <button
        onClick={onSelect}
        className={styles.podCardHeader}
      >
        <div className={styles.podCardHeaderContent}>
          <div className={styles.podCardTitleContainer}>
            <span className={styles.podCardTitle}>
              {pod.name}
            </span>
            <span className={styles.podCardWeekBadge}>
              Week {pod.week}
            </span>
          </div>
          <div className={styles.podCardMeta}>
            {pod.room} - Top {advancementCount} advance
          </div>
        </div>
        <ChevronRight size={18} />
      </button>

      {/* User Team Quick View */}
      <button
        onClick={() => onTeamSelect(pod.userTeam)}
        className={styles.userTeamSection}
      >
        <div className={styles.userTeamContent}>
          {/* Rank Badge */}
          <div
            className={cn(
              styles.rankBadge,
              isInAdvancementZone ? styles.rankBadgeAdvancing : styles.rankBadgeEliminated
            )}
          >
            {userRank}
          </div>

          <div className={styles.userTeamInfo}>
            <div className={styles.userTeamName}>
              {pod.userTeam.name}
            </div>
            <div className={styles.userTeamStats}>
              {pod.userTeam.currentPoints.toFixed(1)} pts - Best case: {pod.userTeam.bestCaseTotal.toFixed(1)}
            </div>
          </div>
        </div>

        {/* Status Indicator */}
        <div
          className={cn(
            styles.userTeamStatus,
            isInAdvancementZone ? styles.userTeamStatusAdvancing : styles.userTeamStatusEliminated
          )}
        >
          {isInAdvancementZone ? 'Advancing' : `Need ${advancementCount - userRank + 1} spots`}
        </div>
      </button>
    </div>
  );
}

function PodCardSkeleton(): React.ReactElement {
  return (
    <div className={styles.skeleton}>
      <div className={styles.skeletonLineTitle} />
      <div className={styles.skeletonLineMeta} />
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function PlayoffPodList({
  pods,
  isLoading = false,
  onSelectPod,
  onSelectTeam,
}: PlayoffPodListProps): React.ReactElement {
  const [searchQuery, setSearchQuery] = useState('');
  const [weekFilter, setWeekFilter] = useState<15 | 16 | 17 | 'all'>('all');
  
  // Filter pods by search and week
  const filteredPods = useMemo(() => {
    let result = pods;
    
    // Filter by week
    if (weekFilter !== 'all') {
      result = result.filter(pod => pod.week === weekFilter);
    }
    
    // Filter by search (team name or pod name)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(pod => 
        pod.name.toLowerCase().includes(query) ||
        pod.userTeam.name.toLowerCase().includes(query)
      );
    }
    
    return result;
  }, [pods, weekFilter, searchQuery]);
  
  // Group pods by week
  const podsByWeek = useMemo(() => {
    const groups: Record<number, PlayoffPod[]> = { 15: [], 16: [], 17: [] };
    filteredPods.forEach(pod => {
      if (groups[pod.week]) {
        groups[pod.week]!.push(pod);
      }
    });
    return groups;
  }, [filteredPods]);
  
  const handleTeamSelect = useCallback((team: PlayoffTeam, pod: PlayoffPod) => {
    onSelectTeam(team, pod);
  }, [onSelectTeam]);
  
  return (
    <div className={cn('flex-1 flex flex-col min-h-0', styles.container)}>
      {/* Header */}
      <div className={styles.header}>
        <h2 className={styles.title}>
          Playoff Pods
        </h2>
        <p className={styles.subtitle}>
          {pods.length} {pods.length === 1 ? 'pod' : 'pods'} - {pods.reduce((sum, p) => sum + 1, 0)} teams
        </p>
      </div>

      {/* Search & Filter */}
      <div className={styles.filterSection}>
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search pods or teams"
        />

        {/* Week Filter Pills */}
        <div className={styles.weekFilterContainer}>
          {(['all', 15, 16, 17] as const).map((week) => (
            <button
              key={week}
              onClick={() => setWeekFilter(week)}
              className={cn(
                styles.weekFilterButton,
                weekFilter === week && styles.weekFilterButtonActive
              )}
            >
              {week === 'all' ? 'All Weeks' : `Week ${week}`}
            </button>
          ))}
        </div>
      </div>
      
      {/* Pod List */}
      <div className={cn('flex-1 min-h-0 overflow-y-auto', styles.listContainer)}>
        {isLoading ? (
          <div className={styles.loadingContainer}>
            {[1, 2, 3].map(i => <PodCardSkeleton key={i} />)}
          </div>
        ) : filteredPods.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyStateText}>
              {searchQuery ? 'No pods match your search' : 'No playoff pods yet'}
            </div>
          </div>
        ) : weekFilter === 'all' ? (
          // Show grouped by week when showing all
          <>
            {([15, 16, 17] as const).map(week => {
              const weekPods = podsByWeek[week]!;
              if (weekPods.length === 0) return null;

              return (
                <div key={week} className={styles.weekGroup}>
                  <div className={styles.weekGroupTitle}>
                    Week {week}
                  </div>
                  <div className={styles.weekGroupList}>
                    {weekPods.map(pod => (
                      <PodCard
                        key={pod.id}
                        pod={pod}
                        onSelect={() => onSelectPod(pod)}
                        onTeamSelect={(team) => handleTeamSelect(team, pod)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </>
        ) : (
          // Show flat list when filtered to specific week
          <div className={styles.flatList}>
            {filteredPods.map(pod => (
              <PodCard
                key={pod.id}
                pod={pod}
                onSelect={() => onSelectPod(pod)}
                onTeamSelect={(team) => handleTeamSelect(team, pod)}
              />
            ))}
          </div>
        )}

        {/* Bottom padding */}
        <div className={styles.bottomPadding} />
      </div>
    </div>
  );
}

export default PlayoffPodList;

