/**
 * FilterSortBar - Sort and filter controls for slow drafts
 *
 * Provides sorting options and quick filters to help users
 * prioritize which of their 50+ drafts need attention.
 */

import React, { useState, useRef, useEffect } from 'react';
import type { FilterSortBarProps } from '../types';
import {
  SORT_OPTIONS,
  SLOW_DRAFT_LAYOUT,
  SLOW_DRAFT_TYPOGRAPHY,
  SLOW_DRAFT_COLORS,
  type SortOption,
} from '../constants';
import { SPACING, RADIUS } from '../../../core/constants/sizes';
import { BG_COLORS, TEXT_COLORS, STATE_COLORS } from '../../../core/constants/colors';
import styles from './FilterSortBar.module.css';

// ============================================================================
// SORT DROPDOWN
// ============================================================================

interface SortDropdownProps {
  value: SortOption;
  onChange: (value: SortOption) => void;
}

function SortDropdown({ value, onChange }: SortDropdownProps): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = SORT_OPTIONS.find((opt) => opt.value === value);

  return (
    <div ref={dropdownRef} className={styles.dropdownContainer}>
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={styles.sortButton}
        style={{
          '--radius-lg': `${RADIUS.lg}px`,
          '--text-color-muted': TEXT_COLORS.muted,
          '--text-color-secondary': TEXT_COLORS.secondary,
        } as React.CSSProperties}
      >
        {/* Sort icon */}
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={styles.sortIcon}
        >
          <line x1="4" y1="6" x2="16" y2="6" />
          <line x1="4" y1="12" x2="12" y2="12" />
          <line x1="4" y1="18" x2="8" y2="18" />
        </svg>

        <span className={styles.sortLabel}>
          {selectedOption?.label || 'Sort'}
        </span>

        {/* Chevron */}
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`${styles.chevron} ${isOpen ? styles.open : ''}`}
          style={{
            '--text-color-muted': TEXT_COLORS.muted,
          } as React.CSSProperties}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div
          className={styles.dropdownMenu}
          style={{
            '--bg-color-card': BG_COLORS.card,
            '--radius-lg': `${RADIUS.lg}px`,
          } as React.CSSProperties}
        >
          {SORT_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`${styles.menuItem} ${option.value === value ? styles.active : ''}`}
              style={{
                '--text-color-primary': TEXT_COLORS.primary,
                '--text-color-active': option.value === value ? STATE_COLORS.active : TEXT_COLORS.primary,
                '--state-color-active': STATE_COLORS.active,
              } as React.CSSProperties}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function FilterSortBar({
  sortBy,
  onSortChange,
}: FilterSortBarProps): React.ReactElement {
  return (
    <div
      className={styles.barContainer}
      style={{
        '--spacing-sm': `${SPACING.sm}`,
        '--padding-x': `${SLOW_DRAFT_LAYOUT.listPaddingX}px`,
      } as React.CSSProperties}
    >
      {/* Top row: Sort */}
      <div className={styles.barTopRow}>
        <SortDropdown value={sortBy} onChange={onSortChange} />
      </div>
    </div>
  );
}
