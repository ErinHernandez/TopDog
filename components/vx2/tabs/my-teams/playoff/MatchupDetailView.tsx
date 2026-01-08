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
  
  return (
    <div
      style={{
        display: 'flex',
        alignItems: side === 'left' ? 'flex-end' : 'flex-start',
        flexDirection: 'column',
        padding: '8px 10px',
        backgroundColor: isShared ? 'rgba(251, 191, 37, 0.12)' : 'rgba(255,255,255,0.03)',
        borderRadius: '8px',
        border: isShared ? '1px solid rgba(251, 191, 37, 0.3)' : '1px solid rgba(255,255,255,0.05)',
        marginBottom: '6px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          flexDirection: side === 'left' ? 'row-reverse' : 'row',
        }}
      >
        {/* Position Badge */}
        <span
          style={{
            fontSize: '9px',
            fontWeight: 700,
            color: POSITION_COLORS[player.position] || TEXT_COLORS.muted,
            textTransform: 'uppercase',
          }}
        >
          {player.position}
        </span>
        
        {/* Player Name */}
        <span
          style={{
            fontSize: '12px',
            fontWeight: isShared ? 600 : 500,
            color: isShared ? '#fbbf24' : TEXT_COLORS.primary,
          }}
        >
          {player.name}
        </span>
        
        {/* Status Badge */}
        {player.status && player.status !== 'active' && (
          <span
            style={{
              padding: '1px 5px',
              backgroundColor: statusStyle.bg,
              borderRadius: '4px',
              fontSize: '8px',
              fontWeight: 600,
              color: statusStyle.text,
              textTransform: 'uppercase',
            }}
          >
            {player.status}
          </span>
        )}
        
        {/* Shared Indicator */}
        {isShared && (
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: '#fbbf24',
            }}
          />
        )}
      </div>
      
      {/* Team & Projected */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginTop: '3px',
          flexDirection: side === 'left' ? 'row-reverse' : 'row',
        }}
      >
        <span style={{ fontSize: '10px', color: TEXT_COLORS.muted }}>
          {player.team}
        </span>
        <span style={{ fontSize: '10px', color: TEXT_COLORS.secondary }}>
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
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        padding: '12px 0',
      }}
    >
      {Array.from({ length: total }, (_, i) => (
        <button
          key={i}
          onClick={() => onSelect(i)}
          style={{
            width: current === i ? '16px' : '8px',
            height: '8px',
            borderRadius: '4px',
            backgroundColor: current === i ? '#3b82f6' : 'rgba(255,255,255,0.2)',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
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
      className="flex-1 flex flex-col min-h-0"
      style={{ backgroundColor: BG_COLORS.primary }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Header */}
      <div
        style={{
          backgroundColor: '#0c1420',
          padding: '14px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
            }}
            aria-label="Back to pod"
          >
            <ChevronLeft size={16} color={TEXT_COLORS.muted} />
          </button>
          
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: TEXT_COLORS.muted, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Matchup {opponentIndex + 1} of {pod.opponents.length}
            </div>
            <div style={{ color: TEXT_COLORS.primary, fontSize: '14px', fontWeight: 600, marginTop: '2px' }}>
              Week {pod.week}
            </div>
          </div>
          
          <div style={{ width: '40px' }} /> {/* Spacer for alignment */}
        </div>
      </div>
      
      {/* Team Headers */}
      <div
        style={{
          display: 'flex',
          backgroundColor: '#0d1520',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        {/* User Team Header */}
        <div
          style={{
            flex: 1,
            padding: '12px',
            borderRight: '1px solid rgba(255,255,255,0.05)',
            textAlign: 'right',
          }}
        >
          <div style={{ color: '#60a5fa', fontSize: '11px', fontWeight: 600, marginBottom: '2px' }}>
            YOUR TEAM
          </div>
          <div style={{ color: TEXT_COLORS.primary, fontSize: '13px', fontWeight: 500 }}>
            {pod.userTeam.name}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
            <span
              style={{
                padding: '2px 8px',
                backgroundColor: pod.userTeam.rank <= advancementCount ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                borderRadius: '10px',
                fontSize: '10px',
                fontWeight: 600,
                color: pod.userTeam.rank <= advancementCount ? '#10b981' : '#ef4444',
              }}
            >
              #{pod.userTeam.rank}
            </span>
            <span style={{ color: TEXT_COLORS.secondary, fontSize: '12px' }}>
              {pod.userTeam.currentPoints.toFixed(1)} pts
            </span>
          </div>
        </div>
        
        {/* VS Divider */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 8px',
            backgroundColor: 'rgba(255,255,255,0.02)',
          }}
        >
          <span style={{ color: TEXT_COLORS.muted, fontSize: '10px', fontWeight: 700 }}>VS</span>
        </div>
        
        {/* Opponent Header */}
        <div
          style={{
            flex: 1,
            padding: '12px',
            borderLeft: '1px solid rgba(255,255,255,0.05)',
            textAlign: 'left',
          }}
        >
          <div style={{ color: TEXT_COLORS.muted, fontSize: '11px', fontWeight: 600, marginBottom: '2px' }}>
            OPPONENT
          </div>
          <div style={{ color: TEXT_COLORS.primary, fontSize: '13px', fontWeight: 500 }}>
            {opponent.name}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
            <span
              style={{
                padding: '2px 8px',
                backgroundColor: opponent.rank <= advancementCount ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                borderRadius: '10px',
                fontSize: '10px',
                fontWeight: 600,
                color: opponent.rank <= advancementCount ? '#10b981' : '#ef4444',
              }}
            >
              #{opponent.rank}
            </span>
            <span style={{ color: TEXT_COLORS.secondary, fontSize: '12px' }}>
              {opponent.currentPoints.toFixed(1)} pts
            </span>
          </div>
        </div>
      </div>
      
      {/* Shared Players Banner */}
      {sharedPlayerNames.size > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '10px 16px',
            backgroundColor: 'rgba(251, 191, 37, 0.1)',
            borderBottom: '1px solid rgba(251, 191, 37, 0.2)',
          }}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: '#fbbf24',
            }}
          />
          <span style={{ color: '#fbbf24', fontSize: '12px', fontWeight: 600 }}>
            {sharedPlayerNames.size} Shared {sharedPlayerNames.size === 1 ? 'Player' : 'Players'}
          </span>
        </div>
      )}
      
      {/* Rosters Side by Side */}
      <div
        className="flex-1 min-h-0 overflow-y-auto"
        style={{
          display: 'flex',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {/* User Roster */}
        <div
          style={{
            flex: 1,
            padding: '12px 8px 12px 12px',
            borderRight: '1px solid rgba(255,255,255,0.05)',
          }}
        >
          {(['QB', 'RB', 'WR', 'TE'] as const).map(position => {
            const players = userPlayersByPosition[position] || [];
            if (players.length === 0) return null;
            
            return (
              <div key={position} style={{ marginBottom: '12px' }}>
                <div
                  style={{
                    color: POSITION_COLORS[position],
                    fontSize: '10px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: '6px',
                    textAlign: 'right',
                  }}
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
        <div
          style={{
            flex: 1,
            padding: '12px 12px 12px 8px',
            borderLeft: '1px solid rgba(255,255,255,0.05)',
          }}
        >
          {(['QB', 'RB', 'WR', 'TE'] as const).map(position => {
            const players = opponentPlayersByPosition[position] || [];
            if (players.length === 0) return null;
            
            return (
              <div key={position} style={{ marginBottom: '12px' }}>
                <div
                  style={{
                    color: POSITION_COLORS[position],
                    fontSize: '10px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: '6px',
                  }}
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
      <div
        style={{
          backgroundColor: '#0c1420',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          padding: '8px 16px 16px',
        }}
      >
        {/* Navigation Dots */}
        <NavigationDots
          total={pod.opponents.length}
          current={opponentIndex}
          onSelect={goToOpponentByIndex}
        />
        
        {/* Arrow Buttons */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <button
            onClick={goToPrevOpponent}
            disabled={opponentIndex === 0}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 16px',
              backgroundColor: opponentIndex === 0 ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.05)',
              border: 'none',
              borderRadius: '8px',
              color: opponentIndex === 0 ? TEXT_COLORS.muted : TEXT_COLORS.secondary,
              fontSize: '12px',
              fontWeight: 500,
              cursor: opponentIndex === 0 ? 'not-allowed' : 'pointer',
              opacity: opponentIndex === 0 ? 0.5 : 1,
            }}
          >
            <ChevronLeft size={14} color="currentColor" />
            <span>Prev</span>
          </button>
          
          <div style={{ color: TEXT_COLORS.muted, fontSize: '11px' }}>
            Swipe to navigate
          </div>
          
          <button
            onClick={goToNextOpponent}
            disabled={opponentIndex === pod.opponents.length - 1}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 16px',
              backgroundColor: opponentIndex === pod.opponents.length - 1 ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.05)',
              border: 'none',
              borderRadius: '8px',
              color: opponentIndex === pod.opponents.length - 1 ? TEXT_COLORS.muted : TEXT_COLORS.secondary,
              fontSize: '12px',
              fontWeight: 500,
              cursor: opponentIndex === pod.opponents.length - 1 ? 'not-allowed' : 'pointer',
              opacity: opponentIndex === pod.opponents.length - 1 ? 0.5 : 1,
            }}
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

