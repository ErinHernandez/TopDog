/**
 * EmptyState - Display when there's no data to show
 * 
 * Provides a consistent empty state UI across the app.
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
import { BG_COLORS, TEXT_COLORS, STATE_COLORS } from '../../vx2/core/constants/colors';
import { SPACING, RADIUS, TYPOGRAPHY } from '../../vx2/core/constants/sizes';

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
      stroke={TEXT_COLORS.muted}
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
  const padding = compact ? SPACING.lg : SPACING['2xl'];
  
  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${className}`}
      style={{
        padding: `${padding}px`,
        minHeight: compact ? 'auto' : '200px',
      }}
      role="status"
      aria-label={title}
    >
      {/* Icon */}
      <div
        className="flex items-center justify-center rounded-full mb-4"
        style={{
          width: compact ? '48px' : '64px',
          height: compact ? '48px' : '64px',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
        }}
      >
        {icon || <DefaultEmptyIcon />}
      </div>

      {/* Title */}
      <h3
        className="font-semibold"
        style={{
          color: TEXT_COLORS.primary,
          fontSize: compact ? `${TYPOGRAPHY.fontSize.base}px` : `${TYPOGRAPHY.fontSize.lg}px`,
          marginBottom: description ? `${SPACING.sm}px` : 0,
        }}
      >
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p
          style={{
            color: TEXT_COLORS.secondary,
            fontSize: `${TYPOGRAPHY.fontSize.sm}px`,
            maxWidth: '280px',
            marginBottom: action ? `${SPACING.lg}px` : 0,
          }}
        >
          {description}
        </p>
      )}

      {/* Actions */}
      {(action || secondaryAction) && (
        <div
          className="flex items-center"
          style={{ gap: `${SPACING.md}px` }}
        >
          {action && (
            <button
              onClick={action.onClick}
              className="font-medium transition-colors"
              style={{
                backgroundColor: action.variant === 'secondary' 
                  ? 'rgba(255, 255, 255, 0.1)' 
                  : STATE_COLORS.active,
                color: action.variant === 'secondary' 
                  ? TEXT_COLORS.primary 
                  : '#000000',
                paddingLeft: `${SPACING.lg}px`,
                paddingRight: `${SPACING.lg}px`,
                paddingTop: `${SPACING.md}px`,
                paddingBottom: `${SPACING.md}px`,
                borderRadius: `${RADIUS.md}px`,
                fontSize: `${TYPOGRAPHY.fontSize.sm}px`,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              {action.label}
            </button>
          )}
          
          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              className="font-medium transition-colors"
              style={{
                backgroundColor: 'transparent',
                color: TEXT_COLORS.secondary,
                padding: `${SPACING.md}px`,
                fontSize: `${TYPOGRAPHY.fontSize.sm}px`,
                border: 'none',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              {secondaryAction.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default EmptyState;

