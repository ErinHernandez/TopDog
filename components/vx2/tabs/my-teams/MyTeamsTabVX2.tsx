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

import { useRouter } from 'next/router';
import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';

import { cn } from '@/lib/styles';

import { usePlayerPool } from '../../../../lib/playerPool/usePlayerPool';
import { isNFLSeasonActive } from '../../../../lib/tournament/seasonUtils';
import {
  PositionBadge,
  Skeleton,
  EmptyState,
  ErrorState,
  PlayerStatsCard,
  SearchInput,
} from '../../../ui';
import { useAuth } from '../../auth/hooks/useAuth';
import {
  ChevronRight,
  ChevronLeft,
  Share,
  Close,
  Grid,
  UserIcon,
  Undo,
  Save,
  Check,
} from '../../components/icons';
import { useHeader, useTabNavigation } from '../../core';
import {
  getPositionColor,
  POSITION_BADGE_THEME,
  TEXT_COLORS,
  UI_COLORS,
} from '../../core/constants/colors';
import ShareOptionsModal from '../../draft-room/components/ShareOptionsModal';
import { useMyTeams, type MyTeam, type TeamPlayer } from '../../hooks/data';
import { useTemporaryState } from '../../hooks/ui/useTemporaryState';
import { UnsavedChangesModal } from '../../modals/UnsavedChangesModal';

import CompletedDraftBoardModal from './CompletedDraftBoardModal';
import styles from './MyTeamsTabVX2.module.css';
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

// Spacing constants removed - now using CSS custom properties in module.css

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
  pointsBack?: number | null;
  pointsAhead?: number | null;
  showPointsDiff?: boolean;
  sortMethod?:
    | 'rank'
    | 'projectedPoints'
    | 'pointsScored'
    | 'pointsBackOfFirst'
    | 'pointsBackOfPlayoffs'
    | 'draftedAt';
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

  // Format draft date: ISO string -> "MMM D, YYYY" (e.g., "Jan 8, 2025")
  const formatDraftDate = useCallback((dateString: string): string => {
    try {
      const date = new Date(dateString);
      const month = date.toLocaleDateString('en-US', { month: 'short' });
      const day = date.getDate();
      const year = date.getFullYear();
      return `${month} ${day}, ${year}`;
    } catch {
      return '';
    }
  }, []);

  const handleClick = (e: React.MouseEvent) => {
    onSelect();
  };

  return (
    <div
      onClick={handleClick}
      draggable={isCustomSort}
      onDragStart={isCustomSort ? onDragStart : undefined}
      onDragOver={isCustomSort ? onDragOver : undefined}
      onDragEnd={isCustomSort ? onDragEnd : undefined}
      onDrop={isCustomSort ? onDrop : undefined}
      className={cn(
        styles.teamCard,
        isDragging && styles.teamCardDragging,
        isDragOver && styles.teamCardDragOver,
        isCustomSort && styles.teamCardDraggable,
      )}
      aria-label={`View ${team.name}`}
    >
      <div className={styles.teamCardContent}>
        {/* Standing - only shown when season has started and rank is available */}
        {seasonStarted && team.rank && team.rank >= 1 && team.rank <= 12 && (
          <div className={styles.teamCardRankBadge}>
            <span className={styles.teamCardRankText}>{formatRank(team.rank)}</span>
          </div>
        )}
        <div className={styles.teamCardInfoContainer}>
          <div className={styles.teamCardInfoContent}>
            <h3 className={styles.teamCardName}>{formattedName}</h3>
            {sortMethod === 'draftedAt' && team.draftedAt && (
              <span className={styles.teamCardDraftDate}>{formatDraftDate(team.draftedAt)}</span>
            )}
            {showPointsDiff &&
              ((pointsBack ?? null) !== null || (pointsAhead ?? null) !== null) && (
                <div className={styles.teamCardPointsContainer}>
                  {(pointsBack ?? null) !== null && (pointsBack ?? 0) > 0 && (
                    <span className={styles.teamCardPointsValue}>
                      {(pointsBack ?? 0).toFixed(1)} pts back
                    </span>
                  )}
                  {(pointsAhead ?? null) !== null && (pointsAhead ?? 0) > 0 && (
                    <span className={styles.teamCardPointsValue}>
                      {(pointsAhead ?? 0).toFixed(1)} pts ahead
                    </span>
                  )}
                </div>
              )}
          </div>
        </div>
      </div>
      {isCustomSort ? (
        <div className={styles.teamCardActionsContainer} onClick={e => e.stopPropagation()}>
          {index > 0 && onMoveUp && (
            <button
              onClick={e => {
                e.stopPropagation();
                onMoveUp();
              }}
              className={cn(styles.moveButton, styles.moveButtonActive)}
              aria-label="Move up"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="18 15 12 9 6 15" />
              </svg>
            </button>
          )}
          {index < totalTeams - 1 && onMoveDown && (
            <button
              onClick={e => {
                e.stopPropagation();
                onMoveDown();
              }}
              className={cn(styles.moveButton, styles.moveButtonActive)}
              aria-label="Move down"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          )}
        </div>
      ) : (
        <div className={styles.chevronContainer}>
          <ChevronRight size={20} />
        </div>
      )}
    </div>
  );
}

function TeamCardSkeleton(): React.ReactElement {
  return (
    <div className={styles.teamCard}>
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
    'custom',
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
    <div ref={dropdownRef} className={styles.sortDropdownWrapper}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={styles.sortDropdownButton}
        aria-label={`Sort by ${TEAM_SORT_LABELS[currentSort.primary]}, ${currentSort.direction === 'asc' ? 'ascending' : 'descending'}`}
      >
        <span className={styles.sortDropdownButtonLabel}>Sort:</span>
        <span className={styles.sortDropdownButtonValue}>
          {TEAM_SORT_LABELS[currentSort.primary]}
        </span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={cn(
            styles.sortDropdownArrow,
            currentSort.direction === 'desc' && styles.sortDropdownArrowRotated,
          )}
        >
          <polyline points="18 15 12 9 6 15" />
        </svg>
      </button>

      {isOpen && (
        <div className={styles.sortDropdownPanel}>
          {sortOptions.map(option => {
            const isActive = currentSort.primary === option;
            return (
              <button
                key={option}
                onClick={() => handleOptionClick(option)}
                className={cn(styles.sortDropdownItem, isActive && styles.sortDropdownItemActive)}
              >
                <span className={styles.sortDropdownItemLabel}>{TEAM_SORT_LABELS[option]}</span>
                {isActive && (
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className={cn(
                      styles.sortDropdownItemCheckmark,
                      currentSort.direction === 'desc' && styles.sortDropdownItemCheckmarkRotated,
                    )}
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
  sortState: TeamSortState;
  onSortChange: (sort: TeamSortState) => void;
}

function TeamListView({
  teams,
  isLoading,
  onSelect,
  sortState,
  onSortChange,
}: TeamListViewProps): React.ReactElement {
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
  const [justSaved, setJustSaved, setJustSavedPermanent] = useTemporaryState(false, 2000);

  // Undo history - stores previous team ID orders
  const [orderHistory, setOrderHistory] = useState<string[][]>([]);

  // Navigation guard for unsaved changes
  const {
    registerNavigationGuard,
    pendingNavigation,
    confirmPendingNavigation,
    cancelPendingNavigation,
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
    return undefined;
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
  }, [confirmPendingNavigation, setJustSaved]);

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
      setJustSavedPermanent(false);
    }
  }, [orderHistory, userId, onSortChange, sortState, setJustSavedPermanent]);

  // Save current order to history before making a change
  const saveToHistory = useCallback((currentTeamIds: string[]) => {
    setOrderHistory(prev => [...prev, currentTeamIds]);
  }, []);

  // Type guard for reduce function
  const getBestTeam = (teams: MyTeam[]) => {
    return teams.reduce((best, current) =>
      current.projectedPoints > best.projectedPoints ? current : best,
    );
  };

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
    const showDiffCategories = [
      'rank',
      'projectedPoints',
      'pointsScored',
      'pointsBackOfFirst',
      'pointsBackOfPlayoffs',
    ];
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
      const firstPlaceTeam = filteredTeams.find(t => t.rank === 1) || getBestTeam(filteredTeams);

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
      const cutoffTeam =
        playoffCutoffTeam ||
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
      const getPointsScored = (team: MyTeam) => team.pointsScored ?? team.projectedPoints;

      const firstPlaceTeam =
        filteredTeams.length > 0
          ? filteredTeams.reduce((best, current) =>
              getPointsScored(current) > getPointsScored(best) ? current : best,
            )
          : null;

      if (!firstPlaceTeam) return map;

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
      const firstPlaceTeam = filteredTeams.find(t => t.rank === 1) || getBestTeam(filteredTeams);
      if (!firstPlaceTeam) {
        // No teams to sort
        return map;
      }
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
      const cutoffTeam =
        playoffCutoffTeam ||
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

  const handleDrop = useCallback(
    (e: React.DragEvent, dropIndex: number) => {
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
      newTeams.splice(dropIndex, 0, removed!);

      // Update custom order with user ID
      const teamIds = newTeams.map(t => t.id);
      updateCustomOrder(teamIds, userId);

      // Force re-render by updating sort state (custom order is stored in localStorage)
      onSortChange({ ...sortState, primary: 'custom' });

      setDraggedTeamId(null);
      setDragOverIndex(null);
      setHasOrderChanged(true);
      setJustSavedPermanent(false);
    },
    [
      draggedTeamId,
      filteredTeams,
      sortState,
      onSortChange,
      userId,
      saveToHistory,
      setJustSavedPermanent,
    ],
  );

  // Move team up/down handlers
  const handleMoveUp = useCallback(
    (teamId: string, currentIndex: number) => {
      if (currentIndex === 0) return;

      // Save current order to history before changing
      saveToHistory(filteredTeams.map(t => t.id));

      const newTeams = [...filteredTeams];
      [newTeams[currentIndex - 1], newTeams[currentIndex]] = [
        newTeams[currentIndex]!,
        newTeams[currentIndex - 1]!,
      ];

      const teamIds = newTeams.map(t => t.id);
      updateCustomOrder(teamIds, userId);
      onSortChange({ ...sortState, primary: 'custom' });
      setHasOrderChanged(true);
      setJustSavedPermanent(false);
    },
    [filteredTeams, sortState, onSortChange, userId, saveToHistory, setJustSavedPermanent],
  );

  const handleMoveDown = useCallback(
    (teamId: string, currentIndex: number) => {
      if (currentIndex >= filteredTeams.length - 1) return;

      // Save current order to history before changing
      saveToHistory(filteredTeams.map(t => t.id));

      const newTeams = [...filteredTeams];
      [newTeams[currentIndex], newTeams[currentIndex + 1]] = [
        newTeams[currentIndex + 1]!,
        newTeams[currentIndex]!,
      ];

      const teamIds = newTeams.map(t => t.id);
      updateCustomOrder(teamIds, userId);
      onSortChange({ ...sortState, primary: 'custom' });
      setHasOrderChanged(true);
      setJustSavedPermanent(false);
    },
    [filteredTeams, sortState, onSortChange, userId, saveToHistory, setJustSavedPermanent],
  );

  return (
    <div className={styles.teamListContainer}>
      {/* Search */}
      <div ref={searchRef} className={styles.searchSection}>
        <div className={styles.searchInputWrapper}>
          <SearchInput
            value={searchQuery}
            onChange={value => {
              setSearchQuery(value);
              setShowDropdown(value.trim().length > 0);
            }}
            placeholder="Search for player(s)"
          />

          {/* Dropdown */}
          {showDropdown && dropdownOptions.length > 0 && (
            <div className={styles.dropdownMenu}>
              {dropdownOptions.map(option => (
                <button
                  key={`${option.type}-${option.id}`}
                  onClick={() => handleSelectItem(option)}
                  className={styles.dropdownOption}
                >
                  <div className={styles.dropdownOptionContent}>
                    {option.type === 'player' && option.position && (
                      <PositionBadge
                        position={option.position as 'QB' | 'RB' | 'WR' | 'TE'}
                        size="sm"
                      />
                    )}
                    <div className={styles.dropdownOptionInfo}>
                      <div className={styles.dropdownOptionName}>{option.name}</div>
                      {option.type === 'player' && option.team && (
                        <div className={styles.dropdownOptionTeam}>{option.team}</div>
                      )}
                      {option.type === 'team' && (
                        <div className={styles.dropdownOptionTeam}>NFL Team</div>
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
          <div className={styles.selectedItemsWrapper}>
            {selectedItems.map(item => (
              <div key={`${item.type}-${item.id}`} className={styles.selectedItem}>
                {item.type === 'player' && item.position && (
                  <PositionBadge position={item.position as 'QB' | 'RB' | 'WR' | 'TE'} size="sm" />
                )}
                <span>{item.name}</span>
                <button
                  onClick={() => handleRemoveItem(item.id)}
                  className={styles.selectedItemRemoveButton}
                  aria-label={`Remove ${item.name}`}
                >
                  <Close size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sort Controls */}
      <div className={styles.sortControlsSection}>
        <span className={styles.teamCountLabel}>
          {filteredTeams.length} {filteredTeams.length === 1 ? 'team' : 'teams'}
        </span>
        <div className={styles.sortButtonsContainer}>
          {sortState.primary === 'custom' && (
            <>
              {/* Save button - turns blue when order has changed, shows checkmark after clicking */}
              <button
                onClick={() => {
                  if (hasOrderChanged) {
                    // Custom order is auto-saved to localStorage, this confirms the save
                    setHasOrderChanged(false);
                    setJustSaved(true);
                  }
                }}
                disabled={!hasOrderChanged && !justSaved}
                className={cn(
                  styles.saveButton,
                  hasOrderChanged && styles.saveButtonActive,
                  justSaved && styles.saveButtonSaved,
                  !hasOrderChanged && !justSaved && styles.saveButtonDisabled,
                )}
                aria-label={justSaved ? 'Changes saved' : 'Save custom order'}
              >
                {justSaved ? (
                  <Check size={14} color={TEXT_COLORS.primary} strokeWidth={3} />
                ) : (
                  <>
                    <Save
                      size={12}
                      color={hasOrderChanged ? TEXT_COLORS.primary : TEXT_COLORS.secondary}
                    />
                    Save
                  </>
                )}
              </button>
              {/* Undo button (icon only) - undoes last move */}
              <button
                onClick={handleUndo}
                disabled={orderHistory.length === 0}
                className={cn(
                  styles.undoButton,
                  orderHistory.length > 0 && styles.undoButtonActive,
                  orderHistory.length === 0 && styles.undoButtonDisabled,
                )}
                aria-label={`Undo last move (${orderHistory.length} moves in history)`}
              >
                <Undo size={12} />
              </button>
            </>
          )}
          <SortDropdown currentSort={sortState} onSortChange={onSortChange} />
        </div>
      </div>

      {/* Team List */}
      <div className={styles.teamListContent}>
        {isLoading ? (
          <div className={styles.teamListLoadingContainer}>
            {[1, 2, 3, 4].map(i => (
              <TeamCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredTeams.length === 0 ? (
          <EmptyState
            title="No Teams Found"
            description={
              selectedItems.length > 0
                ? 'No teams match your search criteria'
                : 'Join a draft to build your first team!'
            }
          />
        ) : (
          <div className={styles.teamListActualContainer}>
            {filteredTeams.map((team, index) => {
              const pointsDiff = pointsDiffMap.get(team.id);
              const isCustomSort = sortState.primary === 'custom';
              return (
                <TeamCard
                  key={team.id}
                  team={team}
                  onSelect={() => onSelect(team)}
                  pointsBack={pointsDiff?.pointsBack ?? null}
                  pointsAhead={pointsDiff?.pointsAhead ?? null}
                  showPointsDiff={
                    sortState.primary === 'rank' ||
                    sortState.primary === 'projectedPoints' ||
                    sortState.primary === 'pointsScored' ||
                    sortState.primary === 'pointsBackOfFirst' ||
                    sortState.primary === 'pointsBackOfPlayoffs'
                  }
                  sortMethod={
                    sortState.primary === 'rank'
                      ? 'rank'
                      : sortState.primary === 'projectedPoints'
                        ? 'projectedPoints'
                        : sortState.primary === 'pointsScored'
                          ? 'pointsScored'
                          : sortState.primary === 'pointsBackOfFirst'
                            ? 'pointsBackOfFirst'
                            : sortState.primary === 'pointsBackOfPlayoffs'
                              ? 'pointsBackOfPlayoffs'
                              : sortState.primary === 'draftedAt'
                                ? 'draftedAt'
                                : undefined
                  }
                  isCustomSort={isCustomSort}
                  index={index}
                  totalTeams={filteredTeams.length}
                  onMoveUp={isCustomSort ? () => handleMoveUp(team.id, index) : undefined}
                  onMoveDown={isCustomSort ? () => handleMoveDown(team.id, index) : undefined}
                  onDragStart={isCustomSort ? e => handleDragStart(e, team.id) : undefined}
                  onDragOver={isCustomSort ? e => handleDragOver(e, index) : undefined}
                  onDragEnd={isCustomSort ? handleDragEnd : undefined}
                  onDrop={isCustomSort ? e => handleDrop(e, index) : undefined}
                  isDragging={draggedTeamId === team.id}
                  isDragOver={dragOverIndex === index}
                />
              );
            })}
          </div>
        )}

        {/* Bottom padding */}
        <div className={styles.teamListBottomPadding} />
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

// Position style: bg from getPositionColor, text/accent from POSITION_BADGE_THEME (core/constants/colors)
function getPositionStyle(position: string): { bg: string; text: string; accent: string } {
  const badge =
    POSITION_BADGE_THEME[position as keyof typeof POSITION_BADGE_THEME] ?? POSITION_BADGE_THEME.BN;
  if (!badge) {
    // Fallback to BN badge if still missing
    const fallback = POSITION_BADGE_THEME.BN;
    return {
      bg: getPositionColor(position),
      text: fallback?.text ?? '#000000',
      accent: fallback?.accent ?? '#cccccc',
    };
  }
  return { bg: getPositionColor(position), text: badge.text, accent: badge.accent };
}

function PlayerRow({
  player,
  onClick,
  isExpanded,
  isLastInGroup,
  isFirstInGroup,
}: PlayerRowProps): React.ReactElement {
  const [isPressed, setIsPressed] = useState(false);
  const style = getPositionStyle(player.position);

  const getPositionBadgeClass = () => {
    switch (player.position) {
      case 'QB':
        return styles.positionBadgeQB;
      case 'RB':
        return styles.positionBadgeRB;
      case 'WR':
        return styles.positionBadgeWR;
      case 'TE':
        return styles.positionBadgeTE;
      default:
        return styles.positionBadgeDefault;
    }
  };

  return (
    <div
      onClick={onClick}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      className={cn(
        styles.playerRow,
        isPressed && styles.playerRowPressed,
        isFirstInGroup && isLastInGroup && styles.playerRowBoth,
        isFirstInGroup && !isLastInGroup && styles.playerRowFirstInGroup,
        isLastInGroup && !isFirstInGroup && styles.playerRowLastInGroup,
        !isLastInGroup && styles.playerRowWithGap,
      )}
      style={
        {
          '--position-border-color': style.bg,
        } as React.CSSProperties
      }
    >
      <div className={styles.playerRowContent}>
        {/* Position Badge - refined with better contrast */}
        <div className={cn(styles.positionBadge, getPositionBadgeClass())}>{player.position}</div>

        {/* Player Info - improved typography and spacing */}
        <div className={styles.playerInfoContainer}>
          <div className={styles.playerInfoContent}>
            <span className={styles.playerName}>{player.name}</span>
            <span className={styles.playerTeam}>{player.team}</span>
          </div>
        </div>

        {/* Down arrow indicator for expandable rows */}
        {onClick && (
          <div
            className={cn(
              styles.playerExpandIndicator,
              isExpanded && styles.playerExpandIndicatorExpanded,
            )}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
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

function PlayerSortPill({
  option,
  isActive,
  direction,
  onClick,
}: PlayerSortPillProps): React.ReactElement {
  return (
    <button
      onClick={onClick}
      className={cn(styles.playerSortPill, isActive && styles.playerSortPillActive)}
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
          className={cn(
            styles.playerSortPillCheckmark,
            direction === 'desc' && styles.playerSortPillCheckmarkRotated,
          )}
        >
          <polyline points="18 15 12 9 6 15" />
        </svg>
      )}
    </button>
  );
}

function TeamDetailsView({
  team,
  onBack,
  onViewDraftBoard,
}: TeamDetailsViewProps): React.ReactElement {
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
    setExpandedPlayerId(prev => (prev === playerId ? null : playerId));
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
        const group = groups[player.position];
        if (group) {
          group.push(player);
        }
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
    <div className={styles.teamDetailsContainer}>
      {/* Position Tracker */}
      <div className={styles.positionTrackerSection}>
        {/* Team Name and Pick Position */}
        <div className={styles.teamHeaderWrapper}>
          <div className={styles.teamHeaderLeftSection}>
            <button onClick={onBack} className={styles.backButton} aria-label="Back to teams">
              <ChevronLeft size={14} />
            </button>
            <button className={styles.editButton} aria-label="Edit team name">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke={TEXT_COLORS.muted}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
            <div className={styles.teamNameContainer}>
              <div className={styles.teamName}>{formattedName}</div>
              {pickPosition !== null && (
                <div className={styles.pickPositionLabel}>Pick position: {pickPosition}</div>
              )}
            </div>
          </div>
          <div className={styles.teamHeaderRightSection}>
            <button
              onClick={handleDraftBoardClick}
              className={styles.draftBoardButton}
              aria-label="View draft board"
            >
              <Grid size={14} />
            </button>
          </div>
        </div>

        {/* Position Distribution Bar */}
        <div className={styles.positionDistributionWrapper}>
          <div className={styles.positionDistributionBar}>
            {team.players.length > 0 ? (
              <>
                <div
                  className={cn(styles.positionSegment, styles.positionSegmentQB)}
                  style={
                    {
                      '--segment-width': `${(positionCounts.QB / team.players.length) * 100}%`,
                      '--segment-min-width': positionCounts.QB > 0 ? '2px' : '0',
                    } as React.CSSProperties
                  }
                />
                <div
                  className={cn(styles.positionSegment, styles.positionSegmentRB)}
                  style={
                    {
                      '--segment-width': `${(positionCounts.RB / team.players.length) * 100}%`,
                      '--segment-min-width': positionCounts.RB > 0 ? '2px' : '0',
                    } as React.CSSProperties
                  }
                />
                <div
                  className={cn(styles.positionSegment, styles.positionSegmentWR)}
                  style={
                    {
                      '--segment-width': `${(positionCounts.WR / team.players.length) * 100}%`,
                      '--segment-min-width': positionCounts.WR > 0 ? '2px' : '0',
                    } as React.CSSProperties
                  }
                />
                <div
                  className={cn(styles.positionSegment, styles.positionSegmentTE)}
                  style={
                    {
                      '--segment-width': `${(positionCounts.TE / team.players.length) * 100}%`,
                      '--segment-min-width': positionCounts.TE > 0 ? '2px' : '0',
                    } as React.CSSProperties
                  }
                />
              </>
            ) : (
              <div
                className={cn(styles.positionSegment, styles.positionSegmentEmpty)}
                style={{ '--segment-width': '100%' } as React.CSSProperties}
              />
            )}
          </div>
        </div>

        {/* Position Counts */}
        <div className={styles.positionCountsWrapper}>
          <span className={cn(styles.positionCount, styles.positionCountQB)}>
            {positionCounts.QB}
          </span>
          <span className={cn(styles.positionCount, styles.positionCountRB)}>
            {positionCounts.RB}
          </span>
          <span className={cn(styles.positionCount, styles.positionCountWR)}>
            {positionCounts.WR}
          </span>
          <span className={cn(styles.positionCount, styles.positionCountTE)}>
            {positionCounts.TE}
          </span>
        </div>
      </div>

      {/* Player Roster */}
      <div className={styles.playerRosterSection}>
        {groupedPlayers.map(([position, players], groupIndex) => {
          return (
            <React.Fragment key={position}>
              {/* Spacing between position groups */}
              {groupIndex > 0 && <div className={styles.positionGroupSpacing} />}

              {/* Position group container */}
              <div className={styles.positionGroup}>
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
                          className={cn(
                            styles.playerStatsContainer,
                            isLastInGroup && styles.playerStatsContainerLastInGroup,
                          )}
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
        <div className={styles.playerRosterPadding} />
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
  // CRITICAL: Initialize with default state to prevent hydration mismatch
  // Load from localStorage in useEffect after mount (client-side only)
  const [sortState, setSortState] = useState<SortState>(() => {
    // Always return default state on initial render (both server and client)
    // This ensures server and client render the same HTML during hydration
    return getDefaultSortState();
  });

  // Load sort preferences from localStorage after mount (client-side only)
  useEffect(() => {
    const saved = loadSortPreferences();
    if (saved) {
      setSortState(saved);
    }
  }, []);

  // Save sort preferences when they change
  const handleSortChange = useCallback(
    (newTeamSort: TeamSortState) => {
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
    },
    [teams, userId],
  );

  // Update teams when initialTeams changes
  useEffect(() => {
    setTeams(initialTeams);
  }, [initialTeams]);

  // Use external or internal state
  const selectedTeam =
    externalSelectedTeam !== undefined ? externalSelectedTeam : internalSelectedTeam;

  const handleSelectTeam = useCallback(
    (team: MyTeam | null) => {
      if (onSelectTeam) {
        onSelectTeam(team);
      } else {
        setInternalSelectedTeam(team);
      }
    },
    [onSelectTeam],
  );

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
      <div className="flex-1 flex items-center justify-center">
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
      sortState={sortState.teamList}
      onSortChange={handleSortChange}
    />
  );
}
