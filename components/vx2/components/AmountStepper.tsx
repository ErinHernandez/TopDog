/**
 * AmountStepper Component
 *
 * Stepper control for deposit amounts with $25 USD increments.
 * Features:
 * - Large +/- buttons for easy tapping
 * - Amount displayed in USD prominently
 * - Local currency equivalent (for non-USD)
 * - Quick select chips for common amounts
 * - Exchange rate transparency notice
 * - Explanation of $25 increment recommendation
 *
 * Migrated to Zero-Runtime CSS for CSP compliance.
 */

import React, { useCallback, useMemo } from 'react';

import { cn } from '@/lib/styles';

import styles from './AmountStepper.module.css';
import { Plus, Minus } from './icons';

// ============================================================================
// TYPES
// ============================================================================

export interface AmountStepperProps {
  /** Current amount in USD */
  amountUSD: number;
  /** Callback when amount changes */
  onChange: (usdAmount: number) => void;
  /** Display currency code (e.g., 'AUD', 'EUR') */
  displayCurrency: string;
  /** Exchange rate: 1 USD = X local currency (null if loading) */
  exchangeRate: number | null;
  /** Human-readable rate display (e.g., "1 USD = 1.55 AUD") */
  rateDisplay: string | null;
  /** Whether exchange rate is loading */
  rateLoading?: boolean;
  /** Minimum amount in USD (default: 25) */
  minUSD?: number;
  /** Maximum amount in USD (default: 10000) */
  maxUSD?: number;
  /** Whether the stepper is disabled */
  disabled?: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/** Quick select amounts in USD */
const QUICK_AMOUNTS_USD = [25, 50, 100, 250, 500];

/** Increment step in USD */
const INCREMENT_USD = 25;

// ============================================================================
// COMPONENT
// ============================================================================

export function AmountStepper({
  amountUSD,
  onChange,
  displayCurrency,
  exchangeRate,
  rateDisplay,
  rateLoading = false,
  minUSD = 25,
  maxUSD = 10000,
  disabled = false,
}: AmountStepperProps): React.ReactElement {
  const isUSD = displayCurrency === 'USD';
  const rate = exchangeRate ?? 1;

  // Calculate local amount
  const localAmount = useMemo(() => {
    return Math.round(amountUSD * rate * 100) / 100;
  }, [amountUSD, rate]);

  // Format currency symbol
  const currencySymbol = useMemo(() => {
    try {
      const formatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: displayCurrency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(0);
      // Extract symbol from formatted string
      return formatted.replace(/[\d\s.,]/g, '').trim() || displayCurrency;
    } catch {
      return displayCurrency;
    }
  }, [displayCurrency]);

  // Format local amount for display
  const formattedLocalAmount = useMemo(() => {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: displayCurrency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(localAmount);
    } catch {
      return `${currencySymbol}${localAmount.toFixed(2)}`;
    }
  }, [localAmount, displayCurrency, currencySymbol]);

  // Check if at limits
  const isAtMin = amountUSD <= minUSD;
  const isAtMax = amountUSD >= maxUSD;

  // Handle increment
  const handleIncrement = useCallback(() => {
    if (disabled || isAtMax) return;
    const newAmount = Math.min(amountUSD + INCREMENT_USD, maxUSD);
    onChange(newAmount);
  }, [amountUSD, maxUSD, disabled, isAtMax, onChange]);

  // Handle decrement
  const handleDecrement = useCallback(() => {
    if (disabled || isAtMin) return;
    const newAmount = Math.max(amountUSD - INCREMENT_USD, minUSD);
    onChange(newAmount);
  }, [amountUSD, minUSD, disabled, isAtMin, onChange]);

  // Handle quick select
  const handleQuickSelect = useCallback((usdAmount: number) => {
    if (disabled) return;
    onChange(usdAmount);
  }, [disabled, onChange]);

  return (
    <div className={styles.container}>
      {/* Explanation Banner */}
      <div className={styles.explanationBanner}>
        <p className={styles.explanationText}>
          Drafts cost $25 each. We recommend depositing in $25 increments so your balance always covers complete draft entries.
        </p>
      </div>

      {/* Stepper Control */}
      <div className={styles.stepperControl}>
        <div className={styles.stepperRow}>
          {/* Decrement Button */}
          <button
            type="button"
            onClick={handleDecrement}
            disabled={disabled || isAtMin}
            className={cn(
              styles.stepperButton,
              isAtMin && styles.stepperButtonDisabled
            )}
            aria-label="Decrease amount by $25"
          >
            <Minus size={24} />
          </button>

          {/* Amount Display */}
          <div className={styles.amountDisplay}>
            <div className={styles.amountValue}>
              ${amountUSD}
            </div>

            {/* Local Currency Equivalent (non-USD only) */}
            {!isUSD && (
              <div className={styles.localEquivalent}>
                {rateLoading ? (
                  <span className="animate-pulse">Loading...</span>
                ) : (
                  `≈ ${formattedLocalAmount}`
                )}
              </div>
            )}
          </div>

          {/* Increment Button */}
          <button
            type="button"
            onClick={handleIncrement}
            disabled={disabled || isAtMax}
            className={cn(
              styles.stepperButton,
              !isAtMax && styles.stepperButtonIncrement,
              isAtMax && styles.stepperButtonDisabled
            )}
            aria-label="Increase amount by $25"
          >
            <Plus size={24} />
          </button>
        </div>

        {/* Limit message */}
        {isAtMin && (
          <p className={styles.limitMessage}>
            Minimum deposit is $25
          </p>
        )}
        {isAtMax && (
          <p className={styles.limitMessage}>
            Maximum deposit reached
          </p>
        )}
      </div>

      {/* Quick Select Chips */}
      <div className={styles.quickSelectContainer}>
        <p className={styles.quickSelectLabel}>
          Quick select
        </p>
        <div className={styles.quickSelectGrid}>
          {QUICK_AMOUNTS_USD.map((usd) => {
            const isSelected = amountUSD === usd;
            return (
              <button
                key={usd}
                type="button"
                onClick={() => handleQuickSelect(usd)}
                disabled={disabled}
                className={cn(
                  styles.quickSelectChip,
                  isSelected && styles.quickSelectChipSelected
                )}
              >
                ${usd}
              </button>
            );
          })}
        </div>
      </div>

      {/* Exchange Rate Transparency (non-USD only) */}
      {!isUSD && rateDisplay && !rateLoading && (
        <div className={styles.exchangeRateBox}>
          <p className={styles.exchangeRateText}>
            Exchange rate: {rateDisplay}
          </p>
          <p className={styles.exchangeRateDisclaimer}>
            Rate from European Central Bank. Final rate at deposit may vary slightly.
          </p>
        </div>
      )}
    </div>
  );
}

export default AmountStepper;
