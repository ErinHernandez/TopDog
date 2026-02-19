/**
 * ProgressBar - Visual progress indicator
 *
 * Migrated to CSS Modules for CSP compliance.
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
  const containerStyle: React.CSSProperties & Record<string, string | undefined> = {};
  if (backgroundColor) {
    containerStyle['--progress-bg'] = backgroundColor;
  }

  // Build fill style - use background image if provided, otherwise custom property
  const fillStyle: React.CSSProperties & Record<string, string | number | undefined> = {
    width: `${clampedValue}%`,
  };

  if (fillBackgroundImage) {
    fillStyle.backgroundImage = fillBackgroundImage;
    fillStyle.backgroundSize = 'cover';
    fillStyle.backgroundPosition = 'center';
    fillStyle.backgroundColor = 'transparent'; // Override CSS default
  } else if (color) {
    fillStyle['--progress-color'] = color;
  }

  const progressBar = (
    <div
      className={cn(styles.container, className)}
      data-size={size}
      style={containerStyle}
      role="progressbar"
      aria-valuenow={clampedValue}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={ariaLabel || `Progress: ${Math.round(clampedValue)}%`}
    >
      {/* Track background */}
      <div className={styles.track} />

      {/* Progress fill */}
      <div className={styles.fill} style={fillStyle} />

      {/* Inside label */}
      {showLabel && labelPosition === 'inside' && size === 'lg' && (
        <span className={styles.insideLabel} data-invert={clampedValue > 50}>
          {Math.round(clampedValue)}%
        </span>
      )}
    </div>
  );

  // With right label
  if (showLabel && labelPosition === 'right') {
    return (
      <div className={styles.withLabel}>
        {progressBar}
        <span className={styles.rightLabel}>
          {Math.round(clampedValue)}%
        </span>
      </div>
    );
  }

  return progressBar;
}

export default ProgressBar;

