/**
 * CurrencySelector Component
 *
 * Dropdown selector for deposit/withdrawal currency.
 * Shows all available currencies with the geolocated currency marked as recommended.
 *
 * Migrated to CSS Modules for CSP compliance.
 */

import React, { useState, useRef, useEffect } from 'react';
import { BG_COLORS, TEXT_COLORS, STATE_COLORS, BORDER_COLORS } from '../core/constants/colors';
import { SPACING, RADIUS, TYPOGRAPHY, Z_INDEX } from '../core/constants/sizes';
import { ChevronDown } from './icons';
import { CurrencyIcon } from './CurrencyIcon';
import { getCurrencyOptions } from '../../../lib/stripe/currencyConfig';
import { cn } from '@/lib/styles';
import styles from './CurrencySelector.module.css';

// ============================================================================
// TYPES
// ============================================================================

export interface CurrencySelectorProps {
  /** Currently selected currency code (e.g., 'USD', 'EUR') */
  selectedCurrency: string;
  /** User's geolocated/detected local currency code */
  localCurrency: string;
  /** Callback when user selects a currency */
  onSelect: (currency: string) => void;
  /** Whether the selector is disabled */
  disabled?: boolean;
  /** Optional label */
  label?: string;
}

interface CurrencyOption {
  value: string;
  label: string;
  symbol: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function CurrencySelector({
  selectedCurrency,
  localCurrency,
  onSelect,
  disabled = false,
  label = 'Deposit Currency',
}: CurrencySelectorProps): React.ReactElement {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Get all currency options
  const currencyOptions = getCurrencyOptions();

  // Find the selected option
  const selectedOption = currencyOptions.find(opt => opt.value === selectedCurrency);

  // Sort options: local currency first, then alphabetically
  const sortedOptions = [...currencyOptions].sort((a, b) => {
    if (a.value === localCurrency) return -1;
    if (b.value === localCurrency) return 1;
    return a.value.localeCompare(b.value);
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle option selection
  const handleSelect = (currency: string) => {
    onSelect(currency);
    setIsOpen(false);
  };

  // CSS custom properties for dynamic values
  const containerStyle: React.CSSProperties = {
    '--font-size-sm': `${TYPOGRAPHY.fontSize.sm}px`,
    '--font-size-xs': `${TYPOGRAPHY.fontSize.xs}px`,
    '--font-size-base': `${TYPOGRAPHY.fontSize.base}px`,
    '--text-secondary': TEXT_COLORS.secondary,
    '--text-primary': TEXT_COLORS.primary,
    '--text-muted': TEXT_COLORS.muted,
    '--active-color': STATE_COLORS.active,
    '--success-color': STATE_COLORS.success,
    '--border-default': BORDER_COLORS.default,
    '--border-light': BORDER_COLORS.light,
    '--dropdown-bg': BG_COLORS.secondary,
    '--z-dropdown': Z_INDEX.dropdown,
  } as React.CSSProperties;

  return (
    <div className={styles.container} ref={dropdownRef} style={containerStyle}>
      {/* Label */}
      {label && (
        <label className={styles.label}>
          {label}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          styles.triggerButton,
          isOpen && styles.triggerButtonOpen,
          disabled && styles.triggerButtonDisabled
        )}
        style={{
          '--trigger-border': isOpen ? STATE_COLORS.active : BORDER_COLORS.default,
        } as React.CSSProperties}
      >
        <div className={styles.triggerContent}>
          {/* Currency Icon */}
          <div className={styles.iconWrapper}>
            <CurrencyIcon
              currency={selectedCurrency}
              size={TYPOGRAPHY.fontSize.lg}
              color={TEXT_COLORS.primary}
              showFallback={true}
              aria-label={`${selectedOption?.value || 'USD'} currency`}
              aria-hidden={false}
            />
          </div>

          {/* Currency Info */}
          <div className={styles.currencyInfo}>
            <div className={styles.currencyCode}>
              {selectedOption?.value || 'USD'}
            </div>
            <div className={styles.currencyName}>
              {selectedOption?.label.split('(')[0].trim() || 'US Dollar'}
            </div>
          </div>
        </div>

        {/* Chevron */}
        <span className={cn(styles.chevron, isOpen && styles.chevronOpen)}>
          <ChevronDown
            size={20}
            color={TEXT_COLORS.muted}
          />
        </span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className={styles.dropdown}>
          {sortedOptions.map((option) => {
            const isSelected = option.value === selectedCurrency;
            const isLocal = option.value === localCurrency;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option.value)}
                className={cn(
                  styles.optionButton,
                  isSelected && styles.optionButtonSelected
                )}
              >
                {/* Currency Icon */}
                <div
                  className={cn(
                    styles.optionIconWrapper,
                    isSelected && styles.optionIconWrapperSelected
                  )}
                  style={{
                    '--option-icon-bg': isSelected
                      ? 'rgba(96, 165, 250, 0.2)'
                      : 'rgba(255, 255, 255, 0.1)',
                  } as React.CSSProperties}
                >
                  <CurrencyIcon
                    currency={option.value}
                    size={TYPOGRAPHY.fontSize.sm * 1.5}
                    color={isSelected ? STATE_COLORS.active : TEXT_COLORS.primary}
                    showFallback={true}
                    aria-label={`${option.value} currency`}
                    aria-hidden={false}
                  />
                </div>

                {/* Currency Info */}
                <div className={styles.optionInfo}>
                  <div
                    className={cn(
                      styles.optionCodeRow,
                      isSelected && styles.optionCodeRowSelected
                    )}
                  >
                    {option.value}
                    {isLocal && (
                      <span className={styles.recommendedBadge}>
                        Recommended
                      </span>
                    )}
                  </div>
                  <div className={styles.optionName}>
                    {option.label.split('(')[0].trim()}
                  </div>
                </div>

                {/* Checkmark for selected */}
                {isSelected && (
                  <svg
                    className={styles.checkmark}
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={STATE_COLORS.active}
                    strokeWidth="2.5"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
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

export default CurrencySelector;
