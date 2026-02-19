/**
 * Grid Icon
 */

import React from 'react';

import type { IconProps } from '../types';
import { DEFAULT_ICON_PROPS } from '../types';

export function Grid({
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
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  );
}

export default Grid;

