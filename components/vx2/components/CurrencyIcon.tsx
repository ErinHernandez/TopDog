/**
 * CurrencyIcon Component
 * 
 * Displays currency icons with fallback to Unicode symbols.
 * Follows VX2 IconProps pattern for consistency.
 * 
 * @example
 * ```tsx
 * <CurrencyIcon currency="USD" size={24} />
 * <CurrencyIcon currency="EUR" size={32} color="#fff" />
 * ```
 */

import React, { useState, useMemo } from 'react';
import type { IconProps } from './icons/types';
import { DEFAULT_ICON_PROPS } from './icons/types';
import { 
  getCurrencyIconPath, 
  getCurrencyUnicode,
  hasCurrencyIcon 
} from '../../../lib/stripe/currencyIcons';

// ============================================================================
// TYPES
// ============================================================================

export interface CurrencyIconProps extends Omit<IconProps, 'strokeWidth'> {
  /** Currency code (ISO 4217) */
  currency: string;
  /** Show Unicode fallback if icon fails to load */
  showFallback?: boolean;
  /** Custom fallback symbol (overrides currency default) */
  fallbackSymbol?: string;
  /** Whether to show loading placeholder */
  showPlaceholder?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function CurrencyIcon({
  currency,
  size = DEFAULT_ICON_PROPS.size,
  color = 'currentColor',
  className = '',
  'aria-label': ariaLabel,
  'aria-hidden': ariaHidden = true,
  showFallback = true,
  fallbackSymbol,
  showPlaceholder = false,
}: CurrencyIconProps): React.ReactElement {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  
  // Get icon path and fallback symbol
  const iconPath = useMemo(() => getCurrencyIconPath(currency), [currency]);
  const unicodeFallback = useMemo(() => 
    fallbackSymbol || getCurrencyUnicode(currency), 
    [currency, fallbackSymbol]
  );
  const hasIcon = useMemo(() => hasCurrencyIcon(currency), [currency]);
  
  // Determine if we should show icon or fallback
  const shouldShowIcon = hasIcon && iconPath && !imageError;
  const shouldShowFallback = !shouldShowIcon && showFallback;
  
  // Generate aria-label if not provided
  const defaultAriaLabel = useMemo(() => 
    ariaLabel || `${currency} currency icon`,
    [currency, ariaLabel]
  );
  
  // Handle image load
  const handleImageLoad = () => {
    setImageLoading(false);
  };
  
  // Handle image error - fallback to Unicode
  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
  };
  
  // Render icon image
  if (shouldShowIcon) {
    return (
      <span
        className={`inline-flex items-center justify-center ${className}`}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          color,
        }}
        aria-label={defaultAriaLabel}
        aria-hidden={ariaHidden}
        role={ariaLabel ? 'img' : undefined}
      >
        {imageLoading && showPlaceholder && (
          <span
            className="absolute animate-pulse"
            style={{
              width: `${size}px`,
              height: `${size}px`,
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '4px',
            }}
            aria-hidden="true"
          />
        )}
        <img
          src={iconPath!}
          alt={defaultAriaLabel}
          width={size}
          height={size}
          className={`${imageLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-200`}
          style={{
            width: `${size}px`,
            height: `${size}px`,
            objectFit: 'contain',
          }}
          onLoad={handleImageLoad}
          onError={handleImageError}
          loading="lazy"
        />
      </span>
    );
  }
  
  // Render Unicode fallback
  if (shouldShowFallback) {
    return (
      <span
        className={`inline-flex items-center justify-center font-semibold ${className}`}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          fontSize: `${Math.max(size * 0.6, 12)}px`,
          color,
        }}
        aria-label={defaultAriaLabel}
        aria-hidden={ariaHidden}
        role={ariaLabel ? 'img' : undefined}
      >
        {unicodeFallback}
      </span>
    );
  }
  
  // Fallback: show currency code if no symbol available
  return (
    <span
      className={`inline-flex items-center justify-center text-xs font-medium ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        fontSize: `${Math.max(size * 0.4, 10)}px`,
        color,
      }}
      aria-label={defaultAriaLabel}
      aria-hidden={ariaHidden}
      role={ariaLabel ? 'img' : undefined}
    >
      {currency}
    </span>
  );
}

export default CurrencyIcon;

