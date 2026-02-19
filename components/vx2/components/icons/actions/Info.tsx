/**
 * Info Icon
 */

import React from 'react';

import type { IconProps } from '../types';
import { DEFAULT_ICON_PROPS } from '../types';

export function Info({
  size = DEFAULT_ICON_PROPS.size,
  color = 'currentColor',
  strokeWidth = DEFAULT_ICON_PROPS.strokeWidth,
  className,
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
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}

export default Info;

