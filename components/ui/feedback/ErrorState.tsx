/**
 * ErrorState - Display when an error occurs
 * 
 * Provides a consistent error UI with retry capability.
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

const DefaultErrorIcon = React.memo(function DefaultErrorIcon(): React.ReactElement {
  return (
    <svg
      width={32}
      height={32}
      viewBox="0 0 24 24"
      fill="none"
      className={styles.errorIcon}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
});

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
      className={`${styles.container} ${className}`}
      data-compact={compact}
      role="alert"
      aria-live="assertive"
    >
      {/* Icon */}
      <div className={styles.iconContainer} data-compact={compact}>
        {icon || <DefaultErrorIcon />}
      </div>

      {/* Title */}
      <h3 className={styles.title} data-compact={compact}>
        {title}
      </h3>

      {/* Description */}
      <p className={styles.description} data-has-retry={!!onRetry}>
        {description}
      </p>

      {/* Error Details (dev only) */}
      {isDev && errorDetails && (
        <details className={styles.details}>
          <summary className={styles.detailsSummary}>
            Technical Details
            {' '}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                navigator.clipboard.writeText(errorDetails);
              }}
              title="Copy error details"
              style={{ marginLeft: '8px', padding: '2px 6px', fontSize: '12px' }}
            >
              Copy
            </button>
          </summary>
          <pre className={styles.detailsContent}>
            {errorDetails}
          </pre>
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

