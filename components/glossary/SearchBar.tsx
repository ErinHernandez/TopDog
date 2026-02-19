/**
 * SearchBar.tsx
 * Search input component with debouncing
 *
 * Features:
 * - Debounced search input
 * - Clear button
 * - Keyboard shortcut hint (Cmd+K)
 * - Search icon
 */

import React, { useState, useEffect, useRef } from 'react';

import styles from './SearchBar.module.css';

interface SearchBarProps {
  onSearch?: (query: string) => void;
  placeholder?: string;
  value?: string;
  debounceMs?: number;
}

export function SearchBar({
  onSearch,
  placeholder = 'Search elements...',
  value: controlledValue,
  debounceMs = 300,
}: SearchBarProps) {
  const [value, setValue] = useState(controlledValue || '');
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Handle controlled vs uncontrolled component
  useEffect(() => {
    if (controlledValue !== undefined) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional setState in effect
      setValue(controlledValue);
    }
  }, [controlledValue]);

  // Debounced search callback
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      onSearch?.(value);
    }, debounceMs);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [value, onSearch, debounceMs]);

  const handleClear = () => {
    setValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Cmd+K on Mac or Ctrl+K on Windows/Linux for keyboard shortcut
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      const input = e.currentTarget;
      input.focus();
      input.select();
    }
  };

  return (
    <div className={styles.searchContainer}>
      <div className={styles.searchWrapper}>
        {/* Search Icon */}
        <div className={styles.searchIcon}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle
              cx="7"
              cy="7"
              r="5.5"
              stroke="currentColor"
              strokeWidth="1.5"
              fill="none"
            />
            <path
              d="M11 11L14 14"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* Input Field */}
        <input
          type="text"
          className={styles.searchInput}
          placeholder={placeholder}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          spellCheck="false"
        />

        {/* Clear Button */}
        {value && (
          <button
            type="button"
            className={styles.clearButton}
            onClick={handleClear}
            aria-label="Clear search"
            title="Clear (Esc)"
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                e.preventDefault();
                handleClear();
              }
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 4L4 12M4 4L12 12"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}

        {/* Keyboard Shortcut Hint */}
        {!value && (
          <div className={styles.shortcutHint}>
            <kbd className={styles.kbd}>
              {typeof navigator !== 'undefined' &&
              navigator.platform.toLowerCase().includes('mac')
                ? '⌘'
                : 'Ctrl'}
              +K
            </kbd>
          </div>
        )}
      </div>
    </div>
  );
}

export default SearchBar;
