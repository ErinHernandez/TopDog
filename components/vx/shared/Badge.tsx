/**
 * VX Badge Component
 * 
 * Small status indicators and labels.
 * Use for counts, tags, and status displays.
 */

import React from 'react';
import { BRAND_COLORS, TEXT_COLORS, POSITION_COLORS } from '../constants/colors';

// ============================================================================
// TYPES
// ============================================================================

export type BadgeVariant = 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info';
export type BadgeSize = 'sm' | 'md' | 'lg';

export interface BadgeProps {
  /** Badge content */
  children: React.ReactNode;
  /** Badge variant */
  variant?: BadgeVariant;
  /** Badge size */
  size?: BadgeSize;
  /** Dot indicator (no text) */
  dot?: boolean;
  /** Pill shape */
  pill?: boolean;
  /** Custom color (overrides variant) */
  color?: string;
  /** Custom className */
  className?: string;
}

export interface StatusBadgeProps {
  /** Status type */
  status: 'online' | 'offline' | 'away' | 'busy' | 'drafting' | 'completed' | 'success' | 'error' | 'warning' | 'active' | 'eliminated';
  /** Optional custom label (overrides default) */
  label?: string;
  /** Show label text */
  showLabel?: boolean;
  /** Custom className */
  className?: string;
}

export interface CountBadgeProps {
  /** Count to display */
  count: number;
  /** Maximum count before showing + */
  max?: number;
  /** Badge variant */
  variant?: BadgeVariant;
  /** Custom className */
  className?: string;
}

// ============================================================================
// VARIANT STYLES
// ============================================================================

const VARIANT_STYLES: Record<BadgeVariant, { bg: string; text: string }> = {
  default: {
    bg: 'rgba(255, 255, 255, 0.1)',
    text: TEXT_COLORS.primary,
  },
  primary: {
    bg: `${BRAND_COLORS.primary}20`,
    text: BRAND_COLORS.primary,
  },
  success: {
    bg: 'rgba(16, 185, 129, 0.2)',
    text: '#10B981',
  },
  warning: {
    bg: 'rgba(245, 158, 11, 0.2)',
    text: '#F59E0B',
  },
  error: {
    bg: 'rgba(239, 68, 68, 0.2)',
    text: '#EF4444',
  },
  info: {
    bg: 'rgba(59, 130, 246, 0.2)',
    text: '#3B82F6',
  },
};

// ============================================================================
// SIZE STYLES
// ============================================================================

const SIZE_STYLES: Record<BadgeSize, { height: string; padding: string; fontSize: string }> = {
  sm: {
    height: '18px',
    padding: '0 6px',
    fontSize: '10px',
  },
  md: {
    height: '22px',
    padding: '0 8px',
    fontSize: '11px',
  },
  lg: {
    height: '26px',
    padding: '0 10px',
    fontSize: '12px',
  },
};

// ============================================================================
// BADGE COMPONENT
// ============================================================================

export default function Badge({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  pill = true,
  color,
  className = '',
}: BadgeProps): React.ReactElement {
  const variantStyle = VARIANT_STYLES[variant];
  const sizeStyle = SIZE_STYLES[size];

  if (dot) {
    const dotSize = { sm: '6px', md: '8px', lg: '10px' }[size];
    return (
      <span
        className={`inline-block rounded-full ${className}`}
        style={{
          width: dotSize,
          height: dotSize,
          backgroundColor: color || variantStyle.text,
        }}
      />
    );
  }

  return (
    <span
      className={`inline-flex items-center justify-center font-medium ${className}`}
      style={{
        height: sizeStyle.height,
        padding: sizeStyle.padding,
        fontSize: sizeStyle.fontSize,
        backgroundColor: color ? `${color}20` : variantStyle.bg,
        color: color || variantStyle.text,
        borderRadius: pill ? '9999px' : '4px',
      }}
    >
      {children}
    </span>
  );
}

// ============================================================================
// STATUS BADGE
// ============================================================================

const STATUS_CONFIG: Record<StatusBadgeProps['status'], { color: string; label: string }> = {
  online: { color: '#10B981', label: 'Online' },
  offline: { color: '#6B7280', label: 'Offline' },
  away: { color: '#F59E0B', label: 'Away' },
  busy: { color: '#EF4444', label: 'Busy' },
  drafting: { color: BRAND_COLORS.primary, label: 'Drafting' },
  completed: { color: '#10B981', label: 'Completed' },
  success: { color: '#10B981', label: 'Success' },
  error: { color: '#EF4444', label: 'Error' },
  warning: { color: '#F59E0B', label: 'Warning' },
  active: { color: '#10B981', label: 'Active' },
  eliminated: { color: '#EF4444', label: 'Eliminated' },
};

export function StatusBadge({
  status,
  label,
  showLabel = false,
  className = '',
}: StatusBadgeProps): React.ReactElement {
  const config = STATUS_CONFIG[status] ?? { color: '#6B7280', label: status };
  const displayLabel = label ?? config.label;

  // If label is provided, show it (shorthand for showLabel=true with custom label)
  const shouldShowLabel = showLabel || !!label;

  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <span
        className="w-2 h-2 rounded-full"
        style={{ backgroundColor: config.color }}
      />
      {shouldShowLabel && (
        <span
          className="text-xs font-medium"
          style={{ color: config.color }}
        >
          {displayLabel}
        </span>
      )}
    </span>
  );
}

// ============================================================================
// COUNT BADGE
// ============================================================================

export function CountBadge({
  count,
  max = 99,
  variant = 'primary',
  className = '',
}: CountBadgeProps): React.ReactElement | null {
  if (count <= 0) return null;

  const displayCount = count > max ? `${max}+` : count.toString();

  return (
    <Badge variant={variant} size="sm" className={className}>
      {displayCount}
    </Badge>
  );
}

// ============================================================================
// POSITION TAG (for player positions)
// ============================================================================

export interface PositionTagProps {
  /** Position */
  position: 'QB' | 'RB' | 'WR' | 'TE' | 'FLEX';
  /** Size */
  size?: BadgeSize;
  /** Custom className */
  className?: string;
}

export function PositionTag({
  position,
  size = 'sm',
  className = '',
}: PositionTagProps): React.ReactElement {
  const color = POSITION_COLORS[position] || POSITION_COLORS.BN;

  return (
    <Badge
      size={size}
      color={color || undefined}
      pill={false}
      className={className}
    >
      {position}
    </Badge>
  );
}

