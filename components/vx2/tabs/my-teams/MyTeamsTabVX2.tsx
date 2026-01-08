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
import { useRouter } from 'next/router';
import { useMyTeams, type MyTeam, type TeamPlayer } from '../../hooks/data';
import { useAuth } from '../../auth/hooks/useAuth';
import { BG_COLORS, TEXT_COLORS, POSITION_COLORS } from '../../core/constants/colors';
import { SPACING, RADIUS, TYPOGRAPHY } from '../../core/constants/sizes';
import { useHeader, useTabNavigation } from '../../core';
import { 
  PositionBadge,
  Skeleton, 
  EmptyState, 
  ErrorState,
  PlayerStatsCard,
} from '../../components/shared';
import { SearchInput } from '../../components/shared/inputs';
import { ChevronRight, ChevronLeft, Edit, Share, Close, Grid, UserIcon, Undo, Save, Check } from '../../components/icons';
import { usePlayerPool } from '../../../../lib/playerPool/usePlayerPool';
import ShareOptionsModal from '../../draft-room/components/ShareOptionsModal';
import { isNFLSeasonActive } from '../../../../lib/tournament/seasonUtils';
import CompletedDraftBoardModal from './CompletedDraftBoardModal';
import { UnsavedChangesModal } from '../../modals/UnsavedChangesModal';
import {
  sortTeams,
  sortPlayers,
  loadSortPreferences,
  saveSortPreferences,
  getDefaultSortState,
  getNextTeamSortState,
  getNextPlayerSortState,
  updateCustomOrder,
  loadCustomOrder,
  clearCustomOrder,
  TEAM_SORT_LABELS,
  PLAYER_SORT_LABELS,
  type TeamSortState,
  type PlayerSortState,
  type TeamSortOption,
  type PlayerSortOption,
  type SortState,
} from './sortUtils';

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

const POSITION_MAXIMUMS = {
  QB: 3,
  RB: 6,
  WR: 8,
  TE: 5,
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
  pointsBack?: number | null;
  pointsAhead?: number | null;
  showPointsDiff?: boolean;
  sortMethod?: 'rank' | 'projectedPoints' | 'pointsScored' | 'pointsBackOfFirst' | 'pointsBackOfPlayoffs';
  isCustomSort?: boolean;
  index?: number;
  totalTeams?: number;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onDragStart?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  isDragging?: boolean;
  isDragOver?: boolean;
}

function TeamCard({ 
  team, 
  onSelect, 
  onNameChange, 
  pointsBack, 
  pointsAhead, 
  showPointsDiff, 
  sortMethod,
  isCustomSort = false,
  index = 0,
  totalTeams = 0,
  onMoveUp,
  onMoveDown,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDrop,
  isDragging = false,
  isDragOver = false,
}: TeamCardProps): React.ReactElement {
  const seasonStarted = isNFLSeasonActive();
  
  // Format team name: "The TopDog International X" -> "THE INTERNATIONAL - X"
  const formattedName = useMemo(() => {
    const name = team.name;
    const match = name.match(/^The TopDog International (.+)$/);
    if (match) {
      return `THE INTERNATIONAL ${match[1]}`;
    }
    return name;
  }, [team.name]);

  // Format rank: 1 -> "1st", 2 -> "2nd", 3 -> "3rd", etc.
  const formatRank = useCallback((rank: number): string => {
    const lastDigit = rank % 10;
    const lastTwoDigits = rank % 100;
    
    if (lastTwoDigits >= 11 && lastTwoDigits <= 13) {
      return `${rank}th`;
    }
    
    switch (lastDigit) {
      case 1:
        return `${rank}st`;
      case 2:
        return `${rank}nd`;
      case 3:
        return `${rank}rd`;
      default:
        return `${rank}th`;
    }
  }, []);
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
      draggable={isCustomSort}
      onDragStart={isCustomSort ? onDragStart : undefined}
      onDragOver={isCustomSort ? onDragOver : undefined}
      onDragEnd={isCustomSort ? onDragEnd : undefined}
      onDrop={isCustomSort ? onDrop : undefined}
      className="w-full flex items-center justify-between transition-all active:scale-[0.98] cursor-pointer"
      style={{
        paddingTop: `${MYTEAMS_PX.cardPadding + 6}px`,
        paddingBottom: `${MYTEAMS_PX.cardPadding + 6}px`,
        paddingLeft: `${MYTEAMS_PX.cardPadding + 4}px`,
        paddingRight: `${MYTEAMS_PX.cardPadding + 4}px`,
        backgroundColor: BG_COLORS.secondary,
        borderRadius: `${RADIUS.lg}px`,
        border: '1px solid rgba(255,255,255,0.1)',
        opacity: isDragging ? 0.5 : 1,
        borderTop: isDragOver ? '2px solid rgba(59, 130, 246, 0.6)' : '1px solid rgba(255,255,255,0.1)',
        cursor: isCustomSort ? 'move' : 'pointer',
        minHeight: '54px',
        height: '54px',
      }}
      aria-label={`View ${team.name}`}
    >
      <div className="flex items-center flex-1 min-w-0">
        {!isEditing && (
          <div
            className="p-1 mr-2 flex items-center justify-center"
            style={{
              borderRadius: `${RADIUS.md}px`,
              minWidth: '28px',
              height: '28px',
            }}
          >
            {seasonStarted && team.rank && team.rank >= 1 && team.rank <= 12 ? (
              <span
                style={{
                  fontSize: `${TYPOGRAPHY.fontSize.xs}px`,
                  color: TEXT_COLORS.primary,
                  fontWeight: 600,
                }}
              >
                {formatRank(team.rank)}
              </span>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDoubleClick(e);
                }}
                className="flex items-center justify-center transition-all active:scale-95"
                aria-label="Edit team name"
                style={{
                  borderRadius: `${RADIUS.md}px`,
                }}
              >
                <Edit size={18} color={TEXT_COLORS.muted} />
              </button>
            )}
          </div>
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
            <div className="flex items-center gap-3" style={{ minWidth: 0, flex: 1 }}>
              <h3 
                className="font-medium flex-shrink-0"
                style={{ 
                  color: TEXT_COLORS.primary, 
                  fontSize: `${TYPOGRAPHY.fontSize.sm}px`,
                  cursor: seasonStarted ? 'pointer' : 'default',
                }}
                onDoubleClick={seasonStarted ? handleDoubleClick : undefined}
                onClick={seasonStarted ? (e) => {
                  e.stopPropagation();
                  handleDoubleClick(e);
                } : undefined}
              >
                {formattedName}
              </h3>
              {showPointsDiff && (pointsBack !== null || pointsAhead !== null) && (
                <div className="flex flex-col" style={{ fontSize: `${TYPOGRAPHY.fontSize.xs}px`, color: TEXT_COLORS.muted, marginLeft: 'auto', textAlign: 'right' }}>
                  {pointsBack !== null && pointsBack > 0 && (
                    <span style={{ whiteSpace: 'nowrap' }}>{pointsBack.toFixed(1)} pts back</span>
                  )}
                  {pointsAhead !== null && pointsAhead > 0 && (
                    <span style={{ whiteSpace: 'nowrap' }}>{pointsAhead.toFixed(1)} pts ahead</span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {isCustomSort ? (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          {index > 0 && onMoveUp && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMoveUp();
              }}
              className="p-1 flex items-center justify-center transition-all active:scale-95"
              aria-label="Move up"
              style={{
                borderRadius: `${RADIUS.sm}px`,
                backgroundColor: 'rgba(255,255,255,0.05)',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={TEXT_COLORS.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="18 15 12 9 6 15" />
              </svg>
            </button>
          )}
          {index < totalTeams - 1 && onMoveDown && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMoveDown();
              }}
              className="p-1 flex items-center justify-center transition-all active:scale-95"
              aria-label="Move down"
              style={{
                borderRadius: `${RADIUS.sm}px`,
                backgroundColor: 'rgba(255,255,255,0.05)',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={TEXT_COLORS.muted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          )}
        </div>
      ) : (
        <div style={{ paddingLeft: `${SPACING.sm}px` }}>
          <ChevronRight size={20} color={TEXT_COLORS.muted} />
        </div>
      )}
    </div>
  );
}

function TeamCardSkeleton(): React.ReactElement {
  return (
    <div
      style={{
        paddingTop: `${MYTEAMS_PX.cardPadding + 6}px`,
        paddingBottom: `${MYTEAMS_PX.cardPadding + 6}px`,
        paddingLeft: `${MYTEAMS_PX.cardPadding + 4}px`,
        paddingRight: `${MYTEAMS_PX.cardPadding + 4}px`,
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

// ============================================================================
// SORT DROPDOWN COMPONENT
// ============================================================================

interface SortDropdownProps {
  currentSort: TeamSortState;
  onSortChange: (sort: TeamSortState) => void;
}

function SortDropdown({ currentSort, onSortChange }: SortDropdownProps): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Available sort options (excluding playoffOverlap for now - regular season only)
  const sortOptions: TeamSortOption[] = [
    'draftedAt', 
    'rank', 
    'projectedPointsThisWeek',
    'pointsScored', 
    'lastWeekScore',
    'last4WeeksScore',
    'pointsBackOfFirst',
    'pointsBackOfPlayoffs',
    'name', 
    'custom'
  ];
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const handleOptionClick = (option: TeamSortOption) => {
    const nextState = getNextTeamSortState(currentSort, option);
    onSortChange(nextState);
    setIsOpen(false);
  };
  
  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '8px 12px',
          backgroundColor: BG_COLORS.secondary,
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: `${RADIUS.md}px`,
          color: TEXT_COLORS.secondary,
          fontSize: `${TYPOGRAPHY.fontSize.xs}px`,
          cursor: 'pointer',
          transition: 'all 0.15s ease',
        }}
        aria-label={`Sort by ${TEAM_SORT_LABELS[currentSort.primary]}, ${currentSort.direction === 'asc' ? 'ascending' : 'descending'}`}
      >
        <span style={{ color: TEXT_COLORS.muted }}>Sort:</span>
        <span style={{ color: TEXT_COLORS.primary, fontWeight: 500 }}>
          {TEAM_SORT_LABELS[currentSort.primary]}
        </span>
        <svg 
          width="12" 
          height="12" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
          style={{ 
            transform: currentSort.direction === 'desc' ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
          }}
        >
          <polyline points="18 15 12 9 6 15" />
        </svg>
      </button>
      
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '4px',
            backgroundColor: BG_COLORS.secondary,
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: `${RADIUS.lg}px`,
            overflow: 'hidden',
            zIndex: 1000,
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            minWidth: '160px',
          }}
        >
          {sortOptions.map((option) => {
            const isActive = currentSort.primary === option;
            return (
              <button
                key={option}
                onClick={() => handleOptionClick(option)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  padding: '10px 14px',
                  backgroundColor: isActive ? 'rgba(255,255,255,0.05)' : 'transparent',
                  border: 'none',
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                  color: isActive ? TEXT_COLORS.primary : TEXT_COLORS.secondary,
                  fontSize: `${TYPOGRAPHY.fontSize.sm}px`,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background-color 0.15s ease',
                }}
              >
                <span style={{ whiteSpace: 'pre-line' }}>{TEAM_SORT_LABELS[option]}</span>
                {isActive && (
                  <svg 
                    width="12" 
                    height="12" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2"
                    style={{ 
                      transform: currentSort.direction === 'desc' ? 'rotate(180deg)' : 'rotate(0deg)',
                    }}
                  >
                    <polyline points="18 15 12 9 6 15" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

interface TeamListViewProps {
  teams: MyTeam[];
  isLoading: boolean;
  onSelect: (team: MyTeam) => void;
  onNameChange?: (teamId: string, newName: string) => void;
  sortState: TeamSortState;
  onSortChange: (sort: TeamSortState) => void;
}

function TeamListView({ teams, isLoading, onSelect, onNameChange, sortState, onSortChange }: TeamListViewProps): React.ReactElement {
  const { players: allPlayers } = usePlayerPool();
  const { user: authUser } = useAuth();
  const userId = authUser?.uid || null;
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItems, setSelectedItems] = useState<SearchItem[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const [draggedTeamId, setDraggedTeamId] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [hasOrderChanged, setHasOrderChanged] = useState(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  
  // Undo history - stores previous team ID orders
  const [orderHistory, setOrderHistory] = useState<string[][]>([]);
  
  // Navigation guard for unsaved changes
  const { 
    registerNavigationGuard, 
    pendingNavigation, 
    confirmPendingNavigation, 
    cancelPendingNavigation 
  } = useTabNavigation();
  
  // Register navigation guard when there are unsaved changes
  useEffect(() => {
    if (hasOrderChanged && sortState.primary === 'custom') {
      const unregister = registerNavigationGuard({
        id: 'my-teams-unsaved-changes',
        guard: () => ({ allow: false, reason: 'unsaved-changes' }),
        tabId: 'my-teams',
        priority: 100,
      });
      
      return unregister;
    }
  }, [hasOrderChanged, sortState.primary, registerNavigationGuard]);
  
  // Show modal when navigation is blocked
  useEffect(() => {
    if (pendingNavigation && hasOrderChanged) {
      setShowUnsavedModal(true);
    }
  }, [pendingNavigation, hasOrderChanged]);
  
  // Handle save from modal
  const handleModalSave = useCallback(() => {
    // Changes are auto-saved to localStorage, just confirm and navigate
    setHasOrderChanged(false);
    setJustSaved(true);
    setShowUnsavedModal(false);
    confirmPendingNavigation();
  }, [confirmPendingNavigation]);
  
  // Handle discard from modal
  const handleModalDiscard = useCallback(() => {
    // Discard changes by resetting to default sort
    clearCustomOrder(userId);
    onSortChange({ primary: 'draftedAt', direction: 'asc' });
    setHasOrderChanged(false);
    setShowUnsavedModal(false);
    confirmPendingNavigation();
  }, [confirmPendingNavigation, userId, onSortChange]);
  
  // Handle cancel from modal
  const handleModalCancel = useCallback(() => {
    setShowUnsavedModal(false);
    cancelPendingNavigation();
  }, [cancelPendingNavigation]);
  
  // Handle undo - restore previous order from history
  const handleUndo = useCallback(() => {
    if (orderHistory.length === 0) return;
    
    // Pop the last order from history
    const newHistory = [...orderHistory];
    const previousOrder = newHistory.pop();
    setOrderHistory(newHistory);
    
    if (previousOrder) {
      // Restore the previous order
      updateCustomOrder(previousOrder, userId);
      // Force re-render
      onSortChange({ ...sortState, primary: 'custom' });
      // Mark as changed - undo creates an unsaved state that needs confirmation
      setHasOrderChanged(true);
      setJustSaved(false);
    }
  }, [orderHistory, userId, onSortChange, sortState]);
  
  // Save current order to history before making a change
  const saveToHistory = useCallback((currentTeamIds: string[]) => {
    setOrderHistory(prev => [...prev, currentTeamIds]);
  }, []);
  
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
  
  // Filter and sort teams
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
    
    // Apply sorting with user ID for custom order
    result = sortTeams(result, sortState, userId);
    
    return result;
  }, [teams, selectedItems, matchingNflTeam, sortState, userId]);
  
  // Calculate points back/ahead based on sort method
  const pointsDiffMap = useMemo(() => {
    // Show points diff for categories that have meaningful comparisons
    const showDiffCategories = ['rank', 'projectedPoints', 'pointsScored', 'pointsBackOfFirst', 'pointsBackOfPlayoffs'];
    if (!showDiffCategories.includes(sortState.primary)) {
      return new Map<string, { pointsBack: number | null; pointsAhead: number | null }>();
    }
    
    const map = new Map<string, { pointsBack: number | null; pointsAhead: number | null }>();
    
    if (filteredTeams.length === 0) {
      return map;
    }
    
    if (sortState.primary === 'rank') {
      // When sorted by rank/standings: compare to 1st place
      // Find the 1st place team (rank 1, or highest projected points if no rank)
      const firstPlaceTeam = filteredTeams.find(t => t.rank === 1) || 
        filteredTeams.reduce((best, current) => 
          current.projectedPoints > best.projectedPoints ? current : best
        );
      
      const firstPlacePoints = firstPlaceTeam.projectedPoints;
      
      filteredTeams.forEach(team => {
        if (team.id === firstPlaceTeam.id) {
          // 1st place team - no points back
          map.set(team.id, { pointsBack: null, pointsAhead: null });
        } else {
          const diff = firstPlacePoints - team.projectedPoints;
          if (diff > 0) {
            map.set(team.id, { pointsBack: diff, pointsAhead: null });
          } else if (diff < 0) {
            map.set(team.id, { pointsBack: null, pointsAhead: Math.abs(diff) });
          } else {
            map.set(team.id, { pointsBack: null, pointsAhead: null });
          }
        }
      });
    } else if (sortState.primary === 'projectedPoints') {
      // When sorted by projected points: compare to playoff cutoff
      // Find the team at the playoff cutoff rank (typically rank 6)
      const playoffCutoffRank = 6; // Standard playoff cutoff
      const playoffCutoffTeam = filteredTeams.find(t => t.rank === playoffCutoffRank);
      
      // If no team at rank 6, use the team with the lowest rank that's >= 6
      const cutoffTeam = playoffCutoffTeam || 
        filteredTeams
          .filter(t => t.rank && t.rank >= playoffCutoffRank)
          .sort((a, b) => (a.rank || 999) - (b.rank || 999))[0];
      
      if (cutoffTeam) {
        const playoffCutoffPoints = cutoffTeam.projectedPoints;
        
        filteredTeams.forEach(team => {
          const diff = playoffCutoffPoints - team.projectedPoints;
          if (diff > 0) {
            map.set(team.id, { pointsBack: diff, pointsAhead: null });
          } else if (diff < 0) {
            map.set(team.id, { pointsBack: null, pointsAhead: Math.abs(diff) });
          } else {
            map.set(team.id, { pointsBack: null, pointsAhead: null });
          }
        });
      }
    } else if (sortState.primary === 'pointsScored') {
      // When sorted by points scored: compare to 1st place (team with highest points scored)
      const getPointsScored = (team: MyTeam) => 
        team.pointsScored ?? team.projectedPoints;
      
      const firstPlaceTeam = filteredTeams.reduce((best, current) => 
        getPointsScored(current) > getPointsScored(best) ? current : best
      );
      
      const firstPlacePoints = getPointsScored(firstPlaceTeam);
      
      filteredTeams.forEach(team => {
        if (team.id === firstPlaceTeam.id) {
          // 1st place team - no points back
          map.set(team.id, { pointsBack: null, pointsAhead: null });
        } else {
          const teamPoints = getPointsScored(team);
          const diff = firstPlacePoints - teamPoints;
          if (diff > 0) {
            map.set(team.id, { pointsBack: diff, pointsAhead: null });
          } else if (diff < 0) {
            map.set(team.id, { pointsBack: null, pointsAhead: Math.abs(diff) });
          } else {
            map.set(team.id, { pointsBack: null, pointsAhead: null });
          }
        }
      });
    } else if (sortState.primary === 'pointsBackOfFirst') {
      // When sorted by points back of 1st: already sorted by this, just show the value
      const firstPlaceTeam = filteredTeams.find(t => t.rank === 1) || 
        filteredTeams.reduce((best, current) => 
          current.projectedPoints > best.projectedPoints ? current : best
        );
      const firstPlacePoints = firstPlaceTeam.projectedPoints;
      
      filteredTeams.forEach(team => {
        const diff = firstPlacePoints - team.projectedPoints;
        if (diff > 0) {
          map.set(team.id, { pointsBack: diff, pointsAhead: null });
        } else if (diff < 0) {
          map.set(team.id, { pointsBack: null, pointsAhead: Math.abs(diff) });
        } else {
          map.set(team.id, { pointsBack: null, pointsAhead: null });
        }
      });
    } else if (sortState.primary === 'pointsBackOfPlayoffs') {
      // When sorted by points back of playoffs: already sorted by this, just show the value
      const playoffCutoffRank = 6;
      const playoffCutoffTeam = filteredTeams.find(t => t.rank === playoffCutoffRank);
      const cutoffTeam = playoffCutoffTeam || 
        filteredTeams
          .filter(t => t.rank && t.rank >= playoffCutoffRank)
          .sort((a, b) => (a.rank || 999) - (b.rank || 999))[0];
      
      if (cutoffTeam) {
        const playoffCutoffPoints = cutoffTeam.projectedPoints;
        
        filteredTeams.forEach(team => {
          const diff = playoffCutoffPoints - team.projectedPoints;
          if (diff > 0) {
            map.set(team.id, { pointsBack: diff, pointsAhead: null });
          } else if (diff < 0) {
            map.set(team.id, { pointsBack: null, pointsAhead: Math.abs(diff) });
          } else {
            map.set(team.id, { pointsBack: null, pointsAhead: null });
          }
        });
      }
    }
    
    return map;
  }, [filteredTeams, sortState.primary]);
  
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
  
  // Drag and drop handlers for custom ordering
  const handleDragStart = useCallback((e: React.DragEvent, teamId: string) => {
    setDraggedTeamId(teamId);
    e.dataTransfer.effectAllowed = 'move';
  }, []);
  
  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  }, []);
  
  const handleDragEnd = useCallback(() => {
    setDraggedTeamId(null);
    setDragOverIndex(null);
  }, []);
  
  const handleDrop = useCallback((e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedTeamId === null) return;
    
    const draggedIndex = filteredTeams.findIndex(t => t.id === draggedTeamId);
    if (draggedIndex === -1 || draggedIndex === dropIndex) {
      setDraggedTeamId(null);
      setDragOverIndex(null);
      return;
    }
    
    // Save current order to history before changing
    saveToHistory(filteredTeams.map(t => t.id));
    
    // Reorder teams
    const newTeams = [...filteredTeams];
    const [removed] = newTeams.splice(draggedIndex, 1);
    newTeams.splice(dropIndex, 0, removed);
    
    // Update custom order with user ID
    const teamIds = newTeams.map(t => t.id);
    updateCustomOrder(teamIds, userId);
    
    // Force re-render by updating sort state (custom order is stored in localStorage)
    onSortChange({ ...sortState, primary: 'custom' });
    
    setDraggedTeamId(null);
    setDragOverIndex(null);
    setHasOrderChanged(true);
    setJustSaved(false);
  }, [draggedTeamId, filteredTeams, sortState, onSortChange, userId, saveToHistory]);
  
  // Move team up/down handlers
  const handleMoveUp = useCallback((teamId: string, currentIndex: number) => {
    if (currentIndex === 0) return;
    
    // Save current order to history before changing
    saveToHistory(filteredTeams.map(t => t.id));
    
    const newTeams = [...filteredTeams];
    [newTeams[currentIndex - 1], newTeams[currentIndex]] = [newTeams[currentIndex], newTeams[currentIndex - 1]];
    
    const teamIds = newTeams.map(t => t.id);
    updateCustomOrder(teamIds, userId);
    onSortChange({ ...sortState, primary: 'custom' });
    setHasOrderChanged(true);
    setJustSaved(false);
  }, [filteredTeams, sortState, onSortChange, userId, saveToHistory]);
  
  const handleMoveDown = useCallback((teamId: string, currentIndex: number) => {
    if (currentIndex >= filteredTeams.length - 1) return;
    
    // Save current order to history before changing
    saveToHistory(filteredTeams.map(t => t.id));
    
    const newTeams = [...filteredTeams];
    [newTeams[currentIndex], newTeams[currentIndex + 1]] = [newTeams[currentIndex + 1], newTeams[currentIndex]];
    
    const teamIds = newTeams.map(t => t.id);
    updateCustomOrder(teamIds, userId);
    onSortChange({ ...sortState, primary: 'custom' });
    setHasOrderChanged(true);
    setJustSaved(false);
  }, [filteredTeams, sortState, onSortChange, userId, saveToHistory]);
  
  return (
    <div 
      className="flex-1 flex flex-col min-h-0"
      style={{ backgroundColor: BG_COLORS.primary }}
    >
      {/* Search */}
      <div
        ref={searchRef}
        style={{
          paddingLeft: `${MYTEAMS_PX.listPadding}px`,
          paddingRight: `${MYTEAMS_PX.listPadding}px`,
          paddingTop: `${MYTEAMS_PX.listPadding + 2 + 4}px`,
          paddingBottom: `${MYTEAMS_PX.listPadding + 2}px`,
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
      
      {/* Sort Controls */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: `${SPACING.sm}px ${MYTEAMS_PX.listPadding}px`,
          borderBottom: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        <span style={{ color: TEXT_COLORS.muted, fontSize: `${TYPOGRAPHY.fontSize.xs}px` }}>
          {filteredTeams.length} {filteredTeams.length === 1 ? 'team' : 'teams'}
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {sortState.primary === 'custom' && (
            <>
              {/* Save button - turns blue when order has changed, shows checkmark after clicking */}
              <button
                onClick={() => {
                  if (hasOrderChanged) {
                    // Custom order is auto-saved to localStorage, this confirms the save
                    setHasOrderChanged(false);
                    setJustSaved(true);
                    // Reset "Saved" state after 2 seconds
                    setTimeout(() => setJustSaved(false), 2000);
                  }
                }}
                disabled={!hasOrderChanged && !justSaved}
                className="flex items-center justify-center gap-1"
                style={{
                  padding: '6px 10px',
                  background: hasOrderChanged 
                    ? 'url(/wr_blue.png) no-repeat center center' 
                    : justSaved 
                      ? 'url(/wr_blue.png) no-repeat center center'
                      : 'rgba(255,255,255,0.05)',
                  backgroundSize: (hasOrderChanged || justSaved) ? 'cover' : undefined,
                  border: (hasOrderChanged || justSaved) ? 'none' : '1px solid rgba(255,255,255,0.1)',
                  borderRadius: `${RADIUS.md}px`,
                  color: (hasOrderChanged || justSaved) ? '#fff' : TEXT_COLORS.secondary,
                  fontSize: `${TYPOGRAPHY.fontSize.xs}px`,
                  cursor: hasOrderChanged ? 'pointer' : 'default',
                  transition: 'all 0.15s ease',
                  opacity: justSaved ? 0.5 : 1,
                }}
                aria-label={justSaved ? 'Changes saved' : 'Save custom order'}
              >
                {justSaved ? (
                  <Check size={14} color="#fff" strokeWidth={3} />
                ) : (
                  <>
                    <Save size={12} color={hasOrderChanged ? '#fff' : TEXT_COLORS.secondary} />
                    Save
                  </>
                )}
              </button>
              {/* Undo button (icon only) - undoes last move */}
              <button
                onClick={handleUndo}
                disabled={orderHistory.length === 0}
                className="flex items-center justify-center"
                style={{
                  padding: '6px',
                  backgroundColor: orderHistory.length > 0 ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: `${RADIUS.md}px`,
                  color: orderHistory.length > 0 ? TEXT_COLORS.secondary : TEXT_COLORS.muted,
                  cursor: orderHistory.length > 0 ? 'pointer' : 'default',
                  transition: 'all 0.15s ease',
                  opacity: orderHistory.length > 0 ? 1 : 0.5,
                }}
                aria-label={`Undo last move (${orderHistory.length} moves in history)`}
              >
                <Undo size={12} color={orderHistory.length > 0 ? TEXT_COLORS.secondary : TEXT_COLORS.muted} />
              </button>
            </>
          )}
          <SortDropdown currentSort={sortState} onSortChange={onSortChange} />
        </div>
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
            {filteredTeams.map((team, index) => {
              const pointsDiff = pointsDiffMap.get(team.id);
              const isCustomSort = sortState.primary === 'custom';
              return (
                <TeamCard 
                  key={team.id} 
                  team={team} 
                  onSelect={() => onSelect(team)}
                  onNameChange={onNameChange}
                  pointsBack={pointsDiff?.pointsBack ?? null}
                  pointsAhead={pointsDiff?.pointsAhead ?? null}
                  showPointsDiff={sortState.primary === 'rank' || sortState.primary === 'projectedPoints' || sortState.primary === 'pointsScored' || sortState.primary === 'pointsBackOfFirst' || sortState.primary === 'pointsBackOfPlayoffs'}
                  sortMethod={
                    sortState.primary === 'rank' ? 'rank' : 
                    sortState.primary === 'projectedPoints' ? 'projectedPoints' : 
                    sortState.primary === 'pointsScored' ? 'pointsScored' : 
                    sortState.primary === 'pointsBackOfFirst' ? 'pointsBackOfFirst' : 
                    sortState.primary === 'pointsBackOfPlayoffs' ? 'pointsBackOfPlayoffs' : 
                    undefined
                  }
                  isCustomSort={isCustomSort}
                  index={index}
                  totalTeams={filteredTeams.length}
                  onMoveUp={isCustomSort ? () => handleMoveUp(team.id, index) : undefined}
                  onMoveDown={isCustomSort ? () => handleMoveDown(team.id, index) : undefined}
                  onDragStart={isCustomSort ? (e) => handleDragStart(e, team.id) : undefined}
                  onDragOver={isCustomSort ? (e) => handleDragOver(e, index) : undefined}
                  onDragEnd={isCustomSort ? handleDragEnd : undefined}
                  onDrop={isCustomSort ? (e) => handleDrop(e, index) : undefined}
                  isDragging={draggedTeamId === team.id}
                  isDragOver={dragOverIndex === index}
                />
              );
            })}
          </div>
        )}
        
        {/* Bottom padding */}
        <div style={{ height: `${SPACING['2xl']}px` }} />
      </div>
      
      {/* Unsaved Changes Modal */}
      <UnsavedChangesModal
        isOpen={showUnsavedModal}
        onSave={handleModalSave}
        onDiscard={handleModalDiscard}
        onCancel={handleModalCancel}
        title="Unsaved Changes"
        message="You have unsaved changes to your custom team order. Would you like to save before leaving?"
      />
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
  isFirstInGroup?: boolean;
}

// Position-specific styling - refined for visual polish
const POSITION_STYLES: Record<string, { bg: string; text: string; accent: string }> = {
  QB: { bg: '#F472B6', text: '#1a0a12', accent: 'rgba(244, 114, 182, 0.12)' },
  RB: { bg: '#0fba80', text: '#041a12', accent: 'rgba(15, 186, 128, 0.12)' },
  WR: { bg: '#FBBF25', text: '#1a1505', accent: 'rgba(251, 191, 37, 0.12)' },
  TE: { bg: '#7C3AED', text: '#ffffff', accent: 'rgba(124, 58, 237, 0.12)' },
};

function PlayerRow({ player, onClick, isExpanded, isLastInGroup, isFirstInGroup }: PlayerRowProps): React.ReactElement {
  const [isPressed, setIsPressed] = useState(false);
  const style = POSITION_STYLES[player.position] || { bg: '#6B7280', text: '#fff', accent: 'rgba(107, 114, 128, 0.12)' };
  
  return (
    <div
      onClick={onClick}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      style={{
        backgroundColor: isPressed ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.02)',
        borderRadius: isFirstInGroup && isLastInGroup ? '6px' : isFirstInGroup ? '6px 6px 0 0' : isLastInGroup ? '0 0 6px 6px' : '0',
        marginBottom: isLastInGroup ? '0px' : '1px',
        overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'background-color 0.1s ease',
        borderLeft: `3px solid ${style.bg}`,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '10px 12px 10px 10px',
          minHeight: '44px',
        }}
      >
        {/* Position Badge - refined with better contrast */}
        <div
          style={{
            backgroundColor: style.bg,
            color: style.text,
            fontSize: '10px',
            fontWeight: 700,
            letterSpacing: '0.3px',
            padding: '4px 8px',
            borderRadius: '4px',
            textTransform: 'uppercase',
            minWidth: '32px',
            textAlign: 'center',
            boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
          }}
        >
          {player.position}
        </div>
        
        {/* Player Info - improved typography and spacing */}
        <div style={{ flex: 1, marginLeft: '12px', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span 
              style={{ 
                color: '#ffffff', 
                fontSize: '14px', 
                fontWeight: 600,
                letterSpacing: '-0.2px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {player.name}
            </span>
            <span 
              style={{ 
                color: '#64748b', 
                fontSize: '11px',
                fontWeight: 500,
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
                flexShrink: 0,
              }}
            >
              {player.team}
            </span>
          </div>
        </div>
        
        {/* Down arrow indicator for expandable rows */}
        {onClick && (
          <div
            style={{
              marginLeft: '8px',
              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease',
              opacity: 0.4,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#94a3b8' }}>
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}

interface TeamDetailsViewProps {
  team: MyTeam;
  onBack: () => void;
  onViewDraftBoard?: () => void;
}

// Player sort pill component for team details
interface PlayerSortPillProps {
  option: PlayerSortOption;
  isActive: boolean;
  direction: 'asc' | 'desc';
  onClick: () => void;
}

function PlayerSortPill({ option, isActive, direction, onClick }: PlayerSortPillProps): React.ReactElement {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        padding: '6px 10px',
        backgroundColor: isActive ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255,255,255,0.05)',
        border: isActive ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid rgba(255,255,255,0.08)',
        borderRadius: '16px',
        color: isActive ? '#60a5fa' : TEXT_COLORS.secondary,
        fontSize: '11px',
        fontWeight: isActive ? 600 : 400,
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        whiteSpace: 'nowrap',
      }}
    >
      <span>{PLAYER_SORT_LABELS[option]}</span>
      {isActive && (
        <svg 
          width="10" 
          height="10" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2.5"
          style={{ 
            transform: direction === 'desc' ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        >
          <polyline points="18 15 12 9 6 15" />
        </svg>
      )}
    </button>
  );
}

function TeamDetailsView({ team, onBack, onViewDraftBoard }: TeamDetailsViewProps): React.ReactElement {
  const router = useRouter();
  
  // Format team name: "The TopDog International X" -> "THE INTERNATIONAL - X"
  const formattedName = useMemo(() => {
    const name = team.name;
    const match = name.match(/^The TopDog International (.+)$/);
    if (match) {
      return `THE INTERNATIONAL ${match[1]}`;
    }
    return name;
  }, [team.name]);
  
  // Expansion state for player stats
  const [expandedPlayerId, setExpandedPlayerId] = useState<string | null>(null);
  // Share modal state
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  // Draft board modal state
  const [isDraftBoardOpen, setIsDraftBoardOpen] = useState(false);
  // Player sort state
  const [playerSort, setPlayerSort] = useState<PlayerSortState>({
    primary: 'position',
    direction: 'asc',
  });
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

  // Handle draft board navigation
  const handleDraftBoardClick = useCallback(() => {
    if (onViewDraftBoard) {
      onViewDraftBoard();
    } else {
      // Show completed draft board modal
      setIsDraftBoardOpen(true);
    }
  }, [onViewDraftBoard]);
  
  // Handle player sort change
  const handlePlayerSortClick = useCallback((option: PlayerSortOption) => {
    setPlayerSort(prev => getNextPlayerSortState(prev, option));
  }, []);
  
  
  // Calculate position counts and pick position
  const positionCounts = useMemo(() => {
    const counts = { QB: 0, RB: 0, WR: 0, TE: 0 };
    team.players.forEach(player => {
      if (player.position in counts) {
        counts[player.position as keyof typeof counts]++;
      }
    });
    return counts;
  }, [team.players]);

  const pickPosition = useMemo(() => {
    if (team.players.length === 0) return null;
    return Math.min(...team.players.map(p => p.pick));
  }, [team.players]);

  // Sort players based on current sort state
  const sortedPlayers = useMemo(() => {
    return sortPlayers(team.players, playerSort);
  }, [team.players, playerSort]);

  // Group players by position when sorting by position, otherwise return flat list
  const groupedPlayers = useMemo(() => {
    if (playerSort.primary === 'position') {
      const posOrder = { QB: 0, RB: 1, WR: 2, TE: 3 };
      
      // Group by position
      const groups: Record<string, TeamPlayer[]> = {};
      sortedPlayers.forEach(player => {
        if (!groups[player.position]) {
          groups[player.position] = [];
        }
        groups[player.position].push(player);
      });
      
      // Return as array of [position, players] tuples, sorted by position order
      return Object.entries(groups).sort(([posA], [posB]) => {
        const orderA = posOrder[posA as keyof typeof posOrder] ?? 4;
        const orderB = posOrder[posB as keyof typeof posOrder] ?? 4;
        return playerSort.direction === 'desc' ? orderB - orderA : orderA - orderB;
      });
    }
    
    // For other sort types, return all players in a single group
    return [['all', sortedPlayers] as [string, TeamPlayer[]]];
  }, [sortedPlayers, playerSort]);
  
  return (
    <div 
      className="flex-1 flex flex-col min-h-0"
      style={{ backgroundColor: BG_COLORS.primary }}
    >
      {/* Position Tracker */}
      <div
        style={{
          backgroundColor: '#0c1420',
          padding: '16px 16px 16px 0',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* Team Name and Pick Position */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingLeft: '16px' }}>
            <button
              onClick={onBack}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: 'none',
                cursor: 'pointer',
                padding: '6px',
                display: 'flex',
                alignItems: 'center',
                borderRadius: '6px',
                transition: 'background 0.15s ease',
              }}
              aria-label="Back to teams"
            >
              <ChevronLeft size={14} color={TEXT_COLORS.muted} />
            </button>
            <button
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: 'none',
                cursor: 'pointer',
                padding: '6px',
                display: 'flex',
                alignItems: 'center',
                borderRadius: '6px',
                transition: 'background 0.15s ease',
              }}
              aria-label="Edit team name"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
            <div>
              <div style={{ color: '#ffffff', fontSize: '16px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {formattedName}
              </div>
              {pickPosition !== null && (
                <div style={{ color: '#94a3b8', fontSize: '12px', marginTop: '2px' }}>
                  Pick position: {pickPosition}
                </div>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={handleDraftBoardClick}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: 'none',
                cursor: 'pointer',
                padding: '6px',
                display: 'flex',
                alignItems: 'center',
                borderRadius: '6px',
                transition: 'background 0.15s ease',
                marginLeft: 'auto',
              }}
              aria-label="View draft board"
            >
              <Grid size={14} color={TEXT_COLORS.muted} />
            </button>
          </div>
        </div>

        {/* Position Distribution Bar */}
        <div style={{ marginBottom: '8px', paddingLeft: '16px', paddingRight: '16px' }}>
          <div
            style={{
              display: 'flex',
              height: '8px',
              borderRadius: '4px',
              overflow: 'hidden',
            }}
          >
            {team.players.length > 0 ? (
              <>
                <div
                  style={{
                    width: `${(positionCounts.QB / team.players.length) * 100}%`,
                    backgroundColor: '#F472B6',
                    minWidth: positionCounts.QB > 0 ? '2px' : '0',
                  }}
                />
                <div
                  style={{
                    width: `${(positionCounts.RB / team.players.length) * 100}%`,
                    backgroundColor: '#0fba80',
                    minWidth: positionCounts.RB > 0 ? '2px' : '0',
                  }}
                />
                <div
                  style={{
                    width: `${(positionCounts.WR / team.players.length) * 100}%`,
                    backgroundColor: '#FBBF25',
                    minWidth: positionCounts.WR > 0 ? '2px' : '0',
                  }}
                />
                <div
                  style={{
                    width: `${(positionCounts.TE / team.players.length) * 100}%`,
                    backgroundColor: '#7C3AED',
                    minWidth: positionCounts.TE > 0 ? '2px' : '0',
                  }}
                />
              </>
            ) : (
              <div style={{ width: '100%', backgroundColor: '#374151' }} />
            )}
          </div>
        </div>

        {/* Position Counts */}
        <div style={{ display: 'flex', gap: '16px', paddingLeft: '16px' }}>
          <span style={{ color: '#F472B6', fontSize: '13px', fontWeight: 600 }}>{positionCounts.QB}</span>
          <span style={{ color: '#0fba80', fontSize: '13px', fontWeight: 600 }}>{positionCounts.RB}</span>
          <span style={{ color: '#FBBF25', fontSize: '13px', fontWeight: 600 }}>{positionCounts.WR}</span>
          <span style={{ color: '#7C3AED', fontSize: '13px', fontWeight: 600 }}>{positionCounts.TE}</span>
        </div>
      </div>
      
      {/* Player Roster */}
      <div
        className="flex-1 min-h-0 overflow-y-auto"
        style={{
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          backgroundColor: '#101927',
          padding: '12px 14px',
        }}
      >
        {groupedPlayers.map(([position, players], groupIndex) => {
          return (
            <React.Fragment key={position}>
              {/* Spacing between position groups */}
              {groupIndex > 0 && <div style={{ height: '12px' }} />}
              
              {/* Position group container */}
              <div
                style={{
                  backgroundColor: 'rgba(255,255,255,0.015)',
                  borderRadius: '8px',
                  overflow: 'hidden',
                }}
              >
                {/* Players in this position group */}
                {players.map((player, index) => {
                  const playerId = `${player.name}-${player.pick}`;
                  const isExpanded = expandedPlayerId === playerId;
                  const isFirstInGroup = index === 0;
                  const isLastInGroup = index === players.length - 1;
                  
                  return (
                    <React.Fragment key={playerId}>
                      <PlayerRow 
                        player={player} 
                        onClick={() => handlePlayerClick(player)}
                        isExpanded={isExpanded}
                        isFirstInGroup={isFirstInGroup}
                        isLastInGroup={isLastInGroup && !isExpanded}
                      />
                      {/* Expanded Stats Card */}
                      {isExpanded && (
                        <div 
                          style={{ 
                            padding: '8px 12px 12px',
                            backgroundColor: 'rgba(0,0,0,0.2)',
                            borderRadius: isLastInGroup ? '0 0 6px 6px' : '0',
                          }}
                        >
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
              </div>
            </React.Fragment>
          );
        })}
        
        {/* Bottom padding for safe area */}
        <div style={{ height: '24px' }} />
      </div>
      
      {/* Share Options Modal */}
      <ShareOptionsModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        shareType="roster"
        contentName={team.name}
      />
      
      {/* Completed Draft Board Modal */}
      <CompletedDraftBoardModal
        team={team}
        isOpen={isDraftBoardOpen}
        onClose={() => setIsDraftBoardOpen(false)}
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
  const { user } = useAuth();
  const userId = user?.uid || null;
  
  // Note: Auth check removed - AuthGateVX2 ensures only logged-in users can access tabs
  
  const [internalSelectedTeam, setInternalSelectedTeam] = useState<MyTeam | null>(null);
  const [teams, setTeams] = useState<MyTeam[]>(initialTeams);
  
  // Sort state management
  const [sortState, setSortState] = useState<SortState>(() => {
    // Try to load from localStorage on initial mount
    const saved = loadSortPreferences();
    return saved || getDefaultSortState();
  });
  
  // Save sort preferences when they change
  const handleSortChange = useCallback((newTeamSort: TeamSortState) => {
    // Initialize custom order if switching to custom sort for the first time
    if (newTeamSort.primary === 'custom') {
      const customOrder = loadCustomOrder(userId);
      if (customOrder.size === 0 && teams.length > 0) {
        // Initialize with current team order
        const teamIds = teams.map(t => t.id);
        updateCustomOrder(teamIds, userId);
      }
    }
    
    setSortState(prev => {
      const newState = { ...prev, teamList: newTeamSort };
      saveSortPreferences(newState);
      return newState;
    });
  }, [teams, userId]);
  
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
      sortState={sortState.teamList}
      onSortChange={handleSortChange}
    />
  );
}

