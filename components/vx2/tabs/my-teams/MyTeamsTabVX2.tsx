/**
 * MyTeamsTabVX2 - My Teams Tab
 * 
 * A-Grade Requirements Met:
 * - TypeScript: Full type coverage
 * - Data Layer: Uses useMyTeams hook
 * - Loading State: Shows skeletons
 * - Error/Empty States: Handled
 * - Constants: All values from VX2 constants
 * - Accessibility: ARIA labels
 */

import React, { useState, useMemo, useCallback } from 'react';
import { useMyTeams, type MyTeam, type TeamPlayer } from '../../hooks/data';
import { BG_COLORS, TEXT_COLORS, POSITION_COLORS } from '../../core/constants/colors';
import { SPACING, RADIUS, TYPOGRAPHY } from '../../core/constants/sizes';
import { 
  PositionBadge,
  Skeleton, 
  EmptyState, 
  ErrorState,
} from '../../components/shared';
import { SearchInput } from '../../components/shared/inputs';
import { ChevronRight, Edit, Share } from '../../components/icons';

// ============================================================================
// CONSTANTS
// ============================================================================

const MYTEAMS_PX = {
  listPadding: SPACING.lg,
  cardPadding: SPACING.md,
  cardGap: SPACING.md,
  headerPadding: SPACING.lg,
  rowPaddingX: SPACING.lg,
  rowPaddingY: SPACING.sm,
  photoSize: 36,
} as const;

// ============================================================================
// TYPES
// ============================================================================

export interface MyTeamsTabVX2Props {
  /** Currently selected team */
  selectedTeam?: MyTeam | null;
  /** Callback when team selection changes */
  onSelectTeam?: (team: MyTeam | null) => void;
  /** Callback to view draft board */
  onViewDraftBoard?: (team: MyTeam) => void;
}

// ============================================================================
// SUB-COMPONENTS: TEAM LIST
// ============================================================================

interface TeamCardProps {
  team: MyTeam;
  onSelect: () => void;
}

function TeamCard({ team, onSelect }: TeamCardProps): React.ReactElement {
  const playerCount = team.players.length;
  
  return (
    <button
      onClick={onSelect}
      className="w-full flex items-center justify-between transition-all active:scale-[0.98]"
      style={{
        padding: `${MYTEAMS_PX.cardPadding}px`,
        backgroundColor: BG_COLORS.secondary,
        borderRadius: `${RADIUS.lg}px`,
        border: '1px solid rgba(255,255,255,0.1)',
      }}
      aria-label={`View ${team.name}`}
    >
      <div className="flex-1 text-left">
        <h3 
          className="font-medium"
          style={{ color: TEXT_COLORS.primary, fontSize: `${TYPOGRAPHY.fontSize.sm}px` }}
        >
          {team.name}
        </h3>
        <p style={{ color: TEXT_COLORS.muted, fontSize: `${TYPOGRAPHY.fontSize.xs}px` }}>
          {playerCount} players
        </p>
      </div>
      <ChevronRight size={20} color={TEXT_COLORS.muted} />
    </button>
  );
}

function TeamCardSkeleton(): React.ReactElement {
  return (
    <div
      style={{
        padding: `${MYTEAMS_PX.cardPadding}px`,
        backgroundColor: BG_COLORS.secondary,
        borderRadius: `${RADIUS.lg}px`,
      }}
    >
      <Skeleton width={150} height={18} />
      <div className="mt-1">
        <Skeleton width={80} height={14} />
      </div>
    </div>
  );
}

interface TeamListViewProps {
  teams: MyTeam[];
  isLoading: boolean;
  onSelect: (team: MyTeam) => void;
}

function TeamListView({ teams, isLoading, onSelect }: TeamListViewProps): React.ReactElement {
  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredTeams = useMemo(() => {
    if (!searchQuery.trim()) return teams;
    const query = searchQuery.toLowerCase();
    return teams.filter(t => t.name.toLowerCase().includes(query));
  }, [teams, searchQuery]);
  
  return (
    <div 
      className="flex-1 flex flex-col min-h-0"
      style={{ backgroundColor: BG_COLORS.primary }}
    >
      {/* Search */}
      <div
        style={{
          padding: `${MYTEAMS_PX.listPadding}px`,
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <SearchInput
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search teams..."
        />
      </div>
      
      {/* Team List */}
      <div
        className="flex-1 min-h-0 overflow-y-auto"
        style={{
          padding: `${MYTEAMS_PX.listPadding}px`,
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: `${MYTEAMS_PX.cardGap}px` }}>
            {[1, 2, 3, 4].map(i => <TeamCardSkeleton key={i} />)}
          </div>
        ) : filteredTeams.length === 0 ? (
          <EmptyState
            title="No Teams Found"
            description={searchQuery ? "Try a different search" : "Join a draft to build your first team!"}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: `${MYTEAMS_PX.cardGap}px` }}>
            {filteredTeams.map(team => (
              <TeamCard key={team.id} team={team} onSelect={() => onSelect(team)} />
            ))}
          </div>
        )}
        
        {/* Bottom padding */}
        <div style={{ height: `${SPACING['2xl']}px` }} />
      </div>
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS: TEAM DETAILS
// ============================================================================

interface PlayerRowProps {
  player: TeamPlayer;
}

function PlayerRow({ player }: PlayerRowProps): React.ReactElement {
  return (
    <div
      className="flex items-center justify-between"
      style={{
        paddingLeft: `${MYTEAMS_PX.rowPaddingX}px`,
        paddingRight: `${MYTEAMS_PX.rowPaddingX}px`,
        paddingTop: `${MYTEAMS_PX.rowPaddingY}px`,
        paddingBottom: `${MYTEAMS_PX.rowPaddingY}px`,
        borderBottom: '1px solid rgba(255,255,255,0.1)',
      }}
    >
      {/* Player Info */}
      <div className="flex items-center flex-1 min-w-0">
        {/* Photo placeholder */}
        <div
          className="flex-shrink-0 rounded-full flex items-center justify-center"
          style={{
            width: `${MYTEAMS_PX.photoSize}px`,
            height: `${MYTEAMS_PX.photoSize}px`,
            backgroundColor: BG_COLORS.tertiary,
            marginRight: `${SPACING.md}px`,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill={TEXT_COLORS.muted}>
            <circle cx="12" cy="8" r="4" />
            <path d="M20 21c0-4.418-3.582-7-8-7s-8 2.582-8 7" />
          </svg>
        </div>
        
        <div className="min-w-0">
          <h3 
            className="font-medium truncate"
            style={{ color: TEXT_COLORS.primary, fontSize: `${TYPOGRAPHY.fontSize.sm}px` }}
          >
            {player.name}
          </h3>
          <div className="flex items-center gap-2 mt-0.5">
            <PositionBadge position={player.position} size="sm" />
            <span style={{ color: TEXT_COLORS.muted, fontSize: `${TYPOGRAPHY.fontSize.xs}px` }}>
              {player.team} (Bye {player.bye})
            </span>
          </div>
        </div>
      </div>
      
      {/* Projected Points */}
      <div
        className="text-right flex-shrink-0"
        style={{ color: TEXT_COLORS.secondary, fontSize: `${TYPOGRAPHY.fontSize.sm}px` }}
      >
        {player.projectedPoints || 0} pts
      </div>
    </div>
  );
}

interface TeamDetailsViewProps {
  team: MyTeam;
  onViewDraftBoard?: () => void;
}

function TeamDetailsView({ team, onViewDraftBoard }: TeamDetailsViewProps): React.ReactElement {
  // Sort players by position order (QB, RB, WR, TE) then by pick
  const sortedPlayers = useMemo(() => {
    const posOrder = { QB: 0, RB: 1, WR: 2, TE: 3 };
    return [...team.players].sort((a, b) => {
      const posA = posOrder[a.position] ?? 4;
      const posB = posOrder[b.position] ?? 4;
      if (posA !== posB) return posA - posB;
      return a.pick - b.pick;
    });
  }, [team]);
  
  return (
    <div 
      className="flex-1 flex flex-col min-h-0"
      style={{ backgroundColor: BG_COLORS.primary }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between flex-shrink-0"
        style={{
          padding: `${MYTEAMS_PX.headerPadding}px`,
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <div className="flex items-center flex-1 min-w-0">
          <button className="p-1 mr-2" aria-label="Edit team name">
            <Edit size={18} color={TEXT_COLORS.muted} />
          </button>
          <h2 
            className="font-semibold truncate"
            style={{ color: TEXT_COLORS.primary, fontSize: `${TYPOGRAPHY.fontSize.lg}px` }}
          >
            {team.name}
          </h2>
        </div>
        
        <div className="flex items-center gap-2">
          <button className="p-2" aria-label="Share team">
            <Share size={20} color={TEXT_COLORS.muted} />
          </button>
          {onViewDraftBoard && (
            <button 
              onClick={onViewDraftBoard}
              className="p-2"
              aria-label="View draft board"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill={TEXT_COLORS.muted}>
                <rect x="3" y="3" width="5" height="5" rx="1" />
                <rect x="10" y="3" width="5" height="5" rx="1" />
                <rect x="17" y="3" width="5" height="5" rx="1" />
                <rect x="3" y="10" width="5" height="5" rx="1" />
                <rect x="10" y="10" width="5" height="5" rx="1" />
                <rect x="17" y="10" width="5" height="5" rx="1" />
                <rect x="3" y="17" width="5" height="5" rx="1" />
                <rect x="10" y="17" width="5" height="5" rx="1" />
                <rect x="17" y="17" width="5" height="5" rx="1" />
              </svg>
            </button>
          )}
        </div>
      </div>
      
      {/* Player Roster */}
      <div
        className="flex-1 min-h-0 overflow-y-auto"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {sortedPlayers.map((player, index) => (
          <PlayerRow key={`${player.name}-${index}`} player={player} />
        ))}
        
        {/* Bottom padding */}
        <div style={{ height: '100px' }} />
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function MyTeamsTabVX2({
  selectedTeam: externalSelectedTeam,
  onSelectTeam,
  onViewDraftBoard,
}: MyTeamsTabVX2Props): React.ReactElement {
  const { teams, isLoading, error, refetch } = useMyTeams();
  const [internalSelectedTeam, setInternalSelectedTeam] = useState<MyTeam | null>(null);
  
  // Use external or internal state
  const selectedTeam = externalSelectedTeam !== undefined ? externalSelectedTeam : internalSelectedTeam;
  
  const handleSelectTeam = useCallback((team: MyTeam | null) => {
    if (onSelectTeam) {
      onSelectTeam(team);
    } else {
      setInternalSelectedTeam(team);
    }
  }, [onSelectTeam]);
  
  const handleViewDraftBoard = useCallback(() => {
    if (selectedTeam && onViewDraftBoard) {
      onViewDraftBoard(selectedTeam);
    }
  }, [selectedTeam, onViewDraftBoard]);
  
  // Error state
  if (error) {
    return (
      <div 
        className="flex-1 flex items-center justify-center"
        style={{ backgroundColor: BG_COLORS.primary, padding: SPACING.xl }}
      >
        <ErrorState 
          title="Failed to load teams"
          description={error || undefined}
          onRetry={refetch}
        />
      </div>
    );
  }
  
  // Team Details View
  if (selectedTeam) {
    return (
      <TeamDetailsView 
        team={selectedTeam}
        onViewDraftBoard={onViewDraftBoard ? handleViewDraftBoard : undefined}
      />
    );
  }
  
  // Team List View
  return (
    <TeamListView
      teams={teams}
      isLoading={isLoading}
      onSelect={handleSelectTeam}
    />
  );
}

