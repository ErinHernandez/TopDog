/**
 * ProgressBar - Visual progress indicator
 *
 * Migrated to CSS Modules for CSP compliance.
 * Uses CSS custom properties for dynamic values.
 *
 * @example
 * ```tsx
 * <ProgressBar value={75} />
 * <ProgressBar value={25} color="#10b981" size="lg" />
 * ```
 */

import React from 'react';

import { cn } from '@/lib/styles';

import styles from './ProgressBar.module.css';

// ============================================================================
// TYPES
// ============================================================================

export interface ProgressBarProps {
  /** Progress value (0-100) */
  value: number;
  /** Bar color */
  color?: string;
  /** Background image for fill (overrides color) */
  fillBackgroundImage?: string;
  /** Background color */
  backgroundColor?: string;
  /** Bar size */
  size?: 'sm' | 'md' | 'lg';
  /** Show percentage label */
  showLabel?: boolean;
  /** Label position */
  labelPosition?: 'inside' | 'right';
  /** Additional className */
  className?: string;
  /** Accessibility label */
  'aria-label'?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function ProgressBar({
  value,
  color,
  fillBackgroundImage,
  backgroundColor,
  size = 'md',
  showLabel = false,
  labelPosition = 'right',
  className = '',
  'aria-label': ariaLabel,
}: ProgressBarProps): React.ReactElement {
  // Clamp value between 0 and 100
  const clampedValue = Math.max(0, Math.min(100, value));

  // Build CSS custom properties for dynamic values
  const trackStyle: React.CSSProperties = {};
  if (backgroundColor) {
    (trackStyle as Record<string, string>)['--progress-bg'] = backgroundColor;
  }

  const fillStyle: React.CSSProperties = {
    '--progress-value': `${clampedValue}%`,
  } as React.CSSProperties;

  if (fillBackgroundImage) {
    fillStyle.backgroundImage = fillBackgroundImage;
  } else if (color) {
    (fillStyle as Record<string, string>)['--progress-color'] = color;
  }

  const progressBar = (
    <div
      className={cn(styles.track, styles[size], className)}
      style={trackStyle}
      role="progressbar"
      aria-valuenow={clampedValue}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={ariaLabel || `Progress: ${Math.round(clampedValue)}%`}
    >
      {/* Progress fill */}
      <div
        className={cn(styles.fill, fillBackgroundImage && styles.hasBackgroundImage)}
        style={fillStyle}
      />

      {/* Inside label */}
      {showLabel && labelPosition === 'inside' && size === 'lg' && (
        <span className={cn(styles.insideLabel, clampedValue > 50 && styles.dark)}>
          {Math.round(clampedValue)}%
        </span>
      )}
    </div>
  );

  // With right label
  if (showLabel && labelPosition === 'right') {
    return (
      <div className={styles.containerWithLabel}>
        {progressBar}
        <span className={styles.rightLabel}>{Math.round(clampedValue)}%</span>
      </div>
    );
  }

  return progressBar;
}

export default ProgressBar;
