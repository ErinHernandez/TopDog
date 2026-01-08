/**
 * PlayoffPodList - List of user's playoff pods
 * 
 * Displays all playoff pods the user has teams in,
 * with compact team cards and navigation to pod details.
 */

import React, { useState, useMemo, useCallback } from 'react';
import { BG_COLORS, TEXT_COLORS } from '../../../core/constants/colors';
import { SPACING, RADIUS, TYPOGRAPHY } from '../../../core/constants/sizes';
import { SearchInput } from '../../../components/shared/inputs';
import { ChevronRight } from '../../../components/icons';
import type { PlayoffPod, PlayoffTeam } from '../../../../../lib/mockData/playoffTeams';

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
    <div
      style={{
        backgroundColor: BG_COLORS.secondary,
        borderRadius: `${RADIUS.lg}px`,
        border: '1px solid rgba(255,255,255,0.1)',
        overflow: 'hidden',
      }}
    >
      {/* Pod Header */}
      <button
        onClick={onSelect}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 16px',
          backgroundColor: 'transparent',
          border: 'none',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: TEXT_COLORS.primary, fontSize: `${TYPOGRAPHY.fontSize.base}px`, fontWeight: 600 }}>
              {pod.name}
            </span>
            <span
              style={{
                padding: '2px 8px',
                backgroundColor: 'rgba(255,255,255,0.1)',
                borderRadius: '12px',
                fontSize: '11px',
                color: TEXT_COLORS.muted,
              }}
            >
              Week {pod.week}
            </span>
          </div>
          <div style={{ color: TEXT_COLORS.muted, fontSize: `${TYPOGRAPHY.fontSize.xs}px`, marginTop: '4px' }}>
            {pod.room} - Top {advancementCount} advance
          </div>
        </div>
        <ChevronRight size={18} color={TEXT_COLORS.muted} />
      </button>
      
      {/* User Team Quick View */}
      <button
        onClick={() => onTeamSelect(pod.userTeam)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          backgroundColor: 'rgba(59, 130, 246, 0.08)',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Rank Badge */}
          <div
            style={{
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              backgroundColor: isInAdvancementZone ? '#10b981' : '#374151',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 700,
            }}
          >
            {userRank}
          </div>
          
          <div>
            <div style={{ color: TEXT_COLORS.primary, fontSize: `${TYPOGRAPHY.fontSize.sm}px`, fontWeight: 500 }}>
              {pod.userTeam.name}
            </div>
            <div style={{ color: TEXT_COLORS.muted, fontSize: `${TYPOGRAPHY.fontSize.xs}px`, marginTop: '2px' }}>
              {pod.userTeam.currentPoints.toFixed(1)} pts - Best case: {pod.userTeam.bestCaseTotal.toFixed(1)}
            </div>
          </div>
        </div>
        
        {/* Status Indicator */}
        <div
          style={{
            padding: '4px 10px',
            borderRadius: '12px',
            backgroundColor: isInAdvancementZone ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
            color: isInAdvancementZone ? '#10b981' : '#ef4444',
            fontSize: '11px',
            fontWeight: 600,
          }}
        >
          {isInAdvancementZone ? 'Advancing' : `Need ${advancementCount - userRank + 1} spots`}
        </div>
      </button>
    </div>
  );
}

function PodCardSkeleton(): React.ReactElement {
  return (
    <div
      style={{
        backgroundColor: BG_COLORS.secondary,
        borderRadius: `${RADIUS.lg}px`,
        padding: '16px',
        height: '100px',
      }}
    >
      <div style={{ width: '120px', height: '16px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '4px' }} />
      <div style={{ width: '80px', height: '12px', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '4px', marginTop: '8px' }} />
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
        groups[pod.week].push(pod);
      }
    });
    return groups;
  }, [filteredPods]);
  
  const handleTeamSelect = useCallback((team: PlayoffTeam, pod: PlayoffPod) => {
    onSelectTeam(team, pod);
  }, [onSelectTeam]);
  
  return (
    <div
      className="flex-1 flex flex-col min-h-0"
      style={{ backgroundColor: BG_COLORS.primary }}
    >
      {/* Header */}
      <div
        style={{
          padding: `${SPACING.md}px ${SPACING.lg}px`,
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <h2 style={{ color: TEXT_COLORS.primary, fontSize: `${TYPOGRAPHY.fontSize.lg}px`, fontWeight: 700, margin: 0 }}>
          Playoff Pods
        </h2>
        <p style={{ color: TEXT_COLORS.muted, fontSize: `${TYPOGRAPHY.fontSize.xs}px`, marginTop: '4px' }}>
          {pods.length} {pods.length === 1 ? 'pod' : 'pods'} - {pods.reduce((sum, p) => sum + 1, 0)} teams
        </p>
      </div>
      
      {/* Search & Filter */}
      <div
        style={{
          padding: `${SPACING.md}px ${SPACING.lg}px`,
          borderBottom: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search pods or teams"
        />
        
        {/* Week Filter Pills */}
        <div style={{ display: 'flex', gap: '8px', marginTop: `${SPACING.sm}px` }}>
          {(['all', 15, 16, 17] as const).map((week) => (
            <button
              key={week}
              onClick={() => setWeekFilter(week)}
              style={{
                padding: '6px 14px',
                backgroundColor: weekFilter === week ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255,255,255,0.05)',
                border: weekFilter === week ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid rgba(255,255,255,0.08)',
                borderRadius: '16px',
                color: weekFilter === week ? '#60a5fa' : TEXT_COLORS.secondary,
                fontSize: '12px',
                fontWeight: weekFilter === week ? 600 : 400,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {week === 'all' ? 'All Weeks' : `Week ${week}`}
            </button>
          ))}
        </div>
      </div>
      
      {/* Pod List */}
      <div
        className="flex-1 min-h-0 overflow-y-auto"
        style={{
          padding: `${SPACING.md}px ${SPACING.lg}px`,
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: `${SPACING.md}px` }}>
            {[1, 2, 3].map(i => <PodCardSkeleton key={i} />)}
          </div>
        ) : filteredPods.length === 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: `${SPACING['2xl']}px`,
              textAlign: 'center',
            }}
          >
            <div style={{ color: TEXT_COLORS.muted, fontSize: `${TYPOGRAPHY.fontSize.sm}px` }}>
              {searchQuery ? 'No pods match your search' : 'No playoff pods yet'}
            </div>
          </div>
        ) : weekFilter === 'all' ? (
          // Show grouped by week when showing all
          <>
            {([15, 16, 17] as const).map(week => {
              const weekPods = podsByWeek[week];
              if (weekPods.length === 0) return null;
              
              return (
                <div key={week} style={{ marginBottom: `${SPACING.lg}px` }}>
                  <div
                    style={{
                      color: TEXT_COLORS.muted,
                      fontSize: `${TYPOGRAPHY.fontSize.xs}px`,
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      marginBottom: `${SPACING.sm}px`,
                    }}
                  >
                    Week {week}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: `${SPACING.md}px` }}>
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: `${SPACING.md}px` }}>
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
        <div style={{ height: `${SPACING['2xl']}px` }} />
      </div>
    </div>
  );
}

export default PlayoffPodList;

