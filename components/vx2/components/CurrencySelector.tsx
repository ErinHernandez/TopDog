/**
 * CurrencySelector Component
 *
 * Dropdown selector for deposit/withdrawal currency.
 * Shows all available currencies with the geolocated currency marked as recommended.
 *
 * Migrated to Zero-Runtime CSS for CSP compliance.
 */

import React, { useState, useRef, useEffect } from 'react';

import { cn } from '@/lib/styles';

import { getCurrencyOptions } from '../../../lib/stripe/currencyConfig';

import { CurrencyIcon } from './CurrencyIcon';
import styles from './CurrencySelector.module.css';
import { ChevronDown } from './icons';

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

  return (
    <div className={styles.container} ref={dropdownRef}>
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
      >
        <div className={styles.triggerContent}>
          {/* Currency Icon */}
          <div className={styles.iconWrapper}>
            <CurrencyIcon
              currency={selectedCurrency}
              size={18}
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
              {selectedOption?.label?.split('(')[0]?.trim() || 'US Dollar'}
            </div>
          </div>
        </div>

        {/* Chevron */}
        <span className={cn(styles.chevron, isOpen && styles.chevronOpen)}>
          <ChevronDown size={20} />
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
                >
                  <CurrencyIcon
                    currency={option.value}
                    size={21}
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
                    {option.label?.split('(')[0]?.trim()}
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
                    stroke="currentColor"
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
