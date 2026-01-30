/**
 * PositionBadge - Display player position with color coding
 *
 * Consistent position badge used throughout the app.
 *
 * Migrated to use data attributes for position colors (CSP compliance).
 * Colors are applied via data-position and data-variant attributes
 * defined in utilities.css.
 *
 * @example
 * ```tsx
 * <PositionBadge position="WR" />
 * <PositionBadge position="QB" size="lg" />
 * ```
 */

import React from 'react';
import { RADIUS } from '../../vx2/core/constants/sizes';
import type { Position } from './types';

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

  return (
    <span
      className={`inline-flex items-center justify-center ${className}`}
      style={{
        width: `${config.width}px`,
        height: `${config.height}px`,
        borderRadius: `${RADIUS.sm}px`,
        fontSize: config.fontSizeToken,
        fontWeight: 'var(--font-weight-bold)',
        lineHeight: 1,
        letterSpacing: '-0.02em',
      }}
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

