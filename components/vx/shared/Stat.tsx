/**
 * VX Stat Display Components
 * 
 * Components for displaying statistics and key-value data.
 */

import React from 'react';
import { TEXT_COLORS, BG_COLORS, BRAND_COLORS } from '../constants/colors';

// ============================================================================
// TYPES
// ============================================================================

export interface StatProps {
  /** Stat label */
  label: string;
  /** Stat value */
  value: string | number;
  /** Optional sublabel */
  sublabel?: string;
  /** Value color */
  valueColor?: string;
  /** Size */
  size?: 'sm' | 'md' | 'lg';
  /** Trend indicator */
  trend?: 'up' | 'down' | 'neutral';
  /** Trend value */
  trendValue?: string;
  /** Custom className */
  className?: string;
}

export interface StatGroupProps {
  /** Array of stats */
  stats: Array<Omit<StatProps, 'size'>>;
  /** Layout direction */
  direction?: 'row' | 'column';
  /** Size */
  size?: 'sm' | 'md' | 'lg';
  /** Custom className */
  className?: string;
}

export interface StatCardProps extends StatProps {
  /** Icon element */
  icon?: React.ReactNode;
  /** Background color */
  bgColor?: string;
}

// ============================================================================
// SIZE STYLES
// ============================================================================

const SIZE_STYLES = {
  sm: { labelSize: '10px', valueSize: '18px', subSize: '9px' },
  md: { labelSize: '12px', valueSize: '24px', subSize: '10px' },
  lg: { labelSize: '14px', valueSize: '32px', subSize: '12px' },
};

// ============================================================================
// TREND COLORS
// ============================================================================

const TREND_COLORS = {
  up: '#10B981',
  down: '#EF4444',
  neutral: TEXT_COLORS.secondary,
};

// ============================================================================
// STAT COMPONENT
// ============================================================================

export default function Stat({
  label,
  value,
  sublabel,
  valueColor = TEXT_COLORS.primary,
  size = 'md',
  trend,
  trendValue,
  className = '',
}: StatProps): React.ReactElement {
  const sizeStyle = SIZE_STYLES[size];

  return (
    <div className={className}>
      <div
        className="font-medium uppercase tracking-wider"
        style={{ fontSize: sizeStyle.labelSize, color: TEXT_COLORS.secondary }}
      >
        {label}
      </div>
      <div className="flex items-baseline gap-2">
        <div
          className="font-bold"
          style={{ fontSize: sizeStyle.valueSize, color: valueColor }}
        >
          {value}
        </div>
        {trend && trendValue && (
          <div
            className="flex items-center gap-0.5"
            style={{ fontSize: sizeStyle.subSize, color: TREND_COLORS[trend] }}
          >
            {trend === 'up' && (
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            )}
            {trend === 'down' && (
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            )}
            {trendValue}
          </div>
        )}
      </div>
      {sublabel && (
        <div
          className="mt-0.5"
          style={{ fontSize: sizeStyle.subSize, color: TEXT_COLORS.muted }}
        >
          {sublabel}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// STAT GROUP
// ============================================================================

export function StatGroup({
  stats,
  direction = 'row',
  size = 'md',
  className = '',
}: StatGroupProps): React.ReactElement {
  const isRow = direction === 'row';

  return (
    <div
      className={`flex ${isRow ? 'gap-6' : 'flex-col gap-4'} ${className}`}
    >
      {stats.map((stat, index) => (
        <React.Fragment key={index}>
          <Stat {...stat} size={size} />
          {isRow && index < stats.length - 1 && (
            <div
              className="w-px self-stretch"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ============================================================================
// STAT CARD
// ============================================================================

export function StatCard({
  label,
  value,
  sublabel,
  valueColor = TEXT_COLORS.primary,
  size = 'md',
  trend,
  trendValue,
  icon,
  bgColor = BG_COLORS.elevated,
  className = '',
}: StatCardProps): React.ReactElement {
  const sizeStyle = SIZE_STYLES[size];

  return (
    <div
      className={`p-4 rounded-xl ${className}`}
      style={{ backgroundColor: bgColor }}
    >
      <div className="flex items-start justify-between">
        <div
          className="font-medium uppercase tracking-wider"
          style={{ fontSize: sizeStyle.labelSize, color: TEXT_COLORS.secondary }}
        >
          {label}
        </div>
        {icon && (
          <div className="w-8 h-8 flex items-center justify-center rounded-lg" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>
            {icon}
          </div>
        )}
      </div>
      <div className="flex items-baseline gap-2 mt-2">
        <div
          className="font-bold"
          style={{ fontSize: sizeStyle.valueSize, color: valueColor }}
        >
          {value}
        </div>
        {trend && trendValue && (
          <div
            className="flex items-center gap-0.5"
            style={{ fontSize: sizeStyle.subSize, color: TREND_COLORS[trend] }}
          >
            {trend === 'up' && (
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            )}
            {trend === 'down' && (
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            )}
            {trendValue}
          </div>
        )}
      </div>
      {sublabel && (
        <div
          className="mt-1"
          style={{ fontSize: sizeStyle.subSize, color: TEXT_COLORS.muted }}
        >
          {sublabel}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// INLINE STAT (Compact key-value)
// ============================================================================

export interface InlineStatProps {
  label: string;
  value: string | number;
  valueColor?: string;
  className?: string;
}

export function InlineStat({
  label,
  value,
  valueColor = TEXT_COLORS.primary,
  className = '',
}: InlineStatProps): React.ReactElement {
  return (
    <div className={`flex items-center justify-between ${className}`}>
      <span style={{ color: TEXT_COLORS.secondary, fontSize: '13px' }}>
        {label}
      </span>
      <span className="font-medium" style={{ color: valueColor, fontSize: '13px' }}>
        {value}
      </span>
    </div>
  );
}

// ============================================================================
// STAT LIST
// ============================================================================

export interface StatListProps {
  items: Array<{ label: string; value: string | number; valueColor?: string }>;
  className?: string;
}

export function StatList({
  items,
  className = '',
}: StatListProps): React.ReactElement {
  return (
    <div className={`space-y-2 ${className}`}>
      {items.map((item, index) => (
        <InlineStat
          key={index}
          label={item.label}
          value={item.value}
          valueColor={item.valueColor}
        />
      ))}
    </div>
  );
}

