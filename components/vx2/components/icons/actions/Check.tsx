/**
 * Check Icon - Bold checkmark for confirmed/saved states
 */

import React from 'react';
import type { IconProps } from '../types';
import { DEFAULT_ICON_PROPS } from '../types';

export function Check({
  size = DEFAULT_ICON_PROPS.size,
  color = 'currentColor',
  strokeWidth = 3,
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
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

export default Check;

