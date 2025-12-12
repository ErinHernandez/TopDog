/**
 * VX Progress Components
 * 
 * Progress indicators for loading, completion, and draft tracking.
 */

import React from 'react';
import { BRAND_COLORS, TEXT_COLORS, POSITION_COLORS, BG_COLORS } from '../constants/colors';
import { TRANSITION } from '../constants/animations';

// ============================================================================
// TYPES
// ============================================================================

export interface ProgressBarProps {
  /** Progress value (0-100) */
  value: number;
  /** Maximum value */
  max?: number;
  /** Progress bar color */
  color?: string;
  /** Show percentage label */
  showLabel?: boolean;
  /** Label position */
  labelPosition?: 'inside' | 'outside' | 'top';
  /** Size */
  size?: 'sm' | 'md' | 'lg';
  /** Animated */
  animated?: boolean;
  /** Custom className */
  className?: string;
}

export interface CircularProgressProps {
  /** Progress value (0-100) */
  value: number;
  /** Circle size in pixels */
  size?: number;
  /** Stroke width */
  strokeWidth?: number;
  /** Progress color */
  color?: string;
  /** Show value in center */
  showValue?: boolean;
  /** Custom center content */
  children?: React.ReactNode;
  /** Custom className */
  className?: string;
}

export interface DraftProgressProps {
  /** Current pick number */
  currentPick: number;
  /** Total picks */
  totalPicks: number;
  /** Current round */
  currentRound: number;
  /** Total rounds */
  totalRounds: number;
  /** Custom className */
  className?: string;
}

export interface PositionProgressProps {
  /** Position counts */
  counts: {
    QB: number;
    RB: number;
    WR: number;
    TE: number;
  };
  /** Total slots filled */
  total?: number;
  /** Size */
  size?: 'sm' | 'md';
  /** Custom className */
  className?: string;
}

// ============================================================================
// SIZE STYLES
// ============================================================================

const BAR_SIZES = {
  sm: { height: '4px', labelSize: '10px' },
  md: { height: '8px', labelSize: '12px' },
  lg: { height: '12px', labelSize: '14px' },
};

// ============================================================================
// PROGRESS BAR
// ============================================================================

export default function ProgressBar({
  value,
  max = 100,
  color = BRAND_COLORS.primary,
  showLabel = false,
  labelPosition = 'outside',
  size = 'md',
  animated = false,
  className = '',
}: ProgressBarProps): React.ReactElement {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  const sizeStyle = BAR_SIZES[size];

  return (
    <div className={className}>
      {showLabel && labelPosition === 'top' && (
        <div className="flex justify-between mb-1">
          <span style={{ fontSize: sizeStyle.labelSize, color: TEXT_COLORS.secondary }}>
            Progress
          </span>
          <span style={{ fontSize: sizeStyle.labelSize, color: TEXT_COLORS.primary }}>
            {Math.round(percentage)}%
          </span>
        </div>
      )}
      
      <div className="flex items-center gap-2">
        <div
          className="flex-1 rounded-full overflow-hidden"
          style={{
            height: sizeStyle.height,
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
          }}
        >
          <div
            className={`h-full rounded-full ${animated ? 'animate-pulse' : ''}`}
            style={{
              width: `${percentage}%`,
              backgroundColor: color,
              transition: TRANSITION.default,
            }}
          >
            {showLabel && labelPosition === 'inside' && size === 'lg' && (
              <span
                className="flex items-center justify-center h-full text-white font-medium"
                style={{ fontSize: '10px' }}
              >
                {Math.round(percentage)}%
              </span>
            )}
          </div>
        </div>
        
        {showLabel && labelPosition === 'outside' && (
          <span style={{ fontSize: sizeStyle.labelSize, color: TEXT_COLORS.primary, minWidth: '36px' }}>
            {Math.round(percentage)}%
          </span>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// CIRCULAR PROGRESS
// ============================================================================

export function CircularProgress({
  value,
  size = 48,
  strokeWidth = 4,
  color = BRAND_COLORS.primary,
  showValue = true,
  children,
  className = '',
}: CircularProgressProps): React.ReactElement {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const percentage = Math.min(100, Math.max(0, value));
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <svg className="transform -rotate-90" width={size} height={size}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: TRANSITION.default }}
        />
      </svg>
      
      {/* Center content */}
      <div className="absolute inset-0 flex items-center justify-center">
        {children || (showValue && (
          <span
            className="font-semibold"
            style={{
              fontSize: size / 4,
              color: TEXT_COLORS.primary,
            }}
          >
            {Math.round(percentage)}
          </span>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// DRAFT PROGRESS
// ============================================================================

export function DraftProgress({
  currentPick,
  totalPicks,
  currentRound,
  totalRounds,
  className = '',
}: DraftProgressProps): React.ReactElement {
  const percentage = ((currentPick - 1) / totalPicks) * 100;

  return (
    <div className={className}>
      <div className="flex justify-between text-sm mb-2">
        <span style={{ color: TEXT_COLORS.secondary }}>
          Round {currentRound} of {totalRounds}
        </span>
        <span style={{ color: TEXT_COLORS.primary }}>
          Pick {currentPick} / {totalPicks}
        </span>
      </div>
      <ProgressBar value={percentage} size="sm" />
    </div>
  );
}

// ============================================================================
// POSITION PROGRESS BAR
// ============================================================================

export function PositionProgress({
  counts,
  total,
  size = 'md',
  className = '',
}: PositionProgressProps): React.ReactElement {
  const totalCount = total || Object.values(counts).reduce((sum, c) => sum + c, 0);
  const height = size === 'sm' ? '8px' : '12px';

  if (totalCount === 0) {
    return (
      <div
        className={`rounded-full ${className}`}
        style={{
          height,
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
        }}
      />
    );
  }

  const positions = [
    { key: 'QB', count: counts.QB, color: POSITION_COLORS.QB },
    { key: 'RB', count: counts.RB, color: POSITION_COLORS.RB },
    { key: 'WR', count: counts.WR, color: POSITION_COLORS.WR },
    { key: 'TE', count: counts.TE, color: POSITION_COLORS.TE },
  ].filter(p => p.count > 0);

  return (
    <div
      className={`flex rounded-full overflow-hidden ${className}`}
      style={{ height }}
    >
      {positions.map((pos, index) => (
        <div
          key={pos.key}
          style={{
            width: `${(pos.count / totalCount) * 100}%`,
            backgroundColor: pos.color || '#6B7280',
            transition: TRANSITION.default,
          }}
        />
      ))}
    </div>
  );
}

// ============================================================================
// STEPS INDICATOR
// ============================================================================

export interface StepsProps {
  /** Steps configuration */
  steps: Array<{ label: string; completed?: boolean }>;
  /** Current step (0-indexed) */
  currentStep: number;
  /** Orientation */
  orientation?: 'horizontal' | 'vertical';
  /** Custom className */
  className?: string;
}

export function Steps({
  steps,
  currentStep,
  orientation = 'horizontal',
  className = '',
}: StepsProps): React.ReactElement {
  const isVertical = orientation === 'vertical';

  return (
    <div
      className={`flex ${isVertical ? 'flex-col' : 'items-center'} ${className}`}
    >
      {steps.map((step, index) => {
        const isCompleted = step.completed || index < currentStep;
        const isCurrent = index === currentStep;
        const isLast = index === steps.length - 1;

        return (
          <React.Fragment key={index}>
            <div className={`flex ${isVertical ? 'items-start' : 'flex-col items-center'}`}>
              {/* Step circle */}
              <div
                className="flex items-center justify-center rounded-full font-medium"
                style={{
                  width: '28px',
                  height: '28px',
                  fontSize: '12px',
                  backgroundColor: isCompleted ? BRAND_COLORS.primary : isCurrent ? BG_COLORS.secondary : 'transparent',
                  border: `2px solid ${isCompleted ? BRAND_COLORS.primary : isCurrent ? BRAND_COLORS.primary : 'rgba(255,255,255,0.2)'}`,
                  color: isCompleted ? '#000' : isCurrent ? TEXT_COLORS.primary : TEXT_COLORS.muted,
                }}
              >
                {isCompleted ? (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  index + 1
                )}
              </div>
              
              {/* Step label */}
              <span
                className={`text-xs font-medium ${isVertical ? 'ml-3' : 'mt-1'}`}
                style={{
                  color: isCurrent ? TEXT_COLORS.primary : TEXT_COLORS.secondary,
                }}
              >
                {step.label}
              </span>
            </div>
            
            {/* Connector line */}
            {!isLast && (
              <div
                className={isVertical ? 'w-0.5 h-8 ml-3.5 my-1' : 'flex-1 h-0.5 mx-2'}
                style={{
                  backgroundColor: isCompleted ? BRAND_COLORS.primary : 'rgba(255,255,255,0.2)',
                }}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

