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
import { SPACING, RADIUS } from '../deps/core/constants/sizes';
import { BG_COLORS, TEXT_COLORS, STATE_COLORS } from '../deps/core/constants/colors';

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
    <div ref={dropdownRef} className="relative">
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 transition-all active:scale-[0.97]"
        style={{
          padding: '6px 12px',
          borderRadius: RADIUS.lg,
          backgroundColor: 'rgba(255, 255, 255, 0.06)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
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
          style={{ color: TEXT_COLORS.muted }}
        >
          <line x1="4" y1="6" x2="16" y2="6" />
          <line x1="4" y1="12" x2="12" y2="12" />
          <line x1="4" y1="18" x2="8" y2="18" />
        </svg>

        <span
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: TEXT_COLORS.secondary,
          }}
        >
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
          style={{
            color: TEXT_COLORS.muted,
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.15s ease',
          }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div
          className="absolute right-0 mt-2 z-50"
          style={{
            minWidth: 180,
            backgroundColor: BG_COLORS.card,
            borderRadius: RADIUS.lg,
            border: '1px solid rgba(255, 255, 255, 0.12)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
            overflow: 'hidden',
          }}
        >
          {SORT_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className="w-full text-left transition-all hover:bg-white/5"
              style={{
                padding: '10px 14px',
                fontSize: 13,
                fontWeight: option.value === value ? 600 : 400,
                color: option.value === value ? STATE_COLORS.active : TEXT_COLORS.primary,
                backgroundColor: option.value === value ? 'rgba(96, 165, 250, 0.1)' : 'transparent',
              }}
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
      className="flex flex-col gap-3"
      style={{
        padding: `${SPACING.sm}px ${SLOW_DRAFT_LAYOUT.listPaddingX}px`,
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      }}
    >
      {/* Top row: Sort */}
      <div className="flex items-center justify-end">
        <SortDropdown value={sortBy} onChange={onSortChange} />
      </div>
    </div>
  );
}
