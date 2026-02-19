/**
 * EmptyState - Display when there's no data to show
 *
 * Provides a consistent empty state UI across the app.
 * Migrated to CSS Modules for CSP compliance.
 *
 * @example
 * ```tsx
 * <EmptyState
 *   title="No Teams Yet"
 *   description="Join a tournament to start drafting"
 *   action={{ label: "Browse Lobby", onClick: () => navigate('lobby') }}
 * />
 * ```
 */

import React from 'react';

import { cn } from '@/lib/styles';

import styles from './EmptyState.module.css';

// ============================================================================
// TYPES
// ============================================================================

export interface EmptyStateAction {
  /** Button label */
  label: string;
  /** Click handler */
  onClick: () => void;
  /** Button variant */
  variant?: 'primary' | 'secondary';
}

export interface EmptyStateProps {
  /** Title text */
  title: string;
  /** Description text */
  description?: string;
  /** Custom icon (optional) */
  icon?: React.ReactNode;
  /** Action button (optional) */
  action?: EmptyStateAction;
  /** Secondary action (optional) */
  secondaryAction?: EmptyStateAction;
  /** Additional className */
  className?: string;
  /** Compact mode (less padding) */
  compact?: boolean;
}

// ============================================================================
// DEFAULT ICON
// ============================================================================

function DefaultEmptyIcon(): React.ReactElement {
  return (
    <svg
      width={48}
      height={48}
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--text-muted)"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
    </svg>
  );
}

// ============================================================================
// COMPONENT
// ============================================================================

export function EmptyState({
  title,
  description,
  icon,
  action,
  secondaryAction,
  className = '',
  compact = false,
}: EmptyStateProps): React.ReactElement {
  return (
    <div
      className={cn(styles.container, compact && styles.compact, className)}
      role="status"
      aria-label={title}
    >
      {/* Icon */}
      <div className={cn(styles.iconWrapper, compact && styles.compact)}>
        {icon || <DefaultEmptyIcon />}
      </div>

      {/* Title */}
      <h3
        className={cn(
          styles.title,
          compact && styles.compact,
          description && styles.hasDescription
        )}
      >
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p className={cn(styles.description, action && styles.hasAction)}>
          {description}
        </p>
      )}

      {/* Actions */}
      {(action || secondaryAction) && (
        <div className={styles.actions}>
          {action && (
            <button
              onClick={action.onClick}
              className={
                action.variant === 'secondary'
                  ? styles.secondaryButton
                  : styles.primaryButton
              }
            >
              {action.label}
            </button>
          )}

          {secondaryAction && (
            <button onClick={secondaryAction.onClick} className={styles.textButton}>
              {secondaryAction.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default EmptyState;
