/**
 * VX Loading Spinner Component
 * 
 * Reusable loading indicator for async operations.
 * Supports different sizes and can display optional loading text.
 */

import React from 'react';
import { BRAND_COLORS } from '../constants/colors';

// ============================================================================
// TYPES
// ============================================================================

export interface LoadingSpinnerProps {
  /** Size of the spinner */
  size?: 'sm' | 'md' | 'lg';
  /** Optional loading text */
  text?: string;
  /** Color of the spinner (defaults to brand teal) */
  color?: string;
  /** Center in container */
  centered?: boolean;
  /** Full screen overlay */
  fullScreen?: boolean;
}

// ============================================================================
// SIZE CONFIGURATION
// ============================================================================

const SIZES = {
  sm: { spinner: 16, border: 2, text: '12px' },
  md: { spinner: 32, border: 3, text: '14px' },
  lg: { spinner: 48, border: 4, text: '16px' },
} as const;

// ============================================================================
// COMPONENT
// ============================================================================

export default function LoadingSpinner({
  size = 'md',
  text,
  color = BRAND_COLORS.primary,
  centered = true,
  fullScreen = false,
}: LoadingSpinnerProps): React.ReactElement {
  const sizeConfig = SIZES[size];

  const spinnerElement = (
    <div className={centered ? 'flex flex-col items-center justify-center gap-3' : ''}>
      <div
        className="animate-spin rounded-full"
        style={{
          width: sizeConfig.spinner,
          height: sizeConfig.spinner,
          border: `${sizeConfig.border}px solid rgba(255, 255, 255, 0.1)`,
          borderTopColor: color,
        }}
        role="status"
        aria-label={text || 'Loading'}
      />
      {text && (
        <span
          className="text-gray-400"
          style={{ fontSize: sizeConfig.text }}
        >
          {text}
        </span>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div 
        className="fixed inset-0 flex items-center justify-center bg-black/50 z-50"
        role="dialog"
        aria-modal="true"
        aria-label="Loading"
      >
        {spinnerElement}
      </div>
    );
  }

  return spinnerElement;
}

// ============================================================================
// SKELETON LOADER
// ============================================================================

export interface SkeletonProps {
  /** Width of skeleton (CSS value) */
  width?: string;
  /** Height of skeleton (CSS value) */
  height?: string;
  /** Border radius */
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  /** Additional className */
  className?: string;
}

const ROUNDED = {
  none: '0',
  sm: '4px',
  md: '8px',
  lg: '12px',
  full: '9999px',
} as const;

export function Skeleton({
  width = '100%',
  height = '16px',
  rounded = 'md',
  className = '',
}: SkeletonProps): React.ReactElement {
  return (
    <div
      className={`animate-pulse bg-gray-700 ${className}`}
      style={{
        width,
        height,
        borderRadius: ROUNDED[rounded],
      }}
      role="status"
      aria-label="Loading"
    />
  );
}

// ============================================================================
// PLAYER ROW SKELETON
// ============================================================================

export function PlayerRowSkeleton(): React.ReactElement {
  return (
    <div className="flex items-center px-3 py-2 gap-3">
      <Skeleton width="28px" height="28px" rounded="full" />
      <div className="flex-1">
        <Skeleton width="60%" height="14px" className="mb-2" />
        <Skeleton width="40%" height="12px" />
      </div>
      <Skeleton width="40px" height="14px" />
    </div>
  );
}

// ============================================================================
// PICK CARD SKELETON
// ============================================================================

export function PickCardSkeleton(): React.ReactElement {
  return (
    <div 
      className="flex-shrink-0 bg-gray-800 rounded-lg p-2"
      style={{ width: '107px', height: '140px' }}
    >
      <Skeleton width="100%" height="24px" rounded="sm" className="mb-2" />
      <Skeleton width="40px" height="40px" rounded="full" className="mx-auto mb-2" />
      <Skeleton width="80%" height="12px" className="mx-auto" />
    </div>
  );
}

