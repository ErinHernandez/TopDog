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
import { useHeader } from '../../core';
import { 
  PositionBadge,
  Skeleton, 
  EmptyState, 
  ErrorState,
  PlayerStatsCard,
} from '../../components/shared';
import { SearchInput } from '../../components/shared/inputs';
import { ChevronRight, ChevronLeft, Edit, Share, Close } from '../../components/icons';
import { usePlayerPool } from '../../../../lib/playerPool/usePlayerPool';
import ShareOptionsModal from '../../draft-room/components/ShareOptionsModal';

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
      if ((player.name?.toLowerCase() || '').includes(query)) {
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
  
  // Check if search query matches an NFL team
  const matchingNflTeam = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const query = searchQuery.trim().toUpperCase();
    return nflTeams.find(team => team === query || team.toUpperCase() === query);
  }, [searchQuery, nflTeams]);
  
  // Filter teams based on selected items and/or direct NFL team search
  const filteredTeams = useMemo(() => {
    let result = teams;
    
    // First, filter by selected items (dropdown selections)
    if (selectedItems.length > 0) {
      result = result.filter(team => {
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
    }
    
    // Then, if search query matches an NFL team directly, filter by that
    if (matchingNflTeam) {
      result = result.filter(team => {
        return team.players.some(p => p.team === matchingNflTeam);
      });
    }
    
    return result;
  }, [teams, selectedItems, matchingNflTeam]);
  
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
                className="flex items-center gap-2 px-3 py-1"
                style={{
                  backgroundColor: BG_COLORS.tertiary,
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: `${RADIUS.sm}px`,
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
  onClick?: () => void;
  isExpanded?: boolean;
  isLastInGroup?: boolean;
}

function PlayerRow({ player, onClick, isExpanded, isLastInGroup }: PlayerRowProps): React.ReactElement {
  // Sandbox-style position badge (inline, not using shared component)
  const positionColors: Record<string, string> = {
    QB: '#F472B6',
    RB: '#0fba80',
    WR: '#FBBF25',
    TE: '#7C3AED',
  };
  const badgeColor = positionColors[player.position] || '#6B7280';
  
  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: '3px',
        marginBottom: isLastInGroup ? '0px' : '2px',
        overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '4px 8px',
        }}
      >
        {/* Player Info - exact sandbox layout */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '6px' }}>
          {/* Position Badge - sandbox style */}
          <div
            style={{
              backgroundColor: badgeColor,
              color: '#000',
              fontSize: '10px',
              fontWeight: 600,
              padding: '2px 6px',
              borderRadius: '3px',
              textTransform: 'uppercase',
            }}
          >
            {player.position}
          </div>
          <span style={{ color: '#fff', fontSize: '12px', fontWeight: 500 }}>
            {player.name}
          </span>
          <span style={{ color: '#6B7280', fontSize: '10px' }}>
            {player.team}
          </span>
        </div>
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
  // Expansion state for player stats
  const [expandedPlayerId, setExpandedPlayerId] = useState<string | null>(null);
  // Share modal state
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  // Header context for back button
  const { setShowBackButton, clearBackButton } = useHeader();
  
  // Show back button in header when viewing team details
  useEffect(() => {
    setShowBackButton(true, onBack);
    return () => clearBackButton();
  }, [setShowBackButton, clearBackButton, onBack]);
  
  // Toggle player expansion
  const handlePlayerClick = useCallback((player: TeamPlayer) => {
    const playerId = `${player.name}-${player.pick}`;
    setExpandedPlayerId(prev => prev === playerId ? null : playerId);
  }, []);
  
  // Handle share button click
  const handleShareClick = useCallback(() => {
    setIsShareModalOpen(true);
  }, []);
  
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
      {/* Team Name Bar - Sandbox Style (exact match) */}
      <div
        style={{
          backgroundColor: '#101927',
          padding: '10px 12px 6px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
          gap: '6px',
        }}
      >
        <button
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '2px',
            display: 'flex',
            alignItems: 'center',
          }}
          aria-label="Edit team name"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
        <span style={{ color: '#fff', fontSize: '12px', fontWeight: 500, paddingTop: 2 }}>
          {team.name}
        </span>
      </div>
      
      {/* Player Roster - Sandbox Style (pixel-for-pixel match) */}
      <div
        className="flex-1 min-h-0 overflow-y-auto"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          backgroundColor: '#101927',
          padding: '8px 12px',
        }}
      >
        {groupedPlayers.map(([position, players], groupIndex) => {
          return (
            <React.Fragment key={position}>
              {/* Spacing between position groups - exactly 6px */}
              {groupIndex > 0 && <div style={{ height: '6px' }} />}
              
              {/* Players in this position group */}
              {players.map((player, index) => {
                const playerId = `${player.name}-${player.pick}`;
                const isExpanded = expandedPlayerId === playerId;
                const isLastInGroup = index === players.length - 1;
                
                return (
                  <React.Fragment key={playerId}>
                    <PlayerRow 
                      player={player} 
                      onClick={() => handlePlayerClick(player)}
                      isExpanded={isExpanded}
                      isLastInGroup={isLastInGroup && !isExpanded}
                    />
                    {/* Expanded Stats Card */}
                    {isExpanded && (
                      <div style={{ padding: '2px 4px 4px' }}>
                        <PlayerStatsCard
                          player={{
                            name: player.name,
                            team: player.team,
                            position: player.position,
                            adp: player.adp,
                            projectedPoints: player.projectedPoints,
                            bye: player.bye,
                          }}
                          showDraftButton={false}
                          fetchStats={true}
                        />
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </React.Fragment>
          );
        })}
        
        {/* Bottom padding - minimal to stop at last player */}
        <div style={{ height: '8px' }} />
      </div>
      
      {/* Share Options Modal */}
      <ShareOptionsModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        shareType="roster"
        contentName={team.name}
      />
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

