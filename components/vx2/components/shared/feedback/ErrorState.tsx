/**
 * ErrorState - Display when an error occurs
 *
 * Provides a consistent error UI with retry capability.
 * Migrated to CSS Modules for CSP compliance.
 *
 * @example
 * ```tsx
 * <ErrorState
 *   title="Failed to load teams"
 *   description="Please check your connection and try again"
 *   onRetry={() => refetch()}
 * />
 * ```
 */

import React from 'react';

import { cn } from '@/lib/styles';

import styles from './ErrorState.module.css';

// ============================================================================
// TYPES
// ============================================================================

export interface ErrorStateProps {
  /** Error title */
  title?: string;
  /** Error description/message */
  description?: string;
  /** Retry callback */
  onRetry?: () => void;
  /** Retry button label */
  retryLabel?: string;
  /** Custom icon (optional) */
  icon?: React.ReactNode;
  /** Additional className */
  className?: string;
  /** Compact mode (less padding) */
  compact?: boolean;
  /** Technical error details (for development) */
  errorDetails?: string;
}

// ============================================================================
// DEFAULT ICON
// ============================================================================

function DefaultErrorIcon(): React.ReactElement {
  return (
    <svg
      width={32}
      height={32}
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--color-error)"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ErrorState({
  title = 'Something went wrong',
  description = 'We had trouble loading this content. Please try again.',
  onRetry,
  retryLabel = 'Try Again',
  icon,
  className = '',
  compact = false,
  errorDetails,
}: ErrorStateProps): React.ReactElement {
  const isDev = process.env.NODE_ENV === 'development';

  return (
    <div
      className={cn(styles.container, compact && styles.compact, className)}
      role="alert"
      aria-live="assertive"
    >
      {/* Icon */}
      <div className={cn(styles.iconWrapper, compact && styles.compact)}>
        {icon || <DefaultErrorIcon />}
      </div>

      {/* Title */}
      <h3 className={cn(styles.title, compact && styles.compact)}>{title}</h3>

      {/* Description */}
      <p className={cn(styles.description, onRetry && styles.hasRetry)}>{description}</p>

      {/* Error Details (dev only) */}
      {isDev && errorDetails && (
        <details className={styles.errorDetails}>
          <summary className={styles.errorSummary}>Technical Details</summary>
          <pre className={styles.errorPre}>{errorDetails}</pre>
        </details>
      )}

      {/* Retry Button */}
      {onRetry && (
        <button onClick={onRetry} className={styles.retryButton}>
          {retryLabel}
        </button>
      )}
    </div>
  );
}

export default ErrorState;
