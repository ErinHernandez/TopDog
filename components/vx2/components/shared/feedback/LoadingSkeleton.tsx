/**
 * LoadingSkeleton - Animated placeholder while content loads
 *
 * Provides building blocks for creating loading skeletons.
 * Migrated to CSS Modules for CSP compliance.
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

import { cn } from '@/lib/styles';

import styles from './LoadingSkeleton.module.css';

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
  borderRadius = 8,
  circle = false,
  className = '',
  animation = 'pulse',
}: SkeletonProps): React.ReactElement {
  const animationClass =
    animation === 'pulse' ? styles.pulse : animation === 'shimmer' ? styles.shimmer : '';

  return (
    <div
      className={cn(styles.skeleton, circle && styles.circle, animationClass, className)}
      style={{
        '--skeleton-width': typeof width === 'number' ? `${width}px` : width,
        '--skeleton-height': typeof height === 'number' ? `${height}px` : height,
        '--skeleton-radius': circle ? '50%' : `${borderRadius}px`,
      } as React.CSSProperties}
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
      className={cn(styles.textContainer, className)}
      style={{ '--skeleton-gap': `${gap}px` } as React.CSSProperties}
    >
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} width={i === lines - 1 ? lastLineWidth : '100%'} height={14} />
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
      className={cn(styles.card, className)}
      style={{ '--card-height': `${height}px` } as React.CSSProperties}
    >
      {showHeader && (
        <div className={styles.cardHeader}>
          <Skeleton width={180} height={20} />
          <Skeleton width={120} height={14} className={styles.mt2} />
        </div>
      )}

      <div className={styles.cardBody}>
        <Skeleton width="100%" height={60} />
      </div>

      {showAction && (
        <div className={styles.cardFooter}>
          <Skeleton width={80} height={14} />
          <Skeleton width={100} height={36} borderRadius={8} />
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
    <div className={cn(styles.listItem, className)}>
      {showAvatar && (
        <Skeleton
          width={avatarSize}
          height={avatarSize}
          circle
          className={styles.listItemAvatar}
        />
      )}

      <div className={styles.listItemContent}>
        <Skeleton width="70%" height={14} />
        {textLines > 1 && <Skeleton width="50%" height={12} className={styles.mt2} />}
      </div>

      {showRight && <Skeleton width={50} height={16} className={styles.listItemRight} />}
    </div>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default Skeleton;
