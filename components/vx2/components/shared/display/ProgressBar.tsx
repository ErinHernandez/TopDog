/**
 * ProgressBar - Visual progress indicator
 * 
 * @example
 * ```tsx
 * <ProgressBar value={75} />
 * <ProgressBar value={25} color="#10b981" size="lg" />
 * ```
 */

import React from 'react';
import { STATE_COLORS } from '../../../core/constants/colors';
import { RADIUS } from '../../../core/constants/sizes';

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
// SIZE CONFIG
// ============================================================================

const SIZE_CONFIG = {
  sm: { height: 4, borderRadius: 2 },
  md: { height: 8, borderRadius: 4 },
  lg: { height: 12, borderRadius: 6 },
} as const;

// ============================================================================
// COMPONENT
// ============================================================================

export function ProgressBar({
  value,
  color = STATE_COLORS.active,
  fillBackgroundImage,
  backgroundColor = 'rgba(255, 255, 255, 0.1)',
  size = 'md',
  showLabel = false,
  labelPosition = 'right',
  className = '',
  'aria-label': ariaLabel,
}: ProgressBarProps): React.ReactElement {
  // Clamp value between 0 and 100
  const clampedValue = Math.max(0, Math.min(100, value));
  const config = SIZE_CONFIG[size];
  
  // Build fill style - use background image if provided, otherwise solid color
  const fillStyle: React.CSSProperties = {
    width: `${clampedValue}%`,
    borderRadius: `${config.borderRadius}px`,
  };
  
  if (fillBackgroundImage) {
    fillStyle.backgroundImage = fillBackgroundImage;
    fillStyle.backgroundSize = 'cover';
    fillStyle.backgroundPosition = 'center';
  } else {
    fillStyle.backgroundColor = color;
  }
  
  const progressBar = (
    <div
      className={`relative overflow-hidden ${className}`}
      style={{
        height: `${config.height}px`,
        borderRadius: `${config.borderRadius}px`,
        backgroundColor,
        flex: 1,
      }}
      role="progressbar"
      aria-valuenow={clampedValue}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={ariaLabel || `Progress: ${Math.round(clampedValue)}%`}
    >
      {/* Progress fill */}
      <div
        className="absolute inset-y-0 left-0 transition-all duration-300 ease-out"
        style={fillStyle}
      />
      
      {/* Inside label */}
      {showLabel && labelPosition === 'inside' && size === 'lg' && (
        <span
          className="absolute inset-0 flex items-center justify-center text-xs font-medium"
          style={{ color: clampedValue > 50 ? '#000' : '#fff' }}
        >
          {Math.round(clampedValue)}%
        </span>
      )}
    </div>
  );
  
  // With right label
  if (showLabel && labelPosition === 'right') {
    return (
      <div className="flex items-center gap-2">
        {progressBar}
        <span
          className="text-xs font-medium flex-shrink-0"
          style={{ color: 'rgba(255, 255, 255, 0.7)', minWidth: '36px' }}
        >
          {Math.round(clampedValue)}%
        </span>
      </div>
    );
  }
  
  return progressBar;
}

export default ProgressBar;

