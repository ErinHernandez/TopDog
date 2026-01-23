/**
 * LoadingSkeleton - Animated placeholder while content loads
 * 
 * Provides building blocks for creating loading skeletons.
 * 
 * @example
 * ```tsx
 * // Basic usage
 * <Skeleton width={200} height={20} />
 * 
 * // Card skeleton
 * <SkeletonCard />
 * 
 * // List item skeleton
 * <SkeletonListItem />
 * ```
 */

import React from 'react';
import { RADIUS } from '../../vx2/core/constants/sizes';

// ============================================================================
// TYPES
// ============================================================================

export interface SkeletonProps {
  /** Width (number for px, string for any unit) */
  width?: number | string;
  /** Height (number for px, string for any unit) */
  height?: number | string;
  /** Border radius */
  borderRadius?: number;
  /** Whether to show as circle */
  circle?: boolean;
  /** Additional className */
  className?: string;
  /** Animation style */
  animation?: 'pulse' | 'shimmer' | 'none';
}

// ============================================================================
// BASE SKELETON
// ============================================================================

export function Skeleton({
  width = '100%',
  height = 16,
  borderRadius = RADIUS.md,
  circle = false,
  className = '',
  animation = 'pulse',
}: SkeletonProps): React.ReactElement {
  const animationClass = animation === 'pulse' ? 'animate-pulse' : '';
  const actualRadius = circle ? '50%' : `${borderRadius}px`;
  
  return (
    <div
      className={`${animationClass} ${className}`}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: actualRadius,
      }}
      aria-hidden="true"
    />
  );
}

// ============================================================================
// COMPOSITE SKELETONS
// ============================================================================

export interface SkeletonTextProps {
  /** Number of lines */
  lines?: number;
  /** Gap between lines */
  gap?: number;
  /** Last line width percentage */
  lastLineWidth?: string;
  className?: string;
}

/**
 * Multi-line text skeleton
 */
export function SkeletonText({
  lines = 3,
  gap = 8,
  lastLineWidth = '60%',
  className = '',
}: SkeletonTextProps): React.ReactElement {
  return (
    <div
      className={className}
      style={{ display: 'flex', flexDirection: 'column', gap: `${gap}px` }}
    >
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          width={i === lines - 1 ? lastLineWidth : '100%'}
          height={14}
        />
      ))}
    </div>
  );
}

export interface SkeletonCardProps {
  /** Card height */
  height?: number;
  /** Show header line */
  showHeader?: boolean;
  /** Show action button */
  showAction?: boolean;
  className?: string;
}

/**
 * Card skeleton
 */
export function SkeletonCard({
  height = 160,
  showHeader = true,
  showAction = true,
  className = '',
}: SkeletonCardProps): React.ReactElement {
  return (
    <div
      className={className}
      style={{
        backgroundColor: 'rgba(31, 41, 55, 0.5)',
        borderRadius: `${RADIUS.lg}px`,
        padding: '16px',
        height: `${height}px`,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {showHeader && (
        <div style={{ marginBottom: '12px' }}>
          <Skeleton width={180} height={20} />
          <Skeleton width={120} height={14} className="mt-2" />
        </div>
      )}
      
      <div style={{ flex: 1 }}>
        <Skeleton width="100%" height={60} />
      </div>
      
      {showAction && (
        <div className="flex justify-between items-center mt-3">
          <Skeleton width={80} height={14} />
          <Skeleton width={100} height={36} borderRadius={RADIUS.md} />
        </div>
      )}
    </div>
  );
}

export interface SkeletonListItemProps {
  /** Show avatar */
  showAvatar?: boolean;
  /** Avatar size */
  avatarSize?: number;
  /** Number of text lines */
  textLines?: number;
  /** Show right content */
  showRight?: boolean;
  className?: string;
}

/**
 * List item skeleton
 */
export function SkeletonListItem({
  showAvatar = true,
  avatarSize = 40,
  textLines = 2,
  showRight = true,
  className = '',
}: SkeletonListItemProps): React.ReactElement {
  return (
    <div
      className={`flex items-center ${className}`}
      style={{ padding: '12px 0' }}
    >
      {showAvatar && (
        <Skeleton
          width={avatarSize}
          height={avatarSize}
          circle
          className="flex-shrink-0 mr-3"
        />
      )}
      
      <div style={{ flex: 1, minWidth: 0 }}>
        <Skeleton width="70%" height={14} />
        {textLines > 1 && (
          <Skeleton width="50%" height={12} className="mt-2" />
        )}
      </div>
      
      {showRight && (
        <Skeleton width={50} height={16} className="ml-3 flex-shrink-0" />
      )}
    </div>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default Skeleton;

