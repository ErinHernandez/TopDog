/**
 * VX Divider Component
 * 
 * Visual separators for content sections.
 */

import React from 'react';
import { TEXT_COLORS } from '../constants/colors';

// ============================================================================
// TYPES
// ============================================================================

export interface DividerProps {
  /** Divider orientation */
  orientation?: 'horizontal' | 'vertical';
  /** Divider style */
  variant?: 'solid' | 'dashed' | 'dotted';
  /** Label text (centered) */
  label?: string;
  /** Color */
  color?: string;
  /** Spacing (margin) */
  spacing?: 'none' | 'sm' | 'md' | 'lg';
  /** Custom className */
  className?: string;
}

// ============================================================================
// SPACING STYLES
// ============================================================================

const SPACING_STYLES = {
  none: '0',
  sm: '8px',
  md: '16px',
  lg: '24px',
};

// ============================================================================
// COMPONENT
// ============================================================================

export default function Divider({
  orientation = 'horizontal',
  variant = 'solid',
  label,
  color = 'rgba(255, 255, 255, 0.1)',
  spacing = 'md',
  className = '',
}: DividerProps): React.ReactElement {
  const isVertical = orientation === 'vertical';
  const spacingValue = SPACING_STYLES[spacing];

  const lineStyle: React.CSSProperties = {
    backgroundColor: variant === 'solid' ? color : 'transparent',
    borderStyle: variant !== 'solid' ? variant : 'none',
    borderColor: color,
  };

  if (isVertical) {
    return (
      <div
        className={`inline-block ${className}`}
        style={{
          width: '1px',
          minHeight: '100%',
          marginLeft: spacingValue,
          marginRight: spacingValue,
          ...lineStyle,
          ...(variant !== 'solid' && { borderWidth: '0 0 0 1px' }),
        }}
        role="separator"
        aria-orientation="vertical"
      />
    );
  }

  // Horizontal divider
  if (label) {
    return (
      <div
        className={`flex items-center gap-4 ${className}`}
        style={{
          marginTop: spacingValue,
          marginBottom: spacingValue,
        }}
        role="separator"
      >
        <div
          className="flex-1 h-px"
          style={lineStyle}
        />
        <span
          className="text-xs font-medium uppercase tracking-wider"
          style={{ color: TEXT_COLORS.muted }}
        >
          {label}
        </span>
        <div
          className="flex-1 h-px"
          style={lineStyle}
        />
      </div>
    );
  }

  return (
    <div
      className={`w-full h-px ${className}`}
      style={{
        marginTop: spacingValue,
        marginBottom: spacingValue,
        ...lineStyle,
        ...(variant !== 'solid' && { borderWidth: '1px 0 0 0', height: 0 }),
      }}
      role="separator"
    />
  );
}

// ============================================================================
// SECTION HEADER (Label + Divider combo)
// ============================================================================

export interface SectionHeaderProps {
  /** Section title */
  title: string;
  /** Optional action on the right */
  action?: React.ReactNode;
  /** Spacing below */
  spacing?: 'sm' | 'md' | 'lg';
  /** Custom className */
  className?: string;
}

export function SectionHeader({
  title,
  action,
  spacing = 'md',
  className = '',
}: SectionHeaderProps): React.ReactElement {
  const marginBottom = SPACING_STYLES[spacing];

  return (
    <div
      className={`flex items-center justify-between ${className}`}
      style={{ marginBottom }}
    >
      <h3
        className="text-sm font-semibold uppercase tracking-wider"
        style={{ color: TEXT_COLORS.secondary }}
      >
        {title}
      </h3>
      {action}
    </div>
  );
}

