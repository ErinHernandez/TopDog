/**
 * StatusBadge - Display status with semantic colors
 *
 * Migrated to CSS Modules for CSP compliance.
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
import { cn } from '@/lib/styles';
import styles from './StatusBadge.module.css';

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

  // CSS custom properties for dynamic values
  const badgeStyle: React.CSSProperties = {
    '--badge-bg': colors.bg,
    '--badge-color': colors.text,
    '--badge-padding-x': `${sizeConfig.paddingX}px`,
    '--badge-padding-y': `${sizeConfig.paddingY}px`,
    '--badge-radius': `${RADIUS.sm}px`,
    '--badge-font-size': `${sizeConfig.fontSize}px`,
  } as React.CSSProperties;

  return (
    <span
      className={cn(styles.badge, pulse && styles.badgePulse, className)}
      style={badgeStyle}
    >
      {label}
    </span>
  );
}

export default StatusBadge;
