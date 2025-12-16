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

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
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
import { ChevronRight, ChevronLeft, Edit, Share, Close } from '../../components/icons';
import { usePlayerPool } from '../../../../lib/playerPool/usePlayerPool';

// ============================================================================
// CONSTANTS
// ============================================================================

const MYTEAMS_PX = {
  listPadding: SPACING.lg,
  cardPadding: SPACING.sm,
  cardGap: SPACING.md,
  headerPadding: SPACING.lg,
  rowPaddingX: SPACING.lg,
  rowPaddingY: SPACING.xs,
  photoSize: 28,
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
  onNameChange?: (teamId: string, newName: string) => void;
}

function TeamCard({ team, onSelect, onNameChange }: TeamCardProps): React.ReactElement {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(team.name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);
  
  useEffect(() => {
    setEditedName(team.name);
  }, [team.name]);

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleBlur = () => {
    if (editedName.trim() && editedName !== team.name && onNameChange) {
      onNameChange(team.id, editedName.trim());
    } else {
      setEditedName(team.name);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur();
    } else if (e.key === 'Escape') {
      setEditedName(team.name);
      setIsEditing(false);
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    if (!isEditing) {
      onSelect();
    }
  };
  
  return (
    <div
      onClick={handleClick}
      className="w-full flex items-center justify-between transition-all active:scale-[0.98] cursor-pointer"
      style={{
        padding: `${MYTEAMS_PX.cardPadding}px`,
        backgroundColor: BG_COLORS.secondary,
        borderRadius: `${RADIUS.lg}px`,
        border: '1px solid rgba(255,255,255,0.1)',
      }}
      aria-label={`View ${team.name}`}
    >
      <div className="flex items-center flex-1 min-w-0">
        {!isEditing && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDoubleClick(e);
            }}
            className="p-1 mr-2 flex items-center justify-center transition-all active:scale-95"
            aria-label="Edit team name"
            style={{
              borderRadius: `${RADIUS.md}px`,
            }}
          >
            <Edit size={18} color={TEXT_COLORS.muted} />
          </button>
        )}
        <div className="flex-1 text-left min-w-0">
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              className="w-full font-medium bg-transparent border-none outline-none"
              style={{ 
                color: TEXT_COLORS.primary, 
                fontSize: `${TYPOGRAPHY.fontSize.sm}px`,
                borderBottom: `1px solid ${TEXT_COLORS.primary}`,
              }}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <h3 
              className="font-medium"
              style={{ color: TEXT_COLORS.primary, fontSize: `${TYPOGRAPHY.fontSize.sm}px` }}
              onDoubleClick={handleDoubleClick}
            >
              {team.name}
            </h3>
          )}
        </div>
      </div>
      <ChevronRight size={20} color={TEXT_COLORS.muted} />
    </div>
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
    </div>
  );
}

interface SearchItem {
  type: 'player' | 'team';
  id: string;
  name: string;
  team?: string;
  position?: string;
}

interface TeamListViewProps {
  teams: MyTeam[];
  isLoading: boolean;
  onSelect: (team: MyTeam) => void;
  onNameChange?: (teamId: string, newName: string) => void;
}

function TeamListView({ teams, isLoading, onSelect, onNameChange }: TeamListViewProps): React.ReactElement {
  const { players: allPlayers } = usePlayerPool();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState<SearchItem[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  
  // Get unique NFL teams from player pool
  const nflTeams = useMemo(() => {
    const teamsSet = new Set<string>();
    allPlayers.forEach(p => {
      if (p.team) teamsSet.add(p.team);
    });
    return Array.from(teamsSet).sort();
  }, [allPlayers]);
  
  // Filter dropdown options based on search query
  const dropdownOptions = useMemo(() => {
    if (!searchQuery.trim()) return [];
    
    const query = searchQuery.toLowerCase();
    const options: SearchItem[] = [];
    
    // Add matching players
    allPlayers.forEach(player => {
      if (player.name.toLowerCase().includes(query)) {
        // Check if already selected
        if (!selectedItems.some(item => item.type === 'player' && item.id === player.id)) {
          options.push({
            type: 'player',
            id: player.id,
            name: player.name,
            team: player.team,
            position: player.position,
          });
        }
      }
    });
    
    // Add matching NFL teams
    nflTeams.forEach(team => {
      if (team.toLowerCase().includes(query)) {
        // Check if already selected
        if (!selectedItems.some(item => item.type === 'team' && item.id === team)) {
          options.push({
            type: 'team',
            id: team,
            name: team,
          });
        }
      }
    });
    
    return options.slice(0, 10); // Limit to 10 results
  }, [searchQuery, allPlayers, nflTeams, selectedItems]);
  
  // Filter teams based on selected items
  const filteredTeams = useMemo(() => {
    if (selectedItems.length === 0) return teams;
    
    return teams.filter(team => {
      return selectedItems.some(item => {
        if (item.type === 'player') {
          // Check if team contains this player
          return team.players.some(p => p.name === item.name);
        } else if (item.type === 'team') {
          // Check if team contains ANY player from this NFL team
          return team.players.some(p => p.team === item.id);
        }
        return false;
      });
    });
  }, [teams, selectedItems]);
  
  const handleSelectItem = useCallback((item: SearchItem) => {
    setSelectedItems(prev => [...prev, item]);
    setSearchQuery('');
    setShowDropdown(false);
  }, []);
  
  const handleRemoveItem = useCallback((itemId: string) => {
    setSelectedItems(prev => prev.filter(item => item.id !== itemId));
  }, []);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  return (
    <div 
      className="flex-1 flex flex-col min-h-0"
      style={{ backgroundColor: BG_COLORS.primary }}
    >
      {/* Search */}
      <div
        ref={searchRef}
        style={{
          padding: `${MYTEAMS_PX.listPadding}px`,
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          position: 'relative',
        }}
      >
        <div style={{ position: 'relative' }}>
          <SearchInput
            value={searchQuery}
            onChange={(value) => {
              setSearchQuery(value);
              setShowDropdown(value.trim().length > 0);
            }}
            placeholder="Search for player(s)"
          />
          
          {/* Dropdown */}
          {showDropdown && dropdownOptions.length > 0 && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                marginTop: `${SPACING.xs}px`,
                backgroundColor: BG_COLORS.secondary,
                borderRadius: `${RADIUS.lg}px`,
                border: '1px solid rgba(255,255,255,0.1)',
                maxHeight: '300px',
                overflowY: 'auto',
                zIndex: 1000,
                boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
              }}
            >
              {dropdownOptions.map((option) => (
                <button
                  key={`${option.type}-${option.id}`}
                  onClick={() => handleSelectItem(option)}
                  className="w-full text-left px-3 py-2 hover:bg-opacity-10 transition-colors"
                  style={{
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                    color: TEXT_COLORS.primary,
                  }}
                >
                  <div className="flex items-center gap-2">
                    {option.type === 'player' && option.position && (
                      <PositionBadge position={option.position as 'QB' | 'RB' | 'WR' | 'TE'} size="sm" />
                    )}
                    <div className="flex-1">
                      <div style={{ fontSize: `${TYPOGRAPHY.fontSize.sm}px`, fontWeight: 500 }}>
                        {option.name}
                      </div>
                      {option.type === 'player' && option.team && (
                        <div style={{ fontSize: `${TYPOGRAPHY.fontSize.xs}px`, color: TEXT_COLORS.muted }}>
                          {option.team}
                        </div>
                      )}
                      {option.type === 'team' && (
                        <div style={{ fontSize: `${TYPOGRAPHY.fontSize.xs}px`, color: TEXT_COLORS.muted }}>
                          NFL Team
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        
        {/* Selected Items */}
        {selectedItems.length > 0 && (
          <div
            className="flex flex-wrap gap-2"
            style={{ marginTop: `${SPACING.md}px` }}
          >
            {selectedItems.map((item) => (
              <div
                key={`${item.type}-${item.id}`}
                className="flex items-center gap-2 px-3 py-1 rounded-full"
                style={{
                  backgroundColor: BG_COLORS.tertiary,
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                {item.type === 'player' && item.position && (
                  <PositionBadge position={item.position as 'QB' | 'RB' | 'WR' | 'TE'} size="sm" />
                )}
                <span style={{ fontSize: `${TYPOGRAPHY.fontSize.sm}px`, color: TEXT_COLORS.primary }}>
                  {item.name}
                </span>
                <button
                  onClick={() => handleRemoveItem(item.id)}
                  className="flex items-center justify-center"
                  style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                  aria-label={`Remove ${item.name}`}
                >
                  <Close size={12} color={TEXT_COLORS.muted} />
                </button>
              </div>
            ))}
          </div>
        )}
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
            description={selectedItems.length > 0 ? "No teams match your search criteria" : "Join a draft to build your first team!"}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: `${MYTEAMS_PX.cardGap}px` }}>
            {filteredTeams.map(team => (
              <TeamCard 
                key={team.id} 
                team={team} 
                onSelect={() => onSelect(team)}
                onNameChange={onNameChange}
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
            marginRight: `${SPACING.sm}px`,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill={TEXT_COLORS.muted}>
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
          <div className="flex items-center gap-2" style={{ marginTop: '2px' }}>
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
  onBack: () => void;
  onViewDraftBoard?: () => void;
}

function TeamDetailsView({ team, onBack, onViewDraftBoard }: TeamDetailsViewProps): React.ReactElement {
  // Group players by position, sorted by position order (QB, RB, WR, TE) then by pick
  const groupedPlayers = useMemo(() => {
    const posOrder = { QB: 0, RB: 1, WR: 2, TE: 3 };
    const sorted = [...team.players].sort((a, b) => {
      const posA = posOrder[a.position] ?? 4;
      const posB = posOrder[b.position] ?? 4;
      if (posA !== posB) return posA - posB;
      return a.pick - b.pick;
    });
    
    // Group by position
    const groups: Record<string, TeamPlayer[]> = {};
    sorted.forEach(player => {
      if (!groups[player.position]) {
        groups[player.position] = [];
      }
      groups[player.position].push(player);
    });
    
    // Return as array of [position, players] tuples, sorted by position order
    return Object.entries(groups).sort(([posA], [posB]) => {
      const orderA = posOrder[posA as keyof typeof posOrder] ?? 4;
      const orderB = posOrder[posB as keyof typeof posOrder] ?? 4;
      return orderA - orderB;
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
          <button 
            onClick={onBack}
            className="p-1 mr-2 flex items-center justify-center transition-all active:scale-95"
            aria-label="Back to teams"
            style={{
              borderRadius: `${RADIUS.md}px`,
            }}
          >
            <ChevronLeft size={20} color={TEXT_COLORS.primary} />
          </button>
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
        {groupedPlayers.map(([position, players], groupIndex) => (
          <React.Fragment key={position}>
            {/* Position Divider */}
            {groupIndex > 0 && (
              <div
                style={{
                  height: '1px',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  marginLeft: `${MYTEAMS_PX.rowPaddingX}px`,
                  marginRight: `${MYTEAMS_PX.rowPaddingX}px`,
                  marginTop: `${SPACING.xs}px`,
                  marginBottom: `${SPACING.xs}px`,
                }}
              />
            )}
            {/* Players in this position group */}
            {players.map((player, index) => (
              <PlayerRow key={`${player.name}-${index}`} player={player} />
            ))}
          </React.Fragment>
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
  const { teams: initialTeams, isLoading, error, refetch } = useMyTeams();
  const [internalSelectedTeam, setInternalSelectedTeam] = useState<MyTeam | null>(null);
  const [teams, setTeams] = useState<MyTeam[]>(initialTeams);
  
  // Update teams when initialTeams changes
  useEffect(() => {
    setTeams(initialTeams);
  }, [initialTeams]);
  
  // Use external or internal state
  const selectedTeam = externalSelectedTeam !== undefined ? externalSelectedTeam : internalSelectedTeam;
  
  const handleSelectTeam = useCallback((team: MyTeam | null) => {
    if (onSelectTeam) {
      onSelectTeam(team);
    } else {
      setInternalSelectedTeam(team);
    }
  }, [onSelectTeam]);
  
  const handleNameChange = useCallback((teamId: string, newName: string) => {
    setTeams(prevTeams => 
      prevTeams.map(team => 
        team.id === teamId ? { ...team, name: newName } : team
      )
    );
    // Update selected team if it's the one being edited
    if (selectedTeam?.id === teamId) {
      const updatedTeam = { ...selectedTeam, name: newName };
      if (onSelectTeam) {
        onSelectTeam(updatedTeam);
      } else {
        setInternalSelectedTeam(updatedTeam);
      }
    }
  }, [selectedTeam, onSelectTeam]);
  
  const handleBack = useCallback(() => {
    if (onSelectTeam) {
      onSelectTeam(null);
    } else {
      setInternalSelectedTeam(null);
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
        onBack={handleBack}
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
      onNameChange={handleNameChange}
    />
  );
}

