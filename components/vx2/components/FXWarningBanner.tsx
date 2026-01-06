/**
 * FXWarningBanner Component
 * 
 * Displays a warning when user selects a currency different from their
 * geolocated currency. Informs them about potential foreign transaction
 * fees from their bank.
 */

import React, { useState } from 'react';
import { TEXT_COLORS, STATE_COLORS } from '../core/constants/colors';
import { SPACING, RADIUS, TYPOGRAPHY } from '../core/constants/sizes';
import { Close } from './icons';
import { getCurrencyConfig } from '../../../lib/stripe/currencyConfig';

// ============================================================================
// TYPES
// ============================================================================

export interface FXWarningBannerProps {
  /** The currency the user selected */
  selectedCurrency: string;
  /** The user's geolocated/detected local currency */
  localCurrency: string;
  /** Whether the banner can be dismissed */
  dismissible?: boolean;
  /** Callback when dismissed */
  onDismiss?: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function FXWarningBanner({
  selectedCurrency,
  localCurrency,
  dismissible = true,
  onDismiss,
}: FXWarningBannerProps): React.ReactElement | null {
  const [isDismissed, setIsDismissed] = useState(false);
  
  // Don't show if currencies match or dismissed
  if (selectedCurrency === localCurrency || isDismissed) {
    return null;
  }
  
  const selectedConfig = getCurrencyConfig(selectedCurrency);
  const localConfig = getCurrencyConfig(localCurrency);
  
  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };
  
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        border: `1px solid rgba(245, 158, 11, 0.3)`,
      }}
    >
      {/* Header */}
      <div 
        className="flex items-center justify-between px-4 py-3"
        style={{
          backgroundColor: 'rgba(245, 158, 11, 0.15)',
          borderBottom: '1px solid rgba(245, 158, 11, 0.2)',
        }}
      >
        <div className="flex items-center gap-2">
          {/* Warning Icon */}
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke={STATE_COLORS.warning}
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <span
            className="font-semibold"
            style={{
              color: STATE_COLORS.warning,
              fontSize: `${TYPOGRAPHY.fontSize.sm}px`,
            }}
          >
            Currency Mismatch Notice
          </span>
        </div>
        
        {dismissible && (
          <button
            type="button"
            onClick={handleDismiss}
            className="p-1 rounded-lg transition-all hover:bg-white/10"
            aria-label="Dismiss warning"
          >
            <Close size={16} color={TEXT_COLORS.muted} />
          </button>
        )}
      </div>
      
      {/* Content */}
      <div className="px-4 py-3 space-y-3">
        {/* Main Warning */}
        <p
          style={{
            fontSize: `${TYPOGRAPHY.fontSize.sm}px`,
            color: TEXT_COLORS.primary,
            lineHeight: 1.5,
          }}
        >
          Your selected currency ({selectedConfig.symbol} {selectedConfig.name}) does not match 
          your detected location ({localConfig.symbol} {localConfig.name}).
        </p>
        
        {/* Bank Fee Warning */}
        <p
          style={{
            fontSize: `${TYPOGRAPHY.fontSize.sm}px`,
            color: TEXT_COLORS.secondary,
            lineHeight: 1.5,
          }}
        >
          Your bank may charge you a foreign transaction fee (typically 1-3%) when using a 
          card that doesn&apos;t match this currency.
        </p>
        
        {/* Tip Box */}
        <div
          className="rounded-lg px-3 py-2 mt-2"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <div className="flex items-start gap-2">
            {/* Lightbulb Icon */}
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke={STATE_COLORS.info}
              strokeWidth="2"
              className="flex-shrink-0 mt-0.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
              />
            </svg>
            <p
              style={{
                fontSize: `${TYPOGRAPHY.fontSize.xs}px`,
                color: TEXT_COLORS.secondary,
                lineHeight: 1.4,
              }}
            >
              <strong style={{ color: TEXT_COLORS.primary }}>Tip:</strong> Select the currency 
              that matches your card&apos;s native currency for the best rates. For example, if you 
              are a US user traveling abroad, select USD to avoid foreign transaction fees.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FXWarningBanner;

