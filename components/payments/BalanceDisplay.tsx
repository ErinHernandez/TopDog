/**
 * Balance Display Component
 *
 * Shows user balance in USD with optional local currency estimate
 * Uses exchange rate service for international users
 */

import React, { useState, useEffect, useCallback } from 'react';

interface BalanceDisplayProps {
  /** Balance in cents */
  balanceCents: number;
  /** User's local currency code (e.g., 'EUR', 'GBP') */
  userCurrency?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Show currency label */
  showLabel?: boolean;
  /** Additional CSS classes */
  className?: string;
}

export function BalanceDisplay({
  balanceCents,
  userCurrency,
  size = 'md',
  showLabel = false,
  className = '',
}: BalanceDisplayProps) {
  const [localEstimate, setLocalEstimate] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch local currency estimate for non-USD users
  const fetchLocalEstimate = useCallback(async () => {
    if (!userCurrency || userCurrency === 'USD') return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/exchange-rates?from=USD&to=${userCurrency}&amount=${balanceCents / 100}`);
      const data = await response.json();
      if (data.convertedAmount) {
        setLocalEstimate(Math.round(data.convertedAmount * 100));
      }
    } catch {
      // Silently fail - just don't show local estimate
    } finally {
      setIsLoading(false);
    }
  }, [userCurrency, balanceCents]);

  useEffect(() => {
    if (userCurrency && userCurrency !== 'USD') {
      fetchLocalEstimate();
    }
  }, [fetchLocalEstimate, userCurrency]);

  // Format USD balance
  const usdFormatted = (balanceCents / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  // Format local currency estimate
  const localFormatted = localEstimate
    ? (localEstimate / 100).toLocaleString('en-US', {
        style: 'currency',
        currency: userCurrency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    : null;

  // Size classes
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl',
  };

  const localSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <div className={`balance-display ${className}`}>
      {showLabel && (
        <span className="text-gray-500 text-sm block mb-1">Balance</span>
      )}

      <span className={`font-semibold ${sizeClasses[size]}`}>
        {usdFormatted}
      </span>

      {/* Show local currency estimate for international users */}
      {userCurrency && userCurrency !== 'USD' && (
        <span className={`text-gray-500 ml-2 ${localSizeClasses[size]}`}>
          {isLoading ? (
            '(...)'
          ) : localFormatted ? (
            `(~${localFormatted})`
          ) : null}
        </span>
      )}
    </div>
  );
}

/**
 * Compact balance display for headers/navigation
 */
interface CompactBalanceProps {
  balanceCents: number;
  onClick?: () => void;
  className?: string;
}

export function CompactBalanceDisplay({
  balanceCents,
  onClick,
  className = '',
}: CompactBalanceProps) {
  const formatted = (balanceCents / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const Component = onClick ? 'button' : 'span';

  return (
    <Component
      onClick={onClick}
      className={`
        inline-flex items-center gap-1.5
        px-3 py-1.5
        bg-green-50 text-green-700
        rounded-full
        font-medium text-sm
        ${onClick ? 'hover:bg-green-100 cursor-pointer' : ''}
        ${className}
      `}
    >
      <WalletIcon className="w-4 h-4" />
      {formatted}
    </Component>
  );
}

// Wallet Icon
function WalletIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
      />
    </svg>
  );
}

export default BalanceDisplay;
