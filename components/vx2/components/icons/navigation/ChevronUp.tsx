import React from 'react';
import type { IconProps } from '../types';

export function ChevronUp({ 
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
      <polyline points="18 15 12 9 6 15" />
    </svg>
  );
}

