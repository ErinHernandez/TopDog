/**
 * SortDropdown Component
 *
 * Dropdown menu for selecting team sort options.
 *
 * @module components/vx2/tabs/my-teams/components/SortDropdown
 */

import React, { useState, useRef, useEffect } from 'react';
import { BG_COLORS, TEXT_COLORS } from '../../../core/constants/colors';
import { RADIUS, TYPOGRAPHY } from '../../../core/constants/sizes';
import {
  getNextTeamSortState,
  TEAM_SORT_LABELS,
  type TeamSortState,
  type TeamSortOption,
} from '../sortUtils';
import { cn } from '@/lib/styles';
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
        style={{
          '--bg-color': BG_COLORS.secondary,
          '--border': '1px solid rgba(255,255,255,0.1)',
          '--border-radius': `${RADIUS.md}px`,
          '--text-color': TEXT_COLORS.secondary,
          '--font-size': `${TYPOGRAPHY.fontSize.xs}px`,
          '--bg-hover': 'rgba(255,255,255,0.08)',
        } as React.CSSProperties}
        aria-label={`Sort by ${TEAM_SORT_LABELS[currentSort.primary]}, ${currentSort.direction === 'asc' ? 'ascending' : 'descending'}`}
      >
        <span className={styles.sortLabel} style={{ '--label-color': TEXT_COLORS.muted } as React.CSSProperties}>Sort:</span>
        <span className={styles.sortValue} style={{ '--value-color': TEXT_COLORS.primary } as React.CSSProperties}>
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
        <div
          className={styles.dropdownMenu}
          style={{
            '--menu-bg': BG_COLORS.secondary,
            '--menu-border': '1px solid rgba(255,255,255,0.1)',
            '--menu-border-radius': `${RADIUS.lg}px`,
            '--menu-shadow': '0 4px 12px rgba(0,0,0,0.3)',
          } as React.CSSProperties}
        >
          {sortOptions.map((option) => {
            const isActive = currentSort.primary === option;
            return (
              <button
                key={option}
                onClick={() => handleOptionClick(option)}
                className={cn(styles.menuOption, isActive && styles.active)}
                style={{
                  '--option-bg': isActive ? 'rgba(255,255,255,0.05)' : 'transparent',
                  '--option-border': '1px solid rgba(255,255,255,0.05)',
                  '--option-text-color': isActive ? TEXT_COLORS.primary : TEXT_COLORS.secondary,
                  '--option-font-size': `${TYPOGRAPHY.fontSize.sm}px`,
                  '--option-hover-bg': 'rgba(255,255,255,0.08)',
                  '--option-active-bg': 'rgba(255,255,255,0.05)',
                  '--option-active-color': TEXT_COLORS.primary,
                } as React.CSSProperties}
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
