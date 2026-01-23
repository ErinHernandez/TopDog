/**
 * PositionBadge - Display player position with color coding
 * 
 * Consistent position badge used throughout the app.
 * 
 * @example
 * ```tsx
 * <PositionBadge position="WR" />
 * <PositionBadge position="QB" size="lg" />
 * ```
 */

import React from 'react';
import { POSITION_COLORS } from '../../vx2/core/constants/colors';
import { RADIUS, TYPOGRAPHY } from '../../vx2/core/constants/sizes';
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
    fontSize: TYPOGRAPHY.fontSize.xs - 2,
  },
  md: {
    width: 28,
    height: 18,
    fontSize: TYPOGRAPHY.fontSize.xs,
  },
  lg: {
    width: 36,
    height: 22,
    fontSize: TYPOGRAPHY.fontSize.sm,
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
  const positionUpper = position.toUpperCase() as keyof typeof POSITION_COLORS;
  const color = POSITION_COLORS[positionUpper] || POSITION_COLORS.BN;
  const config = SIZE_CONFIG[size];
  
  const isFilled = variant === 'filled';
  
  return (
    <span
      className={`inline-flex items-center justify-center font-bold ${className}`}
      style={{
        width: `${config.width}px`,
        height: `${config.height}px`,
        borderRadius: `${RADIUS.sm}px`,
        backgroundColor: isFilled ? color : 'transparent',
        color: isFilled ? '#000000' : color,
        fontSize: `${config.fontSize}px`,
        border: isFilled ? 'none' : `2px solid ${color}`,
        lineHeight: 1,
        letterSpacing: '-0.02em',
      }}
      role="img"
      aria-label={`Position: ${position}`}
    >
      {positionUpper}
    </span>
  );
}

export default PositionBadge;

