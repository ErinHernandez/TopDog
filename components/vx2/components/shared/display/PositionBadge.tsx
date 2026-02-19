/**
 * PositionBadge - Display player position with color coding
 *
 * Consistent position badge used throughout the app.
 *
 * Migrated to CSS Modules + data attributes for CSP compliance.
 * Colors are now applied via data-position and data-variant attributes
 * defined in utilities.css.
 *
 * @example
 * ```tsx
 * <PositionBadge position="WR" />
 * <PositionBadge position="QB" size="lg" />
 * ```
 */

import React from 'react';

import { cn } from '@/lib/styles';

import type { Position } from '../../../hooks/data';

import styles from './PositionBadge.module.css';

// ============================================================================
// TYPES
// ============================================================================

export interface PositionBadgeProps {
  /** Player position */
  position: Position | string;
  /** Badge size */
  size?: 'sm' | 'md' | 'lg';
  /** Additional className */
  className?: string;
  /** Show as outline instead of filled */
  variant?: 'filled' | 'outline';
}

// ============================================================================
// SIZE CONFIG
// ============================================================================

const SIZE_CONFIG = {
  sm: {
    width: 22,
    height: 14,
    fontSizeToken: 'var(--font-size-xs)',
  },
  md: {
    width: 28,
    height: 18,
    fontSizeToken: 'var(--font-size-xs)',
  },
  lg: {
    width: 36,
    height: 22,
    fontSizeToken: 'var(--font-size-sm)',
  },
} as const;

// ============================================================================
// COMPONENT
// ============================================================================

export function PositionBadge({
  position,
  size = 'md',
  className = '',
  variant = 'filled',
}: PositionBadgeProps): React.ReactElement {
  const positionLower = position.toLowerCase();
  const positionUpper = position.toUpperCase();
  const config = SIZE_CONFIG[size];

  // CSS custom properties for size values (colors handled by data attributes)
  const badgeStyle: React.CSSProperties = {
    '--badge-width': `${config.width}px`,
    '--badge-height': `${config.height}px`,
    '--badge-radius': 'var(--radius-sm)',
    '--badge-font-size': config.fontSizeToken,
  } as React.CSSProperties;

  return (
    <span
      className={cn(styles.badge, className)}
      style={badgeStyle}
      data-position={positionLower}
      data-variant={variant}
      role="img"
      aria-label={`Position: ${position}`}
    >
      {positionUpper}
    </span>
  );
}

export default PositionBadge;
