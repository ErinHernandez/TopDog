/**
 * Icon Types
 * 
 * Shared types for all icon components.
 */

import React from 'react';

/**
 * Standard icon props
 */
export interface IconProps {
  /** Icon size in pixels (default: 24) */
  size?: number;
  /** Icon color (default: currentColor) */
  color?: string;
  /** Stroke width for outlined icons (default: 2) */
  strokeWidth?: number;
  /** Additional CSS class */
  className?: string;
  /** Accessibility label */
  'aria-label'?: string;
  /** Whether icon is decorative (hides from screen readers) */
  'aria-hidden'?: boolean;
}

/**
 * Icon component type
 */
export type IconComponent = React.FC<IconProps>;

/**
 * Default icon props
 */
export const DEFAULT_ICON_PROPS: Required<Pick<IconProps, 'size' | 'strokeWidth'>> = {
  size: 24,
  strokeWidth: 2,
};

