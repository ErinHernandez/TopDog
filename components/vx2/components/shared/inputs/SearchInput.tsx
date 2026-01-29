/**
 * SearchInput - Search input field with icon
 *
 * Migrated to CSS Modules for CSP compliance.
 *
 * @example
 * ```tsx
 * <SearchInput
 *   value={query}
 *   onChange={setQuery}
 *   placeholder="Search players..."
 * />
 * ```
 */

import React, { useRef, useCallback } from 'react';
import { BG_COLORS, TEXT_COLORS, BORDER_COLORS, STATE_COLORS } from '../../../core/constants/colors';
import { SPACING, RADIUS, TYPOGRAPHY } from '../../../core/constants/sizes';
import { Search, Close } from '../../icons';
import { cn } from '@/lib/styles';
import styles from './SearchInput.module.css';

// ============================================================================
// TYPES
// ============================================================================

export interface SearchInputProps {
  /** Current value */
  value: string;
  /** Change handler */
  onChange: (value: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Whether input is disabled */
  disabled?: boolean;
  /** Auto focus on mount */
  autoFocus?: boolean;
  /** Show clear button when has value */
  showClear?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Additional className */
  className?: string;
  /** Called when Enter is pressed */
  onSubmit?: () => void;
  /** Called when Escape is pressed */
  onCancel?: () => void;
  /** Accessibility label */
  'aria-label'?: string;
}

// ============================================================================
// SIZE CONFIG
// ============================================================================

const SIZE_CONFIG = {
  sm: {
    height: 36,
    paddingX: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.sm,
    iconSize: 16,
  },
  md: {
    height: 44,
    paddingX: SPACING.md,
    fontSize: TYPOGRAPHY.fontSize.base,
    iconSize: 18,
  },
  lg: {
    height: 52,
    paddingX: SPACING.lg,
    fontSize: TYPOGRAPHY.fontSize.lg,
    iconSize: 20,
  },
} as const;

// ============================================================================
// COMPONENT
// ============================================================================

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search...',
  disabled = false,
  autoFocus = false,
  showClear = true,
  size = 'md',
  className = '',
  onSubmit,
  onCancel,
  'aria-label': ariaLabel = 'Search',
}: SearchInputProps): React.ReactElement {
  const inputRef = useRef<HTMLInputElement>(null);
  const config = SIZE_CONFIG[size];

  const handleClear = useCallback(() => {
    onChange('');
    inputRef.current?.focus();
  }, [onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && onSubmit) {
      onSubmit();
    } else if (e.key === 'Escape') {
      if (value) {
        handleClear();
      } else if (onCancel) {
        onCancel();
      }
    }
  }, [value, onSubmit, onCancel, handleClear]);

  // CSS custom properties for dynamic values
  const containerStyle: React.CSSProperties = {
    '--input-height': `${config.height}px`,
    '--input-bg': BG_COLORS.secondary,
    '--text-primary': TEXT_COLORS.primary,
    '--text-muted': TEXT_COLORS.muted,
    '--border-default': BORDER_COLORS.default,
    '--border-radius': `${RADIUS.md}px`,
    '--font-size': `${config.fontSize}px`,
    '--input-padding-right': showClear && value ? `${config.height}px` : `${config.paddingX}px`,
    '--focus-border': `${STATE_COLORS.active}80`,
  } as React.CSSProperties;

  return (
    <div className={cn(styles.container, className)} style={containerStyle}>
      {/* Search icon */}
      <div className={styles.searchIcon}>
        <Search
          size={config.iconSize}
          color={TEXT_COLORS.muted}
        />
      </div>

      {/* Input */}
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        autoFocus={autoFocus}
        className={styles.input}
        aria-label={ariaLabel}
      />

      {/* Clear button */}
      {showClear && value && (
        <button
          type="button"
          onClick={handleClear}
          className={styles.clearButton}
          aria-label="Clear search"
        >
          <Close
            size={config.iconSize}
            color={TEXT_COLORS.muted}
          />
        </button>
      )}
    </div>
  );
}

export default SearchInput;
