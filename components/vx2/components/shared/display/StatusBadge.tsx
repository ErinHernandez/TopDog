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
// SIZE CONFIG
// ============================================================================

const SIZE_CONFIG = {
  sm: {
    paddingX: 'var(--spacing-sm)',
    paddingY: 'var(--spacing-xs)',
    fontSizeToken: 'var(--font-size-xs)',
  },
  md: {
    paddingX: 'var(--spacing-md)',
    paddingY: 'var(--spacing-xs)',
    fontSizeToken: 'var(--font-size-xs)',
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
  const sizeConfig = SIZE_CONFIG[size];

  // CSS custom properties for size values only (colors handled by data-status in CSS)
  const badgeStyle: React.CSSProperties = {
    '--badge-padding-x': sizeConfig.paddingX,
    '--badge-padding-y': sizeConfig.paddingY,
    '--badge-font-size': sizeConfig.fontSizeToken,
  } as React.CSSProperties;

  return (
    <span
      className={cn(styles.badge, pulse && styles.badgePulse, className)}
      data-status={status}
      style={badgeStyle}
    >
      {label}
    </span>
  );
}

export default StatusBadge;
