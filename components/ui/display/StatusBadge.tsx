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
// COMPONENT
// ============================================================================

export function StatusBadge({
  status,
  label,
  size = 'sm',
  className = '',
  pulse = false,
}: StatusBadgeProps): React.ReactElement {
  return (
    <span
      className={cn(styles.badge, pulse && styles.badgePulse, className)}
      data-status={status}
      data-size={size}
    >
      {label}
    </span>
  );
}

export default StatusBadge;
