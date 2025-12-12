/**
 * VX Empty State Component
 * 
 * Consistent empty state displays for when there's no content.
 * Use for empty lists, search results, error states, etc.
 */

import React from 'react';
import { TEXT_COLORS, BRAND_COLORS } from '../constants/colors';
import Button from './Button';

// ============================================================================
// TYPES
// ============================================================================

export interface EmptyStateProps {
  /** Icon to display */
  icon?: React.ReactNode;
  /** Title text */
  title: string;
  /** Description text */
  description?: string;
  /** Primary action */
  action?: {
    label: string;
    onClick: () => void;
  };
  /** Secondary action */
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Custom className */
  className?: string;
}

// ============================================================================
// SIZE STYLES
// ============================================================================

const SIZE_STYLES = {
  sm: {
    iconSize: '40px',
    titleSize: '14px',
    descSize: '12px',
    padding: '16px',
    gap: '8px',
  },
  md: {
    iconSize: '56px',
    titleSize: '16px',
    descSize: '14px',
    padding: '24px',
    gap: '12px',
  },
  lg: {
    iconSize: '72px',
    titleSize: '20px',
    descSize: '16px',
    padding: '32px',
    gap: '16px',
  },
};

// ============================================================================
// DEFAULT ICONS
// ============================================================================

const DEFAULT_ICONS = {
  empty: (
    <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
    </svg>
  ),
  search: (
    <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  error: (
    <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  success: (
    <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

// ============================================================================
// COMPONENT
// ============================================================================

export default function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  size = 'md',
  className = '',
}: EmptyStateProps): React.ReactElement {
  const sizeStyle = SIZE_STYLES[size];

  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${className}`}
      style={{ padding: sizeStyle.padding }}
    >
      {/* Icon */}
      {icon !== null && (
        <div
          className="mb-4"
          style={{
            width: sizeStyle.iconSize,
            height: sizeStyle.iconSize,
            color: TEXT_COLORS.muted,
          }}
        >
          {icon || DEFAULT_ICONS.empty}
        </div>
      )}

      {/* Title */}
      <h3
        className="font-semibold mb-1"
        style={{
          fontSize: sizeStyle.titleSize,
          color: TEXT_COLORS.primary,
        }}
      >
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p
          style={{
            fontSize: sizeStyle.descSize,
            color: TEXT_COLORS.secondary,
            maxWidth: '280px',
          }}
        >
          {description}
        </p>
      )}

      {/* Actions */}
      {(action || secondaryAction) && (
        <div
          className="flex items-center gap-3 mt-4"
          style={{ marginTop: sizeStyle.gap }}
        >
          {action && (
            <Button
              variant="primary"
              size={size === 'lg' ? 'md' : 'sm'}
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              variant="ghost"
              size={size === 'lg' ? 'md' : 'sm'}
              onClick={secondaryAction.onClick}
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// PRESET EMPTY STATES
// ============================================================================

export function NoSearchResults({
  searchTerm,
  onClear,
}: {
  searchTerm?: string;
  onClear?: () => void;
}): React.ReactElement {
  return (
    <EmptyState
      icon={DEFAULT_ICONS.search}
      title="No results found"
      description={searchTerm ? `No results for "${searchTerm}"` : 'Try a different search term'}
      action={onClear ? { label: 'Clear Search', onClick: onClear } : undefined}
    />
  );
}

export function NoPlayers({
  onRefresh,
}: {
  onRefresh?: () => void;
}): React.ReactElement {
  return (
    <EmptyState
      icon={DEFAULT_ICONS.empty}
      title="No players available"
      description="All players have been drafted"
      action={onRefresh ? { label: 'Refresh', onClick: onRefresh } : undefined}
    />
  );
}

export function EmptyQueue({
  onBrowse,
}: {
  onBrowse?: () => void;
}): React.ReactElement {
  return (
    <EmptyState
      icon={
        <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
        </svg>
      }
      title="No players queued"
      description="Tap the + button on players to add them to your queue"
      action={onBrowse ? { label: 'Browse Players', onClick: onBrowse } : undefined}
    />
  );
}

export function ErrorState({
  message = 'Something went wrong',
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}): React.ReactElement {
  return (
    <EmptyState
      icon={DEFAULT_ICONS.error}
      title="Error"
      description={message}
      action={onRetry ? { label: 'Try Again', onClick: onRetry } : undefined}
    />
  );
}

export function SuccessState({
  title = 'Success',
  message,
  onContinue,
}: {
  title?: string;
  message?: string;
  onContinue?: () => void;
}): React.ReactElement {
  return (
    <EmptyState
      icon={DEFAULT_ICONS.success}
      title={title}
      description={message}
      action={onContinue ? { label: 'Continue', onClick: onContinue } : undefined}
    />
  );
}

