/**
 * PositionBadge - Display player position with color coding
 *
 * Consistent position badge used throughout the app.
 *
 * Migrated to CSS Modules for CSP compliance.
 *
 * @example
 * ```tsx
 * <PositionBadge position="WR" />
 * <PositionBadge position="QB" size="lg" />
 * ```
 */

import React from 'react';
import { POSITION_COLORS } from '../../../core/constants/colors';
import { RADIUS, TYPOGRAPHY } from '../../../core/constants/sizes';
import type { Position } from '../../../hooks/data';
import { cn } from '@/lib/styles';
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

  // CSS custom properties for dynamic values
  const badgeStyle: React.CSSProperties = {
    '--badge-width': `${config.width}px`,
    '--badge-height': `${config.height}px`,
    '--badge-radius': `${RADIUS.sm}px`,
    '--badge-bg': isFilled ? color : 'transparent',
    '--badge-color': isFilled ? '#000000' : color,
    '--badge-font-size': `${config.fontSize}px`,
    '--badge-border': isFilled ? 'none' : `2px solid ${color}`,
  } as React.CSSProperties;

  return (
    <span
      className={cn(styles.badge, className)}
      style={badgeStyle}
      role="img"
      aria-label={`Position: ${position}`}
    >
      {positionUpper}
    </span>
  );
}

export default PositionBadge;
