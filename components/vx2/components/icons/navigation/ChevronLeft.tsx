/**
 * ChevronLeft Icon
 */

import React from 'react';

import type { IconProps } from '../types';
import { DEFAULT_ICON_PROPS } from '../types';

export function ChevronLeft({
  size = DEFAULT_ICON_PROPS.size,
  color = 'currentColor',
  strokeWidth = DEFAULT_ICON_PROPS.strokeWidth,
  className = '',
  'aria-label': ariaLabel,
  'aria-hidden': ariaHidden = true,
}: IconProps): React.ReactElement {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-label={ariaLabel}
      aria-hidden={ariaHidden}
      role={ariaLabel ? 'img' : undefined}
    >
      <path d="M15 19l-7-7 7-7" />
    </svg>
  );
}

export default ChevronLeft;

