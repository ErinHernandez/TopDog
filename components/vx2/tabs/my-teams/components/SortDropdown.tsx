/**
 * SortDropdown Component
 *
 * Dropdown menu for selecting team sort options.
 *
 * @module components/vx2/tabs/my-teams/components/SortDropdown
 */

import React, { useState, useRef, useEffect } from 'react';

import { cn } from '@/lib/styles';

import {
  getNextTeamSortState,
  TEAM_SORT_LABELS,
  type TeamSortState,
  type TeamSortOption,
} from '../sortUtils';

import styles from './SortDropdown.module.css';

// ============================================================================
// TYPES
// ============================================================================

export interface SortDropdownProps {
  currentSort: TeamSortState;
  onSortChange: (sort: TeamSortState) => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function SortDropdown({ currentSort, onSortChange }: SortDropdownProps): React.ReactElement {
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
    <div ref={dropdownRef} className={styles.dropdownContainer}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={styles.dropdownButton}
        aria-label={`Sort by ${TEAM_SORT_LABELS[currentSort.primary]}, ${currentSort.direction === 'asc' ? 'ascending' : 'descending'}`}
      >
        <span className={styles.sortLabel}>Sort:</span>
        <span className={styles.sortValue}>
          {TEAM_SORT_LABELS[currentSort.primary]}
        </span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={cn(styles.sortIcon, currentSort.direction === 'desc' && styles.rotated)}
        >
          <polyline points="18 15 12 9 6 15" />
        </svg>
      </button>

      {isOpen && (
        <div className={styles.dropdownMenu}>
          {sortOptions.map((option) => {
            const isActive = currentSort.primary === option;
            return (
              <button
                key={option}
                onClick={() => handleOptionClick(option)}
                className={cn(styles.menuOption, isActive && styles.active)}
              >
                <span className={styles.optionText}>{TEAM_SORT_LABELS[option]}</span>
                {isActive && (
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className={cn(styles.optionCheckIcon, currentSort.direction === 'desc' && styles.rotated)}
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

export default SortDropdown;
