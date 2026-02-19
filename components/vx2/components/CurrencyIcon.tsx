/**
 * CurrencyIcon Component
 *
 * Displays currency icons with fallback to Unicode symbols.
 * Follows VX2 IconProps pattern for consistency.
 *
 * Migrated to CSS Modules for CSP compliance.
 *
 * @example
 * ```tsx
 * <CurrencyIcon currency="USD" size={24} />
 * <CurrencyIcon currency="EUR" size={32} color="#fff" />
 * ```
 */

import React, { useState, useMemo } from 'react';

import { cn } from '@/lib/styles';

import {
  getCurrencyIconPath,
  getCurrencyUnicode,
  hasCurrencyIcon
} from '../../../lib/stripe/currencyIcons';

import styles from './CurrencyIcon.module.css';
import type { IconProps } from './icons/types';
import { DEFAULT_ICON_PROPS } from './icons/types';


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

  // CSS custom properties for dynamic values
  const iconStyle: React.CSSProperties = {
    '--icon-size': `${size}px`,
    '--icon-color': color,
    '--fallback-font-size': `${Math.max(size * 0.6, 12)}px`,
    '--code-font-size': `${Math.max(size * 0.4, 10)}px`,
  } as React.CSSProperties;

  // Render icon image
  if (shouldShowIcon) {
    return (
      <span
        className={cn(styles.iconContainer, className)}
        style={iconStyle}
        aria-label={defaultAriaLabel}
        aria-hidden={ariaHidden}
        role={ariaLabel ? 'img' : undefined}
      >
        {imageLoading && showPlaceholder && (
          <span
            className={styles.placeholder}
            aria-hidden="true"
          />
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={iconPath!}
          alt={defaultAriaLabel}
          width={size}
          height={size}
          className={cn(
            styles.iconImage,
            imageLoading ? styles.iconImageLoading : styles.iconImageLoaded
          )}
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
        className={cn(styles.unicodeFallback, className)}
        style={iconStyle}
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
      className={cn(styles.codeFallback, className)}
      style={iconStyle}
      aria-label={defaultAriaLabel}
      aria-hidden={ariaHidden}
      role={ariaLabel ? 'img' : undefined}
    >
      {currency}
    </span>
  );
}

export default CurrencyIcon;
