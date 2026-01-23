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
import { TEXT_COLORS, STATE_COLORS } from '../../vx2/core/constants/colors';
import { SPACING, RADIUS, TYPOGRAPHY } from '../../vx2/core/constants/sizes';

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
      stroke={STATE_COLORS.error}
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
  const padding = compact ? SPACING.lg : SPACING['2xl'];
  const isDev = process.env.NODE_ENV === 'development';
  
  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${className}`}
      style={{
        padding: `${padding}px`,
        minHeight: compact ? 'auto' : '200px',
      }}
      role="alert"
      aria-live="assertive"
    >
      {/* Icon */}
      <div
        className="flex items-center justify-center rounded-full mb-4"
        style={{
          width: compact ? '48px' : '64px',
          height: compact ? '48px' : '64px',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
        }}
      >
        {icon || <DefaultErrorIcon />}
      </div>

      {/* Title */}
      <h3
        className="font-semibold"
        style={{
          color: TEXT_COLORS.primary,
          fontSize: compact ? `${TYPOGRAPHY.fontSize.base}px` : `${TYPOGRAPHY.fontSize.lg}px`,
          marginBottom: `${SPACING.sm}px`,
        }}
      >
        {title}
      </h3>

      {/* Description */}
      <p
        style={{
          color: TEXT_COLORS.secondary,
          fontSize: `${TYPOGRAPHY.fontSize.sm}px`,
          maxWidth: '280px',
          marginBottom: onRetry ? `${SPACING.lg}px` : 0,
        }}
      >
        {description}
      </p>

      {/* Error Details (dev only) */}
      {isDev && errorDetails && (
        <details
          className="w-full max-w-sm mb-4 text-left"
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            borderRadius: `${RADIUS.md}px`,
            padding: `${SPACING.md}px`,
          }}
        >
          <summary
            className="cursor-pointer"
            style={{
              color: TEXT_COLORS.secondary,
              fontSize: `${TYPOGRAPHY.fontSize.xs}px`,
            }}
          >
            Technical Details
          </summary>
          <pre
            className="mt-2 overflow-x-auto"
            style={{
              color: STATE_COLORS.error,
              fontSize: `${TYPOGRAPHY.fontSize.xs}px`,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {errorDetails}
          </pre>
        </details>
      )}

      {/* Retry Button */}
      {onRetry && (
        <button
          onClick={onRetry}
          className="font-medium transition-colors hover:opacity-90"
          style={{
            backgroundColor: STATE_COLORS.active,
            color: '#000000',
            paddingLeft: `${SPACING.xl}px`,
            paddingRight: `${SPACING.xl}px`,
            paddingTop: `${SPACING.md}px`,
            paddingBottom: `${SPACING.md}px`,
            borderRadius: `${RADIUS.md}px`,
            fontSize: `${TYPOGRAPHY.fontSize.sm}px`,
            border: 'none',
            cursor: 'pointer',
          }}
        >
          {retryLabel}
        </button>
      )}
    </div>
  );
}

export default ErrorState;

