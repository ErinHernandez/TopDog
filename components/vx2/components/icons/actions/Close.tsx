/**
 * Close Icon (X)
 */

import React from 'react';
import type { IconProps } from '../types';
import { DEFAULT_ICON_PROPS } from '../types';

export function Close({
  size = DEFAULT_ICON_PROPS.size,
  color = 'currentColor',
  strokeWidth = DEFAULT_ICON_PROPS.strokeWidth,
  className = '',
  'aria-label': ariaLabel = 'Close',
  'aria-hidden': ariaHidden = false,
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
      role="img"
    >
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

export default Close;

