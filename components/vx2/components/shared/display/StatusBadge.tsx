/**
 * StatusBadge - Display status with semantic colors
 * 
 * @example
 * ```tsx
 * <StatusBadge status="success" label="YOUR TURN" />
 * <StatusBadge status="warning" label="PENDING" />
 * ```
 */

import React from 'react';
import { STATE_COLORS, TEXT_COLORS } from '../../../core/constants/colors';
import { RADIUS, TYPOGRAPHY, SPACING } from '../../../core/constants/sizes';

// ============================================================================
// TYPES
// ============================================================================

export type BadgeStatus = 'success' | 'warning' | 'error' | 'info' | 'neutral';

export interface StatusBadgeProps {
  /** Badge status/variant */
  status: BadgeStatus;
  /** Badge label */
  label: string;
  /** Badge size */
  size?: 'sm' | 'md';
  /** Additional className */
  className?: string;
  /** Pulsing animation for urgent statuses */
  pulse?: boolean;
}

// ============================================================================
// COLOR CONFIG
// ============================================================================

const STATUS_CONFIG: Record<BadgeStatus, { bg: string; text: string }> = {
  success: {
    bg: 'rgba(16, 185, 129, 0.2)',
    text: STATE_COLORS.success,
  },
  warning: {
    bg: 'rgba(245, 158, 11, 0.2)',
    text: STATE_COLORS.warning,
  },
  error: {
    bg: 'rgba(239, 68, 68, 0.2)',
    text: STATE_COLORS.error,
  },
  info: {
    bg: 'rgba(96, 165, 250, 0.2)',
    text: STATE_COLORS.active,
  },
  neutral: {
    bg: 'rgba(156, 163, 175, 0.2)',
    text: TEXT_COLORS.secondary,
  },
};

const SIZE_CONFIG = {
  sm: {
    paddingX: SPACING.sm,
    paddingY: 2,
    fontSize: TYPOGRAPHY.fontSize.xs - 1,
  },
  md: {
    paddingX: SPACING.md,
    paddingY: SPACING.xs,
    fontSize: TYPOGRAPHY.fontSize.xs,
  },
} as const;

// ============================================================================
// COMPONENT
// ============================================================================

export function StatusBadge({
  status,
  label,
  size = 'sm',
  className = '',
  pulse = false,
}: StatusBadgeProps): React.ReactElement {
  const colors = STATUS_CONFIG[status];
  const sizeConfig = SIZE_CONFIG[size];
  
  return (
    <span
      className={`inline-flex items-center font-semibold uppercase tracking-wide ${pulse ? 'animate-pulse' : ''} ${className}`}
      style={{
        backgroundColor: colors.bg,
        color: colors.text,
        paddingLeft: `${sizeConfig.paddingX}px`,
        paddingRight: `${sizeConfig.paddingX}px`,
        paddingTop: `${sizeConfig.paddingY}px`,
        paddingBottom: `${sizeConfig.paddingY}px`,
        borderRadius: `${RADIUS.sm}px`,
        fontSize: `${sizeConfig.fontSize}px`,
        lineHeight: 1.2,
      }}
    >
      {label}
    </span>
  );
}

export default StatusBadge;

