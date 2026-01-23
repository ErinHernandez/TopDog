/**
 * SearchInput - Search input field with icon
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
import { BG_COLORS, TEXT_COLORS, BORDER_COLORS } from '../../vx2/core/constants/colors';
import { SPACING, RADIUS, TYPOGRAPHY } from '../../vx2/core/constants/sizes';
import { Search, Close } from '../../vx2/components/icons';

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
  
  return (
    <div
      className={`relative flex items-center ${className}`}
      style={{
        height: `${config.height}px`,
      }}
    >
      {/* Search icon */}
      <div
        className="absolute left-0 flex items-center justify-center pointer-events-none"
        style={{
          width: `${config.height}px`,
          height: `${config.height}px`,
        }}
      >
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
        className="w-full h-full outline-none transition-colors"
        style={{
          backgroundColor: BG_COLORS.secondary,
          color: TEXT_COLORS.primary,
          border: `1px solid ${BORDER_COLORS.default}`,
          borderRadius: `${RADIUS.md}px`,
          paddingLeft: `${config.height}px`,
          paddingRight: showClear && value ? `${config.height}px` : `${config.paddingX}px`,
          fontSize: `${config.fontSize}px`,
        }}
        aria-label={ariaLabel}
      />
      
      {/* Clear button */}
      {showClear && value && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-0 flex items-center justify-center transition-colors hover:opacity-80"
          style={{
            width: `${config.height}px`,
            height: `${config.height}px`,
            background: 'none',
            border: 'none',
            cursor: 'pointer',
          }}
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

