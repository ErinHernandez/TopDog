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
 */

import React, { useCallback, useMemo } from 'react';
import { BG_COLORS, TEXT_COLORS, STATE_COLORS, BORDER_COLORS } from '../core/constants/colors';
import { SPACING, RADIUS, TYPOGRAPHY, TOUCH_TARGETS } from '../core/constants/sizes';
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
    <div className="space-y-5">
      {/* Explanation Banner */}
      <div 
        className="p-4 rounded-xl"
        style={{ 
          backgroundColor: `${STATE_COLORS.info}12`,
          border: `1px solid ${STATE_COLORS.info}30`,
        }}
      >
        <p 
          style={{ 
            fontSize: `${TYPOGRAPHY.fontSize.sm}px`, 
            color: TEXT_COLORS.primary,
            lineHeight: 1.5,
          }}
        >
          Drafts cost $25 each. We recommend depositing in $25 increments so your balance always covers complete draft entries.
        </p>
      </div>
      
      {/* Stepper Control */}
      <div className="flex flex-col items-center gap-3">
        <div className="flex items-center gap-6">
          {/* Decrement Button */}
          <button
            type="button"
            onClick={handleDecrement}
            disabled={disabled || isAtMin}
            className="flex items-center justify-center rounded-full transition-all active:scale-95"
            style={{
              width: TOUCH_TARGETS.comfort,
              height: TOUCH_TARGETS.comfort,
              backgroundColor: isAtMin 
                ? 'rgba(255, 255, 255, 0.05)' 
                : 'rgba(255, 255, 255, 0.1)',
              border: `1px solid ${isAtMin ? BORDER_COLORS.light : BORDER_COLORS.default}`,
              opacity: isAtMin ? 0.5 : 1,
              cursor: isAtMin ? 'not-allowed' : 'pointer',
            }}
            aria-label="Decrease amount by $25"
          >
            <Minus 
              size={24} 
              color={isAtMin ? TEXT_COLORS.muted : TEXT_COLORS.primary} 
            />
          </button>
          
          {/* Amount Display */}
          <div className="text-center min-w-[140px]">
            <div 
              className="font-bold"
              style={{ 
                fontSize: `${TYPOGRAPHY.fontSize['3xl']}px`,
                color: TEXT_COLORS.primary,
              }}
            >
              ${amountUSD}
            </div>
            
            {/* Local Currency Equivalent (non-USD only) */}
            {!isUSD && (
              <div 
                className="mt-1"
                style={{ 
                  fontSize: `${TYPOGRAPHY.fontSize.sm}px`,
                  color: TEXT_COLORS.secondary,
                }}
              >
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
            className="flex items-center justify-center rounded-full transition-all active:scale-95"
            style={{
              width: TOUCH_TARGETS.comfort,
              height: TOUCH_TARGETS.comfort,
              backgroundColor: isAtMax 
                ? 'rgba(255, 255, 255, 0.05)' 
                : STATE_COLORS.active,
              border: `1px solid ${isAtMax ? BORDER_COLORS.light : STATE_COLORS.active}`,
              opacity: isAtMax ? 0.5 : 1,
              cursor: isAtMax ? 'not-allowed' : 'pointer',
            }}
            aria-label="Increase amount by $25"
          >
            <Plus 
              size={24} 
              color={isAtMax ? TEXT_COLORS.muted : '#000'} 
            />
          </button>
        </div>
        
        {/* Limit message */}
        {isAtMin && (
          <p 
            style={{ 
              fontSize: `${TYPOGRAPHY.fontSize.xs}px`,
              color: TEXT_COLORS.muted,
            }}
          >
            Minimum deposit is $25
          </p>
        )}
        {isAtMax && (
          <p 
            style={{ 
              fontSize: `${TYPOGRAPHY.fontSize.xs}px`,
              color: TEXT_COLORS.muted,
            }}
          >
            Maximum deposit reached
          </p>
        )}
      </div>
      
      {/* Quick Select Chips */}
      <div>
        <p 
          className="text-center mb-3"
          style={{ 
            fontSize: `${TYPOGRAPHY.fontSize.xs}px`,
            color: TEXT_COLORS.muted,
          }}
        >
          Quick select
        </p>
        <div className="flex justify-center flex-wrap gap-2">
          {QUICK_AMOUNTS_USD.map((usd) => {
            const isSelected = amountUSD === usd;
            return (
              <button
                key={usd}
                type="button"
                onClick={() => handleQuickSelect(usd)}
                disabled={disabled}
                className="px-4 py-2 rounded-full font-medium transition-all"
                style={{
                  backgroundColor: isSelected 
                    ? STATE_COLORS.active 
                    : 'rgba(255, 255, 255, 0.05)',
                  color: isSelected ? '#000' : TEXT_COLORS.primary,
                  border: `1px solid ${isSelected ? STATE_COLORS.active : BORDER_COLORS.default}`,
                  fontSize: `${TYPOGRAPHY.fontSize.sm}px`,
                }}
              >
                ${usd}
              </button>
            );
          })}
        </div>
      </div>
      
      {/* Exchange Rate Transparency (non-USD only) */}
      {!isUSD && rateDisplay && !rateLoading && (
        <div 
          className="p-3 rounded-lg"
          style={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            border: `1px solid ${BORDER_COLORS.light}`,
          }}
        >
          <p 
            className="text-center"
            style={{ 
              fontSize: `${TYPOGRAPHY.fontSize.xs}px`,
              color: TEXT_COLORS.muted,
            }}
          >
            Exchange rate: {rateDisplay}
          </p>
          <p 
            className="text-center mt-1"
            style={{ 
              fontSize: `${TYPOGRAPHY.fontSize.xs}px`,
              color: TEXT_COLORS.muted,
              opacity: 0.7,
            }}
          >
            Rate from European Central Bank. Final rate at deposit may vary slightly.
          </p>
        </div>
      )}
    </div>
  );
}

export default AmountStepper;

