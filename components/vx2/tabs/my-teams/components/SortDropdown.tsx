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

export default SortDropdown;
