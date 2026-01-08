/**
 * PlayoffPodDetail - Detailed view of a playoff pod
 * 
 * Shows all 12 teams in the pod with standings, best case calculations,
 * and overlap detection for the user's team vs opponents.
 */

import React, { useState, useMemo, useCallback } from 'react';
import { BG_COLORS, TEXT_COLORS } from '../../../core/constants/colors';
import { SPACING, RADIUS, TYPOGRAPHY } from '../../../core/constants/sizes';
import { ChevronLeft, ChevronRight } from '../../../components/icons';
import type { PlayoffPod, PlayoffTeam, PlayoffPlayer } from '../../../../../lib/mockData/playoffTeams';

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
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        padding: '12px 14px',
        backgroundColor: isUserTeam ? 'rgba(59, 130, 246, 0.12)' : 'transparent',
        border: 'none',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        cursor: isUserTeam ? 'default' : 'pointer',
        textAlign: 'left',
        transition: 'background-color 0.15s ease',
      }}
    >
      {/* Rank */}
      <div
        style={{
          width: '28px',
          height: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '50%',
          backgroundColor: isInAdvancementZone ? '#10b981' : '#374151',
          color: '#ffffff',
          fontSize: '12px',
          fontWeight: 700,
          flexShrink: 0,
        }}
      >
        {rank}
      </div>
      
      {/* Team Info */}
      <div style={{ flex: 1, marginLeft: '12px', minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span
            style={{
              color: isUserTeam ? '#60a5fa' : TEXT_COLORS.primary,
              fontSize: '13px',
              fontWeight: isUserTeam ? 600 : 500,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {team.name}
          </span>
          {isUserTeam && (
            <span
              style={{
                padding: '1px 5px',
                backgroundColor: '#3b82f6',
                borderRadius: '4px',
                fontSize: '9px',
                fontWeight: 700,
                color: '#ffffff',
              }}
            >
              YOU
            </span>
          )}
        </div>
      </div>
      
      {/* Current Points */}
      <div
        style={{
          width: '65px',
          textAlign: 'right',
          color: TEXT_COLORS.primary,
          fontSize: '13px',
          fontWeight: 500,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {team.currentPoints.toFixed(1)}
      </div>
      
      {/* Best Case */}
      <div
        style={{
          width: '65px',
          textAlign: 'right',
          color: TEXT_COLORS.secondary,
          fontSize: '12px',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {team.bestCaseTotal.toFixed(1)}
      </div>
      
      {/* Overlap (only for opponents) */}
      {!isUserTeam && (
        <div
          style={{
            width: '40px',
            textAlign: 'center',
            marginLeft: '8px',
          }}
        >
          {overlapCount > 0 ? (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '22px',
                height: '22px',
                borderRadius: '50%',
                backgroundColor: 'rgba(251, 191, 37, 0.2)',
                color: '#fbbf24',
                fontSize: '11px',
                fontWeight: 600,
              }}
            >
              {overlapCount}
            </span>
          ) : (
            <span style={{ color: TEXT_COLORS.muted, fontSize: '11px' }}>-</span>
          )}
        </div>
      )}
      
      {/* Chevron for opponents */}
      {!isUserTeam && (
        <div style={{ marginLeft: '8px' }}>
          <ChevronRight size={14} color={TEXT_COLORS.muted} />
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
      style={{
        width,
        display: 'flex',
        alignItems: 'center',
        justifyContent: align === 'left' ? 'flex-start' : align === 'center' ? 'center' : 'flex-end',
        gap: '4px',
        padding: '0',
        backgroundColor: 'transparent',
        border: 'none',
        cursor: 'pointer',
        color: isActive ? '#60a5fa' : TEXT_COLORS.muted,
        fontSize: '10px',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
      }}
    >
      <span>{label}</span>
      {isActive && (
        <svg
          width="8"
          height="8"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          style={{ transform: direction === 'desc' ? 'rotate(180deg)' : 'rotate(0deg)' }}
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
    <div
      className="flex-1 flex flex-col min-h-0"
      style={{ backgroundColor: BG_COLORS.primary }}
    >
      {/* Header */}
      <div
        style={{
          backgroundColor: '#0c1420',
          padding: '16px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={onBack}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              display: 'flex',
              alignItems: 'center',
              borderRadius: '8px',
              transition: 'background 0.15s ease',
            }}
            aria-label="Back to pods"
          >
            <ChevronLeft size={16} color={TEXT_COLORS.muted} />
          </button>
          
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ color: TEXT_COLORS.primary, fontSize: '18px', fontWeight: 700 }}>
                {pod.name}
              </span>
              <span
                style={{
                  padding: '3px 10px',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  fontSize: '11px',
                  color: TEXT_COLORS.secondary,
                }}
              >
                Week {pod.week}
              </span>
            </div>
            <div style={{ color: TEXT_COLORS.muted, fontSize: '12px', marginTop: '4px' }}>
              {pod.room} - Top {advancementCount} advance - {pod.teams.length} teams
            </div>
          </div>
        </div>
        
        {/* User Status Summary */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginTop: '14px',
            padding: '12px 14px',
            backgroundColor: isInAdvancementZone ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            borderRadius: '10px',
            border: `1px solid ${isInAdvancementZone ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
          }}
        >
          <div>
            <div style={{ color: TEXT_COLORS.muted, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Your Rank
            </div>
            <div style={{ color: isInAdvancementZone ? '#10b981' : '#ef4444', fontSize: '24px', fontWeight: 700 }}>
              #{userRank}
            </div>
          </div>
          
          <div style={{ width: '1px', height: '36px', backgroundColor: 'rgba(255,255,255,0.1)' }} />
          
          <div>
            <div style={{ color: TEXT_COLORS.muted, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Current
            </div>
            <div style={{ color: TEXT_COLORS.primary, fontSize: '18px', fontWeight: 600 }}>
              {pod.userTeam.currentPoints.toFixed(1)}
            </div>
          </div>
          
          <div>
            <div style={{ color: TEXT_COLORS.muted, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Best Case
            </div>
            <div style={{ color: TEXT_COLORS.secondary, fontSize: '18px', fontWeight: 600 }}>
              {pod.userTeam.bestCaseTotal.toFixed(1)}
            </div>
          </div>
          
          {!isInAdvancementZone && (
            <>
              <div style={{ width: '1px', height: '36px', backgroundColor: 'rgba(255,255,255,0.1)' }} />
              <div>
                <div style={{ color: TEXT_COLORS.muted, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Behind Cutoff
                </div>
                <div style={{ color: '#ef4444', fontSize: '18px', fontWeight: 600 }}>
                  {pointsBehindCutoff.toFixed(1)}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* Standings Table Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '10px 14px',
          backgroundColor: '#0d1520',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div style={{ width: '28px' }} /> {/* Rank column spacer */}
        <div style={{ flex: 1, marginLeft: '12px' }}>
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
        <div style={{ width: '22px' }} /> {/* Chevron spacer */}
      </div>
      
      {/* Standings List */}
      <div
        className="flex-1 min-h-0 overflow-y-auto"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
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
        <div style={{ height: `${SPACING['2xl']}px` }} />
      </div>
    </div>
  );
}

export default PlayoffPodDetail;

