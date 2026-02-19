import React from 'react';

import type { IconProps } from '../types';

export function ChevronDown({ 
  size = 24, 
  color = 'currentColor',
  strokeWidth = 2,
  className = '',
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
      aria-hidden="true"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

